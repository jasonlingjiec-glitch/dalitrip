const API = "http://localhost:3000/api";
const CUSTOMER_ID = "customer-demo";
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
const activityTags = (activity) => Array.isArray(activity?.tags) ? activity.tags : [];
const nonActivityGuideNames = new Set(["深夜食堂旧时光", "大家在一起的时间", "在一起的日子"]);
const isActivitySelectableGuide = (guide) => guide?.paused !== true && !nonActivityGuideNames.has(guide?.name);
const sortGuidesForDisplay = (guides = []) => [...guides].sort((left, right) => {
  const pausedDiff = (left.paused ? 1 : 0) - (right.paused ? 1 : 0);
  if (pausedDiff) return pausedDiff;
  const leftArchived = isActivitySelectableGuide(left) ? 0 : 1;
  const rightArchived = isActivitySelectableGuide(right) ? 0 : 1;
  return leftArchived - rightArchived || (left.sortOrder ?? 9999) - (right.sortOrder ?? 9999);
});
const tagParts = (tag) => {
  const parts = String(tag.name ?? "").split("·").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? { group: parts[0], child: parts.slice(1).join(" · ") } : { group: "", child: tag.name };
};
const groupedTags = (tags = []) => {
  const groups = new Map();
  const standalone = [];
  tags.forEach((tag) => {
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
    staticDataPromise = fetch("../../data/runtime-data.json")
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
const withActivityContent = (activity, data) => {
  if (!activity) return null;
  const content = activity.content ?? activity.translations?.["zh-CN"] ?? activity.translations?.en ?? {};
  const tags = (activity.tagIds ?? activityTags(activity).map((tag) => tag.id))
    .map((id) => data.tags.find((tag) => tag.id === id))
    .filter(Boolean);
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
    meetingLongitude: activity?.meetingLongitude
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
    customerId: body.customerId ?? CUSTOMER_ID,
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
      customerId: CUSTOMER_ID,
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
      customerId: CUSTOMER_ID,
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
    const comment = { id: `demo-blog-comment-${Date.now()}`, postId, customerId: CUSTOMER_ID, displayName: body.displayName || "Mia", content: body.content || "", createdAt: new Date().toISOString() };
    data.blogComments.unshift(comment);
    return comment;
  }
  if (method === "POST" && route === "/ai/ask") return staticAiAsk(data, parseBody(options));

  if (route === "/tags") return data.tags;
  if (route === "/guides") return sortGuidesForDisplay(data.guides.filter((guide) => guide.paused !== true)).map(guideWithActivityCovers);
  if (route === "/ai/questions") return data.aiQuestions ?? [];
  if (route === "/faqs") return staticLimit(publishedOnly(data.faqs ?? [], params), params);
  if (route === "/guide-page") return data.guidePage;
  if (route === "/home-entries") return staticLimit(publishedOnly(data.homeEntries, params).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), params);
  if (route === "/home-modules") return staticLimit(publishedOnly(data.homeModules, params).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), params);
  if (route === "/topic-pages") return staticLimit(publishedOnly(data.topicPages, params), params);
  if (/^\/topic-pages\/[^/]+$/.test(route)) {
    const slug = decodeURIComponent(route.split("/")[2]);
    const page = data.topicPages.find((item) => item.slug === slug || item.id === slug);
    if (!page) throw new Error("专题不存在");
    const activities = data.activities.map((activity) => withActivityContent(activity, data))
      .filter((activity) => (page.tagIds ?? []).every((tagId) => activityTags(activity).some((tag) => tag.id === tagId)))
      .map((activity) => ({ ...activity, name: activity.content.name, summary: activity.content.summary }));
    return { ...page, activities };
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
    return staticLimit(data.slots.filter((slot) => {
      const activity = slotActivity(slot, data);
      return slot.enabled !== false && slotIsFuture(slot) && activity?.schedulePaused !== true;
    }).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map((slot) => {
      const activity = slotActivity(slot, data);
      return {
        ...slot,
        activityId: activity?.id,
        activityName: activity?.content?.name ?? "活动",
        coverUrl: activityCover(activity),
        customerDisplayName: "匿**",
        bookedCount: slot.bookedCount ?? 0
      };
    }), params);
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
  return `
    <article class="review-card ${compact ? "detail-latest-review" : ""}">
      <div class="detail-review-head">
        <span class="review-avatar">${escapeHtml(review.displayName.slice(0, 1))}</span>
        <div><strong>${escapeHtml(review.displayName)}</strong><em>${"★".repeat(review.rating)}</em></div>
        <time>${review.createdAt.slice(0, 10)}</time>
      </div>
      <section class="review-body">${compact ? `<p>${escapeHtml(content)}</p>` : renderParagraphs(content)}</section>
      ${compact && content.length > 80 ? `<button type="button" class="detail-review-expand" data-expand-detail-review>展开</button>` : ""}
      ${images.length ? `<div class="review-images">${images.map((url, index) => `<button type="button" data-preview-review="${review.id}" data-preview-index="${index}"><img src="${escapeHtml(url)}" alt="评价照片" /></button>`).join("")}</div>` : ""}
      ${review.imageUrls.length > images.length ? `<button type="button" class="review-more-images" data-preview-review="${review.id}" data-preview-index="${images.length}">更多照片</button>` : ""}
      ${review.videoUrl ? `<video class="review-video" src="${escapeHtml(review.videoUrl)}" controls preload="metadata"></video>` : ""}
    </article>
  `;
}
function bindReviewActions() {
  document.querySelectorAll("[data-expand-detail-review]").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest(".detail-latest-review");
    const expanded = card.classList.toggle("expanded");
    button.textContent = expanded ? "收起" : "展开";
  }));
  document.querySelectorAll("[data-preview-review]").forEach((button) => button.addEventListener("click", () => {
    const review = state.reviews.find((item) => item.id === button.dataset.previewReview);
    openImagePreview(review?.imageUrls ?? [], Number(button.dataset.previewIndex));
  }));
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
const activityCover = (activity) => activity?.coverUrl || cover;
const activityImageUrl = (image) => image?.url || (image?.cosKey?.startsWith("http") || image?.cosKey?.startsWith("data:") ? image.cosKey : demoImageUrls[image?.cosKey]) || "";
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

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { $("#toast").hidden = true; }, 1800);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== `${name}-view`; });
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
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
const filteredLocalInfos = () => state.localInfos.filter((item) => !state.localInfoTag || (item.tags ?? []).includes(state.localInfoTag));
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

