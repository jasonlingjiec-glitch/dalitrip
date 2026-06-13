const API = (() => {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3000/api";
  return "https://api.dalitripapp.cn/api";
})();
const USE_STATIC_DEMO = window.location.hostname.endsWith("github.io");
const DEMO_CUSTOMER_ID = "customer-demo";
let customerId = localStorage.getItem("dalitripCustomerId") || DEMO_CUSTOMER_ID;
const cover = "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=85";
const state = { activities: [], tags: [], guides: [], guidePage: { introductionHtml: "" }, topicPages: [], topicPage: null, blogPosts: [], blogPost: null, localInfos: [], localInfo: null, localInfoTag: "", homeEntries: [], homeModules: [], homeReviews: [], upcomingSlots: [], selectedTags: [], expandedTagGroups: [], bookingDate: "", bookingTags: [], bookingExpandedTagGroups: [], bookingSearch: "", bookingActivities: [], aiGuide: null, activity: null, activityDate: "", activityDateAvailability: [], slots: [], reviews: [], relatedActivities: [], reviewImages: [], reviewVideo: "", bookingSlot: null, orders: [], cancellingOrderId: null, replyingReviewId: null };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[character]));
const money = (cents) => `¥${(cents / 100).toFixed(Number(cents) % 100 === 0 ? 0 : 2)}`;
const dateOnly = (value) => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
const timeOnly = (value) => value.slice(11, 16);
const readableDate = (value) => value ? value.replace("T", " ").slice(0, 16) : "";
const readableDateTimeRange = (startsAt, endsAt) => `${startsAt.slice(0, 10)} ${timeOnly(startsAt)}-${timeOnly(endsAt)}`;
const shortDateTime = (startsAt, endsAt) => {
  const date = new Date(startsAt);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${timeOnly(startsAt)}-${timeOnly(endsAt)}`;
};
const shortDateOnly = (value) => {
  const date = new Date(value);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
};
const plainText = (html) => {
  const node = document.createElement("div");
  node.innerHTML = html ?? "";
  return (node.textContent || "").replace(/\s+/g, " ").trim();
};
const blogSummary = (post) => post.summary?.trim() || plainText(post.contentHtml).slice(0, 150);
const formatBlogDate = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(date);
};
const activeOrderStatuses = new Set(["PENDING_PAYMENT", "BOOKED", "COMPLETED"]);
const activityTags = (activity) => Array.isArray(activity?.tags) ? activity.tags : [];
const isSeasonalBestTag = (tag) => {
  const name = String(tag?.name ?? tag?.translations?.["zh-CN"] ?? "");
  return name.includes("当季最佳") || name.includes("当家最佳");
};
const seasonalHighlight = (activity) => {
  const text = String(activity?.content?.seasonalHighlight ?? "").trim();
  return text && activityTags(activity).some(isSeasonalBestTag) ? text : "";
};
const nonActivityGuideNames = new Set(["深夜食堂旧时光", "大家在一起的时间", "在一起的日子"]);
const isActivitySelectableGuide = (guide) => guide?.paused !== true && !nonActivityGuideNames.has(guide?.name);
const sortGuidesForDisplay = (guides = []) => [...guides].sort((left, right) => {
  const pausedDiff = (left.paused ? 1 : 0) - (right.paused ? 1 : 0);
  if (pausedDiff) return pausedDiff;
  const leftArchived = isActivitySelectableGuide(left) ? 0 : 1;
  const rightArchived = isActivitySelectableGuide(right) ? 0 : 1;
  return leftArchived - rightArchived || (left.sortOrder ?? 9999) - (right.sortOrder ?? 9999);
});
function normalizeWarmModule(module) {
  if (!module || !["BLOG", "GUIDES"].includes(module.type)) return module;
  const style = { ...(module.style ?? {}) };
  if (!style.backgroundColor || style.backgroundColor === "#ffffff") style.backgroundColor = "#fffaf0";
  if (!style.layout) style.layout = "GRID";
  if (!style.cardStyle) style.cardStyle = "PLAIN";
  if (style.radius == null) style.radius = 6;
  if (style.gap == null || style.gap === 8) style.gap = 10;
  if (style.padding == null || style.padding === 11) style.padding = 14;
  return { ...module, style };
}
const normalizeWarmModules = (modules = []) => modules.map(normalizeWarmModule);
const tagParts = (tag) => {
  const parts = String(tag.name ?? "").split("·").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? { group: parts[0], child: parts.slice(1).join(" · ") } : { group: "", child: tag.name };
};
const groupedTags = (tags = []) => {
  const groups = new Map();
  const standalone = [];
  visibleTags(tags).forEach((tag) => {
    const parts = tagParts(tag);
    if (!parts.group) return standalone.push({ ...tag, displayName: parts.child });
    if (!groups.has(parts.group)) groups.set(parts.group, []);
    groups.get(parts.group).push({ ...tag, displayName: parts.child });
  });
  return { standalone, groups: [...groups.entries()].map(([name, children]) => ({ name, children })) };
};
const toggleInList = (list, value) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
const singleSelectedTag = (list, value) => list.includes(value) ? [] : [value];
const renderGroupedTagFilter = ({ selectedIds, expandedGroups, tagAttr = "tag", groupAttr = "tag-group" }) => {
  const { standalone, groups } = groupedTags(state.tags);
  return [
    `<div class="tag-filter-plain">`,
    ...standalone.map((tag) => `<button class="${selectedIds.includes(tag.id) ? "active" : ""}" data-${tagAttr}="${tag.id}">${escapeHtml(tag.displayName)}</button>`),
    `</div>`,
    groups.length ? `<div class="tag-filter-main">` : "",
    ...groups.map((group) => {
      const hasSelected = group.children.some((tag) => selectedIds.includes(tag.id));
      const expanded = expandedGroups.includes(group.name) || hasSelected;
      return `<button class="${expanded ? "active" : ""}" data-${groupAttr}="${escapeHtml(group.name)}">${escapeHtml(group.name)}</button>`;
    }),
    groups.length ? `</div>` : "",
    ...groups.map((group) => {
      const hasSelected = group.children.some((tag) => selectedIds.includes(tag.id));
      const expanded = expandedGroups.includes(group.name) || hasSelected;
      return expanded ? `<div class="tag-filter-sub">${group.children.map((tag) => `<button class="${selectedIds.includes(tag.id) ? "active" : ""}" data-${tagAttr}="${tag.id}">${escapeHtml(tag.displayName)}</button>`).join("")}</div>` : "";
    })
  ].join("");
};
let staticDataPromise;
const normalizeAssetUrl = (value) => {
  if (typeof value !== "string") return value;
  return value.replaceAll("http://localhost:8890/dalitrip-mvp/", "../../");
};
const normalizeStaticAssets = (value) => {
  if (Array.isArray(value)) return value.map(normalizeStaticAssets);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeStaticAssets(item)]));
  return normalizeAssetUrl(value);
};
const loadStaticData = async () => {
  if (!staticDataPromise) {
    staticDataPromise = fetch(`../../data/runtime-data.json?v=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("静态数据读取失败");
        return response.json();
      })
      .then(normalizeStaticAssets);
  }
  return staticDataPromise;
};
const parseBody = (options) => {
  if (!options.body) return {};
  try {
    return JSON.parse(options.body);
  } catch {
    return {};
  }
};
const staticLocalized = (translations = {}) => translations?.["zh-CN"] ?? translations?.en ?? {};
const staticTag = (tag) => ({ ...tag, name: tag.translations?.["zh-CN"] ?? tag.name ?? tag.code ?? tag.id });
const visibleTags = (tags = []) => tags.map(staticTag).filter((tag) => String(tag.name ?? "").trim());
const withActivityContent = (activity, data) => {
  if (!activity) return null;
  const content = activity.content ?? activity.translations?.["zh-CN"] ?? activity.translations?.en ?? {};
  const tags = (activity.tagIds ?? activityTags(activity).map((tag) => tag.id))
    .map((id) => data.tags.find((tag) => tag.id === id))
    .filter(Boolean)
    .map(staticTag)
    .filter((tag) => String(tag.name ?? "").trim());
  const guides = (activity.guideIds ?? [])
    .map((id) => data.guides.find((guide) => guide.id === id))
    .filter((guide) => guide?.paused !== true);
  return {
    ...activity,
    content,
    tags,
    guides,
    groupName: data.groups.find((group) => group.id === activity.groupId)?.name ?? "活动"
  };
};
const staticLimit = (items, params) => items.slice(0, Number(params.get("limit") || items.length));
const publishedOnly = (items, params) => params.get("published") === "true" ? items.filter((item) => item.published !== false) : items;
const slotActivity = (slot, data) => withActivityContent(data.activities.find((activity) => activity.id === slot.activityId), data);
const slotIsFuture = (slot) => new Date(slot.startsAt).getTime() >= Date.now() - 86400000;
const orderWithDetails = (order, data) => {
  const activity = withActivityContent(data.activities.find((item) => item.id === order.activityId), data);
  const slot = data.slots.find((item) => item.id === order.slotId);
  return {
    ...order,
    activityName: activity?.content?.name ?? "活动",
    groupName: data.groups.find((group) => group.id === order.groupId)?.name ?? activity?.groupName ?? "活动",
    startsAt: slot?.startsAt,
    endsAt: slot?.endsAt,
    meetingPointName: activity?.content?.meetingPointName ?? "",
    meetingLatitude: activity?.meetingLatitude,
    meetingLongitude: activity?.meetingLongitude,
    leaderWechat: activity?.leaderWechat ?? ""
  };
};
const staticAiQuestionTokens = (question) => [...new Set(String(question ?? "").toLowerCase().match(/[\p{Script=Han}A-Za-z0-9]+/gu) ?? [])]
  .filter((token) => token.length >= 2)
  .slice(0, 14);
