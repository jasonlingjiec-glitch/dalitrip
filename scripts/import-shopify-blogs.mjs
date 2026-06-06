const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "dalitrip.com";
const SHOP_URL = `https://${STORE_DOMAIN}`;
const API_URL = process.env.DALITRIP_API_URL ?? "http://localhost:3000/api";
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "";
const SHOPIFY_ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-04";
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";
const SHOPIFY_ACCESS_TOKEN_URL =
  process.env.SHOPIFY_ACCESS_TOKEN_URL ?? `${SHOP_URL}/admin/oauth/access_token`;

const decodeEntities = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");

const unwrapCdata = (value = "") =>
  decodeEntities(value.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim());

const tagValue = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? unwrapCdata(match[1]) : "";
};

const categoryValues = (xml = "") =>
  [...xml.matchAll(/<category\b[^>]*\bterm=["']([^"']+)["'][^>]*\/?>/gi)]
    .map((match) => unwrapCdata(match[1]))
    .map((tag) => tag.trim())
    .filter(Boolean);

const blogHandleTags = {
  "life-in-dali": "大理生活",
  "lingjiec-s-trip": "旅行记录",
  data: "资料"
};

const blogHandleTag = (handle = "") => blogHandleTags[handle] ?? handle;

const tagList = (value = "") =>
  (Array.isArray(value) ? value : String(value).split(/[,，、\n]/))
    .map((tag) => String(tag ?? "").trim())
    .filter(Boolean);

const safeSlug = (...parts) => {
  const slug = parts
    .filter((part) => part !== undefined && part !== null && String(part).trim())
    .join("-")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || `post-${Date.now()}`;
};

const stripHtml = (html = "") =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const firstImage = (html = "") => {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match) return "";
  if (match[1].startsWith("//")) return `https:${match[1]}`;
  return match[1];
};

const normalizeImageUrl = (url = "") => {
  const decoded = decodeEntities(url.trim());
  if (!decoded) return "";
  if (decoded.startsWith("//")) return `https:${decoded}`;
  if (decoded.startsWith(`http://${STORE_DOMAIN}/`)) return decoded.replace("http://", "https://");
  if (decoded.startsWith("/")) return `${SHOP_URL}${decoded}`;
  return decoded;
};

const pageCoverImage = (html = "") => {
  const candidates = [];
  const metaPatterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match) candidates.push(match[1]);
  }

  for (const match of html.matchAll(/"image"\s*:\s*(?:\{[^}]*"url"\s*:\s*)?["']([^"']+)["']/gi)) {
    candidates.push(match[1].replace(/\\\//g, "/"));
  }

  const articleHtml = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html;
  for (const match of articleHtml.matchAll(/<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["']/gi)) {
    candidates.push(match[1]);
  }

  return candidates
    .map(normalizeImageUrl)
    .find((url) => url && !/logo|icon|favicon|avatar|loading|placeholder/i.test(url)) ?? "";
};

const cleanContent = (html = "") =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .trim();

const blogHandleFromUrl = (url) => {
  const match = url.match(/\/blogs\/([^/]+)/);
  return match ? match[1] : "";
};

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
};

const api = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message ?? response.statusText);
    error.status = response.status;
    throw error;
  }
  return payload.data;
};

const getShopifyBlogFeeds = async () => {
  const sitemap = await fetchText(`${SHOP_URL}/sitemap_blogs_1.xml`);
  const handles = [...new Set(
    [...sitemap.matchAll(/<loc>(https?:\/\/[^<]+\/blogs\/[^/<]+)<\/loc>/g)]
      .map((match) => blogHandleFromUrl(match[1]))
      .filter(Boolean)
  )];
  return handles.map((handle) => ({ handle, url: `${SHOP_URL}/blogs/${handle}.atom` }));
};

const parseFeed = async ({ handle, url }) => {
  const xml = await fetchText(url);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const posts = [];

  for (const [index, match] of entries.entries()) {
    const entry = match[1];
    const link = entry.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/i)?.[1] ?? "";
    const title = tagValue(entry, "title");
    const summaryHtml = tagValue(entry, "summary");
    const contentHtml = cleanContent(tagValue(entry, "content") || summaryHtml);
    const summary = stripHtml(summaryHtml || contentHtml).slice(0, 150);
    const tags = [...new Set([...categoryValues(entry), blogHandleTag(handle)].filter(Boolean))];
    const slug = safeSlug("shopify", handle, index + 1);
    let coverUrl = normalizeImageUrl(firstImage(contentHtml || summaryHtml));

    if (!coverUrl && link) {
      const pageHtml = await fetchText(link);
      coverUrl = pageCoverImage(pageHtml);
    }

    posts.push({
      title,
      slug,
      coverUrl,
      tags,
      summary,
      contentHtml: contentHtml || `<p>${summary}</p>`,
      publishedAt: tagValue(entry, "published") || tagValue(entry, "updated") || new Date().toISOString(),
      published: true,
      sourceUrl: link
    });
  }

  return posts.filter((post) => post.title && post.contentHtml);
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return payload;
};