function renderLocalInfos() {
  const tags = localInfoTags();
  const groups = groupedLocalInfoTags();
  if (state.localInfoTag && !tags.includes(state.localInfoTag)) state.localInfoTag = "";
  $("#local-tag-filter").innerHTML = [
    `<button class="${state.localInfoTag ? "" : "active"}" data-local-tag="">全部</button>`,
    ...groups.map((group) => {
      const active = state.localInfoTag === group.name || localInfoTagParts(state.localInfoTag).group === group.name;
      return `
        <div class="local-tag-group">
          <div class="local-tag-main">
            <button class="${active ? "active" : ""}" data-local-main-tag="${escapeHtml(group.name)}">${escapeHtml(group.name)}</button>
          </div>
          ${active && group.children.length ? `<div class="local-tag-sub">${group.children.map((tag) => `<button class="${state.localInfoTag === tag ? "active" : ""}" data-local-tag="${escapeHtml(tag)}">${escapeHtml(localInfoTagParts(tag).child)}</button>`).join("")}</div>` : ""}
        </div>
      `;
    })
  ].join("");
  $("#local-tag-filter").querySelectorAll("[data-local-main-tag]").forEach((button) => button.addEventListener("click", () => {
    state.localInfoTag = state.localInfoTag === button.dataset.localMainTag ? "" : button.dataset.localMainTag;
    renderLocalInfos();
  }));
  $("#local-tag-filter").querySelectorAll("[data-local-tag]").forEach((button) => button.addEventListener("click", () => {
    state.localInfoTag = button.dataset.localTag;
    renderLocalInfos();
  }));
  const items = filteredLocalInfos();
  $("#local-info-list").innerHTML = items.map((item) => `
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
  `).join("") || `<div class="empty">暂时没有这个标签下的在地信息。</div>`;
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
}

