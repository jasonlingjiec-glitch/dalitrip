import { ApiError } from "./errors.js";
import { MemoryStore } from "./store.js";
import { codeToSession, createJsapiTransaction, decryptWechatResource, verifyWechatPaySignature } from "./wechat-pay.js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const json = (response, status, body) => {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(JSON.stringify(body));
};

const readJson = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "请求内容不是有效的 JSON");
  }
};
const readText = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};
const withAdminAccount = (body) => {
  const { adminAccountId, ...input } = body;
  return { adminAccountId, input };
};

const plainText = (value) => String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const truncateText = (value, maxLength = 160) => {
  const text = plainText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
const publicAssetBaseUrl = process.env.DALITRIP_PUBLIC_ASSET_BASE_URL ?? "https://api.dalitripapp.cn";
const localAssetPrefix = "http://localhost:8890/dalitrip-mvp/";
const assetUrl = (value) => String(value ?? "").replace(localAssetPrefix, `${publicAssetBaseUrl}/`);
const assetFileRoot = path.resolve(process.env.DALITRIP_ASSET_DIR ?? "imported-assets");
const mimeTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"]
]);
const sendImportedAsset = async (url, response) => {
  const pathname = decodeURIComponent(url.pathname);
  if (!pathname.startsWith("/imported-assets/")) return false;
  const relativePath = pathname.replace(/^\/imported-assets\//, "");
  const filePath = path.resolve(assetFileRoot, relativePath);
  if (!filePath.startsWith(`${assetFileRoot}${path.sep}`)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return true;
  }
  try {
    const buffer = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "access-control-allow-origin": "*"
    });
    response.end(buffer);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "access-control-allow-origin": "*" });
    response.end("Not found");
  }
  return true;
};
const paginateIfRequested = (items, searchParams) => {
  if (!searchParams.has("page") && !searchParams.has("pageSize")) return items;
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 10, 1), 100);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Math.max(Number(searchParams.get("page")) || 1, 1);
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize, pageCount };
};

const compactActivity = (activity) => ({
  id: activity.id,
  groupId: activity.groupId,
  advanceBookingHours: activity.advanceBookingHours,
  coverUrl: assetUrl(activity.coverUrl),
  schedulePaused: activity.schedulePaused,
  hasSchedule: activity.hasSchedule,
  content: {
    name: activity.content?.name ?? "",
    summary: activity.content?.summary ?? ""
  },
  tags: (activity.tags ?? []).map((tag) => ({ id: tag.id, code: tag.code, name: tag.name }))
});

const compactActivities = (activities) => activities.map(compactActivity);

const normalizeActivityAssets = (activity) => ({
  ...activity,
  coverUrl: assetUrl(activity.coverUrl),
  images: (activity.images ?? []).map((image) => ({ ...image, cosKey: assetUrl(image.cosKey), url: assetUrl(image.url ?? image.cosKey) }))
});

const compactGuide = (guide) => ({
  id: guide.id,
  name: guide.name,
  aliases: guide.aliases ?? [],
  photoUrl: assetUrl(guide.photoUrl),
  paused: guide.paused,
  sortOrder: guide.sortOrder,
  descriptionHtml: truncateText(guide.descriptionHtml),
  activityCount: guide.activities?.length ?? 0,
  imageCount: guide.images?.length ?? 0,
  activities: (guide.activities ?? []).slice(0, 4)
});

const normalizeGuideAssets = (guide) => ({
  ...guide,
  photoUrl: assetUrl(guide.photoUrl),
  images: (guide.images ?? []).map((image) => ({ ...image, cosKey: assetUrl(image.cosKey), url: assetUrl(image.url ?? image.cosKey) }))
});

const compactTopicPage = (page) => ({
  id: page.id,
  slug: page.slug,
  title: page.title,
  summary: page.summary,
  imageUrl: page.imageUrl,
  published: page.published,
  tags: page.tags ?? [],
  activityCount: page.activities?.length ?? 0,
  moduleCount: page.modules?.length ?? 0
});