const staticAiBlob = (activity) => [
  activity.content?.name,
  activity.content?.summary,
  plainText(activity.content?.descriptionHtml),
  activity.content?.meetingPointName,
  activity.content?.suitableAge,
  activity.leaderWechat,
  activity.groupName,
  activityTags(activity).map((tag) => tag.name).join(" "),
  (activity.guides ?? []).map((guide) => guide.name).join(" ")
].join(" ").toLowerCase();
const staticAiScore = (activity, tokens) => tokens.length ? tokens.reduce((score, token) => score + (staticAiBlob(activity).includes(token) ? 2 : 0), 0) : 1;
const staticAiCover = (activity) => activity?.coverUrl || activityImageUrl(activity?.images?.[0]) || cover;
const staticAiRecommendation = (activity, tokens) => ({
  activityId: activity.id,
  name: activity.content?.name ?? "活动",
  summary: activity.content?.summary ?? "",
  coverUrl: staticAiCover(activity),
  matchedTags: activityTags(activity).map((tag) => tag.name).filter((name) => tokens.length === 0 || tokens.some((token) => String(name).toLowerCase().includes(token))),
  reason: activity.content?.summary || "当前活动库中的可选活动"
});
const staticAiAsk = (data, body) => {
  const question = body.question?.trim();
  if (!question) throw new Error("请先输入想咨询的问题");
  const tokens = staticAiQuestionTokens(question);
  const activities = data.activities.map((activity) => withActivityContent(activity, data)).filter((activity) => activity.schedulePaused !== true);
  const recommendations = activities
    .map((activity) => ({ activity, score: staticAiScore(activity, tokens) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ activity }) => staticAiRecommendation(activity, tokens));
  const fallback = recommendations.length ? recommendations : activities.slice(0, 3).map((activity) => staticAiRecommendation(activity, tokens));
  const answer = fallback.length
    ? `我只根据当前活动库帮你筛选。可以优先看看：${fallback.map((item, index) => `${index + 1}. ${item.name}`).join("；")}。`
    : "我只根据当前活动库回答：暂时没有找到特别匹配的活动，可以换一个日期或减少条件再试。";
  const record = {
    id: `demo-ai-${Date.now()}`,
    question,
    answer,
    recommendations: fallback,
    extractedNeeds: tokens,
    source: "DATABASE_ONLY",
    model: data.aiSettings?.model ?? "deepseek-chat",
    customerId: body.customerId ?? DEMO_CUSTOMER_ID,
    createdAt: new Date().toISOString(),
    faqId: null
  };
  data.aiQuestions ??= [];
  data.aiQuestions.unshift(record);
  return record;
};
async function staticRequest(path, options = {}) {
  const data = await loadStaticData();
  const url = new URL(path, "https://dalitrip.local");
  const route = url.pathname;
  const params = url.searchParams;
  const method = (options.method || "GET").toUpperCase();
  const activityById = (id) => withActivityContent(data.activities.find((activity) => activity.id === id), data);
  const guideWithActivityCovers = (guide) => ({
    ...guide,
    activities: ((guide.activities ?? []).length
      ? guide.activities
      : data.activities
        .filter((activity) => (activity.guideIds ?? []).includes(guide.id))
        .map((activity) => ({ id: activity.id, name: staticLocalized(activity.translations).name, summary: staticLocalized(activity.translations).summary })))
      .map((activity) => {
        const fullActivity = activityById(activity.id);
        return { ...activity, coverUrl: activity.coverUrl || staticAiCover(fullActivity) };
      })
  });

  if (method === "DELETE" && route.startsWith("/reviews/")) return null;
  if (method === "POST" && route === "/orders") {
    const body = parseBody(options);
    const slot = data.slots.find((item) => item.id === body.slotId) ?? data.slots[0];
    const activity = activityById(body.activityId ?? slot?.activityId);
    const lineItems = normalizeStaticOrderLineItems(body, slot);
    const quantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const amountCents = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
    const firstItem = lineItems[0] ?? {};
    const order = {
      id: `demo-order-${Date.now()}`,
      orderNo: `DEMO${Date.now()}`,
      customerId: DEMO_CUSTOMER_ID,
      activityId: activity?.id,
      groupId: activity?.groupId,
      slotId: slot?.id,
      quantity,
      priceOptionId: firstItem.priceOptionId,
      specification: lineItems.length === 1 ? firstItem.specification : lineItems.map((item) => `${item.specification} × ${item.quantity}`).join("，"),
      unitPriceCents: firstItem.unitPriceCents ?? 0,
      amountCents,
      lineItems,
      status: "PENDING_PAYMENT",
      paymentMethod: "WECHAT",
      profile: body.profile ?? {},
      createdAt: new Date().toISOString()
    };
    data.orders.unshift(order);
    return orderWithDetails(order, data);
  }
  if (method === "PATCH" && /^\/orders\/[^/]+\/confirm-payment$/.test(route)) {
    const id = route.split("/")[2];
    const order = data.orders.find((item) => item.id === id) ?? data.orders[0];
    if (order) {
      order.status = "BOOKED";
      order.paidAt = new Date().toISOString();
    }
    return order ? orderWithDetails(order, data) : null;
  }
  if (method === "PATCH" && /^\/orders\/[^/]+\/cancel$/.test(route)) {
    const id = route.split("/")[2];
    const order = data.orders.find((item) => item.id === id) ?? data.orders[0];
    if (order) order.status = "REFUNDED";
    return order ? orderWithDetails(order, data) : null;
  }
  if (method === "POST" && /^\/activities\/[^/]+\/reviews$/.test(route)) {
    const activityId = route.split("/")[2];
    const body = parseBody(options);
    const review = {
      id: `demo-review-${Date.now()}`,
      activityId,
      customerId: DEMO_CUSTOMER_ID,
      displayName: body.displayName || "Mia",
      rating: Number(body.rating || 5),
      content: body.content || "",
      imageUrls: body.imageUrls ?? [],
      videoUrl: body.videoUrl || "",
      replies: [],
      hidden: false,
      createdAt: new Date().toISOString()
    };
    data.reviews.unshift(review);
    return review;
  }
  if (method === "POST" && /^\/reviews\/[^/]+\/replies$/.test(route)) {
    const review = data.reviews.find((item) => item.id === route.split("/")[2]);
    const reply = { id: `demo-reply-${Date.now()}`, authorRole: "CUSTOMER", displayName: "Mia", content: parseBody(options).content || "", createdAt: new Date().toISOString() };
    if (review) (review.replies ??= []).push(reply);
    return reply;
  }
  if (method === "POST" && /^\/blog-posts\/[^/]+\/comments$/.test(route)) {
    const postId = route.split("/")[2];
    const body = parseBody(options);
    const comment = { id: `demo-blog-comment-${Date.now()}`, postId, customerId: DEMO_CUSTOMER_ID, displayName: body.displayName || "Mia", content: body.content || "", createdAt: new Date().toISOString() };
    data.blogComments.unshift(comment);
    return comment;
  }
  if (method === "POST" && route === "/ai/ask") return staticAiAsk(data, parseBody(options));

  if (route === "/tags") return visibleTags(data.tags);
  if (route === "/guides") return sortGuidesForDisplay(data.guides.filter((guide) => guide.paused !== true)).map(guideWithActivityCovers);
  if (route === "/ai/questions") return data.aiQuestions ?? [];
  if (route === "/faqs") return staticLimit(publishedOnly(data.faqs ?? [], params), params);
  if (route === "/guide-page") return data.guidePage;
  if (route === "/home-entries") return staticLimit(publishedOnly(data.homeEntries, params).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), params);
  if (route === "/home-modules") return staticLimit(publishedOnly(data.homeModules, params).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map(normalizeWarmModule), params);
  if (route === "/topic-pages") return staticLimit(publishedOnly(data.topicPages, params).map((page) => ({ ...page, modules: normalizeWarmModules(page.modules ?? []) })), params);
  if (/^\/topic-pages\/[^/]+$/.test(route)) {
    const slug = decodeURIComponent(route.split("/")[2]);
    const page = data.topicPages.find((item) => item.slug === slug || item.id === slug);
    if (!page) throw new Error("专题不存在");
    const activities = data.activities.map((activity) => withActivityContent(activity, data))
      .filter((activity) => (page.tagIds ?? []).every((tagId) => activityTags(activity).some((tag) => tag.id === tagId)))
      .map((activity) => ({ ...activity, name: activity.content.name, summary: activity.content.summary }));
    return { ...page, modules: normalizeWarmModules(page.modules ?? []), activities };
  }
  if (route === "/blog-posts") return staticLimit(publishedOnly(data.blogPosts, params), params);
  if (/^\/blog-posts\/[^/]+$/.test(route)) {
    const key = decodeURIComponent(route.split("/")[2]);
    const post = data.blogPosts.find((item) => item.slug === key || item.id === key);
    if (!post) throw new Error("文章不存在");
    const comments = data.blogComments.filter((comment) => comment.postId === post.id);
    return { ...post, comments };
  }
  if (route === "/local-infos") {
    const tag = params.get("tag") ?? "";
    return staticLimit(publishedOnly(data.localInfos ?? [], params)
      .filter((item) => !tag || (item.tags ?? []).includes(tag))
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)), params);
  }
  if (/^\/local-infos\/[^/]+$/.test(route)) {
    const key = decodeURIComponent(route.split("/")[2]);
    const item = (data.localInfos ?? []).find((candidate) => candidate.id === key);
    if (!item) throw new Error("在地信息不存在");
    return item;
  }
  if (route === "/activities") {
    const tagIds = (params.get("tagIds") || "").split(",").filter(Boolean);
    return data.activities.map((activity) => withActivityContent(activity, data))
      .filter((activity) => tagIds.every((tagId) => activityTags(activity).some((tag) => tag.id === tagId)));
  }
  if (route === "/available-activities") {
    const date = params.get("date");
    const tagIds = (params.get("tagIds") || "").split(",").filter(Boolean);
    return data.activities.map((activity) => withActivityContent(activity, data))
      .filter((activity) => tagIds.every((tagId) => activityTags(activity).some((tag) => tag.id === tagId)))
      .map((activity) => ({
        ...activity,
        slots: data.slots.filter((slot) => slot.activityId === activity.id && slot.enabled !== false && (!date || slot.startsAt.slice(0, 10) === date))
      }))
      .filter((activity) => activity.slots.length);
  }
  if (route === "/upcoming-departures") {
    const slots = data.slots.filter((slot) => {
      const activity = slotActivity(slot, data);
      return slot.enabled !== false && slotIsFuture(slot) && activity?.schedulePaused !== true;
    }).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map((slot) => {
      const activity = slotActivity(slot, data);
      const slotOrders = (data.orders ?? []).filter((order) => order.slotId === slot.id && activeOrderStatuses.has(order.status));
      const quantity = slot.bookedCount ?? slotOrders.reduce((sum, order) => sum + (order.quantity ?? 0), 0);
      const firstOrder = slotOrders[0];
      const firstCustomer = (data.customers ?? []).find((customer) => customer.id === firstOrder?.customerId);
      const firstName = firstCustomer?.nickname || firstCustomer?.profile?.nickname || firstOrder?.customerName || "客人";
      return {
        ...slot,
        activityId: activity?.id,
        activityName: activity?.content?.name ?? "活动",
        coverUrl: activityCover(activity),
        customerDisplayName: firstName,
        participantAvatarUrl: firstCustomer?.avatarUrl || firstCustomer?.profile?.avatarUrl || "",
        participantCount: quantity,
        bookedCount: quantity
      };
    }).filter((slot) => slot.participantCount > 0);
    return staticLimit(slots, params);
  }
  if (route === "/reviews") {
    return data.reviews.filter((review) => review.hidden !== true && (!params.get("activityId") || review.activityId === params.get("activityId")))
      .map((review) => ({ ...review, activityName: review.activityId ? activityById(review.activityId)?.content?.name ?? "活动" : review.activityName ?? "苍山徒步之家" }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  if (route === "/orders") return data.orders.filter((order) => !params.get("customerId") || order.customerId === params.get("customerId")).map((order) => orderWithDetails(order, data));
  if (/^\/orders\/[^/]+\/cancellation-preview$/.test(route)) {
    const order = orderWithDetails(data.orders.find((item) => item.id === route.split("/")[2]) ?? data.orders[0], data);
    const refundRate = 1;
    return { order, amountCents: order.amountCents, refundRate, refundAmountCents: order.amountCents, retainedAmountCents: 0, leaderWechat: activityById(order.activityId)?.leaderWechat ?? "" };
  }
  if (/^\/activities\/[^/]+\/slots$/.test(route)) {
    const activityId = route.split("/")[2];
    const date = params.get("date");
    return data.slots.filter((slot) => slot.activityId === activityId && slot.enabled !== false && (!date || slot.startsAt.slice(0, 10) === date));
  }
  if (/^\/activities\/[^/]+\/related$/.test(route)) {
    const activityId = route.split("/")[2];
    return staticLimit(data.activities.filter((activity) => activity.id !== activityId).map((activity) => withActivityContent(activity, data)), params);
  }
  if (/^\/activities\/[^/]+$/.test(route)) {
    const activity = activityById(route.split("/")[2]);
    if (!activity) throw new Error("活动不存在");
    return activity;
  }
  throw new Error("静态 demo 暂不支持这个操作");
}
const demoImageUrls = {
  "demo/forest-hike-cover.jpg": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
  "demo/forest-ferns-1.jpg": "https://images.unsplash.com/photo-1530968033775-2c92736b131e?auto=format&fit=crop&w=900&q=85",
  "demo/forest-ferns-2.jpg": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85",
  "demo/forest-stream.jpg": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=900&q=85",
  "demo/forest-moss.jpg": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=85",
  "demo/lake-kayak.jpg": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85",
  "demo/pottery.jpg": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=85",
  "demo/tie-dye.jpg": "https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=900&q=85",
  "demo/wild-tea.jpg": "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=85",
  "demo/mushroom.jpg": "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=900&q=85",
  "demo/sup.jpg": "https://images.unsplash.com/photo-1526188717906-ab4a2f70b5d3?auto=format&fit=crop&w=900&q=85"
};
const normalizeStaticOrderLineItems = (body, slot) => {
  const rawItems = Array.isArray(body.lineItems) && body.lineItems.length
    ? body.lineItems
    : [{ priceOptionId: body.priceOptionId, quantity: body.quantity }];
  return rawItems.map((item) => {
    const option = slot?.priceOptions?.find((priceOption) => priceOption.id === item.priceOptionId) ?? slot?.priceOptions?.[0] ?? {};
    const quantity = Number(item.quantity || 0);
    return {
      priceOptionId: option.id,
      specification: option.name ?? "成人",
      quantity,
      unitPriceCents: option.priceCents ?? 0,
      amountCents: (option.priceCents ?? 0) * quantity
    };
  }).filter((item) => item.quantity > 0);
};
const isoDate = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};
const chunks = (items, size) => items.reduce((pages, item, index) => {
  if (index % size === 0) pages.push([]);
  pages[pages.length - 1].push(item);
  return pages;
}, []);
function paragraphs(value) {
  const manual = String(value ?? "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
  if (manual.length > 1) return manual;
  const text = manual[0] || "";
  if (text.length <= 220) return text ? [text] : [];
  const parts = [];
  let buffer = "";
  for (const segment of text.split(/(?<=[。！？.!?])/)) {
    if (!segment) continue;
    if (buffer && (buffer + segment).length > 190) {
      parts.push(buffer.trim());
      buffer = "";
    }
    buffer += segment;
  }
  if (buffer.trim()) parts.push(buffer.trim());
  return parts.length ? parts : [text];
}
function renderParagraphs(value) {
  return paragraphs(value).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}
function compactReviewText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
function renderReviewReplies(review) {
  const replies = review.replies ?? [];
  if (!replies.length) return "";
  return `<section class="review-replies">${replies.map((reply) => `
    <article>
      <strong>${escapeHtml(reply.displayName || "回复")}</strong>
      <time>${readableDate(reply.createdAt)}</time>
      <p>${escapeHtml(reply.content)}</p>
    </article>
  `).join("")}</section>`;
}
function detailDateValues(selectedDate) {
  const today = isoDate();
  const selectedTimestamp = Date.parse(`${selectedDate}T00:00:00`);
  const todayTimestamp = Date.parse(`${today}T00:00:00`);
  const startDate = selectedTimestamp >= todayTimestamp && selectedTimestamp <= todayTimestamp + 6 * 86400000 ? today : selectedDate;
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}
function renderDetailReview(review, compact = false) {
  if (!review) return `<div class="empty">还没有评价，欢迎写下第一条体验。</div>`;
  const images = compact ? review.imageUrls.slice(0, 6) : review.imageUrls;
  const content = compact ? compactReviewText(review.content) : review.content;
  const reviewTitle = `${review.displayName} 对 ${review.activityName || state.activity?.content?.name || "苍山徒步之家"} 的评价`;
  const reviewText = compactReviewText(review.content).slice(0, 80);
  return `
    <article class="review-card ${compact ? "detail-latest-review" : ""}">
      <div class="detail-review-head">
        <span class="review-avatar">${escapeHtml(review.displayName.slice(0, 1))}</span>
        <div><strong>${escapeHtml(review.displayName)}</strong><em>${"★".repeat(review.rating)}</em></div>
        <time>${review.createdAt.slice(0, 10)}</time>
      </div>
      <section class="review-body">${compact ? `<p>${escapeHtml(content)}</p>` : renderParagraphs(content)}</section>
      ${renderReviewReplies(review)}
      <div class="review-actions">
        <button type="button" data-reply-review="${escapeHtml(review.id)}">回复</button>
        ${shareButton({ kind: "review", id: review.id, title: reviewTitle, text: reviewText, label: "发给朋友" })}
      </div>
      ${compact && content.length > 80 ? `<button type="button" class="detail-review-expand" data-expand-detail-review>展开</button>` : ""}
      ${images.length ? `<div class="review-images">${images.map((url, index) => `<button type="button" data-preview-review="${review.id}" data-preview-index="${index}"><img src="${escapeHtml(url)}" alt="评价照片" /></button>`).join("")}</div>` : ""}
      ${review.imageUrls.length > images.length ? `<button type="button" class="review-more-images" data-preview-review="${review.id}" data-preview-index="${images.length}">更多照片</button>` : ""}
      ${review.videoUrl ? `<video class="review-video" src="${escapeHtml(review.videoUrl)}" controls preload="metadata"></video>` : ""}
    </article>
  `;
}
function bindReviewActions() {
  document.querySelectorAll("[data-expand-detail-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSlidingReviewGroup(button, ".detail-latest-list", ".detail-latest-review", "[data-expand-detail-review]");
  }));
  document.querySelectorAll("[data-reply-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    openReviewReply(button.dataset.replyReview);
  }));
  document.querySelectorAll("[data-preview-review]").forEach((button) => button.addEventListener("click", () => {
    const review = state.reviews.find((item) => item.id === button.dataset.previewReview);
    openImagePreview(review?.imageUrls ?? [], Number(button.dataset.previewIndex));
  }));
  bindShareActions();
  syncReviewGalleryRatios();
}
const statusText = (status) => ({ PENDING_PAYMENT: "待付款", BOOKED: "已预约", COMPLETED: "已完成", REFUNDED: "退款完成", CANCELLED: "已取消" }[status] ?? status);
const mapUrl = (activity) => {
  if (activity.meetingLatitude === null || activity.meetingLatitude === undefined || activity.meetingLongitude === null || activity.meetingLongitude === undefined) return null;
  return `https://uri.amap.com/marker?position=${activity.meetingLongitude},${activity.meetingLatitude}&name=${encodeURIComponent(activity.content.meetingPointName || "集合地点")}`;
};
const orderMapUrl = (order) => mapUrl({
  meetingLatitude: order.meetingLatitude,
  meetingLongitude: order.meetingLongitude,
  content: { meetingPointName: order.meetingPointName }
});
const activityImageUrl = (image) => image?.url || (image?.cosKey?.startsWith("http") || image?.cosKey?.startsWith("data:") ? image.cosKey : demoImageUrls[image?.cosKey]) || "";
const activityCover = (activity) => activity?.coverUrl || activityImageUrl(activity?.images?.[0]) || cover;
const activityGalleryImages = (activity) => {
  const images = (activity?.images ?? [])
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map(activityImageUrl)
    .filter(Boolean);
  return images.length ? images : [activityCover(activity)];
};
const slotHighestPrice = (slot) => Math.max(...(slot.priceOptions ?? []).map((option) => option.priceCents ?? 0));
function syncActivityGalleryRatio() {
  const gallery = document.querySelector(".activity-gallery");
  const image = gallery?.querySelector("img");
  if (!gallery || !image) return;
  const applyRatio = () => {
    const width = image.naturalWidth || 3;
    const height = image.naturalHeight || 4;
    const ratio = width / Math.max(height, 1);
    gallery.style.setProperty("--gallery-ratio", `${width} / ${height}`);
    gallery.style.setProperty("--gallery-card-width", ratio >= 1 ? "86%" : ratio >= 0.82 ? "72%" : "62%");
    gallery.style.setProperty("--gallery-card-max", ratio >= 1 ? "340px" : ratio >= 0.82 ? "280px" : "235px");
  };
  if (image.complete) applyRatio();
  else image.addEventListener("load", applyRatio, { once: true });
}
function syncReviewGalleryRatios() {
  document.querySelectorAll(".review-images, .home-review-images").forEach((gallery) => {
    const image = gallery.querySelector("img");
    if (!image) return;
    const applyRatio = () => {
      const width = image.naturalWidth || 1;
      const height = image.naturalHeight || 1;
      gallery.style.setProperty("--review-gallery-ratio", `${width} / ${height}`);
    };
    if (image.complete) applyRatio();
    else image.addEventListener("load", applyRatio, { once: true });
  });
}

