import { ApiError } from "./errors.js";
import { MemoryStore } from "./store.js";

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
const withAdminAccount = (body) => {
  const { adminAccountId, ...input } = body;
  return { adminAccountId, input };
};

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

      if (parts[0] !== "api") throw new ApiError(404, "接口不存在");

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
        return json(response, 200, { data: store.listGuides() });
      }
      if (request.method === "GET" && parts[1] === "guide-page" && parts.length === 2) {
        return json(response, 200, { data: store.getGuidePage() });
      }
      if (request.method === "PATCH" && parts[1] === "guide-page" && parts.length === 2) {
        return json(response, 200, { data: store.updateGuidePage(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "topic-pages" && parts.length === 2) {
        return json(response, 200, { data: store.listTopicPages({ publishedOnly: url.searchParams.get("published") === "true" }) });
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
        return json(response, 200, { data: store.listBlogPosts({ publishedOnly: url.searchParams.get("published") === "true" }) });
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
        return json(response, 200, { data: store.listGuideCalendar({ adminAccountId: url.searchParams.get("adminAccountId") }) });
      }
      if (request.method === "PATCH" && parts[1] === "guide-calendar" && parts.length === 2) {
        const { input, adminAccountId } = withAdminAccount(await readJson(request));
        return json(response, 200, { data: store.setGuideAvailability(input, adminAccountId) });
      }

      if (request.method === "GET" && parts[1] === "activities" && parts.length === 2) {
        const tagIds = url.searchParams.get("tagIds")?.split(",").filter(Boolean) ?? [];
        return json(response, 200, {
          data: store.listActivities({ locale: url.searchParams.get("locale") ?? "zh-CN", tagIds, adminAccountId: url.searchParams.get("adminAccountId") })
        });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts.length === 2) {
        return json(response, 201, { data: store.createActivity(await readJson(request)) });
      }
      if (request.method === "GET" && parts[1] === "activities" && parts.length === 3) {
        return json(response, 200, {
          data: store.getActivity(parts[2], url.searchParams.get("locale") ?? "zh-CN", url.searchParams.get("adminAccountId"))
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
        return json(response, 200, {
          data: store.listSlots(parts[2], {
            from: url.searchParams.get("from"),
            to: url.searchParams.get("to"),
            date: url.searchParams.get("date"),
            includeGenerated: url.searchParams.get("includeGenerated") === "true",
            adminAccountId: url.searchParams.get("adminAccountId")
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
        return json(response, 200, {
          data: store.listReviews({
            activityId: url.searchParams.get("activityId"),
            customerId: url.searchParams.get("customerId"),
            includeHidden: url.searchParams.get("includeHidden") === "true",
            adminAccountId: url.searchParams.get("adminAccountId")
          })
        });
      }
      if (request.method === "POST" && parts[1] === "activities" && parts[3] === "reviews") {
        return json(response, 201, { data: store.createReview(parts[2], await readJson(request)) });
      }
      if (request.method === "DELETE" && parts[1] === "reviews" && parts.length === 3) {
        return json(response, 200, { data: store.deleteReview(parts[2], url.searchParams.get("customerId")) });
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