const getShopifyAccessToken = async () => {
  if (SHOPIFY_ADMIN_ACCESS_TOKEN) return SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) return "";

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: SHOPIFY_CLIENT_ID,
    client_secret: SHOPIFY_CLIENT_SECRET
  });

  const payload = await fetchJson(SHOPIFY_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!payload.access_token) {
    throw new Error("Shopify did not return an access_token.");
  }
  return payload.access_token;
};

const shopifyAdmin = async (path, accessToken) =>
  fetchJson(`${SHOP_URL}/admin/api/${SHOPIFY_ADMIN_API_VERSION}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    }
  });

const fetchShopifyAdminBlogPosts = async (accessToken) => {
  const blogsPayload = await shopifyAdmin("/blogs.json?limit=250", accessToken);
  const blogs = blogsPayload.blogs ?? [];
  const posts = [];

  for (const blog of blogs) {
    const articlesPayload = await shopifyAdmin(`/blogs/${blog.id}/articles.json?limit=250`, accessToken);
    for (const article of articlesPayload.articles ?? []) {
      const contentHtml = cleanContent(article.body_html || article.summary_html || "");
      const coverUrl = normalizeImageUrl(article.image?.src ?? firstImage(contentHtml));
      const summary = stripHtml(article.summary_html || contentHtml).slice(0, 150);
      posts.push({
        title: article.title,
        slug: safeSlug("shopify", blog.handle || blog.id, article.handle, article.id),
        coverUrl,
        tags: [...new Set(tagList(article.tags))],
        summary,
        contentHtml: contentHtml || `<p>${summary}</p>`,
        publishedAt: article.published_at || article.updated_at || new Date().toISOString(),
        published: Boolean(article.published_at),
        sourceUrl: `${SHOP_URL}/blogs/${blog.handle}/${article.handle}`
      });
    }
  }

  return { feeds: blogs.map((blog) => ({ handle: blog.handle, url: `${SHOP_URL}/blogs/${blog.handle}` })), posts };
};

const fetchShopifyPublicBlogPosts = async () => {
  const feeds = await getShopifyBlogFeeds();
  const posts = (await Promise.all(feeds.map(parseFeed))).flat();
  return { feeds, posts };
};

const run = async () => {
  const accessToken = await getShopifyAccessToken();
  const source = accessToken ? "admin-api" : "public-atom";
  const { feeds, posts } = accessToken
    ? await fetchShopifyAdminBlogPosts(accessToken)
    : await fetchShopifyPublicBlogPosts();
  const existing = await api("/blog-posts");
  const byTitle = new Map(existing.map((post) => [post.title, post]));
  const bySlug = new Map(existing.map((post) => [post.slug, post]));
  const results = [];

  for (const post of posts) {
    const existingPost = byTitle.get(post.title) ?? bySlug.get(post.slug);
    const payload = {
      title: post.title,
      slug: existingPost?.slug ?? post.slug,
      coverUrl: post.coverUrl,
      tags: post.tags,
      summary: post.summary,
      contentHtml: post.contentHtml,
      publishedAt: post.publishedAt,
      published: post.published
    };

    if (existingPost) {
      const updated = await api(`/blog-posts/${existingPost.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      results.push({ action: "updated", title: updated.title });
      byTitle.set(updated.title, updated);
      bySlug.set(updated.slug, updated);
    } else {
      const created = await api("/blog-posts", { method: "POST", body: JSON.stringify(payload) });
      results.push({ action: "created", title: created.title });
      byTitle.set(created.title, created);
      bySlug.set(created.slug, created);
    }
  }

  const counts = results.reduce((memo, item) => {
    memo[item.action] = (memo[item.action] ?? 0) + 1;
    return memo;
  }, {});
  console.log(JSON.stringify({ source, feeds: feeds.length, posts: posts.length, ...counts }, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