async function request(path, options = {}) {
  if (USE_STATIC_DEMO) return staticRequest(path, options);
  try {
    const response = await fetch(`${API}${path}`, { headers: { "content-type": "application/json" }, ...options });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "请求失败");
    return payload.data;
  } catch (error) {
    console.info("使用静态 demo 数据", path, error.message);
    return staticRequest(path, options);
  }
}

const hasWeChatPayment = () => Boolean(globalThis.wx?.login && globalThis.wx?.requestPayment);

function wxPromisify(method, options = {}) {
  return new Promise((resolve, reject) => {
    globalThis.wx[method]({
      ...options,
      success: resolve,
      fail: reject
    });
  });
}

async function ensureWechatCustomer(profile = {}) {
  if (!hasWeChatPayment()) return customerId;
  if (customerId !== DEMO_CUSTOMER_ID) return customerId;
  const login = await wxPromisify("login");
  if (!login.code) throw new Error("微信登录失败，请重试");
  const session = await request("/wechat/login", {
    method: "POST",
    body: JSON.stringify({ kind: "customer", code: login.code, nickname: profile.nickname, mobile: profile.mobile })
  });
  customerId = session.customerId;
  localStorage.setItem("dalitripCustomerId", customerId);
  return customerId;
}

async function payOrder(order) {
  if (!hasWeChatPayment()) {
    await request(`/orders/${order.id}/confirm-payment`, { method: "PATCH", body: JSON.stringify({ paymentMethod: "WECHAT", wechatTransactionId: `demo-${Date.now()}` }) });
    return;
  }
  const payment = await request(`/orders/${order.id}/wechat-prepay`, {
    method: "POST",
    body: JSON.stringify({ customerId })
  });
  await wxPromisify("requestPayment", {
    timeStamp: payment.timeStamp,
    nonceStr: payment.nonceStr,
    package: payment.package,
    signType: payment.signType,
    paySign: payment.paySign
  });
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { $("#toast").hidden = true; }, 1800);
}

async function copyText(value, successMessage = "已复制") {
  try {
    await navigator.clipboard.writeText(value);
    toast(successMessage);
  } catch {
    window.prompt("请复制", value);
  }
}

function shareUrl(kind, id) {
  const url = new URL(window.location.href);
  url.searchParams.set("share", kind);
  url.searchParams.set("id", id);
  return url.toString();
}

function shareButton({ kind, id, title, text, label = "分享" }) {
  return `<button type="button" class="share-button" data-share-kind="${escapeHtml(kind)}" data-share-id="${escapeHtml(id)}" data-share-title="${escapeHtml(title)}" data-share-text="${escapeHtml(text)}">${escapeHtml(label)}</button>`;
}

async function shareItem({ kind, id, title, text }) {
  const url = shareUrl(kind, id);
  const payload = { title, text, url };
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(`${title}\n${text}\n${url}`, "分享内容已复制");
}

function bindShareActions(scope = document) {
  scope.querySelectorAll("[data-share-kind]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    shareItem({
      kind: button.dataset.shareKind,
      id: button.dataset.shareId,
      title: button.dataset.shareTitle,
      text: button.dataset.shareText
    });
  }));
}

function showView(name) {
  document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== `${name}-view`; });
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  updateCollapseStickyBar();
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function renderTags() {
  $("#tag-filter").innerHTML = state.tags.map((tag) => `
    <button class="${state.selectedTags.includes(tag.id) ? "active" : ""}" data-tag="${tag.id}">${tag.name}</button>
  `).join("");
  document.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", async () => {
    state.selectedTags = singleSelectedTag(state.selectedTags, button.dataset.tag);
    await loadActivities();
  }));
}

