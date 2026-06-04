import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const API_BASE = process.env.DALITRIP_API_BASE ?? "http://localhost:3000/api";
const STATIC_BASE = process.env.DALITRIP_STATIC_BASE ?? "http://localhost:8890/dalitrip-mvp";
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "dalitrip.com";
const TARGET_VENDOR = process.env.SHOPIFY_VENDOR ?? "Dali Experience Community";
const ASSET_ROOT = path.join(PROJECT_ROOT, "imported-assets", "shopify-products");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "imported-assets", "shopify-products-manifest.json");

const safeName = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";

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

const extFromContentType = (contentType) => {
  if (/jpe?g/i.test(contentType)) return ".jpg";
  if (/png/i.test(contentType)) return ".png";
  if (/webp/i.test(contentType)) return ".webp";
  if (/gif/i.test(contentType)) return ".gif";
  if (/mp4/i.test(contentType)) return ".mp4";
  if (/mpegurl|m3u8/i.test(contentType)) return ".m3u8";
  return "";
};

const extFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    return ext && ext.length <= 8 ? ext : "";
  } catch {
    return "";
  }
};

const absoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (/^https?:\/\//.test(url)) return url;
  return "";
};

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
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
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
  return products.filter((product) => product.vendor === TARGET_VENDOR);
}

function extractInlineImages(product) {
  const html = product.body_html ?? "";
  return [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => absoluteUrl(match[1]))
    .filter(Boolean);
}

async function extractVideos(handle) {
  const response = await fetchWithRetry(`https://${STORE_DOMAIN}/products/${handle}`);
  if (!response.ok) return [];
  const html = await response.text();
  const urls = new Set();
  const direct = new RegExp("https?://[^\\\"'<>\\s]+(?:mp4|m3u8)[^\\\"'<>\\s]*", "gi");
  for (const match of html.matchAll(direct)) urls.add(match[0].replace(/\\u0026/g, "&"));
  for (const match of html.matchAll(/<(?:source|video)[^>]+src=["']([^"']+)["']/gi)) {
    const url = absoluteUrl(match[1]);
    if (url) urls.add(url);
  }
  return [...urls];
}

async function downloadAsset(url, folder, index) {
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`下载失败 ${response.status}: ${url}`);
  const contentType = response.headers.get("content-type") ?? "";
  const ext = extFromUrl(url) || extFromContentType(contentType) || ".bin";
  const base = safeName(path.basename(new URL(url).pathname, ext)) || `asset-${index}`;
  const filename = `${String(index).padStart(3, "0")}-${base}${ext}`;
  const filePath = path.join(folder, filename);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, bytes);
  return {
    sourceUrl: url,
    filePath,
    publicUrl: `${STATIC_BASE}/imported-assets/shopify-products/${path.basename(folder)}/${encodeURIComponent(filename)}`
  };
}

async function tryDownloadAsset(url, folder, index) {
  try {
    return await downloadAsset(url, folder, index);
  } catch (error) {
    console.warn(`跳过下载失败的媒体: ${url} (${error.message})`);
    return null;
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function buildDescription(product, videos) {
  const videoHtml = videos.length
    ? `<section><h3>视频</h3>${videos.map((video) => `<video controls src="${video.publicUrl}"></video>`).join("")}</section>`
    : "";
  return `${product.body_html ?? ""}${videoHtml}`;
}

async function ensureGroup() {
  const groups = await request("/groups");
  const existing = groups.find((group) => group.name === TARGET_VENDOR);
  if (existing) return existing;
  return request("/groups", { method: "POST", body: JSON.stringify({ name: TARGET_VENDOR }) });
}

function buildActivityPayload(product, groupId, images, videos) {
  const summary = stripHtml(product.body_html).slice(0, 150);
  return {
    groupId,
    advanceBookingHours: 8,
    leaderWechat: "",
    tagIds: [],
    guideIds: [],
    meetingLatitude: null,
    meetingLongitude: null,
    coverUrl: images[0]?.publicUrl ?? "",
    images: images.map((image, index) => ({
      id: `shopify-${product.handle}-${index + 1}`,
      cosKey: image.publicUrl,
      url: image.publicUrl,
      sortOrder: index + 1
    })),
    shopify: {
      id: product.id,
      handle: product.handle,
      vendor: product.vendor,
      productUrl: `https://${STORE_DOMAIN}/products/${product.handle}`,
      videos: videos.map((video) => video.publicUrl)
    },
    translations: {
      "zh-CN": {
        name: product.title,
        summary,
        meetingPointName: "",
        suitableAge: "",
        descriptionHtml: buildDescription(product, videos)
      }
    }
  };
}

async function importOne(product, groupId, existingByName) {
  const folder = path.join(ASSET_ROOT, safeName(product.handle));
  await mkdir(folder, { recursive: true });

  const imageUrls = [
    ...(product.images ?? []).map((image) => absoluteUrl(image.src)),
    ...extractInlineImages(product)
  ].filter(Boolean);
  const uniqueImageUrls = [...new Set(imageUrls)];
  const videoUrls = [...new Set(await extractVideos(product.handle))];

  const images = (await mapWithConcurrency(uniqueImageUrls, 5, (url, index) => tryDownloadAsset(url, folder, index + 1))).filter(Boolean);
  const videos = (await mapWithConcurrency(videoUrls, 2, (url, index) => tryDownloadAsset(url, folder, uniqueImageUrls.length + index + 1))).filter(Boolean);

  const payload = buildActivityPayload(product, groupId, images, videos);
  const existing = existingByName.get(product.title);
  if (existing) {
    await request(`/activities/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    return { title: product.title, handle: product.handle, action: "updated", images: images.length, videos: videos.length };
  }
  const created = await request("/activities", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  await request(`/activities/${created.id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  existingByName.set(product.title, created);
  return { title: product.title, handle: product.handle, action: "created", images: images.length, videos: videos.length };
}

async function main() {
  await mkdir(ASSET_ROOT, { recursive: true });
  const products = await fetchProducts();
  const group = await ensureGroup();
  const activities = await request("/activities");
  const existingByName = new Map(activities.map((activity) => [activity.content.name, activity]));
  const results = [];

  for (const product of products) {
    console.log(`导入 ${product.title}`);
    results.push(await importOne(product, group.id, existingByName));
  }

  const previousManifest = await readFile(MANIFEST_PATH, "utf8").then(JSON.parse).catch(() => null);
  await writeFile(MANIFEST_PATH, JSON.stringify({
    importedAt: new Date().toISOString(),
    vendor: TARGET_VENDOR,
    storeDomain: STORE_DOMAIN,
    previousImportedAt: previousManifest?.importedAt ?? null,
    results
  }, null, 2));

  const summary = results.reduce((acc, item) => {
    acc[item.action] = (acc[item.action] ?? 0) + 1;
    acc.images += item.images;
    acc.videos += item.videos;
    return acc;
  }, { created: 0, updated: 0, images: 0, videos: 0 });
  console.log(JSON.stringify({ total: results.length, ...summary, manifest: MANIFEST_PATH }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