function renderTopicPages() {
  $("#topic-page-count").textContent = `${state.topicPages.length} 个专题`;
  $("#topic-page-list").innerHTML = state.topicPages.map((page) => `
    <button class="topic-page-card" data-topic-page="${page.slug}" data-external-url="${escapeHtml(page.externalUrl)}">
      ${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />` : ""}
      <span>
        <strong>${escapeHtml(page.title)}</strong>
        <small>${escapeHtml(page.summary) || "打开专题查看更多活动"}</small>
      </span>
    </button>
  `).join("") || `<div class="empty topic-empty">专题内容正在整理中。</div>`;
  document.querySelectorAll("[data-topic-page]").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.externalUrl) return window.open(button.dataset.externalUrl, "_blank", "noopener,noreferrer");
    await openTopicPage(button.dataset.topicPage);
  }));
}

function renderBlogCard(post, dataAttribute = "data-blog-post") {
  const dateText = formatBlogDate(post.publishedAt);
  const tags = renderBlogTags(post.tags);
  return `
    <button class="blog-card" ${dataAttribute}="${escapeHtml(post.slug)}">
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

function bindBlogCards() {
  document.querySelectorAll("[data-blog-post]").forEach((button) => {
    button.addEventListener("click", () => openBlogPost(button.dataset.blogPost));
  });
}

function renderBlogPreview() {
  $("#blog-preview-list").innerHTML = state.blogPosts.slice(0, 4).map(renderBlogCard).join("") || `<div class="empty">生活记录正在整理中。</div>`;
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
      body: JSON.stringify({ question, customerId: CUSTOMER_ID })
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
  $("#blog-list").innerHTML = state.blogPosts.map(renderBlogCard).join("") || `<div class="empty">生活记录正在整理中。</div>`;
  bindBlogCards();
  showView("blog");
  scrollToPageTop();
}

async function openBlogPost(slug) {
  state.blogPost = await request(`/blog-posts/${slug}`);
  renderBlogDetail();
  showView("blog-detail");
  scrollToPageTop();
}

function renderBlogDetail() {
  const post = state.blogPost;
  const dateText = formatBlogDate(post.publishedAt);
  $("#blog-detail").innerHTML = `
    ${post.coverUrl ? `<img class="blog-detail-cover" src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.title)}" />` : ""}
    <section class="blog-detail-copy">
      <h1>${escapeHtml(post.title)}</h1>
      ${dateText ? `<time>${dateText}</time>` : ""}
      ${renderBlogTags(post.tags)}
      <div class="blog-content">${post.contentHtml}</div>
    </section>
    <section class="blog-comments">
      <h2>评论(${post.comments.length})</h2>
      <div class="blog-comment-list">
        ${post.comments.map((comment) => `
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
}

async function submitBlogComment(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  await request(`/blog-posts/${state.blogPost.id}/comments`, {
    method: "POST",
    body: JSON.stringify({
      customerId: CUSTOMER_ID,
      displayName: values.get("displayName"),
      content: values.get("content")
    })
  });
  toast("评论已发布");
  await openBlogPost(state.blogPost.id);
}

function renderHomeEntries() {
  $("#home-entry-list").innerHTML = state.homeEntries.map((entry) => `
    <button class="home-entry-card" data-home-entry="${entry.id}">
      ${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.title)}" />` : ""}
      <strong>${escapeHtml(entry.title)}</strong>
    </button>
  `).join("");
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
      ${modules.map(renderPageModule).join("") || `<div class="empty">这个专页还没有内容。</div>`}
    </section>
  `;
  bindHomepageModules();
  showView("topic");
}

async function loadActivities() {
  const query = state.selectedTags.length ? `?tagIds=${state.selectedTags.join(",")}` : "";
  state.activities = await request(`/activities${query}`);
  await loadUpcomingSlots();
  renderHomepageModules();
}