function renderActivities() {
  $("#activity-count").textContent = `${state.activities.length} 个活动`;
  $("#customer-activity-list").innerHTML = state.activities.map((activity) => {
    const tags = activityTags(activity);
    return `
      <article class="activity-card" data-activity="${activity.id}">
        <img src="${activityCover(activity)}" alt="${activity.content.name}" />
        <div>
          <h3>${activity.content.name}</h3>
          <p>${activity.content.summary || "查看活动详情与可预约时间。"}</p>
          ${tags.map((tag) => `<span>${tag.name}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("") || `<div class="empty">暂时没有符合这些标签的活动。</div>`;
  document.querySelectorAll("[data-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.activity)));
}

const localInfoTags = () => [...new Set(state.localInfos.flatMap((item) => item.tags ?? []))].sort((a, b) => a.localeCompare(b, "zh-CN"));
const filteredLocalInfos = () => {
  if (!state.localInfoTag) return state.localInfos;
  const selectedParts = localInfoTagParts(state.localInfoTag);
  return state.localInfos.filter((item) => (item.tags ?? []).some((tag) => {
    if (tag === state.localInfoTag) return true;
    return !selectedParts.child && localInfoTagParts(tag).group === selectedParts.group;
  }));
};
const localInfoTagParts = (name) => {
  const parts = String(name ?? "").split("·").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? { group: parts[0], child: parts.slice(1).join(" · ") } : { group: parts[0] ?? "", child: "" };
};
const groupedLocalInfoTags = () => {
  const groups = new Map();
  localInfoTags().forEach((name) => {
    const parts = localInfoTagParts(name);
    if (!parts.group) return;
    if (!groups.has(parts.group)) groups.set(parts.group, new Set());
    if (parts.child) groups.get(parts.group).add(name);
  });
  return [...groups.entries()].map(([name, children]) => ({ name, children: [...children].sort((a, b) => a.localeCompare(b, "zh-CN")) }));
};

const localInfoHasTag = (item, tagName) => {
  if (!tagName) return true;
  const selectedParts = localInfoTagParts(tagName);
  return (item.tags ?? []).some((tag) => tag === tagName || (!selectedParts.child && localInfoTagParts(tag).group === selectedParts.group));
};
const localInfoImage = (item) => item?.coverUrl || cover;
const localInfoByTag = (tagName, matcher = () => true) => state.localInfos.find((item) => localInfoHasTag(item, tagName) && item.coverUrl && matcher(item)) || state.localInfos.find((item) => localInfoHasTag(item, tagName) && matcher(item));
const localInfoText = (item) => `${item?.title ?? ""} ${item?.summary ?? ""} ${plainText(item?.contentHtml ?? "")}`;
const lunarMonthNumber = (value) => {
  const text = String(value ?? "").replace(/闰|月/g, "");
  if (/^\d+$/.test(text)) return Number(text);
  return { 正: 1, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 冬: 11, 十一: 11, 腊: 12, 十二: 12 }[text] ?? 0;
};
const lunarDayNumber = (value) => {
  const text = String(value ?? "").replace(/日|号/g, "");
  if (/^\d+$/.test(text)) return Number(text);
  const map = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
    初一: 1, 初二: 2, 初三: 3, 初四: 4, 初五: 5, 初六: 6, 初七: 7, 初八: 8, 初九: 9, 初十: 10,
    十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15, 十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
    廿一: 21, 廿二: 22, 廿三: 23, 廿四: 24, 廿五: 25, 廿六: 26, 廿七: 27, 廿八: 28, 廿九: 29, 三十: 30
  };
  return map[text] ?? map[text.replace(/^二/, "廿")] ?? 0;
};
const lunarPartsForDate = (date) => {
  const parts = new Intl.DateTimeFormat("zh-u-ca-chinese", { year: "numeric", month: "long", day: "numeric" }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { month: lunarMonthNumber(lookup.month), day: lunarDayNumber(lookup.day) };
};
const nextLunarDate = (rules, horizonDays = 420) => {
  const today = isoDate();
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const value = addDays(today, offset);
    const parts = lunarPartsForDate(new Date(`${value}T00:00:00`));
    if (rules.some((rule) => (!rule.month || rule.month === parts.month) && rule.days.includes(parts.day))) return value;
  }
  return "";
};
const localEventDateLabel = (value) => {
  if (!value) return "近期";
  const date = new Date(`${value}T00:00:00`);
  const today = isoDate();
  if (value === today) return "今天";
  if (value === addDays(today, 1)) return "明天";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};
const nextWeekdayDate = (weekday) => {
  const today = new Date(`${isoDate()}T00:00:00`);
  const current = today.getDay();
  const offset = (weekday - current + 7) % 7;
  return addDays(isoDate(), offset);
};
const weekdayNumber = (value) => ({ 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 }[value] ?? 0);
const lunarMarketDaysFromText = (text) => {
  const match = text.match(/逢\s*([一二三四五六七八九十0-9])\s*[、,，和]\s*([一二三四五六七八九十0-9])/);
  if (!match) return [];
  const numbers = [lunarDayNumber(match[1]), lunarDayNumber(match[2])].filter(Boolean);
  return [...new Set(numbers.flatMap((number) => [number, number + 10, number + 20]).filter((number) => number <= 30))].sort((a, b) => a - b);
};
const localEventRule = (item) => {
  const text = localInfoText(item);
  const weekly = text.match(/每周([一二三四五六日天])/);
  if (weekly) return { nextDate: nextWeekdayDate(weekdayNumber(weekly[1])), meta: `每周${weekly[1]}` };
  const marketDays = lunarMarketDaysFromText(text);
  if (marketDays.length) return { nextDate: nextLunarDate([{ days: marketDays }], 90), meta: `农历${text.match(/逢\s*([一二三四五六七八九十0-9])\s*[、,，和]\s*([一二三四五六七八九十0-9])/)?.[0] ?? "赶集日"}` };
  if (/火把节/.test(text)) return { nextDate: nextLunarDate([{ month: 6, days: [25] }]), meta: "农历六月二十五" };
  if (/观音塘/.test(text)) return { nextDate: nextLunarDate([{ month: 2, days: [19] }, { month: 6, days: [19] }, { month: 9, days: [19] }]), meta: "农历二、六、九月十九" };
  const match = text.match(/(?:农历)?\s*([正一二三四五六七八九十冬腊0-9]{1,3})月\s*([初十廿卅一二三四五六七八九0-9]{1,3})/);
  if (match) {
    const month = lunarMonthNumber(match[1]);
    const day = lunarDayNumber(match[2]);
    if (month && day) return { nextDate: nextLunarDate([{ month, days: [day] }]), meta: `农历${match[1]}月${match[2]}` };
  }
  return { nextDate: "", meta: "近期活动" };
};
const localUpcomingEvents = () => {
  const localMatches = state.localInfos
    .filter((item) => (item.tags ?? []).some((tag) => tag.includes("节日")) || /节|庙会|赶集|市集|集市|太子会|刀杆会|火把/.test(item.title ?? ""))
    .map((item) => {
      const timing = localEventRule(item);
      return { kind: "local", id: item.id, title: item.title, summary: item.summary, image: localInfoImage(item), day: localEventDateLabel(timing.nextDate), nextDate: timing.nextDate, meta: timing.meta };
    });
  const scheduledActivityMatches = state.upcomingSlots
    .filter((slot) => /赶集|市集|集市|节/.test(`${slot.activityName ?? ""}`))
    .map((slot) => ({ kind: "activity", id: slot.activityId, title: slot.activityName ?? "社区活动", summary: "查看可预约时间", image: slot.coverUrl || cover, day: localEventDateLabel(slot.startsAt.slice(0, 10)), nextDate: slot.startsAt.slice(0, 10), meta: `${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)}` }));
  const ruleActivityMatches = state.activities
    .filter((activity) => activity.schedulePaused !== true && /赶集|市集|集市|节/.test(`${activity.content?.name ?? ""}`))
    .map((activity) => {
      const timing = localEventRule({ title: activity.content?.name, summary: activity.content?.summary });
      return { kind: "activity", id: activity.id, title: activity.content?.name ?? "社区活动", summary: activity.content?.summary, image: activityCover(activity), day: localEventDateLabel(timing.nextDate), nextDate: timing.nextDate, meta: timing.meta };
    });
  const unique = new Map();
  [...localMatches, ...scheduledActivityMatches, ...ruleActivityMatches].forEach((item) => {
    const key = `${item.kind}:${item.id}`;
    if (!unique.has(key) || (item.nextDate && item.nextDate < (unique.get(key).nextDate || "9999-12-31"))) unique.set(key, item);
  });
  return [...unique.values()]
    .sort((a, b) => (a.nextDate || "9999-12-31").localeCompare(b.nextDate || "9999-12-31"))
    .slice(0, 5);
};
const localSceneCards = () => {
  const dining = localInfoByTag("餐馆", (item) => /深夜食堂|餐|饭|素/.test(localInfoText(item))) || localInfoByTag("餐馆");
  const cafe = localInfoByTag("咖啡馆") || localInfoByTag("酒吧");
  const stay = localInfoByTag("民宿");
  return [
    { tag: "餐馆", title: "吃一顿舒服的饭", subtitle: "本地菜、素食、夜宵、亲子友好", item: dining },
    { tag: "咖啡馆", title: "咖啡和面包", subtitle: "可以坐下来的小店和社区空间", item: cafe },
    { tag: "民宿", title: "找个住处", subtitle: "亲子、可月租、乡村民宿", item: stay }
  ];
};
const renderLocalInfoCard = (item) => `
  <article class="local-info-card">
    <button type="button" class="local-info-card-main ${item.mapUrl ? "has-nav" : ""}" data-local-info="${escapeHtml(item.id)}">
      ${item.coverUrl ? `<img src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title)}" />` : `<span class="local-info-placeholder">在地</span>`}
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.summary || item.address || "查看详细信息")}</p>
        <small>${escapeHtml((item.tags ?? []).join(" · "))}</small>
      </div>
    </button>
    ${item.mapUrl ? `<a class="local-info-card-nav" href="${escapeHtml(item.mapUrl)}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}
  </article>
`;

function renderLocalInfos() {
  const tags = localInfoTags();
  const groups = groupedLocalInfoTags();
  if (state.localInfoTag && !tags.includes(state.localInfoTag)) state.localInfoTag = "";
  const activeGroupName = localInfoTagParts(state.localInfoTag).group;
  const activeGroup = groups.find((group) => group.name === activeGroupName);
  const events = localUpcomingEvents();
  const scenes = localSceneCards();
  $("#local-tag-filter").innerHTML = `
    <section class="local-home-hero">
      <button type="button" class="local-home-back" data-local-back-home aria-label="返回首页">‹</button>
      <p>LOCAL GUIDE</p>
      <h2>吃饭，住下，散步，遇见生活</h2>
      <span>我们把大理的在地信息按场景整理，也留意最近会发生的集市、节日和社区活动。</span>
    </section>
    <section class="local-scenes">
      <div class="local-scene-grid">
        ${scenes.map((scene) => `
          <button type="button" class="local-scene-card" data-local-scene="${escapeHtml(scene.tag)}">
            <img src="${escapeHtml(localInfoImage(scene.item))}" alt="${escapeHtml(scene.title)}" />
            <span>
              <strong>${escapeHtml(scene.title)}</strong>
              <small>${escapeHtml(scene.subtitle)}</small>
            </span>
          </button>
        `).join("")}
      </div>
    </section>
    ${events.length ? `
      <section class="local-upcoming">
        <div class="local-section-title">
          <p>COMING SOON</p>
          <h2>最近发生</h2>
        </div>
        <div class="local-event-strip">
          ${events.map((event) => `
            <button type="button" class="local-event-card" ${event.kind === "activity" ? `data-local-event-activity="${escapeHtml(event.id)}"` : `data-local-info="${escapeHtml(event.id)}"`}>
              <span class="local-event-date">${escapeHtml(event.day)}</span>
              <span class="local-event-copy">
                <strong>${escapeHtml(event.title)}</strong>
                <small>${escapeHtml(event.meta)}</small>
              </span>
              <img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" />
            </button>
          `).join("")}
        </div>
      </section>
    ` : ""}
    <section class="local-filter-panel ${state.localInfoTag ? "is-filtered" : ""}">
      <div class="local-section-title">
        <p>${state.localInfoTag ? "DIRECTORY" : "ALL PLACES"}</p>
        <h2>${state.localInfoTag ? escapeHtml(state.localInfoTag) : "全部在地信息"}</h2>
      </div>
      ${state.localInfoTag ? `<button type="button" class="local-clear-filter" data-local-tag="">查看全部</button>` : ""}
    </section>
  `;
  $("#local-tag-filter").querySelectorAll("[data-local-scene]").forEach((button) => button.addEventListener("click", () => {
    state.localInfoTag = button.dataset.localScene;
    renderLocalInfos();
    requestAnimationFrame(() => {
      $(".local-filter-panel")?.scrollIntoView({ block: "start" });
    });
  }));
  $("#local-tag-filter").querySelectorAll("[data-local-main-tag]").forEach((button) => button.addEventListener("click", () => {
    state.localInfoTag = state.localInfoTag === button.dataset.localMainTag ? "" : button.dataset.localMainTag;
    renderLocalInfos();
  }));
  $("#local-tag-filter").querySelectorAll("[data-local-tag]").forEach((button) => button.addEventListener("click", () => {
    state.localInfoTag = button.dataset.localTag;
    renderLocalInfos();
  }));
  $("#local-tag-filter").querySelector("[data-local-back-home]")?.addEventListener("click", () => {
    scrollToPageTop();
    showView("home");
  });
  $("#local-tag-filter").querySelectorAll("[data-local-info]").forEach((button) => button.addEventListener("click", () => openLocalInfo(button.dataset.localInfo)));
  $("#local-tag-filter").querySelectorAll("[data-local-event-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.localEventActivity)));
  const items = filteredLocalInfos();
  $("#local-info-list").innerHTML = items.map(renderLocalInfoCard).join("") || `<div class="empty">暂时没有这个标签下的在地信息。</div>`;
  $("#local-info-list").querySelectorAll("[data-local-info]").forEach((button) => button.addEventListener("click", () => openLocalInfo(button.dataset.localInfo)));
}

async function loadLocalInfos() {
  state.localInfos = await request("/local-infos?published=true");
  renderLocalInfos();
}

async function openLocalInfo(id) {
  state.localInfo = await request(`/local-infos/${id}`);
  renderLocalInfoDetail();
  showView("local-detail");
  scrollToPageTop();
}

function renderLocalInfoDetail() {
  const item = state.localInfo;
  $("#local-info-detail").innerHTML = `
    ${item.coverUrl ? `<img class="local-info-detail-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title)}" />` : ""}
    <section class="local-info-detail-copy">
      <p>LOCAL DIRECTORY</p>
      <h1>${escapeHtml(item.title)}</h1>
      <div class="detail-share-row">
        ${shareButton({ kind: "local", id: item.id, title: item.title, text: item.summary || item.address || "来自苍山徒步之家的在地信息", label: "发给朋友" })}
      </div>
      ${(item.tags ?? []).length ? `<div class="local-info-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      ${item.summary ? `<strong>${escapeHtml(item.summary)}</strong>` : ""}
      <div class="local-info-facts">
        ${item.openingHours ? `<span><em>时间</em>${escapeHtml(item.openingHours)}</span>` : ""}
        ${item.address ? `<span><em>地址</em>${escapeHtml(item.address)}</span>` : ""}
        ${item.contact ? `<span><em>联系</em>${escapeHtml(item.contact)}</span>` : ""}
      </div>
      <div class="local-info-content">${item.contentHtml || ""}</div>
      ${item.mapUrl ? `<a class="local-info-map" href="${escapeHtml(item.mapUrl)}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}
    </section>
  `;
  bindShareActions($("#local-info-detail"));
}

function renderTopicPages() {
  $("#topic-page-count").textContent = `${state.topicPages.length} 个专题`;
  $("#topic-page-list").innerHTML = state.topicPages.map(renderTopicPageCard).join("") || `<div class="empty topic-empty">专题内容正在整理中。</div>`;
  document.querySelectorAll("[data-topic-page]").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.externalUrl) return window.open(button.dataset.externalUrl, "_blank", "noopener,noreferrer");
    await openTopicPage(button.dataset.topicPage);
  }));
}