const compactBlogPost = (post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  coverUrl: post.coverUrl,
  published: post.published,
  publishedAt: post.publishedAt,
  summary: post.summary || truncateText(post.contentHtml),
  tags: post.tags ?? [],
  commentCount: post.comments?.length ?? 0,
  comments: post.comments ?? []
});

const compactLocalInfo = (item) => ({
  id: item.id,
  title: item.title,
  coverUrl: item.coverUrl,
  summary: item.summary || truncateText(item.descriptionHtml || item.contentHtml || item.description),
  address: item.address,
  openingHours: item.openingHours,
  mapUrl: item.mapUrl,
  tags: item.tags ?? [],
  published: item.published,
  sortOrder: item.sortOrder
});

const compactReview = (review) => ({
  id: review.id,
  activityId: review.activityId,
  activityName: review.activityName,
  customerId: review.customerId,
  displayName: review.displayName,
  rating: review.rating,
  content: truncateText(review.content, 120),
  hidden: review.hidden,
  createdAt: review.createdAt,
  imageUrls: [],
  imageCount: review.imageUrls?.length ?? 0,
  replies: [],
  replyCount: review.replies?.length ?? 0
});

export function createApp(store = new MemoryStore()) {
  return async function app(request, response) {
    try {
      const url = new URL(request.url, "http://localhost");
      const parts = url.pathname.split("/").filter(Boolean);

      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "access-control-allow-headers": "content-type"
        });
        return response.end();
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return json(response, 200, { ok: true, service: "dalitrip-api" });
      }

      if (request.method === "GET" && await sendImportedAsset(url, response)) return;

      if (parts[0] !== "api") throw new ApiError(404, "接口不存在");

      if (request.method === "POST" && parts[1] === "wechat" && parts[2] === "login" && parts.length === 3) {
        const body = await readJson(request);
        const kind = body.kind === "manager" ? "manager" : "customer";
        if (kind === "manager") throw new ApiError(501, "管理小程序微信登录待接入权限模型");
        if (!body.code?.trim()) throw new ApiError(400, "缺少微信登录 code");
        const session = await codeToSession(kind, body.code.trim());
        const customer = store.upsertCustomerFromWechat({
          openid: session.openid,
          unionid: session.unionid,
          nickname: body.nickname,
          mobile: body.mobile
        });
        return json(response, 200, { data: { customerId: customer.id, nickname: customer.nickname } });
      }

      if (request.method === "POST" && parts[1] === "wechat" && parts[2] === "pay" && parts[3] === "notify" && parts.length === 4) {
        const bodyText = await readText(request);
        const verified = await verifyWechatPaySignature(request.headers, bodyText);
        if (!verified) return json(response, 401, { code: "FAIL", message: "签名验证失败" });
        const body = JSON.parse(bodyText || "{}");
        const transaction = decryptWechatResource(body.resource);
        if (transaction.trade_state === "SUCCESS") {
          store.confirmWechatPaymentByOutTradeNo(transaction.out_trade_no, {
            transactionId: transaction.transaction_id,
            tradeState: transaction.trade_state,
            payerOpenid: transaction.payer?.openid,
            amountCents: transaction.amount?.payer_total ?? transaction.amount?.total
          });
        }
        return json(response, 200, { code: "SUCCESS", message: "成功" });
      }

      if (request.method === "GET" && parts[1] === "groups" && parts.length === 2) {
        return json(response, 200, { data: store.listGroups() });
      }
      if (request.method === "POST" && parts[1] === "groups" && parts.length === 2) {
        return json(response, 201, { data: store.createGroup(await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "groups" && parts.length === 3) {
        return json(response, 200, { data: store.updateGroup(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "groups" && parts.length === 3) {
        return json(response, 200, { data: store.deleteGroup(parts[2]) });
      }
      if (request.method === "GET" && parts[1] === "admin-accounts" && parts.length === 2) {
        return json(response, 200, { data: store.listAdminAccounts() });
      }
      if (request.method === "POST" && parts[1] === "admin-accounts" && parts.length === 2) {
        return json(response, 201, { data: store.createAdminAccount(await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "admin-accounts" && parts.length === 3) {
        return json(response, 200, { data: store.updateAdminAccount(parts[2], await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "admin-accounts" && parts[3] === "enabled") {
        const body = await readJson(request);
        return json(response, 200, { data: store.setAdminAccountEnabled(parts[2], body.enabled) });
      }
      if (request.method === "PATCH" && parts[1] === "admin-accounts" && parts[3] === "wechat-binding") {
        const body = await readJson(request);
        if (body.action === "simulate-bind") return json(response, 200, { data: store.simulateAdminAccountWechatBinding(parts[2], body) });
        if (body.action === "unbind") return json(response, 200, { data: store.unbindAdminAccountWechat(parts[2]) });
        return json(response, 200, { data: store.refreshAdminAccountWechatBinding(parts[2]) });
      }

      if (request.method === "GET" && parts[1] === "tags" && parts.length === 2) {
        return json(response, 200, { data: store.listTags(url.searchParams.get("locale") ?? "zh-CN") });
      }
      if (request.method === "POST" && parts[1] === "tags" && parts.length === 2) {
        return json(response, 201, { data: store.createTag(await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "tags" && parts.length === 3) {
        return json(response, 200, { data: store.deleteTag(parts[2]) });
      }
      if (request.method === "GET" && parts[1] === "guides" && parts.length === 2) {
        const guides = store.listGuides({ includePaused: url.searchParams.get("includePaused") === "true" });
        return json(response, 200, { data: url.searchParams.get("compact") === "true" ? guides.map(compactGuide) : guides });
      }
      if (request.method === "GET" && parts[1] === "guides" && parts.length === 3) {
        return json(response, 200, { data: normalizeGuideAssets(store.getGuide(parts[2])) });
      }
      if (request.method === "GET" && parts[1] === "guide-page" && parts.length === 2) {
        return json(response, 200, { data: store.getGuidePage() });
      }
      if (request.method === "PATCH" && parts[1] === "guide-page" && parts.length === 2) {
        return json(response, 200, { data: store.updateGuidePage(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "topic-pages" && parts.length === 2) {
        const pages = store.listTopicPages({ publishedOnly: url.searchParams.get("published") === "true" });
        return json(response, 200, { data: url.searchParams.get("compact") === "true" ? pages.map(compactTopicPage) : pages });
      }
      if (request.method === "POST" && parts[1] === "topic-pages" && parts.length === 2) {
        return json(response, 201, { data: store.createTopicPage(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "topic-pages" && parts.length === 3) {
        return json(response, 200, { data: store.getTopicPage(parts[2]) });
      }
      if (request.method === "PATCH" && parts[1] === "topic-pages" && parts.length === 3) {
        return json(response, 200, { data: store.updateTopicPage(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "topic-pages" && parts.length === 3) {
        return json(response, 200, { data: store.deleteTopicPage(parts[2]) });
      }
      if (request.method === "GET" && parts[1] === "blog-posts" && parts.length === 2) {
        const posts = store.listBlogPosts({ publishedOnly: url.searchParams.get("published") === "true" });
        return json(response, 200, { data: url.searchParams.get("compact") === "true" ? posts.map(compactBlogPost) : posts });
      }
      if (request.method === "POST" && parts[1] === "blog-posts" && parts.length === 2) {
        return json(response, 201, { data: store.createBlogPost(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "blog-posts" && parts.length === 3) {
        return json(response, 200, { data: store.getBlogPost(parts[2]) });
      }
      if (request.method === "PATCH" && parts[1] === "blog-posts" && parts.length === 3) {
        return json(response, 200, { data: store.updateBlogPost(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "blog-posts" && parts.length === 3) {
        return json(response, 200, { data: store.deleteBlogPost(parts[2]) });
      }
      if (request.method === "POST" && parts[1] === "blog-posts" && parts[3] === "comments" && parts.length === 4) {
        return json(response, 201, { data: store.createBlogComment(parts[2], await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "home-entries" && parts.length === 2) {
        return json(response, 200, { data: store.listHomeEntries({ publishedOnly: url.searchParams.get("published") === "true" }) });
      }
      if (request.method === "POST" && parts[1] === "home-entries" && parts.length === 2) {
        return json(response, 201, { data: store.createHomeEntry(await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "home-entries" && parts.length === 3) {
        return json(response, 200, { data: store.updateHomeEntry(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "home-entries" && parts.length === 3) {
        return json(response, 200, { data: store.deleteHomeEntry(parts[2]) });
      }
      if (request.method === "GET" && parts[1] === "home-modules" && parts.length === 2) {
        return json(response, 200, { data: store.listHomeModules({ publishedOnly: url.searchParams.get("published") === "true" }) });
      }
      if (request.method === "GET" && parts[1] === "upcoming-departures" && parts.length === 2) {
        return json(response, 200, { data: store.listUpcomingDepartures({ locale: url.searchParams.get("locale") ?? "zh-CN", limit: url.searchParams.get("limit") }) });
      }
      if (request.method === "GET" && parts[1] === "available-activities" && parts.length === 2) {
        const tagIds = url.searchParams.get("tagIds")?.split(",").filter(Boolean) ?? [];
        return json(response, 200, {
          data: store.listAvailableActivities({ date: url.searchParams.get("date"), locale: url.searchParams.get("locale") ?? "zh-CN", tagIds })
        });
      }
      if (request.method === "POST" && parts[1] === "home-modules" && parts.length === 2) {
        return json(response, 201, { data: store.createHomeModule(await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "home-modules" && parts[2] === "reorder") {
        return json(response, 200, { data: store.reorderHomeModules((await readJson(request)).ids) });
      }
      if (request.method === "PATCH" && parts[1] === "home-modules" && parts.length === 3) {
        return json(response, 200, { data: store.updateHomeModule(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "home-modules" && parts.length === 3) {
        return json(response, 200, { data: store.deleteHomeModule(parts[2]) });
      }
      if (request.method === "GET" && parts[1] === "ai" && parts[2] === "settings" && parts.length === 3) {
        return json(response, 200, { data: store.getAiSettings() });
      }
      if (request.method === "PATCH" && parts[1] === "ai" && parts[2] === "settings" && parts.length === 3) {
        return json(response, 200, { data: store.updateAiSettings(await readJson(request)) });
      }
      if (request.method === "POST" && parts[1] === "ai" && parts[2] === "ask" && parts.length === 3) {
        return json(response, 201, { data: store.askAi(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "ai" && parts[2] === "questions" && parts.length === 3) {
        return json(response, 200, { data: store.listAiQuestions() });
      }
      if (request.method === "POST" && parts[1] === "ai" && parts[2] === "questions" && parts[4] === "faq" && parts.length === 5) {
        return json(response, 201, { data: store.createFaqFromQuestion(parts[3]) });
      }
      if (request.method === "GET" && parts[1] === "faqs" && parts.length === 2) {
        return json(response, 200, { data: store.listFaqs({ publishedOnly: url.searchParams.get("published") === "true" }) });
      }
      if (request.method === "POST" && parts[1] === "faqs" && parts.length === 2) {
        return json(response, 201, { data: store.createFaq(await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "faqs" && parts.length === 3) {
        return json(response, 200, { data: store.updateFaq(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "faqs" && parts.length === 3) {
        return json(response, 200, { data: store.deleteFaq(parts[2]) });
      }
      if (request.method === "POST" && parts[1] === "guides" && parts.length === 2) {
        return json(response, 201, { data: store.createGuide(await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "guides" && parts[2] === "reorder" && parts.length === 3) {
        return json(response, 200, { data: store.reorderGuides((await readJson(request)).ids) });
      }
      if (request.method === "PATCH" && parts[1] === "guides" && parts.length === 3) {
        return json(response, 200, { data: store.updateGuide(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "guides" && parts.length === 3) {
        return json(response, 200, { data: store.deleteGuide(parts[2]) });
      }
      if (request.method === "GET" && parts[1] === "guide-calendar" && parts.length === 2) {
        const calendar = store.listGuideCalendar({ adminAccountId: url.searchParams.get("adminAccountId") });
        return json(response, 200, { data: { ...calendar, guides: calendar.guides.map(normalizeGuideAssets) } });
      }
      if (request.method === "PATCH" && parts[1] === "guide-calendar" && parts.length === 2) {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 200, { data: store.setGuideAvailability(input, adminAccountId) });
      }

      if (request.method === "GET" && parts[1] === "activities" && parts.length === 2) {
        const tagIds = url.searchParams.get("tagIds")?.split(",").filter(Boolean) ?? [];
        const search = plainText(url.searchParams.get("search")).toLocaleLowerCase();
        const activitySortRank = (activity) => {
          if (activity.schedulePaused) return 2;
          if (!activity.hasSchedule) return 1;
          return 0;
        };
        const activities = store.listActivities({ locale: url.searchParams.get("locale") ?? "zh-CN", tagIds, adminAccountId: url.searchParams.get("adminAccountId") })
          .filter((activity) => !search || activity.content.name.toLocaleLowerCase().includes(search))
          .sort((left, right) => {
            const rankDiff = activitySortRank(left) - activitySortRank(right);
            if (rankDiff) return rankDiff;
            return left.content.name.localeCompare(right.content.name, "zh-CN");
          });
        const data = url.searchParams.get("compact") === "true" ? compactActivities(activities) : activities.map(normalizeActivityAssets);
        return json(response, 200, {
          data: paginateIfRequested(data, url.searchParams)
        });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts.length === 2) {
        return json(response, 201, { data: store.createActivity(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "activities" && parts.length === 3) {
        const activity = store.getActivity(parts[2], url.searchParams.get("locale") ?? "zh-CN", url.searchParams.get("adminAccountId"));
        return json(response, 200, {
          data: url.searchParams.get("compact") === "true" ? compactActivity(activity) : normalizeActivityAssets(activity)
        });
      }
      if (request.method === "GET" && parts[1] === "activities" && parts.length === 4 && parts[3] === "related") {
        return json(response, 200, {
          data: store.listRelatedActivities(parts[2], { locale: url.searchParams.get("locale") ?? "zh-CN", limit: url.searchParams.get("limit") })
        });
      }
      if (request.method === "PATCH" && parts[1] === "activities" && parts.length === 3) {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 200, { data: store.updateActivity(parts[2], input, adminAccountId) });
      }
      if (request.method === "DELETE" && parts[1] === "activities" && parts.length === 3) {
        return json(response, 200, { data: store.deleteActivity(parts[2], url.searchParams.get("adminAccountId")) });
      }
      if (request.method === "GET" && parts[1] === "local-infos" && parts.length === 2) {
        const items = store.listLocalInfos({ publishedOnly: url.searchParams.get("published") === "true", tag: url.searchParams.get("tag") ?? "" });
        return json(response, 200, {
          data: url.searchParams.get("compact") === "true" ? items.map(compactLocalInfo) : items
        });
      }
      if (request.method === "POST" && parts[1] === "local-infos" && parts.length === 2) {
        return json(response, 201, { data: store.createLocalInfo(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "local-infos" && parts.length === 3) {
        return json(response, 200, { data: store.getLocalInfo(parts[2]) });
      }
      if (request.method === "PATCH" && parts[1] === "local-infos" && parts.length === 3) {
        return json(response, 200, { data: store.updateLocalInfo(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "local-infos" && parts.length === 3) {
        return json(response, 200, { data: store.deleteLocalInfo(parts[2]) });
      }
      if (request.method === "PATCH" && parts[1] === "activities" && parts[3] === "schedule-pause") {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 200, { data: store.setSchedulePaused(parts[2], input.paused, adminAccountId) });
      }
      if (request.method === "GET" && parts[1] === "activities" && parts[3] === "schedule-rules") {
        return json(response, 200, { data: store.listScheduleRules(parts[2], url.searchParams.get("adminAccountId")) });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts[3] === "schedule-rules") {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 201, { data: store.createScheduleRule(parts[2], input, adminAccountId) });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts[3] === "regular-schedule-rules") {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 201, { data: store.createRegularScheduleRules(parts[2], input, adminAccountId) });
      }
      if (request.method === "PATCH" && parts[1] === "schedule-rules" && parts.length === 3) {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 200, { data: store.updateScheduleRule(parts[2], input, adminAccountId) });
      }
      if (request.method === "DELETE" && parts[1] === "schedule-rules" && parts.length === 3) {
        return json(response, 200, { data: store.deleteScheduleRule(parts[2], url.searchParams.get("adminAccountId")) });
      }
      if (request.method === "GET" && parts[1] === "activities" && parts[3] === "slots") {
        const adminAccountId = url.searchParams.get("adminAccountId");
        const fromWechatDevtools = [
          request.headers?.referer,
          request.headers?.["user-agent"]
        ].some((value) => String(value ?? "").includes("servicewechat.com") || String(value ?? "").includes("MicroMessenger"));
        return json(response, 200, {
          data: store.listSlots(parts[2], {
            from: url.searchParams.get("from"),
            to: url.searchParams.get("to"),
            date: url.searchParams.get("date"),
            includeGenerated: url.searchParams.get("includeGenerated") === "true" || (!adminAccountId && !url.searchParams.get("date") && fromWechatDevtools),
            adminAccountId
          })
        });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts[3] === "slots") {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 201, { data: store.createSlot(parts[2], input, adminAccountId) });
      }
      if (request.method === "PATCH" && parts[1] === "slots" && parts.length === 3) {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 200, { data: store.updateSlot(parts[2], input, adminAccountId) });
      }
      if (request.method === "DELETE" && parts[1] === "slots" && parts.length === 3) {
        return json(response, 200, { data: store.deleteSlot(parts[2], url.searchParams.get("adminAccountId")) });
      }

      if (request.method === "GET" && parts[1] === "customers" && parts.length === 2) {
        return json(response, 200, { data: store.listCustomers() });
      }
      if (request.method === "GET" && parts[1] === "customers" && parts.length === 3) {
        return json(response, 200, { data: store.getCustomer(parts[2]) });
      }
      if (request.method === "PATCH" && parts[1] === "customers" && parts[3] === "frozen") {
        const body = await readJson(request);
        return json(response, 200, { data: store.setCustomerFrozen(parts[2], body.frozen) });
      }
      if (request.method === "POST" && parts[1] === "customers" && parts[3] === "wallet-adjustments") {
        return json(response, 201, { data: store.adjustCustomerWallet(parts[2], await readJson(request)) });
      }

      if (request.method === "GET" && parts[1] === "reviews" && parts.length === 2) {
        const search = plainText(url.searchParams.get("search")).toLocaleLowerCase();
        const reviews = store.listReviews({
          activityId: url.searchParams.get("activityId"),
          customerId: url.searchParams.get("customerId"),
          includeHidden: url.searchParams.get("includeHidden") === "true",
          adminAccountId: url.searchParams.get("adminAccountId")
        }).filter((review) => !search ||
          review.activityName.toLocaleLowerCase().includes(search) ||
          review.displayName.toLocaleLowerCase().includes(search) ||
          review.content.toLocaleLowerCase().includes(search));
        const data = url.searchParams.get("compact") === "true" ? reviews.map(compactReview) : reviews;
        return json(response, 200, {
          data: paginateIfRequested(data, url.searchParams)
        });
      }
      if (request.method === "GET" && parts[1] === "reviews" && parts.length === 3) {
        return json(response, 200, { data: store.getReview(parts[2]) });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts[3] === "reviews") {
        return json(response, 201, { data: store.createReview(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "reviews" && parts.length === 3) {
        return json(response, 200, { data: store.deleteReview(parts[2], url.searchParams.get("customerId")) });
      }
      if (request.method === "PATCH" && parts[1] === "reviews" && parts.length === 3) {
        return json(response, 200, { data: store.updateReview(parts[2], await readJson(request)) });
      }
      if (request.method === "PATCH" && parts[1] === "reviews" && parts[3] === "hidden") {
        const body = await readJson(request);
        return json(response, 200, { data: store.setReviewHidden(parts[2], body.hidden) });
      }
      if (request.method === "POST" && parts[1] === "reviews" && parts[3] === "replies") {
        return json(response, 201, { data: store.createReviewReply(parts[2], await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "notifications" && parts.length === 2) {
        return json(response, 200, { data: store.listNotifications(url.searchParams.get("adminAccountId")) });
      }
      if (request.method === "PATCH" && parts[1] === "notifications" && parts[3] === "read") {
        const body = await readJson(request);
        return json(response, 200, { data: store.markNotificationRead(parts[2], body.adminAccountId) });
      }

      if (request.method === "GET" && parts[1] === "orders" && parts.length === 2) {
        return json(response, 200, {
          data: store.listOrders({
            customerId: url.searchParams.get("customerId"),
            groupId: url.searchParams.get("groupId"),
            activityId: url.searchParams.get("activityId"),
            activityDate: url.searchParams.get("activityDate"),
            activityDateFrom: url.searchParams.get("activityDateFrom"),
            activityDateTo: url.searchParams.get("activityDateTo"),
            status: url.searchParams.get("status"),
            paymentMethod: url.searchParams.get("paymentMethod"),
            adminAccountId: url.searchParams.get("adminAccountId")
          })
        });
      }
      if (request.method === "POST" && parts[1] === "orders" && parts.length === 2) {
        return json(response, 201, { data: store.createOrder(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "orders" && parts.length === 3) {
        return json(response, 200, { data: store.getOrder(parts[2], url.searchParams.get("adminAccountId")) });
      }
      if (request.method === "GET" && parts[1] === "orders" && parts[3] === "cancellation-preview") {
        return json(response, 200, {
          data: store.getCancellationPreview(parts[2], {
            customerId: url.searchParams.get("customerId"),
            adminAccountId: url.searchParams.get("adminAccountId")
          })
        });
      }
      if (request.method === "PATCH" && parts[1] === "orders" && parts[3] === "confirm-payment") {
        return json(response, 200, { data: store.confirmOrderPayment(parts[2], await readJson(request)) });
      }
      if (request.method === "POST" && parts[1] === "orders" && parts[3] === "wechat-prepay") {
        const body = await readJson(request);
        const target = store.getWechatPaymentTarget(parts[2], { customerId: body.customerId });
        return json(response, 200, {
          data: await createJsapiTransaction({
            description: target.description,
            outTradeNo: target.orderNo,
            amountCents: target.amountCents,
            openid: target.openid
          })
        });
      }
      if (request.method === "PATCH" && parts[1] === "orders" && parts[3] === "cancel") {
        return json(response, 200, { data: store.cancelOrder(parts[2], await readJson(request)) });
      }

      throw new ApiError(404, "接口不存在");
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      const message = error instanceof ApiError ? error.message : "服务器内部错误";
      json(response, status, { error: { message, details: error.details } });
    }
  };
}