async function loadUpcomingSlots() {
  state.upcomingSlots = await request("/upcoming-departures?limit=20");
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

function moduleHeading(module, eyebrow = "DISCOVER") {
  const title = module.type === "UPCOMING" && module.title === "即将成行" ? "即将出发的旅行" : module.title;
  return `<section class="section-heading"><div><p>${eyebrow}</p><h2>${escapeHtml(title)}</h2>${module.subtitle ? `<span>${escapeHtml(module.subtitle)}</span>` : ""}</div></section>`;
}

function homeModuleStyle(module) {
  return {
    layout: module.style?.layout || "",
    cardStyle: module.style?.cardStyle || "PLAIN",
    radius: module.style?.radius ?? 6,
    gap: module.style?.gap ?? 8,
    padding: module.style?.padding ?? 11,
    textAlign: module.style?.textAlign || "LEFT",
    dividerStyle: module.style?.dividerStyle || "SPACE",
    height: module.style?.height ?? 24,
    backgroundColor: module.style?.backgroundColor || "#ffffff",
    collapseTitleStyle: module.style?.collapseTitleStyle || "SOFT_BLOCK"
  };
}

function homeModuleVars(module) {
  const style = homeModuleStyle(module);
  return `style="--module-radius:${style.radius}px;--module-gap:${style.gap}px;--module-padding:${style.padding}px;--module-background:${escapeHtml(style.backgroundColor)}"`;
}

function renderRichTextParagraphs(text = "") {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderPageModule(module) {
  const style = homeModuleStyle(module);
    if (module.type === "CUBE") return `<section class="home-entry-list layout-${style.layout || "TWO"} card-${style.cardStyle}" ${homeModuleVars(module)}>${state.homeEntries.slice(0, module.limit).map((entry) => `
      <button class="home-entry-card" data-home-entry="${entry.id}">${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.title)}" />` : ""}<strong>${escapeHtml(entry.title)}</strong></button>`).join("")}</section>`;
    if (module.type === "NAV") return `<nav class="home-text-nav layout-${style.layout || "FOUR"}" ${homeModuleVars(module)}>${(module.navItems ?? []).slice(0, module.limit).map((entry) => `
      <button data-nav-type="${entry.targetType}" data-nav-value="${escapeHtml(entry.targetValue)}"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.subtitle || "DISCOVER")}</small></button>`).join("")}</nav>`;
    if (module.type === "TOPICS") return `${moduleHeading(module, "DISCOVER MORE")}<section class="topic-page-list">${state.topicPages.slice(0, module.limit).map((page) => `
      <button class="topic-page-card" data-topic-page="${page.slug}" data-external-url="${escapeHtml(page.externalUrl)}">${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />` : ""}<span><strong>${escapeHtml(page.title)}</strong><small>${escapeHtml(page.summary) || "打开专题查看更多活动"}</small></span></button>`).join("")}</section>`;
    if (module.type === "BLOG") {
      const blogTag = module.blogTag ?? "";
      const posts = state.blogPosts
        .filter((post) => !blogTag || (post.tags ?? []).includes(blogTag))
        .slice(0, module.limit);
      return `<section class="home-blog-module">${moduleHeading(module, "DALI LIFE")}<section class="blog-preview-list layout-${style.layout || "GRID"}">${posts.map(renderBlogCard).join("") || `<div class="empty">生活记录正在整理中。</div>`}</section></section>`;
    }
    if (module.type === "ACTIVITIES") {
      const moduleTagIds = Array.isArray(module.tagIds) ? module.tagIds : [];
      const items = state.activities.filter((activity) =>
        activity.hasSchedule &&
        activity.schedulePaused !== true &&
        moduleTagIds.every((tagId) => activityTags(activity).some((tag) => tag.id === tagId))
      );
      return `<section class="home-activity-module">${moduleHeading(module, "EXPLORE")}<section class="tag-filter">${renderGroupedTagFilter({ selectedIds: state.selectedTags, expandedGroups: state.expandedTagGroups })}</section><section class="activity-list layout-${style.layout || "LIST"} card-${style.cardStyle}" ${homeModuleVars(module)}>${items.map((activity) => `
        <article class="activity-card" data-activity="${activity.id}"><img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" /><div><h3>${escapeHtml(activity.content.name)}</h3><p>${escapeHtml(activity.content.summary) || "查看活动详情与可预约时间。"}</p>${activityTags(activity).map((tag) => `<span>${escapeHtml(tag.name)}</span>`).join("")}</div></article>`).join("") || `<div class="empty">暂时没有符合这些标签的活动。</div>`}</section></section>`;
    }
    if (module.type === "GUIDES") return `${moduleHeading(module, "MEET THE GUIDES")}<section class="home-guide-list">${state.guides.slice(0, module.limit).map((guide) => `
      <button data-guide="${guide.id}">${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : ""}<strong>${escapeHtml(guide.name)}</strong></button>`).join("")}</section>`;
    if (module.type === "REVIEWS") return `${moduleHeading(module, "LATEST STORIES")}<section class="home-review-strip">${latestHomeReviews(20).map((review) => `
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
    if (module.type === "UPCOMING") return `${moduleHeading(module, "NEXT DEPARTURES")}<section class="upcoming-strip">${state.upcomingSlots.slice(0, 20).map((slot) => `
      <button data-upcoming-activity="${slot.activityId}">
        <img src="${slot.coverUrl || cover}" alt="${escapeHtml(slot.activityName)}" />
        <span class="upcoming-copy">
          <small>${shortDateOnly(slot.startsAt)}</small>
          <time>${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)} · ${slot.bookedCount} 人预订</time>
          <strong>${escapeHtml(slot.activityName)}</strong>
        </span>
      </button>`).join("") || `<div class="empty">近期活动正在准备中。</div>`}</section>`;
    if (module.type === "BANNER") {
      const images = (module.imageUrls?.length ? module.imageUrls : [module.imageUrl]).filter(Boolean);
      return `<section class="home-banners layout-${style.layout || "SINGLE"} card-${style.cardStyle}" ${homeModuleVars(module)}>${(images.length ? images : [""]).map((imageUrl) => `<a class="home-banner" href="${escapeHtml(module.linkUrl || "#")}" ${module.linkUrl ? `target="_blank" rel="noopener noreferrer"` : ""}>${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(module.title)}" />` : ""}<strong>${escapeHtml(module.title)}</strong></a>`).join("")}</section>`;
    }
    if (module.type === "COLLAPSE") return `<section class="home-collapse-module" style="padding:${style.padding}px;background:${escapeHtml(style.backgroundColor)}">
      <h2 class="collapse-title-${style.collapseTitleStyle}">${escapeHtml(module.title)}</h2>
      <div class="home-collapse-list">${(module.items ?? []).slice(0, module.limit).map((item, index) => `
        <article class="home-collapse-item">
          <button type="button" data-collapse-item="${module.id}-${index}" aria-expanded="false"><span>☏</span><strong>${escapeHtml(item.title)}</strong><em>⌄</em></button>
          <div class="home-collapse-body">${renderRichTextParagraphs(item.content)}</div>
        </article>`).join("") || `<p class="empty">暂时没有内容。</p>`}</div>
    </section>`;
    if (module.type === "DIVIDER") return `<div class="home-divider ${style.dividerStyle === "LINE" ? "is-line" : "is-space"}" style="height:${style.height}px"><span></span></div>`;
    return `<section class="home-text-module" style="padding:${style.padding}px;text-align:${style.textAlign === "CENTER" ? "center" : "left"};background:${escapeHtml(style.backgroundColor)}"><h2>${escapeHtml(module.title)}</h2><p>${escapeHtml(module.subtitle)}</p></section>`;
}

function renderHomepageModules() {
  $("#home-module-container").innerHTML = state.homeModules.map(renderPageModule).join("");
  bindHomepageModules();
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
  bindBlogCards();
  document.querySelectorAll("[data-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.activity)));
  document.querySelectorAll("[data-guide]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guide)));
  document.querySelectorAll("[data-review-activity]").forEach((card) => card.addEventListener("click", () => {
    if (card.dataset.reviewActivity) openActivity(card.dataset.reviewActivity);
  }));
  document.querySelectorAll("[data-expand-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = button.closest(".home-review-card");
    const expanded = card.classList.toggle("expanded");
    button.textContent = expanded ? "收起" : "展开";
  }));
  document.querySelectorAll("[data-home-preview-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const review = state.homeReviews.find((item) => item.id === button.dataset.homePreviewReview);
    openImagePreview(review?.imageUrls ?? [], Number(button.dataset.previewIndex));
  }));
  document.querySelectorAll("[data-collapse-item]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const item = button.closest(".home-collapse-item");
    const isOpen = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  }));
  syncReviewGalleryRatios();
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
  $("#activity-detail").innerHTML = `
    <section class="detail-copy detail-intro">
      <h1>${escapeHtml(state.activity.content.name)}</h1>
      <p>${escapeHtml(state.activity.content.summary) || "一段慢一点的自然体验。"}</p>
      <span>${activityTags(state.activity).map((tag) => escapeHtml(tag.name)).join(" / ")}</span>
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
      <section class="detail-description">
        <h3>体验内容</h3>
        ${state.activity.content.descriptionHtml?.trim() || renderParagraphs(state.activity.content.summary || "详情正在整理中。")}
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
    const value = event.currentTarget.dataset.copyLeaderWechat;
    try {
      await navigator.clipboard.writeText(value);
      toast("领队微信已复制");
    } catch {
      window.prompt("请复制领队微信", value);
    }
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
    const expanded = card.classList.toggle("expanded");
    const button = card.querySelector("[data-expand-guide-review]");
    if (!button) return;
    button.textContent = expanded ? "收起" : "展开";
  };
  document.querySelectorAll("[data-guide-blog-post]").forEach((button) => button.addEventListener("click", async () => {
    $("#guide-dialog").close();
    await openBlogPost(button.dataset.guideBlogPost);
  }));
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
    return `
    <article class="customer-order">
      <div><strong>${order.groupName}</strong><span>${statusText(order.status)}</span></div>
      <h3>${order.activityName}</h3>
      <p>${dateOnly(order.startsAt)} ${timeOnly(order.startsAt)}-${timeOnly(order.endsAt)}</p>
      <p>${escapeHtml(orderSpecText(order))} · ${money(order.amountCents)}</p>
      <p class="order-meeting-point"><strong>集合地点：</strong>${order.meetingPointName || "出发前通知"}${navigationUrl ? `<a class="navigation-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}</p>
      ${["PENDING_PAYMENT", "BOOKED"].includes(order.status) ? `<div class="customer-order-actions"><button class="danger" data-cancel-booking="${order.id}">取消预约</button></div>` : ""}
    </article>
  `;
  }).join("") || `<div class="empty">还没有预约记录。</div>`;
  document.querySelectorAll("[data-cancel-booking]").forEach((button) => button.addEventListener("click", () => openCancellation(button.dataset.cancelBooking)));
}