function renderBlogCard(post, dataAttribute = "data-blog-post") {
  const dateText = formatBlogDate(post.publishedAt);
  const tags = renderBlogTags(post.tags);
  const key = post.slug || post.id;
  return `
    <button type="button" class="blog-card" ${dataAttribute}="${escapeHtml(key)}">
      ${post.coverUrl ? `<img src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.title)}" />` : ""}
      <span>
        <strong>${escapeHtml(post.title)}</strong>
        ${dateText ? `<time>${dateText}</time>` : ""}
        ${tags}
        <small>${escapeHtml(blogSummary(post))}</small>
      </span>
    </button>
  `;
}

function renderBlogTags(tags = []) {
  if (!Array.isArray(tags) || !tags.length) return "";
  return `<div class="blog-tags">${tags.map((tag) => `<em>${escapeHtml(tag)}</em>`).join("")}</div>`;
}

function normalizeTagName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function blogPostsForGuide(guide) {
  const guideName = normalizeTagName(guide.name);
  return state.blogPosts.filter((post) => (post.tags ?? []).some((tag) => normalizeTagName(tag) === guideName));
}

function guideReviewKeywords(guide) {
  return [...new Set([guide.name, ...(guide.aliases ?? [])]
    .map(normalizeTagName)
    .filter((keyword) => keyword.length >= 2))];
}

function guideReviewsForGuide(guide) {
  const guideKeywords = guideReviewKeywords(guide);
  return state.homeReviews
    .filter((review) => {
      const content = normalizeTagName(review.content);
      const displayName = normalizeTagName(review.displayName);
      return guideKeywords.some((keyword) => content.includes(keyword) || displayName.includes(keyword));
    })
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

function latestHomeReviews(limit = 20) {
  return [...state.homeReviews]
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
    .slice(0, limit);
}

function generalHomeReviews(limit = 20) {
  return state.homeReviews
    .filter((review) => !review.activityId || review.activityName === "苍山徒步之家")
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
    .slice(0, limit);
}

function toggleSlidingReviewGroup(control, stripSelector, cardSelector, buttonSelector) {
  const card = control.closest(cardSelector);
  const strip = control.closest(stripSelector) || card?.closest(stripSelector);
  if (!strip || !card) return;
  const shouldExpand = !card.classList.contains("expanded");
  strip.querySelectorAll(cardSelector).forEach((item) => {
    item.classList.toggle("expanded", shouldExpand);
  });
  strip.querySelectorAll(buttonSelector).forEach((button) => {
    button.textContent = shouldExpand ? "收起" : "展开";
  });
}

function bindBlogCards() {
  document.querySelectorAll("[data-blog-post]").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      openBlogPost(button.dataset.blogPost);
    };
  });
}

function bindInternalContentLinks(scope = document) {
  scope.querySelectorAll("[data-internal-link]").forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const type = link.dataset.internalLink;
      const value = link.dataset.internalValue ?? "";
      if (type === "TOPIC") return openTopicPage(value);
      if (type === "BLOG") return openBlogPost(value);
      if (type === "ACTIVITY") return openActivity(value);
      if (type === "GUIDE") return openGuide(value);
      if (type === "GUIDES") {
        await loadGuideHome();
        return showView("guides");
      }
    });
  });
}

function renderBlogPreview() {
  $("#blog-preview-list").innerHTML = state.blogPosts.slice(0, 4).map((post) => renderBlogCard(post)).join("") || `<div class="empty">生活记录正在整理中。</div>`;
  bindBlogCards();
}

function renderAiGuideResult(result = state.aiGuide) {
  const container = $("#ai-guide-result");
  if (!container) return;
  if (!result) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  container.innerHTML = `
    <p>${escapeHtml(result.answer)}</p>
    <div class="ai-guide-recommendations">
      ${(result.recommendations ?? []).map((item) => `
        <button type="button" data-ai-activity="${escapeHtml(item.activityId)}">
          <img src="${escapeHtml(item.coverUrl || cover)}" alt="${escapeHtml(item.name)}" />
          <span>
            <strong>${escapeHtml(item.name)}</strong>
            <em>${escapeHtml(item.reason || item.summary || "")}</em>
          </span>
        </button>
      `).join("")}
    </div>
  `;
  container.querySelectorAll("[data-ai-activity]").forEach((button) => {
    button.addEventListener("click", () => openActivity(button.dataset.aiActivity));
  });
}

async function askAiGuide(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const question = new FormData(form).get("question")?.trim();
  if (!question) return toast("先告诉我你想找什么活动");
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "正在查找";
  try {
    state.aiGuide = await request("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question, customerId })
    });
    renderAiGuideResult();
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "帮我找活动";
  }
}

function openBlogList() {
  $("#blog-list").innerHTML = state.blogPosts.map((post) => renderBlogCard(post)).join("") || `<div class="empty">生活记录正在整理中。</div>`;
  bindBlogCards();
  showView("blog");
  scrollToPageTop();
}

async function openBlogPost(slug) {
  try {
    state.blogPost = await request(`/blog-posts/${slug}`);
    renderBlogDetail();
    showView("blog-detail");
    scrollToPageTop();
  } catch (error) {
    toast(error.message || "文章暂时无法打开");
  }
}

function renderBlogDetail() {
  const post = state.blogPost;
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const dateText = formatBlogDate(post.publishedAt);
  $("#blog-detail-view .detail-header strong").textContent = post.title || "文章";
  $("#blog-detail").innerHTML = `
    <section class="blog-detail-copy">
      <h1>${escapeHtml(post.title)}</h1>
      ${dateText ? `<time>${dateText}</time>` : ""}
      <div class="detail-share-row">
        ${shareButton({ kind: "blog", id: post.slug || post.id, title: post.title, text: blogSummary(post), label: "发给朋友" })}
      </div>
      ${renderBlogTags(post.tags)}
      <div class="blog-content">${post.contentHtml}</div>
    </section>
    <section class="blog-comments">
      <h2>评论(${comments.length})</h2>
      <div class="blog-comment-list">
        ${comments.map((comment) => `
          <article class="blog-comment-card">
            <strong>${escapeHtml(comment.displayName)}</strong>
            <time>${readableDate(comment.createdAt)}</time>
            <p>${escapeHtml(comment.content)}</p>
          </article>
        `).join("") || `<div class="empty">还没有评论。</div>`}
      </div>
      <form id="blog-comment-form" class="blog-comment-form">
        <input name="displayName" maxlength="60" value="Mia" required />
        <textarea name="content" rows="4" maxlength="1500" required placeholder="写下你的想法"></textarea>
        <button>发布评论</button>
      </form>
    </section>
  `;
  $("#blog-comment-form").addEventListener("submit", submitBlogComment);
  bindInternalContentLinks($("#blog-detail"));
  bindShareActions($("#blog-detail"));
}

async function submitBlogComment(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  await request(`/blog-posts/${state.blogPost.id}/comments`, {
    method: "POST",
    body: JSON.stringify({
      customerId,
      displayName: values.get("displayName"),
      content: values.get("content")
    })
  });
  toast("评论已发布");
  await openBlogPost(state.blogPost.id);
}

function renderHomeEntries() {
  $("#home-entry-list").innerHTML = state.homeEntries.map(renderHomeEntryCard).join("");
  document.querySelectorAll("[data-home-entry]").forEach((button) => button.addEventListener("click", async () => {
    const entry = state.homeEntries.find((item) => item.id === button.dataset.homeEntry);
    if (entry.targetType === "TOPIC") return openTopicPage(entry.targetValue);
    if (entry.targetType === "ACTIVITY") return openActivity(entry.targetValue);
    if (entry.targetType === "GUIDES") {
      await loadGuideHome();
      return showView("guides");
    }
    window.open(entry.targetValue, "_blank", "noopener,noreferrer");
  }));
}

async function openTopicPage(slug) {
  state.topicPage = await request(`/topic-pages/${slug}`);
  const modules = (state.topicPage.modules ?? [])
    .slice()
    .filter((module) => module.published !== false)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  $("#topic-view .detail-header strong").textContent = state.topicPage.title || "专题";
  $("#topic-detail").innerHTML = `
    <section class="topic-module-page">
      <div class="topic-share-row">
        ${shareButton({ kind: "topic", id: state.topicPage.slug || state.topicPage.id, title: state.topicPage.title || "专题", text: "来自苍山徒步之家的专题内容", label: "发给朋友" })}
      </div>
      ${modules.map((module) => renderPageModule(module, { context: "topic" })).join("") || `<div class="empty">这个专页还没有内容。</div>`}
    </section>
  `;
  bindHomepageModules();
  bindShareActions($("#topic-detail"));
  showView("topic");
}

async function loadActivities() {
  const query = state.selectedTags.length ? `?tagIds=${state.selectedTags.join(",")}` : "";
  state.activities = await request(`/activities${query}`);
  await loadUpcomingSlots();
  renderHomepageModules();
}

async function loadUpcomingSlots() {
  state.upcomingSlots = await request("/upcoming-departures?limit=30");
}

function renderBookingDateStrip() {
  const today = isoDate();
  const selectedTimestamp = Date.parse(`${state.bookingDate}T00:00:00`);
  const todayTimestamp = Date.parse(`${today}T00:00:00`);
  const startDate = selectedTimestamp >= todayTimestamp && selectedTimestamp <= todayTimestamp + 6 * 86400000 ? today : state.bookingDate;
  $("#booking-selected-date").textContent = dateOnly(`${state.bookingDate}T00:00:00`);
  $("#booking-date-picker").value = state.bookingDate;
  $("#booking-date-strip").innerHTML = Array.from({ length: 7 }, (_, index) => {
    const value = addDays(startDate, index);
    const date = new Date(`${value}T00:00:00`);
    return `
      <button class="${value === state.bookingDate ? "active" : ""}" data-booking-date="${value}">
        <span>${new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date)}</span>
        <strong>${date.getDate()}</strong>
        <small>${value === state.bookingDate ? "已选" : "选择"}</small>
      </button>
    `;
  }).join("");
  document.querySelectorAll("[data-booking-date]").forEach((button) => button.addEventListener("click", async () => {
    state.bookingDate = button.dataset.bookingDate;
    await loadBookingActivities();
  }));
}

function renderBookingTags() {
  $("#booking-tag-filter").innerHTML = `
    <button class="${state.bookingTags.length ? "" : "active"}" data-booking-tag="">全部</button>
    ${renderGroupedTagFilter({ selectedIds: state.bookingTags, expandedGroups: state.bookingExpandedTagGroups, tagAttr: "booking-tag", groupAttr: "booking-tag-group" })}
  `;
  document.querySelectorAll("[data-booking-tag]").forEach((button) => button.addEventListener("click", async () => {
    if (!button.dataset.bookingTag) {
      state.bookingTags = [];
      state.bookingExpandedTagGroups = [];
    } else {
      state.bookingTags = singleSelectedTag(state.bookingTags, button.dataset.bookingTag);
    }
    await loadBookingActivities();
  }));
}

function renderBookingActivities() {
  const search = state.bookingSearch.trim().toLocaleLowerCase();
  const filtered = state.bookingActivities.filter((activity) => !search || activity.content.name.toLocaleLowerCase().includes(search) || activityTags(activity).some((tag) => tag.name.toLocaleLowerCase().includes(search)));
  const grouped = filtered.reduce((groups, activity) => {
    (groups[activity.groupName] ??= []).push(activity);
    return groups;
  }, {});
  $("#booking-discovery-list").innerHTML = Object.entries(grouped).map(([groupName, activities]) => `
    <section class="booking-activity-group">
      <header><h2>${escapeHtml(groupName)}</h2><span>${activities.reduce((count, activity) => count + activity.slots.length, 0)} 个时间可约</span></header>
      <div>${activities.flatMap((activity) => activity.slots.map((slot) => {
        const minimumPrice = Math.min(...slot.priceOptions.map((option) => option.priceCents));
        return `
          <article class="booking-discovery-card">
            <img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" />
            <div>
              <h3>${escapeHtml(activity.content.name)}</h3>
              <strong>${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)}</strong>
              <p>${money(minimumPrice)} 起 · 已有 ${slot.bookedCount} 人报名，最多 ${slot.capacity} 人</p>
              <aside>${activityTags(activity).map((tag) => `<span>${escapeHtml(tag.name)}</span>`).join("")}</aside>
            </div>
            <button data-booking-activity="${activity.id}">预约</button>
          </article>
        `;
      })).join("")}</div>
    </section>
  `).join("") || `<div class="empty">这一天暂时没有符合条件的活动，可以换一个日期或减少标签。</div>`;
  document.querySelectorAll("[data-booking-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.bookingActivity, state.bookingDate)));
}

async function loadBookingActivities() {
  if (!state.bookingDate) state.bookingDate = state.upcomingSlots[0]?.startsAt.slice(0, 10) || isoDate();
  const tags = state.bookingTags.length ? `&tagIds=${state.bookingTags.join(",")}` : "";
  state.bookingActivities = await request(`/available-activities?date=${state.bookingDate}${tags}`);
  renderBookingDateStrip();
  renderBookingTags();
  renderBookingActivities();
}

function moduleHeading(module, eyebrow = "DISCOVER", actionHtml = "") {
  const title = module.type === "UPCOMING" ? "加入吧！即将出发的旅行" : module.title;
  return `<section class="section-heading"><div><p>${eyebrow}</p><h2>${escapeHtml(title)}</h2>${module.subtitle ? `<span>${escapeHtml(module.subtitle)}</span>` : ""}</div>${actionHtml}</section>`;
}

function homeModuleStyle(module) {
  const warmDefault = ["BLOG", "GUIDES", "TOPICS"].includes(module.type);
  const savedBackground = module.style?.backgroundColor;
  return {
    layout: module.style?.layout || "",
    cardStyle: module.style?.cardStyle || "PLAIN",
    radius: module.style?.radius ?? 6,
    gap: module.style?.gap ?? 8,
    padding: module.style?.padding ?? 11,
    textAlign: module.style?.textAlign || "LEFT",
    dividerStyle: module.style?.dividerStyle || "SPACE",
    height: module.style?.height ?? 24,
    backgroundColor: warmDefault && (!savedBackground || savedBackground === "#ffffff") ? "#fffaf0" : savedBackground || "#ffffff",
    collapseTitleStyle: module.style?.collapseTitleStyle || "SOFT_BLOCK"
  };
}

function homeModuleVars(module) {
  const style = homeModuleStyle(module);
  return `style="--module-radius:${style.radius}px;--module-gap:${style.gap}px;--module-padding:${style.padding}px;--module-background:${escapeHtml(style.backgroundColor)}"`;
}

function renderRichTextParagraphs(text = "") {
  const value = String(text ?? "").trim();
  if (!value) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function plainTextFromHtml(html = "") {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function topicPageForEntry(entry) {
  if (entry.targetType !== "TOPIC") return null;
  return state.topicPages.find((page) => page.slug === entry.targetValue) || null;
}

function topicCollapseItems(page) {
  const module = (page?.modules ?? []).find((item) => item.type === "COLLAPSE" && item.published !== false);
  return (module?.items ?? []).slice(0, module?.limit ?? 4);
}

function renderHomeEntryCard(entry) {
  const page = topicPageForEntry(entry);
  const imageUrl = entry.imageUrl || page?.imageUrl || "";
  const items = topicCollapseItems(page);
  const canShowTopicPhoto = imageUrl && items.length;
  if (canShowTopicPhoto) return `
    <button class="home-entry-card home-entry-topic-photo" data-home-entry="${entry.id}">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(entry.title)}" />
      <span class="home-entry-topic-shade"></span>
      <span class="home-entry-topic-title">${escapeHtml(entry.title)}</span>
      <span class="home-entry-topic-links">
        ${items.map((item) => `<span><i class="dialog-icon" aria-hidden="true"></i><em>${escapeHtml(item.title)}</em></span>`).join("")}
      </span>
    </button>
  `;
  return `
    <button class="home-entry-card" data-home-entry="${entry.id}">
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(entry.title)}" />` : ""}
      <strong>${escapeHtml(entry.title)}</strong>
    </button>
  `;
}

function renderTopicPageCard(page) {
  const items = topicCollapseItems(page);
  if (page.imageUrl && items.length) return `
    <button class="topic-page-card topic-photo-home-card" data-topic-page="${page.slug}" data-external-url="${escapeHtml(page.externalUrl)}">
      <img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />
      <span class="home-entry-topic-shade"></span>
      <span class="home-entry-topic-title">${escapeHtml(page.title)}</span>
      <span class="home-entry-topic-links">
        ${items.map((item) => `<span><i class="dialog-icon" aria-hidden="true"></i><em>${escapeHtml(item.title)}</em></span>`).join("")}
      </span>
    </button>
  `;
  return `
    <button class="topic-page-card" data-topic-page="${page.slug}" data-external-url="${escapeHtml(page.externalUrl)}">
      ${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />` : ""}
      <span>
        <strong>${escapeHtml(page.title)}</strong>
        <small>${escapeHtml(page.summary) || "打开专题查看更多活动"}</small>
      </span>
    </button>
  `;
}

function renderHomeLocalInfoCard() {
  const item = state.localInfos[0] || {};
  return `
    <button class="topic-page-card home-local-info-card" data-home-local-info>
      ${item.coverUrl ? `<img src="${escapeHtml(item.coverUrl)}" alt="在地信息" />` : ""}
      <span class="home-local-info-shade"></span>
      <span class="home-local-info-copy">
        <strong>在地信息</strong>
        <small>${escapeHtml(item.title || "吃喝、地点与本地指引")}</small>
      </span>
    </button>
  `;
}

function renderTopicModule(module) {
  const topicLimit = module.id === "home-module-topics" ? Math.max(1, (module.limit ?? 2) - 1) : module.limit;
  const pages = state.topicPages.slice(0, topicLimit).map(renderTopicPageCard);
  if (module.id === "home-module-topics") pages.push(renderHomeLocalInfoCard());
  return `${moduleHeading(module, "DISCOVER MORE")}<section class="topic-page-list" ${homeModuleVars(module)}>${pages.join("")}</section>`;
}

function upcomingParticipant(slot) {
  const count = slot.participantCount ?? slot.bookedCount ?? 0;
  if (count > 1) return {
    avatar: `<span class="upcoming-avatar-count">${count}</span>`,
    text: `已有${count}人预约了`
  };
  if (count === 1) {
    const name = slot.customerDisplayName || "客人";
    return {
      avatar: slot.participantAvatarUrl
        ? `<img src="${escapeHtml(slot.participantAvatarUrl)}" alt="${escapeHtml(name)}" />`
        : `<span>${escapeHtml(name.slice(0, 1).toUpperCase())}</span>`,
      text: `${escapeHtml(name)} 预约了`
    };
  }
  return {
    avatar: `<span class="upcoming-avatar-empty"></span>`,
    text: "等你加入"
  };
}

function renderUpcomingDeparture(slot) {
  const participant = upcomingParticipant(slot);
  return `
    <button class="upcoming-row" data-upcoming-activity="${slot.activityId}">
      <span class="upcoming-participant-avatar">${participant.avatar}</span>
      <span class="upcoming-row-copy">
        <small>${participant.text}</small>
        <strong>${escapeHtml(slot.activityName)}</strong>
        <time>${readableDateTimeRange(slot.startsAt, slot.endsAt)}</time>
      </span>
      <img class="upcoming-thumb" src="${escapeHtml(slot.coverUrl || cover)}" alt="${escapeHtml(slot.activityName)}" />
    </button>
  `;
}

function renderUpcomingDepartures(slots) {
  if (!slots.length) return `<div class="empty">近期活动正在准备中。</div>`;
  const pages = [];
  for (let index = 0; index < slots.length; index += 3) {
    pages.push(slots.slice(index, index + 3));
  }
  return pages.map((page) => `
    <div class="upcoming-page">
      ${page.map(renderUpcomingDeparture).join("")}
      ${Array.from({ length: 3 - page.length }, () => `<span class="upcoming-row upcoming-row-placeholder" aria-hidden="true"></span>`).join("")}
    </div>
  `).join("");
}

