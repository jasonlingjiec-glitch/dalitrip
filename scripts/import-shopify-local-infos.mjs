import { writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const API_BASE = process.env.DALITRIP_API_BASE ?? "http://localhost:3000/api";
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "dalitrip.com";
const REPORT_PATH = path.join(PROJECT_ROOT, "data", "shopify-local-infos-import-report.json");

const EXCLUDED_VENDORS = new Set([
  "Activities",
  "Dali Experience Community",
  "Guide Introduction",
  "Other Activities",
  "QR",
  "素材"
]);

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const stripHtml = (html) =>
  String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const decodeText = (value) =>
  String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();

const absoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (/^https?:\/\//.test(url)) return url;
  return "";
};

const decodeUrlParam = (value) => {
  let text = String(value ?? "").replace(/\+/g, " ").trim();
  for (let index = 0; index < 3; index += 1) {
    try {
      const decoded = decodeURIComponent(text);
      if (decoded === text) break;
      text = decoded;
    } catch {
      break;
    }
  }
  return text.trim();
};

function extractAppleMap(html) {
  const source = String(html ?? "");
  const link = source.match(/<a\b[^>]*href=["'](https:\/\/maps\.apple\.com\/?[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const rawUrl = link?.[1] ?? source.match(/https:\/\/maps\.apple\.com\/?[^\s"'<>]+/i)?.[0] ?? "";
  const rawCleanUrl = decodeText(rawUrl);
  if (!rawCleanUrl) return null;
  let url = rawCleanUrl;
  let address = "";
  try {
    const parsed = new URL(rawCleanUrl);
    for (const key of ["address", "q"]) {
      const value = parsed.searchParams.get(key);
      if (value) parsed.searchParams.set(key, decodeUrlParam(value));
    }
    url = parsed.toString();
    address = decodeUrlParam(parsed.searchParams.get("address") || parsed.searchParams.get("q") || "");
  } catch {
    address = "";
  }
  const text = decodeText(stripHtml(link?.[2] ?? ""));
  return { url, address: address || text };
}


async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok || attempt === attempts) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 650 * attempt));
  }
  throw lastError;
}

async function request(pathname, options = {}) {
  const response = await fetchWithRetry(`${API_BASE}${pathname}`, {
    headers: { "content-type": "application/json" },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message ?? `${response.status} ${response.statusText}`);
  return payload.data;
}

async function fetchProducts() {
  const products = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetchWithRetry(`https://${STORE_DOMAIN}/products.json?limit=250&page=${page}`);
    if (!response.ok) throw new Error(`Shopify 产品列表读取失败: ${response.status}`);
    const data = await response.json();
    const pageProducts = data.products ?? [];
    products.push(...pageProducts);
    if (pageProducts.length < 250) break;
  }
  return products;
}

function parseCollectionSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
    const chunk = match[1];
    const url = chunk.match(/<loc>https:\/\/[^/]+\/collections\/([^<]+)<\/loc>/)?.[1];
    if (!url) return null;
    const handle = decodeURIComponent(url);
    const title = chunk.match(/<image:title>([\s\S]*?)<\/image:title>/)?.[1]?.trim() ?? handle;
    return { handle, title };
  }).filter(Boolean);
}

async function fetchCollections() {
  const sitemapResponse = await fetchWithRetry(`https://${STORE_DOMAIN}/sitemap.xml`);
  if (!sitemapResponse.ok) return [];
  const sitemap = await sitemapResponse.text();
  const collectionSitemapUrls = [...sitemap.matchAll(/<loc>([^<]*sitemap_collections_[^<]*)<\/loc>/g)]
    .map((match) => match[1].replace(/&amp;/g, "&"))
    .filter((url) => url.startsWith(`https://${STORE_DOMAIN}/`));
  const collections = [];
  for (const url of collectionSitemapUrls) {
    const response = await fetchWithRetry(url);
    if (response.ok) collections.push(...parseCollectionSitemap(await response.text()));
  }
  return collections;
}

async function fetchCollectionProductHandles(collection) {
  const handles = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetchWithRetry(`https://${STORE_DOMAIN}/collections/${encodeURIComponent(collection.handle)}/products.json?limit=250&page=${page}`);
    if (!response.ok) break;
    const data = await response.json();
    const products = data.products ?? [];
    handles.push(...products.map((product) => product.handle));
    if (products.length < 250) break;
  }
  return handles;
}

async function buildCollectionMap() {
  const collections = await fetchCollections();
  const byHandle = new Map();
  for (const collection of collections) {
    const productHandles = await fetchCollectionProductHandles(collection);
    for (const handle of productHandles) {
      if (!byHandle.has(handle)) byHandle.set(handle, []);
      byHandle.get(handle).push(collection.title);
    }
  }
  return byHandle;
}

async function extractProductPageDetails(handle) {
  const response = await fetchWithRetry(`https://${STORE_DOMAIN}/products/${handle}`);
  if (!response.ok) return { videos: [], appleMap: null };
  const html = await response.text();
  const urls = new Set();
  const direct = new RegExp("https?://[^\\\"'<>\\s]+(?:mp4|m3u8)[^\\\"'<>\\s]*", "gi");
  for (const match of html.matchAll(direct)) urls.add(match[0].replace(/\\u0026/g, "&"));
  for (const match of html.matchAll(/<(?:source|video)[^>]+src=["']([^"']+)["']/gi)) {
    const url = absoluteUrl(match[1]);
    if (url) urls.add(url);
  }
  return { videos: [...urls], appleMap: extractAppleMap(html) };
}