async function openCancellation(orderId) {
  try {
    const preview = await request(`/orders/${orderId}/cancellation-preview?customerId=${CUSTOMER_ID}`);
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
      const value = event.currentTarget.dataset.copyWechat;
      try {
        await navigator.clipboard.writeText(value);
        toast("领队微信已复制");
      } catch {
        window.prompt("请复制领队微信", value);
      }
    });
    $("#cancel-booking-form").reset();
    $("#cancel-booking-dialog").showModal();
  } catch (error) {
    toast(error.message);
  }
}

async function loadOrders() {
  state.orders = await request(`/orders?customerId=${CUSTOMER_ID}`);
  renderOrders();
}

async function boot() {
  try {
    [state.tags, state.topicPages, state.blogPosts, state.homeEntries, state.homeModules, state.guides, state.homeReviews] = await Promise.all([request("/tags"), request("/topic-pages?published=true"), request("/blog-posts?published=true"), request("/home-entries?published=true"), request("/home-modules?published=true"), request("/guides"), request("/reviews")]);
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
    const order = await request("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerId: CUSTOMER_ID,
        slotId: state.bookingSlot.id,
        lineItems,
        profile: { mobile: values.get("mobile"), nickname: values.get("nickname"), childInfo: values.get("childInfo") }
      })
    });
    await request(`/orders/${order.id}/confirm-payment`, { method: "PATCH", body: JSON.stringify({ paymentMethod: "WECHAT", wechatTransactionId: `demo-${Date.now()}` }) });
    form.closest("dialog").close();
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
      body: JSON.stringify({ customerId: CUSTOMER_ID, displayName: values.get("displayName"), rating: Number(values.get("rating")), content: values.get("content"), imageUrls: state.reviewImages, videoUrl: state.reviewVideo })
    });
    $("#review-dialog").close();
    toast("评价已发布");
    await openActivity(state.activity.id);
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
      body: JSON.stringify({ customerId: CUSTOMER_ID, note: new FormData(event.currentTarget).get("note") })
    });
    $("#cancel-booking-dialog").close();
    await loadOrders();
    toast("预约已取消，退款已提交");
  } catch (error) {
    toast(error.message);
  }
});

document.addEventListener("click", (event) => {
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