function renderPageModule(module, options = {}) {
  const style = homeModuleStyle(module);
    if (module.type === "CUBE") return `<section class="home-entry-list layout-${style.layout || "TWO"} card-${style.cardStyle}" ${homeModuleVars(module)}>${state.homeEntries.slice(0, module.limit).map((entry) => `
      ${renderHomeEntryCard(entry)}`).join("")}</section>`;
    if (module.type === "NAV") return `<nav class="home-text-nav layout-${style.layout || "FOUR"}" ${homeModuleVars(module)}>${(module.navItems ?? []).slice(0, module.limit).map((entry) => `
      <button data-nav-type="${entry.targetType}" data-nav-value="${escapeHtml(entry.targetValue)}"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.subtitle || "DISCOVER")}</small></button>`).join("")}</nav>`;
    if (module.type === "TOPICS") return renderTopicModule(module);
    if (module.type === "BLOG") {
      const blogTag = module.blogTag ?? "";
      const posts = state.blogPosts
        .filter((post) => !blogTag || (post.tags ?? []).includes(blogTag))
        .slice(0, module.limit);
      return `<section class="home-blog-module" ${homeModuleVars(module)}>${moduleHeading(module, "DALI LIFE")}<section class="blog-preview-list layout-${style.layout || "GRID"}">${posts.map((post) => renderBlogCard(post)).join("") || `<div class="empty">生活记录正在整理中。</div>`}</section></section>`;
    }
    if (module.type === "ACTIVITIES") {
      const moduleTagIds = Array.isArray(module.tagIds) ? module.tagIds : [];
      const items = state.activities.filter((activity) =>
        moduleTagIds.every((tagId) => activityTags(activity).some((tag) => tag.id === tagId))
      );
      return `<section class="home-activity-module">${moduleHeading(module, "EXPLORE")}<section class="tag-filter">${renderGroupedTagFilter({ selectedIds: state.selectedTags, expandedGroups: state.expandedTagGroups })}</section><section class="activity-list layout-${style.layout || "LIST"} card-${style.cardStyle}" ${homeModuleVars(module)}>${items.map((activity) => `
        <article class="activity-card" data-activity="${activity.id}"><img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" /><div><h3>${escapeHtml(activity.content.name)}</h3><p>${escapeHtml(activity.content.summary) || "查看活动详情与可预约时间。"}</p>${activityTags(activity).map((tag) => `<span>${escapeHtml(tag.name)}</span>`).join("")}</div></article>`).join("") || `<div class="empty">暂时没有符合这些标签的活动。</div>`}</section></section>`;
    }
    if (module.type === "GUIDES") {
      const guides = options.context === "topic" ? state.guides : state.guides.slice(0, module.limit);
      return `<section class="home-guide-module" ${homeModuleVars(module)}>${moduleHeading(module, "MEET THE GUIDES", `<button class="section-heading-action" type="button" data-open-guides>查看全部</button>`)}<section class="home-guide-list">${guides.map((guide) => `
      <button data-guide="${guide.id}">
        ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<span class="home-guide-placeholder">照片</span>`}
        <span>
          <strong>${escapeHtml(guide.name)}</strong>
          <small>${escapeHtml(plainTextFromHtml(guide.descriptionHtml)) || "查看领队档案与可能带领的活动。"}</small>
        </span>
      </button>`).join("")}</section></section>`;
    }
    if (module.type === "REVIEWS") {
      const reviews = options.context === "topic" ? generalHomeReviews(20) : latestHomeReviews(20);
      return `${moduleHeading(module, "LATEST STORIES")}<section class="home-review-strip">${reviews.map((review) => `
      <article class="home-review-card" ${review.activityId ? `data-review-activity="${escapeHtml(review.activityId)}"` : ""}>
        <div class="home-review-head">
          <span class="review-avatar">${escapeHtml(review.displayName.slice(0, 1))}</span>
          <div>
            <strong>${escapeHtml(review.displayName)}</strong>
            <em>${"★".repeat(review.rating)}</em>
          </div>
          <time>${readableDate(review.createdAt)}</time>
        </div>
        <div class="home-review-copy">
            <div class="home-review-text">
              <p>${escapeHtml(compactReviewText(review.content))}</p>
              ${compactReviewText(review.content).length > 80 ? `<button type="button" class="review-expand" data-expand-review>展开</button>` : ""}
            </div>
            <small>#${escapeHtml(review.activityName)}</small>
            ${(review.imageUrls ?? []).length ? `<div class="home-review-images">${review.imageUrls.slice(0, 5).map((url, index) => `<button type="button" data-home-preview-review="${review.id}" data-preview-index="${index}"><img src="${escapeHtml(url)}" alt="评价照片" /></button>`).join("")}</div>${review.imageUrls.length > 5 ? `<button type="button" class="review-more-images" data-home-preview-review="${review.id}" data-preview-index="5">更多照片</button>` : ""}` : ""}
        </div>
      </article>`).join("") || `<div class="empty">最新评价正在整理中。</div>`}</section>`;
    }
    if (module.type === "UPCOMING") return `${moduleHeading(module, "NEXT DEPARTURES")}<section class="upcoming-strip">${renderUpcomingDepartures(state.upcomingSlots.slice(0, 30))}</section>`;
    if (module.type === "BANNER") {
      const images = (module.imageUrls?.length ? module.imageUrls : [module.imageUrl]).filter(Boolean);
      return `<section class="home-banners layout-${style.layout || "SINGLE"} card-${style.cardStyle}" ${homeModuleVars(module)}>${(images.length ? images : [""]).map((imageUrl) => `<a class="home-banner" href="${escapeHtml(module.linkUrl || "#")}" ${module.linkUrl ? `target="_blank" rel="noopener noreferrer"` : ""}>${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(module.title)}" />` : ""}<strong>${escapeHtml(module.title)}</strong></a>`).join("")}</section>`;
    }
    if (module.type === "COLLAPSE") return `<section class="home-collapse-module" style="padding:${style.padding}px;background:${escapeHtml(style.backgroundColor)}">
      <div class="home-collapse-list">${(module.items ?? []).slice(0, module.limit).map((item, index) => `
        <article class="home-collapse-item">
          <button type="button" data-collapse-item="${module.id}-${index}" aria-expanded="false"><span class="dialog-icon" aria-hidden="true"></span><strong>${escapeHtml(item.title)}</strong><em>⌄</em></button>
          <div class="home-collapse-body">${renderRichTextParagraphs(item.content)}</div>
        </article>`).join("") || `<p class="empty">暂时没有内容。</p>`}</div>
    </section>`;
    if (module.type === "DIVIDER") return `<div class="home-divider ${style.dividerStyle === "LINE" ? "is-line" : "is-space"}" style="height:${style.height}px"><span></span></div>`;
    return `<section class="home-text-module" style="padding:${style.padding}px;text-align:${style.textAlign === "CENTER" ? "center" : "left"};background:${escapeHtml(style.backgroundColor)}"><h2>${escapeHtml(module.title)}</h2><p>${escapeHtml(module.subtitle)}</p></section>`;
}

function renderHomepageModules() {
  clearUpcomingAutoScroll();
  $("#home-module-container").innerHTML = state.homeModules.map(renderPageModule).join("");
  bindHomepageModules();
}

function clearUpcomingAutoScroll() {
  (window.__upcomingAutoScrollTimers ?? []).forEach((timer) => clearInterval(timer));
  window.__upcomingAutoScrollTimers = [];
}

function bindUpcomingAutoScroll() {
  clearUpcomingAutoScroll();
  document.querySelectorAll(".upcoming-strip").forEach((strip) => {
    const pages = [...strip.querySelectorAll(".upcoming-page")];
    if (pages.length <= 1) return;
    const timer = setInterval(() => {
      if (!document.body.contains(strip) || $("#home-view")?.hidden) return;
      const pageWidth = pages[0].getBoundingClientRect().width + 8;
      const currentPage = Math.round(strip.scrollLeft / pageWidth);
      const nextPage = currentPage >= pages.length - 1 ? 0 : currentPage + 1;
      strip.scrollTo({ left: nextPage * pageWidth, behavior: "smooth" });
    }, 3000);
    window.__upcomingAutoScrollTimers.push(timer);
  });
}

function collapseStickyBar() {
  let bar = document.querySelector(".collapse-sticky-close");
  if (bar) return bar;
  bar = document.createElement("button");
  bar.type = "button";
  bar.className = "collapse-sticky-close";
  bar.hidden = true;
  bar.innerHTML = `<span class="dialog-icon" aria-hidden="true"></span><strong></strong><em>⌄</em>`;
  bar.addEventListener("click", () => {
    const target = document.querySelector(`[data-collapse-item="${bar.dataset.target || ""}"]`);
    if (target) target.click();
    updateCollapseStickyBar();
  });
  document.body.appendChild(bar);
  return bar;
}

function updateCollapseStickyBar() {
  const bar = collapseStickyBar();
  const visibleView = document.querySelector(".view:not([hidden])");
  const activeItem = visibleView?.querySelector(".home-collapse-item.open");
  if (!activeItem) {
    bar.hidden = true;
    return;
  }
  const button = activeItem.querySelector("[data-collapse-item]");
  const body = activeItem.querySelector(".home-collapse-body");
  const bodyRect = body?.getBoundingClientRect();
  const buttonRect = button?.getBoundingClientRect();
  const shouldShow = Boolean(button && bodyRect && buttonRect && buttonRect.bottom < 0 && bodyRect.bottom > 64);
  if (!shouldShow) {
    bar.hidden = true;
    return;
  }
  bar.dataset.target = button.dataset.collapseItem;
  bar.querySelector("strong").textContent = button.querySelector("strong")?.textContent || "收起";
  bar.hidden = false;
}

if (!window.__collapseStickyBarBound) {
  window.__collapseStickyBarBound = true;
  window.addEventListener("scroll", updateCollapseStickyBar, { passive: true });
  window.addEventListener("resize", updateCollapseStickyBar);
}

function bindHomepageModules() {
  document.querySelectorAll("[data-nav-type]").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.navType === "TOPIC") return openTopicPage(button.dataset.navValue);
    if (button.dataset.navType === "ACTIVITY") return openActivity(button.dataset.navValue);
    if (button.dataset.navType === "GUIDES") { await loadGuideHome(); return showView("guides"); }
    window.open(button.dataset.navValue, "_blank", "noopener,noreferrer");
  }));
  document.querySelectorAll("[data-home-entry]").forEach((button) => button.addEventListener("click", async () => {
    const entry = state.homeEntries.find((item) => item.id === button.dataset.homeEntry);
    if (entry.targetType === "TOPIC") return openTopicPage(entry.targetValue);
    if (entry.targetType === "ACTIVITY") return openActivity(entry.targetValue);
    if (entry.targetType === "GUIDES") { await loadGuideHome(); return showView("guides"); }
    window.open(entry.targetValue, "_blank", "noopener,noreferrer");
  }));
  document.querySelectorAll("[data-topic-page]").forEach((button) => button.addEventListener("click", async () => button.dataset.externalUrl ? window.open(button.dataset.externalUrl, "_blank", "noopener,noreferrer") : openTopicPage(button.dataset.topicPage)));
  document.querySelectorAll("[data-home-local-info]").forEach((button) => button.addEventListener("click", async () => {
    await loadLocalInfos();
    showView("local");
  }));
  bindBlogCards();
  document.querySelectorAll("[data-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.activity)));
  document.querySelectorAll("[data-guide]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guide)));
  document.querySelectorAll("[data-open-guides]").forEach((button) => button.addEventListener("click", async () => {
    await loadGuideHome();
    showView("guides");
  }));
  document.querySelectorAll("[data-review-activity]").forEach((card) => card.addEventListener("click", () => {
    if (card.dataset.reviewActivity) openActivity(card.dataset.reviewActivity);
  }));
  document.querySelectorAll("[data-expand-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSlidingReviewGroup(button, ".home-review-strip", ".home-review-card", "[data-expand-review]");
  }));
  document.querySelectorAll("[data-home-preview-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const review = state.homeReviews.find((item) => item.id === button.dataset.homePreviewReview);
    openImagePreview(review?.imageUrls ?? [], Number(button.dataset.previewIndex));
  }));
  document.querySelectorAll("[data-topic-photo-collapse]").forEach((button) => button.addEventListener("click", () => {
    const target = document.querySelector(`[data-collapse-item="${button.dataset.topicPhotoCollapse}"]`);
    const panel = target?.closest(".topic-photo-collapse-panel");
    if (!target || !panel) return;
    document.querySelectorAll(".topic-photo-collapse-panel.open").forEach((item) => {
      if (item === panel) return;
      item.classList.remove("open");
      item.querySelector("[data-collapse-item]")?.setAttribute("aria-expanded", "false");
    });
    if (!panel.classList.contains("open")) target.click();
    requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
      updateCollapseStickyBar();
    });
  }));
  document.querySelectorAll("[data-collapse-item]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const item = button.closest(".home-collapse-item");
    const isOpen = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    requestAnimationFrame(updateCollapseStickyBar);
  }));
  bindInternalContentLinks();
  syncReviewGalleryRatios();
  bindUpcomingAutoScroll();
  document.querySelectorAll("[data-upcoming-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.upcomingActivity)));
  document.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", async () => {
    state.selectedTags = singleSelectedTag(state.selectedTags, button.dataset.tag);
    await loadActivities();
  }));
}