function replaceRelativeImageUrls(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/src=["']([^"']+)["']/gi, (match, value) => {
      const source = absoluteUrl(value);
      return source ? `src="${source}"` : match;
    });
}

function nestedTags(vendor, product, collections) {
  const children = [
    ...(product.tags ?? []),
    product.product_type,
    ...collections
  ].map((tag) => String(tag ?? "").trim())
    .filter(Boolean)
    .filter((tag) => tag.toLowerCase() !== "bookeasy");
  return [...new Set([
    vendor,
    ...children.map((tag) => `${vendor} · ${tag}`)
  ])];
}

function buildContentHtml(product, imageUrls, videos) {
  const body = replaceRelativeImageUrls(product.body_html);
  const gallery = imageUrls.length
    ? `<section><h3>图片</h3>${imageUrls.map((url) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(product.title)}" />`).join("")}</section>`
    : "";
  const videoHtml = videos.length
    ? `<section><h3>视频</h3>${videos.map((url) => `<video controls src="${escapeHtml(url)}"></video>`).join("")}</section>`
    : "";
  return [body, gallery, videoHtml].filter(Boolean).join("");
}

function buildPayload(product, collections, videos, sortOrder, productPageAppleMap = null) {
  const imageUrls = [...new Set((product.images ?? []).map((image) => absoluteUrl(image.src)).filter(Boolean))];
  const appleMap = productPageAppleMap ?? extractAppleMap(product.body_html);
  const productUrl = `https://${STORE_DOMAIN}/products/${product.handle}`;
  return {
    title: product.title,
    summary: stripHtml(product.body_html).slice(0, 160),
    coverUrl: imageUrls[0] ?? "",
    address: appleMap?.address ?? "",
    openingHours: "",
    contact: "",
    mapUrl: appleMap?.url ?? "",
    contentHtml: buildContentHtml(product, imageUrls, videos),
    tags: nestedTags(product.vendor, product, collections),
    published: true,
    sortOrder,
    shopify: {
      id: product.id,
      handle: product.handle,
      vendor: product.vendor,
      productType: product.product_type ?? "",
      tags: product.tags ?? [],
      collections,
      productUrl
    }
  };
}

async function main() {
  const [products, localInfos, activities, guides, collectionMap] = await Promise.all([
    fetchProducts(),
    request("/local-infos"),
    request("/activities"),
    request("/guides?includePaused=true"),
    buildCollectionMap()
  ]);
  const activityNames = new Set(activities.map((activity) => activity.content?.name).filter(Boolean));
  const activityHandles = new Set(activities.map((activity) => activity.shopify?.handle).filter(Boolean));
  const guideNames = new Set(guides.map((guide) => guide.name).filter(Boolean));
  const guideHandles = new Set(guides.map((guide) => guide.shopify?.handle).filter(Boolean));
  const existingByHandle = new Map(localInfos.filter((item) => item.shopify?.handle).map((item) => [item.shopify.handle, item]));
  const existingByTitle = new Map(localInfos.filter((item) => !item.shopify?.handle).map((item) => [item.title, item]));
  const candidates = products.filter((product) =>
    !EXCLUDED_VENDORS.has(product.vendor) &&
    !activityNames.has(product.title) &&
    !activityHandles.has(product.handle) &&
    !guideNames.has(product.title) &&
    !guideHandles.has(product.handle)
  );
  const results = [];
  let sortOrder = 100;
  for (const product of candidates) {
    const collections = collectionMap.get(product.handle) ?? [];
    const { videos, appleMap } = await extractProductPageDetails(product.handle);
    const payload = buildPayload(product, collections, videos, sortOrder, appleMap);
    sortOrder += 1;
    const existingByHandleMatch = existingByHandle.get(product.handle);
    const existingByTitleMatch = existingByTitle.get(product.title);
    const existing = existingByHandleMatch ?? existingByTitleMatch;
    if (existingByTitleMatch) existingByTitle.delete(product.title);
    if (existing) {
      const updated = await request(`/local-infos/${existing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      existingByHandle.set(product.handle, updated);
      existingByTitle.set(product.title, updated);
      results.push({ title: product.title, vendor: product.vendor, handle: product.handle, action: "updated", tags: payload.tags.length, collections: collections.length, images: product.images?.length ?? 0, videos: videos.length });
    } else {
      const created = await request("/local-infos", { method: "POST", body: JSON.stringify(payload) });
      existingByHandle.set(product.handle, created);
      existingByTitle.set(product.title, created);
      results.push({ title: product.title, vendor: product.vendor, handle: product.handle, action: "created", tags: payload.tags.length, collections: collections.length, images: product.images?.length ?? 0, videos: videos.length });
    }
    console.log(`${results.at(-1).action}: ${product.title}`);
  }
  const skipped = products.length - candidates.length;
  const summary = results.reduce((acc, item) => {
    acc[item.action] = (acc[item.action] ?? 0) + 1;
    acc.images += item.images;
    acc.videos += item.videos;
    return acc;
  }, { created: 0, updated: 0, images: 0, videos: 0 });
  await writeFile(REPORT_PATH, JSON.stringify({
    importedAt: new Date().toISOString(),
    storeDomain: STORE_DOMAIN,
    totalShopifyProducts: products.length,
    skipped,
    imported: results.length,
    ...summary,
    excludedVendors: [...EXCLUDED_VENDORS],
    results
  }, null, 2));
  console.log(JSON.stringify({ totalShopifyProducts: products.length, skipped, imported: results.length, ...summary, report: REPORT_PATH }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