async function openActivity(id, date = "", options = {}) {
  const baseDate = date || isoDate();
  const detailDates = detailDateValues(baseDate);
  const [activity, reviews, relatedActivities, dateSlots] = await Promise.all([
    request(`/activities/${id}`),
    request(`/reviews?activityId=${id}`),
    request(`/activities/${id}/related?limit=3`),
    Promise.all(detailDates.map(async (value) => ({
      date: value,
      slots: await request(`/activities/${id}/slots?date=${value}&includeGenerated=true`)
    })))
  ]);
  state.activity = activity;
  state.reviews = reviews;
  state.relatedActivities = relatedActivities;
  const selectedDate = date || dateSlots.find((item) => item.slots.length > 0)?.date || baseDate;
  state.activityDate = selectedDate;
  state.slots = dateSlots.find((item) => item.date === selectedDate)?.slots ?? [];
  state.activityDateAvailability = dateSlots.map((item) => ({ date: item.date, available: item.slots.length > 0 }));
  const navigationUrl = mapUrl(state.activity);
  const latestReview = state.reviews[0];
  const activityImages = activityGalleryImages(state.activity);
  const seasonalText = seasonalHighlight(state.activity);
  $("#detail-view .detail-header strong").textContent = state.activity.content.name || "服务详情";
  $("#activity-detail").innerHTML = `
    <section class="detail-copy detail-intro">
      <h1>${escapeHtml(state.activity.content.name)}</h1>
      <p>${escapeHtml(state.activity.content.summary) || "一段慢一点的自然体验。"}</p>
      ${seasonalText ? `<section class="seasonal-highlight"><strong>当季特色</strong><p>${escapeHtml(seasonalText)}</p></section>` : ""}
      <span>${activityTags(state.activity).map((tag) => escapeHtml(tag.name)).join(" / ")}</span>
      <div class="detail-share-row">
        ${shareButton({ kind: "activity", id: state.activity.id, title: state.activity.content.name, text: state.activity.content.summary || "来自苍山徒步之家的活动", label: "发给朋友" })}
      </div>
    </section>
    <section class="activity-gallery" aria-label="活动照片">
      <div>
        ${activityImages.map((imageUrl, index) => `
          <button type="button" data-activity-preview-index="${index}">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(state.activity.content.name)}照片 ${index + 1}" />
          </button>
        `).join("")}
      </div>
      ${activityImages.length > 1 ? `<p>${activityImages.map((_, index) => `<span class="${index === 0 ? "active" : ""}"></span>`).join("")}</p>` : ""}
    </section>
    <nav class="detail-tabs">
      <button class="active" data-detail-section="detail-booking-section">预约</button>
      <button data-detail-section="detail-review-section">评论</button>
      <button data-detail-section="detail-info-section">详情</button>
    </nav>
    <section id="detail-booking-section" class="detail-booking-section">
      <div class="detail-date-strip">
        ${state.activityDateAvailability.map((item) => {
          const dateObject = new Date(`${item.date}T00:00:00`);
          return `
            <button class="${item.date === state.activityDate ? "active" : ""} ${item.available ? "available" : "unavailable"}" data-activity-date="${item.date}">
              <span>${new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(dateObject)}</span>
              <strong>${dateObject.getDate()}</strong>
              <small>${item.available ? "可约" : "不可约"}</small>
            </button>
          `;
        }).join("")}
      </div>
      <p class="advance-notice">需提前 ${state.activity.advanceBookingHours || 0} 小时进行预约</p>
      <h3>选择时段</h3>
      <div class="slot-list detail-slot-list">
        ${state.slots.map((slot) => `
          <article class="slot-card">
            <div>
              <strong>${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)}</strong>
              <p>${slot.bookedCount} 人预订，最多 ${slot.capacity} 人</p>
              <em>最高 ${money(slotHighestPrice(slot))}</em>
            </div>
            <button data-book-slot="${slot.id}">预约</button>
          </article>
        `).join("") || `<div class="empty">暂时没有开放预约的时间。</div>`}
      </div>
    </section>
    <section id="detail-review-section" class="reviews-section detail-review-section">
      <div class="reviews-heading">
        <h2>评论(${state.reviews.length})</h2>
        <div>
          <button class="secondary" id="show-all-reviews">查看全部</button>
          <button class="primary" id="new-review">写评价</button>
        </div>
      </div>
      <div class="review-list detail-latest-list">
        ${state.reviews.map((review) => renderDetailReview(review, true)).join("") || `<div class="empty">还没有评价，欢迎写下第一条体验。</div>`}
      </div>
    </section>
    <section id="detail-info-section" class="detail-copy detail-info-section">
      <h2>详情</h2>
      <section class="activity-facts">
        <div><span>年龄</span><strong>${escapeHtml(state.activity.content.suitableAge || "咨询领队")}</strong></div>
        <div><span>集合地点</span><strong>${escapeHtml(state.activity.content.meetingPointName || "出发前通知")}${navigationUrl ? `<a class="navigation-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}</strong></div>
        <div><span>领队微信</span><strong class="wechat-copy-line">${escapeHtml(state.activity.leaderWechat || "预订后沟通")}${state.activity.leaderWechat ? `<button type="button" data-copy-leader-wechat="${escapeHtml(state.activity.leaderWechat)}">复制</button>` : ""}</strong></div>
      </section>
      ${(state.activity.guides ?? []).length ? `
        <section class="activity-guides">
          <h2>可能带队的领队</h2>
          <div>${(state.activity.guides ?? []).map((guide) => `
            <button data-guide="${guide.id}">
              ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : ""}
              <span>${escapeHtml(guide.name)}</span>
            </button>
          `).join("")}</div>
        </section>
      ` : ""}
      <section class="detail-description">
        <h3>体验内容</h3>
        ${state.activity.content.descriptionHtml?.trim() || renderParagraphs(state.activity.content.summary || "详情正在整理中。")}
      </section>
      ${state.relatedActivities.length ? `
        <section class="related-activities">
          <h3>喜欢这个的人也去了</h3>
          <div>
            ${state.relatedActivities.map((activity) => `
              <button data-related-activity="${activity.id}">
                <img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" />
                <strong>${escapeHtml(activity.content.name)}</strong>
              </button>
            `).join("")}
          </div>
        </section>
      ` : ""}
    </section>`;
  document.querySelectorAll("[data-book-slot]").forEach((button) => button.addEventListener("click", () => openBooking(button.dataset.bookSlot)));
  document.querySelectorAll("[data-activity-preview-index]").forEach((button) => button.addEventListener("click", () => openImagePreview(activityImages, Number(button.dataset.activityPreviewIndex))));
  $("#new-review").addEventListener("click", openReview);
  $("#show-all-reviews").addEventListener("click", openActivityReviews);
  document.querySelectorAll("[data-activity-date]").forEach((button) => button.addEventListener("click", () => openActivity(state.activity.id, button.dataset.activityDate, { scrollToTop: false })));
  document.querySelectorAll("[data-detail-section]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".detail-tabs button").forEach((item) => item.classList.toggle("active", item === button));
    document.getElementById(button.dataset.detailSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  document.querySelectorAll("[data-guide]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guide)));
  document.querySelectorAll("[data-related-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.relatedActivity)));
  document.querySelector("[data-copy-leader-wechat]")?.addEventListener("click", async (event) => {
    copyText(event.currentTarget.dataset.copyLeaderWechat, "领队微信已复制");
  });
  syncActivityGalleryRatio();
  bindReviewActions();
  showView("detail");
  if (options.scrollToTop !== false) scrollToPageTop();
}

function openActivityReviews() {
  if (!state.activity) return;
  $("#activity-reviews-title").textContent = `${state.activity.content.name} · 评论(${state.reviews.length})`;
  $("#activity-review-list").innerHTML = state.reviews.map((review) => renderDetailReview(review)).join("") || `<div class="empty">还没有评价，欢迎写下第一条体验。</div>`;
  $("#new-review-from-list").onclick = openReview;
  bindReviewActions();
  showView("activity-reviews");
}

function openImagePreview(images, index = 0) {
  if (!images.length) return;
  const dialog = $("#image-preview-dialog");
  const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
  dialog.dataset.images = JSON.stringify(images);
  dialog.dataset.index = String(safeIndex);
  renderImagePreview();
  dialog.showModal();
}

function renderImagePreview() {
  const dialog = $("#image-preview-dialog");
  const images = JSON.parse(dialog.dataset.images || "[]");
  const index = Number(dialog.dataset.index || 0);
  $("#image-preview-content").innerHTML = `
    <button type="button" data-close-image-preview aria-label="关闭">×</button>
    <div class="image-preview-track">${images.map((image) => `<img src="${escapeHtml(image)}" alt="评价照片预览" />`).join("")}</div>
    <footer><span>${index + 1} / ${images.length}</span></footer>
  `;
  document.querySelector("[data-close-image-preview]").addEventListener("click", () => dialog.close());
  const track = document.querySelector(".image-preview-track");
  requestAnimationFrame(() => {
    track.scrollLeft = track.clientWidth * index;
  });
  track.addEventListener("scroll", () => {
    const current = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    dialog.dataset.index = String(current);
    const counter = document.querySelector("#image-preview-content footer span");
    if (counter) counter.textContent = `${current + 1} / ${images.length}`;
  }, { passive: true });
}

async function openGuide(guideId) {
  if (!state.guides.length) state.guides = await request("/guides");
  if (!state.blogPosts.length) state.blogPosts = await request("/blog-posts?published=true");
  if (!state.homeReviews.length) state.homeReviews = await request("/reviews");
  const guide = state.guides.find((item) => item.id === guideId);
  if (!guide) return;
  const guideImages = (guide.images ?? [])
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map(activityImageUrl)
    .filter(Boolean);
  const guideBlogPosts = blogPostsForGuide(guide);
  const guideReviews = guideReviewsForGuide(guide);
  $("#guide-profile").innerHTML = `
    <header>
      <div>
        <p>GUIDE PROFILE</p>
        <h2>${escapeHtml(guide.name)}</h2>
        <div class="detail-share-row">
          ${shareButton({ kind: "guide", id: guide.id, title: guide.name, text: guide.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 80) || "来自苍山徒步之家的领队资料", label: "发给朋友" })}
        </div>
      </div>
      <button data-close-guide aria-label="关闭">×</button>
    </header>
    ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : ""}
    ${guideImages.length ? `
      <div class="guide-gallery-strip">
        ${guideImages.map((url, index) => `
          <button type="button" data-guide-image-index="${index}">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(guide.name)}相册照片 ${index + 1}" />
          </button>
        `).join("")}
      </div>
    ` : ""}
    <div class="guide-description">${guide.descriptionHtml}</div>
    <section class="guide-section">
      <h3>可能带领的活动</h3>
      <div class="guide-activity-list">
        ${guide.activities.map((activity) => `
          <button data-guide-activity="${activity.id}">
            <img src="${escapeHtml(activity.coverUrl || cover)}" alt="${escapeHtml(activity.name)}" />
            <div>
              <strong>${escapeHtml(activity.name)}</strong>
              <span>${escapeHtml(activity.summary) || "查看活动详情与可预约时间。"}</span>
            </div>
          </button>
        `).join("") || `<p>暂时没有关联活动。</p>`}
      </div>
    </section>
    <section class="guide-review-section">
      <div class="guide-review-heading">
        <h3>客人对${escapeHtml(guide.name)}的评价</h3>
        <span>${guideReviews.length} 条</span>
      </div>
      <div class="guide-review-strip">
        ${guideReviews.map((review) => `
          <article class="guide-review-card" data-guide-review-card>
            <span>${"★".repeat(review.rating)}</span>
            <strong>${escapeHtml(review.activityName || "苍山徒步之家")}</strong>
            <div class="guide-review-text">
              <p>${escapeHtml(review.content)}</p>
              ${review.content.length > 100 ? `<button type="button" class="review-expand" data-expand-guide-review>展开</button>` : ""}
            </div>
            ${(review.imageUrls ?? []).length ? `<div class="guide-review-images">${review.imageUrls.slice(0, 3).map((url, index) => `<button type="button" data-guide-preview-review="${review.id}" data-preview-index="${index}"><img src="${escapeHtml(url)}" alt="评价照片" /></button>`).join("")}${review.imageUrls.length > 3 ? `<button type="button" class="more" data-guide-preview-review="${review.id}" data-preview-index="3">更多</button>` : ""}</div>` : ""}
            <small>${escapeHtml(review.displayName)} · ${readableDate(review.createdAt)}</small>
          </article>
        `).join("") || `<div class="empty">还没有客人评价直接提到 ${escapeHtml(guide.name)}。</div>`}
      </div>
    </section>
    <section class="guide-blog-section">
      <div class="blog-preview-heading guide-blog-heading">
        <div>
          <p>DALI LIFE</p>
          <h2>和${escapeHtml(guide.name)}有关的记录</h2>
        </div>
        <span>${guideBlogPosts.length} 篇</span>
      </div>
      <div class="blog-preview-list guide-blog-list">
        ${guideBlogPosts.map((post) => renderBlogCard(post, "data-guide-blog-post")).join("") || `<div class="empty">还没有带「${escapeHtml(guide.name)}」标签的文章。</div>`}
      </div>
    </section>
  `;
  $("#guide-profile [data-close-guide]").addEventListener("click", () => $("#guide-dialog").close());
  document.querySelectorAll("[data-guide-image-index]").forEach((button) => button.addEventListener("click", () => openImagePreview(guideImages, Number(button.dataset.guideImageIndex))));
  document.querySelectorAll("[data-guide-activity]").forEach((button) => button.addEventListener("click", async () => {
    $("#guide-dialog").close();
    await openActivity(button.dataset.guideActivity);
  }));
  $("#guide-profile").onclick = (event) => {
    const previewButton = event.target.closest("[data-guide-preview-review]");
    if (previewButton) {
      const review = state.homeReviews.find((item) => item.id === previewButton.dataset.guidePreviewReview);
      openImagePreview(review?.imageUrls ?? [], Number(previewButton.dataset.previewIndex));
      return;
    }
    const card = event.target.closest("[data-guide-review-card]");
    if (!card) return;
    toggleSlidingReviewGroup(card, ".guide-review-strip", "[data-guide-review-card]", "[data-expand-guide-review]");
  };
  document.querySelectorAll("[data-guide-blog-post]").forEach((button) => button.addEventListener("click", async () => {
    $("#guide-dialog").close();
    await openBlogPost(button.dataset.guideBlogPost);
  }));
  bindShareActions($("#guide-profile"));
  $("#guide-dialog").showModal();
}

async function loadGuideHome() {
  [state.guides, state.guidePage] = await Promise.all([request("/guides"), request("/guide-page")]);
  state.guides = sortGuidesForDisplay(state.guides);
  $("#guide-home-introduction").innerHTML = state.guidePage.introductionHtml || `<p>暂未填写领队介绍。</p>`;
  $("#guide-count").textContent = `${state.guides.length} 位领队`;
  $("#customer-guide-list").innerHTML = state.guides.map((guide) => `
    <button class="customer-guide-card" data-guide-card="${guide.id}">
      ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<span class="customer-guide-placeholder">照片</span>`}
      <div>
        <h3>${escapeHtml(guide.name)}</h3>
        <p>${escapeHtml(guide.descriptionHtml.replace(/<[^>]+>/g, "")) || "查看领队档案与可能带领的活动。"}</p>
        <span>${guide.activities.length} 个相关活动</span>
      </div>
    </button>
  `).join("") || `<div class="empty">领队档案正在整理中。</div>`;
  document.querySelectorAll("[data-guide-card]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guideCard)));
}

function openReview() {
  state.reviewImages = [];
  state.reviewVideo = "";
  $("#review-form").reset();
  $("#review-form").elements.displayName.value = "Mia";
  $("#review-image-preview").innerHTML = "";
  $("#review-video-preview").innerHTML = "";
  $("#review-dialog").showModal();
}

function openReviewReply(reviewId) {
  const review = state.reviews.find((item) => item.id === reviewId);
  if (!review) return;
  state.replyingReviewId = reviewId;
  $("#review-reply-form").reset();
  $("#review-reply-summary").textContent = `${review.displayName}：${compactReviewText(review.content).slice(0, 80)}`;
  $("#review-reply-dialog").showModal();
}

function readImageFiles(files) {
  return Promise.all([...files].map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.readAsDataURL(file);
  })));
}

function openBooking(slotId) {
  state.bookingSlot = state.slots.find((slot) => slot.id === slotId);
  const form = $("#booking-form");
  form.reset();
  $("#booking-price-options").innerHTML = state.bookingSlot.priceOptions.map((option, index) => `
    <div class="booking-line-item" data-booking-line-item="${option.id}">
      <div>
        <strong>${escapeHtml(option.name)}</strong>
        <span>${money(option.priceCents)}</span>
      </div>
      <span class="stepper">
        <button type="button" data-line-quantity-step="-1" data-price-option-id="${option.id}" aria-label="减少${escapeHtml(option.name)}人数">−</button>
        <input name="lineQuantity:${option.id}" type="number" min="0" value="${index === 0 ? 1 : 0}" readonly />
        <button type="button" data-line-quantity-step="1" data-price-option-id="${option.id}" aria-label="增加${escapeHtml(option.name)}人数">＋</button>
      </span>
    </div>
  `).join("");
  document.querySelectorAll("[data-line-quantity-step]").forEach((button) => button.addEventListener("click", () => {
    const input = form.elements[`lineQuantity:${button.dataset.priceOptionId}`];
    const selectedCount = selectedBookingLineItems().reduce((sum, item) => sum + item.quantity, 0);
    const available = state.bookingSlot.capacity - state.bookingSlot.bookedCount;
    const current = Number(input.value);
    const next = Math.max(0, Math.min(current + Number(button.dataset.lineQuantityStep), available - selectedCount + current));
    input.value = next;
    updateTotal();
  }));
  $("#booking-slot-summary").innerHTML = `<strong>${dateOnly(state.bookingSlot.startsAt)} ${timeOnly(state.bookingSlot.startsAt)}-${timeOnly(state.bookingSlot.endsAt)}</strong><br />${state.bookingSlot.bookedCount} 人预订，最多 ${state.bookingSlot.capacity} 人`;
  updateTotal();
  $("#booking-dialog").showModal();
}

function selectedBookingLineItems() {
  const form = $("#booking-form");
  return (state.bookingSlot?.priceOptions ?? []).map((option) => {
    const quantity = Number(form.elements[`lineQuantity:${option.id}`]?.value || 0);
    return {
      priceOptionId: option.id,
      quantity,
      specification: option.name,
      unitPriceCents: option.priceCents,
      amountCents: option.priceCents * quantity
    };
  }).filter((item) => item.quantity > 0);
}

function bookingSuccessMessage(activity = state.activity) {
  const leaderName = String(activity?.leaderName ?? activity?.responsibleLeaderName ?? activity?.leaderDisplayName ?? "").trim();
  const leaderWechat = String(activity?.leaderWechat ?? "").trim();
  const leaderText = leaderName ? `领队「${escapeHtml(leaderName)}」` : "负责领队";
  const message = [`订单已经发给领队，${leaderText}晚些会加你微信，建群，发集合信息、注意事项、保险填写。`];
  if (leaderWechat) {
    message.push(`如果需要，您也可以直接加领队微信「${escapeHtml(leaderWechat)}」。`);
  }
  return message.join("<br />");
}

function orderLineItems(order) {
  return (order.lineItems?.length ? order.lineItems : [{
    priceOptionId: order.priceOptionId,
    specification: order.specification,
    quantity: order.quantity,
    unitPriceCents: order.unitPriceCents,
    amountCents: order.amountCents
  }]).filter((item) => Number(item.quantity) > 0);
}

function orderSpecText(order) {
  return orderLineItems(order).map((item) => `${item.specification} × ${item.quantity}`).join("，");
}

function updateTotal() {
  const amountCents = selectedBookingLineItems().reduce((sum, item) => sum + item.amountCents, 0);
  $("#booking-total").textContent = money(amountCents);
}

function renderOrders() {
  $("#customer-order-list").innerHTML = state.orders.map((order) => {
    const navigationUrl = orderMapUrl(order);
    const leaderWechat = String(order.leaderWechat ?? "").trim();
    return `
    <article class="customer-order">
      <div><strong>${order.groupName}</strong><span>${statusText(order.status)}</span></div>
      <h3>${order.activityName}</h3>
      <p>${dateOnly(order.startsAt)} ${timeOnly(order.startsAt)}-${timeOnly(order.endsAt)}</p>
      <p>${escapeHtml(orderSpecText(order))} · ${money(order.amountCents)}</p>
      <p class="order-meeting-point"><strong>集合地点：</strong>${order.meetingPointName || "出发前通知"}${navigationUrl ? `<a class="navigation-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}</p>
      ${leaderWechat ? `<p class="order-leader-wechat"><strong>领队微信：</strong>「${escapeHtml(leaderWechat)}」<button type="button" data-copy-order-wechat="${escapeHtml(leaderWechat)}">复制</button></p>` : ""}
      ${["PENDING_PAYMENT", "BOOKED"].includes(order.status) ? `<div class="customer-order-actions"><button class="danger" data-cancel-booking="${order.id}">取消预约</button></div>` : ""}
    </article>
  `;
  }).join("") || `<div class="empty">还没有预约记录。</div>`;
  document.querySelectorAll("[data-cancel-booking]").forEach((button) => button.addEventListener("click", () => openCancellation(button.dataset.cancelBooking)));
  document.querySelectorAll("[data-copy-order-wechat]").forEach((button) => button.addEventListener("click", (event) => {
    copyText(event.currentTarget.dataset.copyOrderWechat, "领队微信已复制");
  }));
}

async function openCancellation(orderId) {
  try {
    const preview = await request(`/orders/${orderId}/cancellation-preview?customerId=${customerId}`);
    state.cancellingOrderId = orderId;
    $("#cancel-booking-summary").innerHTML = `
      <strong>预计退款 ${money(preview.refundAmountCents)}</strong><br />
      <span>订单金额 ${money(preview.amountCents)}，扣款 ${money(preview.retainedAmountCents)}，退款比例 ${Math.round(preview.refundRate * 100)}%，款项原路退回</span>
    `;
    const contact = $("#cancel-booking-contact");
    contact.hidden = !preview.leaderWechat;
    contact.innerHTML = preview.leaderWechat
      ? `<div><span>需要沟通？联系领队微信</span><strong>${preview.leaderWechat}</strong></div><button type="button" class="secondary" data-copy-wechat="${preview.leaderWechat}">复制微信</button>`
      : "";
    contact.querySelector("[data-copy-wechat]")?.addEventListener("click", async (event) => {
      copyText(event.currentTarget.dataset.copyWechat, "领队微信已复制");
    });
    $("#cancel-booking-form").reset();
    $("#cancel-booking-dialog").showModal();
  } catch (error) {
    toast(error.message);
  }
}

async function loadOrders() {
  state.orders = await request(`/orders?customerId=${customerId}`);
  renderOrders();
}

async function boot() {
  try {
    [state.tags, state.topicPages, state.blogPosts, state.homeEntries, state.homeModules, state.guides, state.homeReviews, state.localInfos] = await Promise.all([request("/tags"), request("/topic-pages?published=true"), request("/blog-posts?published=true"), request("/home-entries?published=true"), request("/home-modules?published=true"), request("/guides"), request("/reviews"), request("/local-infos?published=true")]);
    state.tags = visibleTags(state.tags);
    state.guides = sortGuidesForDisplay(state.guides);
    renderBlogPreview();
    await loadActivities();
  } catch (error) {
    toast(error.message);
  }
}

document.querySelectorAll(".bottom-nav button").forEach((button) => button.addEventListener("click", async () => {
  if (button.dataset.view === "orders") await loadOrders();
  if (button.dataset.view === "booking") await loadBookingActivities();
  if (button.dataset.view === "local") await loadLocalInfos();
  if (button.dataset.view === "guides") await loadGuideHome();
  showView(button.dataset.view);
}));
$("#booking-date-picker").addEventListener("change", async (event) => {
  state.bookingDate = event.currentTarget.value;
  await loadBookingActivities();
});
$("#booking-search").addEventListener("input", (event) => {
  state.bookingSearch = event.currentTarget.value;
  renderBookingActivities();
});
$("#back-to-home").addEventListener("click", () => showView("home"));
$("#open-blog-list").addEventListener("click", openBlogList);
$("#back-from-blog").addEventListener("click", () => showView("home"));
$("#back-from-local-detail").addEventListener("click", () => showView("local"));
$("#back-from-blog-detail").addEventListener("click", openBlogList);
$("#back-from-topic").addEventListener("click", () => showView("home"));
$("#back-to-detail-from-reviews").addEventListener("click", () => showView("detail"));
document.querySelectorAll("[data-close-booking]").forEach((button) => button.addEventListener("click", () => $("#booking-dialog").close()));
$("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const lineItems = selectedBookingLineItems().map(({ priceOptionId, quantity }) => ({ priceOptionId, quantity }));
  if (!lineItems.length) return toast("请至少选择 1 位预约人数");
  try {
    const profile = { mobile: values.get("mobile"), nickname: values.get("nickname"), childInfo: values.get("childInfo") };
    const currentCustomerId = await ensureWechatCustomer(profile);
    const order = await request("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerId: currentCustomerId,
        slotId: state.bookingSlot.id,
        lineItems,
        profile
      })
    });
    await payOrder(order);
    form.closest("dialog").close();
    $("#success-message").innerHTML = bookingSuccessMessage();
    $("#success-dialog").showModal();
  } catch (error) {
    toast(error.message);
  }
});
$("#show-orders").addEventListener("click", async () => {
  $("#success-dialog").close();
  await loadOrders();
  showView("orders");
});
document.querySelectorAll("[data-close-cancel-booking]").forEach((button) => button.addEventListener("click", () => $("#cancel-booking-dialog").close()));
document.querySelectorAll("[data-close-review]").forEach((button) => button.addEventListener("click", () => $("#review-dialog").close()));
document.querySelectorAll("[data-close-review-reply]").forEach((button) => button.addEventListener("click", () => $("#review-reply-dialog").close()));
$("#review-images").addEventListener("change", async (event) => {
  const urls = await readImageFiles(event.currentTarget.files);
  if (state.reviewImages.length + urls.length > 9) toast("评价图片最多上传 9 张");
  state.reviewImages = [...state.reviewImages, ...urls].slice(0, 9);
  $("#review-image-preview").innerHTML = state.reviewImages.map((url) => `<img src="${url}" alt="待上传照片" />`).join("");
  event.currentTarget.value = "";
});
$("#review-video").addEventListener("change", async (event) => {
  const [url] = await readImageFiles(event.currentTarget.files);
  state.reviewVideo = url || "";
  $("#review-video-preview").innerHTML = state.reviewVideo ? `<video src="${state.reviewVideo}" controls preload="metadata"></video>` : "";
  event.currentTarget.value = "";
});
$("#review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const values = new FormData(event.currentTarget);
    await request(`/activities/${state.activity.id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ customerId, displayName: values.get("displayName"), rating: Number(values.get("rating")), content: values.get("content"), imageUrls: state.reviewImages, videoUrl: state.reviewVideo })
    });
    $("#review-dialog").close();
    toast("评价已发布");
    await openActivity(state.activity.id);
  } catch (error) {
    toast(error.message);
  }
});
$("#review-reply-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.replyingReviewId) return;
  try {
    const returnToReviewList = !$("#activity-reviews-view").hidden;
    const values = new FormData(event.currentTarget);
    await request(`/reviews/${state.replyingReviewId}/replies`, {
      method: "POST",
      body: JSON.stringify({ customerId, content: values.get("content") })
    });
    $("#review-reply-dialog").close();
    state.replyingReviewId = null;
    toast("回复已发布");
    await openActivity(state.activity.id, state.activityDate, { scrollToTop: false });
    if (returnToReviewList) openActivityReviews();
  } catch (error) {
    toast(error.message);
  }
});
$("#ai-guide-form")?.addEventListener("submit", askAiGuide);
$("#cancel-booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request(`/orders/${state.cancellingOrderId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ customerId, note: new FormData(event.currentTarget).get("note") })
    });
    $("#cancel-booking-dialog").close();
    await loadOrders();
    toast("预约已取消，退款已提交");
  } catch (error) {
    toast(error.message);
  }
});

document.addEventListener("click", (event) => {
  const blogCard = event.target.closest("[data-blog-post]");
  if (blogCard) {
    event.preventDefault();
    event.stopPropagation();
    openBlogPost(blogCard.dataset.blogPost);
    return;
  }
  const homeGroupButton = event.target.closest("[data-tag-group]");
  if (homeGroupButton) {
    event.preventDefault();
    event.stopPropagation();
    state.expandedTagGroups = toggleInList(state.expandedTagGroups, homeGroupButton.dataset.tagGroup);
    renderHomepageModules();
    return;
  }
  const bookingGroupButton = event.target.closest("[data-booking-tag-group]");
  if (bookingGroupButton) {
    event.preventDefault();
    event.stopPropagation();
    state.bookingExpandedTagGroups = toggleInList(state.bookingExpandedTagGroups, bookingGroupButton.dataset.bookingTagGroup);
    renderBookingTags();
  }
}, true);

boot();
