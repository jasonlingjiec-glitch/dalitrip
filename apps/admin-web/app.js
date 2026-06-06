const API_BASE = "http://localhost:3000";
const state = { activities: [], groups: [], tags: [], guides: [], guidePage: { introductionHtml: "" }, guideCalendar: { dates: [], guides: [], availability: [] }, guideCalendarMode: "mark", topicPages: [], blogPosts: [], homeEntries: [], homeModules: [], homePreviewReviews: [], homePreviewSlots: [], orders: [], customers: [], reviews: [], adminAccounts: [], aiSettings: null, aiQuestions: [], faqs: [], editingFaqId: null, selectedTagIds: [], searchText: "", customerSearchText: "", currentActivityId: null, editingActivityId: null, editingGuideId: null, editingTopicPageId: null, editingBlogPostId: null, editingHomeEntryId: null, selectedHomeModuleId: null, editingRuleId: null, editingGroupId: null, editingAdminAccountId: null, cancellingOrderId: null, walletCustomerId: null, replyingReviewId: null, activeScheduleTab: "regular", currentView: "activities", descriptionDraft: "", activityGalleryDraft: [], activityGallerySelectedIds: new Set(), activityGalleryDragIndex: null, activityGalleryEditorOpen: false, guideDescriptionDraft: "", guidePhotoDraft: "", guideGalleryDraft: [], guideGallerySelectedIds: new Set(), guideGalleryDragIndex: null, guideGalleryEditorOpen: false, guideDragIndex: null, guideOrderDirty: false, topicPageIntroductionDraft: "", blogPostContentDraft: "", blogTagFilter: "", editorTarget: "activity", specialDialogSlots: [], specialDialogExistingSlots: [] };
const demoImageUrls = {
  "demo/forest-hike-cover.jpg": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=80",
  "demo/forest-ferns-1.jpg": "https://images.unsplash.com/photo-1530968033775-2c92736b131e?auto=format&fit=crop&w=500&q=80",
  "demo/forest-ferns-2.jpg": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=500&q=80",
  "demo/forest-stream.jpg": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=500&q=80",
  "demo/forest-moss.jpg": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=500&q=80",
  "demo/lake-kayak.jpg": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&q=80",
  "demo/pottery.jpg": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=500&q=80",
  "demo/tie-dye.jpg": "https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=500&q=80",
  "demo/wild-tea.jpg": "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=500&q=80",
  "demo/mushroom.jpg": "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=500&q=80",
  "demo/sup.jpg": "https://images.unsplash.com/photo-1526188717906-ab4a2f70b5d3?auto=format&fit=crop&w=500&q=80"
};
const ttyyMigrationPreview = [
  {
    id: "ttyy-ailao-hike",
    groupName: "寒寒的哀牢山",
    name: "哀牢山森林徒步（2日旅行）",
    category: "徒步",
    paymentType: "线上支付",
    priceCents: 169800,
    capacity: 6,
    advanceBookingHours: 12,
    meetingPointName: "集合地方：朴石烘焙",
    suitableAge: "请根据活动详情确认",
    summary: "从天天预约迁移的测试活动，后续可继续补充图片、详情、领队与多语言内容。",
    weekday: 6,
    startsAt: "09:00",
    endsAt: "18:00"
  },
  {
    id: "ttyy-baima-snow-mountain",
    groupName: "程昌的寻光舍",
    name: "白马雪山沿线（3日旅行）",
    category: "深度旅行",
    paymentType: "线上支付",
    priceCents: 328000,
    capacity: 6,
    advanceBookingHours: 24,
    meetingPointName: "集合地点：根据线路提前通知",
    suitableAge: "12 岁以上",
    summary: "从天天预约迁移的三日深度旅行活动，适合后续补充住宿、交通、海拔与行程说明。",
    weekday: 5,
    startsAt: "09:00",
    endsAt: "18:00"
  },
  {
    id: "ttyy-star-watch",
    groupName: "测试",
    name: "你的星座·流星",
    category: "观星",
    paymentType: "线上支付",
    priceCents: 39800,
    capacity: 30,
    advanceBookingHours: 12,
    meetingPointName: "集合地点：活动前通知",
    suitableAge: "8 岁以上",
    summary: "从天天预约迁移的夜间观星活动，可继续补充天气、月相和保暖提醒。",
    weekday: 6,
    startsAt: "19:00",
    endsAt: "22:00"
  },
  {
    id: "ttyy-time-capsule",
    groupName: "寒寒的哀牢山",
    name: "时间里的熟人｜移森部队 A2",
    category: "在地生活",
    paymentType: "线上支付",
    priceCents: 100,
    capacity: 6,
    advanceBookingHours: 4,
    meetingPointName: "集合地点：活动前通知",
    suitableAge: "成人友好",
    summary: "从天天预约迁移的在地生活体验，保留低价测试项用于检查支付和预约流程。",
    weekday: 3,
    startsAt: "14:00",
    endsAt: "16:30"
  },
  {
    id: "ttyy-handmade-room",
    groupName: "测试",
    name: "制作自己的树屋",
    category: "手作",
    paymentType: "线上支付",
    priceCents: 59800,
    capacity: 5,
    advanceBookingHours: 12,
    meetingPointName: "集合地点：工作室",
    suitableAge: "亲子 / 成人",
    summary: "从天天预约迁移的手作活动，后续可以补充材料、成品照片和适合年龄。",
    weekday: 7,
    startsAt: "10:00",
    endsAt: "12:30"
  },
  {
    id: "ttyy-shangrila-flower-sea",
    groupName: "程昌的寻光舍",
    name: "浪巴田吉左摄影旅行｜深入香格里拉秘境花海",
    category: "深度旅行",
    paymentType: "线上支付",
    priceCents: 298000,
    capacity: 6,
    advanceBookingHours: 24,
    meetingPointName: "集合地点：根据线路提前通知",
    suitableAge: "12 岁以上",
    summary: "从天天预约迁移的香格里拉摄影旅行，适合后续补充交通、住宿、海拔、花期和装备建议。",
    weekday: 6,
    startsAt: "09:00",
    endsAt: "18:00"
  },
  {
    id: "ttyy-erhai-third-eighth",
    groupName: "测试",
    name: "登山面朝洱海｜每月逢三、八日",
    category: "在地生活",
    paymentType: "线上支付",
    priceCents: 39800,
    capacity: 6,
    advanceBookingHours: 12,
    meetingPointName: "集合地点：根据路线提前通知",
    suitableAge: "8 岁以上",
    summary: "从天天预约迁移的固定日期登山活动，后续可用特殊排班补充每月逢三、八日的真实日期。",
    weekday: 3,
    startsAt: "14:30",
    endsAt: "17:00"
  },
  {
    id: "ttyy-cangshan-qingtuan",
    groupName: "寒寒的哀牢山",
    name: "在苍山脚下「做青团」",
    category: "在地生活",
    paymentType: "线上支付",
    priceCents: 26800,
    capacity: 6,
    advanceBookingHours: 8,
    meetingPointName: "集合地点：苍山脚下工作室",
    suitableAge: "4 岁以上",
    summary: "从天天预约迁移的在地节气手作体验，适合补充食材、流程和亲子注意事项。",
    weekday: 7,
    startsAt: "10:00",
    endsAt: "12:00"
  },
  {
    id: "ttyy-flower-wreath",
    groupName: "测试",
    name: "制作松枝果实花环",
    category: "手作",
    paymentType: "线上支付",
    priceCents: 32800,
    capacity: 5,
    advanceBookingHours: 12,
    meetingPointName: "集合地点：工作室",
    suitableAge: "6 岁以上",
    summary: "从天天预约迁移的植物花环手作活动，后续可补充材料、季节植物和成品照片。",
    weekday: 6,
    startsAt: "14:00",
    endsAt: "16:30"
  },
  {
    id: "ttyy-mulianhua-trip",
    groupName: "程昌的寻光舍",
    name: "木莲花山｜和燕子的旅行",
    category: "徒步",
    paymentType: "线上支付",
    priceCents: 59800,
    capacity: 6,
    advanceBookingHours: 12,
    meetingPointName: "集合地点：根据路线提前通知",
    suitableAge: "10 岁以上",
    summary: "从天天预约迁移的自然观察徒步活动，适合补充鸟类、植物和路线难度说明。",
    weekday: 6,
    startsAt: "09:30",
    endsAt: "16:30"
  }
];

const $ = (selector) => document.querySelector(selector);
let staticDataPromise;

const cloneStatic = (value) => JSON.parse(JSON.stringify(value));
const loadStaticData = async () => {
  if (!staticDataPromise) {
    staticDataPromise = fetch("../../data/runtime-data.json").then((response) => {
      if (!response.ok) throw new Error("静态数据读取失败");
      return response.json();
    });
  }
  return staticDataPromise;
};
const parseRequestBody = (options) => {
  if (!options.body) return {};
  try {
    return JSON.parse(options.body);
  } catch {
    return {};
  }
};
const staticLocalized = (translations) => translations?.["zh-CN"] ?? translations?.en ?? {};
const staticTag = (tag) => ({ ...tag, name: tag.translations?.["zh-CN"] ?? tag.code ?? tag.id });
const staticActivity = (activity, data) => ({
  ...activity,
  content: staticLocalized(activity.translations),
  groupName: data.groups.find((group) => group.id === activity.groupId)?.name ?? "活动组",
  tags: (activity.tagIds ?? []).map((tagId) => data.tags.find((tag) => tag.id === tagId)).filter(Boolean).map(staticTag),
  guides: (activity.guideIds ?? []).map((guideId) => data.guides.find((guide) => guide.id === guideId)).filter(Boolean),
  images: (activity.images ?? []).map((image) => ({ ...image, url: image.url ?? demoImageUrls[image.cosKey] ?? image.cosKey }))
});
const staticGuide = (guide, data) => ({
  ...guide,
  activities: data.activities
    .filter((activity) => (activity.guideIds ?? []).includes(guide.id))
    .map((activity) => ({ id: activity.id, name: staticLocalized(activity.translations).name, summary: staticLocalized(activity.translations).summary }))
});
const staticAccount = (account, data) => ({
  ...account,
  groups: (account.groupIds ?? []).map((groupId) => data.groups.find((group) => group.id === groupId)).filter(Boolean)
});
const staticCustomer = (customer, data) => ({
  ...customer,
  orderCount: data.orders.filter((order) => order.customerId === customer.id).length,
  totalPaidCents: data.orders.filter((order) => order.customerId === customer.id && ["BOOKED", "COMPLETED"].includes(order.status)).reduce((sum, order) => sum + order.amountCents, 0)
});
const staticOrder = (order, data) => {
  const activity = data.activities.find((item) => item.id === order.activityId);
  const slot = data.slots.find((item) => item.id === order.slotId);
  const customer = data.customers.find((item) => item.id === order.customerId);
  return {
    ...order,
    activityName: staticLocalized(activity?.translations).name ?? "活动",
    groupName: data.groups.find((group) => group.id === order.groupId)?.name ?? "活动组",
    customerNickname: customer?.profile?.nickname ?? "客人",
    customerMobile: customer?.profile?.mobile ?? "",
    startsAt: slot?.startsAt ?? order.createdAt,
    endsAt: slot?.endsAt ?? order.createdAt
  };
};
const staticReview = (review, data) => ({
  ...review,
  activityName: staticLocalized(data.activities.find((activity) => activity.id === review.activityId)?.translations).name ?? "活动"
});
const staticSlot = (slot, data) => {
  const activity = data.activities.find((item) => item.id === slot.activityId);
  return {
    ...slot,
    activityName: staticLocalized(activity?.translations).name ?? "活动",
    coverUrl: activity?.coverUrl ?? demoImageUrls[activity?.images?.[0]?.cosKey] ?? "",
    customerDisplayName: "匿**"
  };
};
const staticManagedGuideIds = (data, adminAccountId) => {
  const account = data.adminAccounts.find((item) => item.id === adminAccountId);
  const groupIds = account ? new Set(account.groupIds) : null;
  return new Set(data.activities
    .filter((activity) => !groupIds || groupIds.has(activity.groupId))
    .flatMap((activity) => activity.guideIds ?? [])
    .filter((guideId) => data.guides.some((guide) => guide.id === guideId)));
};
const staticCalendarDates = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const start = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return Array.from({ length: 30 }, (_, index) => new Date(start + index * 86400000).toISOString().slice(0, 10));
};
const staticGuideCalendar = (data, adminAccountId = "account-owner") => {
  const dates = staticCalendarDates();
  const managedGuideIds = staticManagedGuideIds(data, adminAccountId);
  return {
    dates,
    guides: data.guides.filter((guide) => managedGuideIds.has(guide.id)).map((guide) => staticGuide(guide, data)),
    availability: (data.guideAvailability ?? []).filter((item) => managedGuideIds.has(item.guideId) && dates.includes(item.date))
  };
};
const staticLimit = (items, params) => items.slice(0, Number(params.get("limit") || items.length));
const staticPublished = (items, params) => params.get("published") === "true" ? items.filter((item) => item.published !== false) : items;

async function staticRequest(path, options = {}) {
  const data = await loadStaticData();
  const url = new URL(path.replace(/^\/api/, ""), "https://dalitrip.local");
  const route = url.pathname;
  const params = url.searchParams;
  const method = (options.method || "GET").toUpperCase();
  const body = parseRequestBody(options);

  if (route === "/groups") return cloneStatic(data.groups);
  if (route === "/tags") return data.tags.map(staticTag);
  if (route === "/guides") return data.guides.map((guide) => staticGuide(guide, data));
  if (route === "/guide-page") return cloneStatic(data.guidePage);
  if (route === "/topic-pages") return cloneStatic(data.topicPages);
  if (route === "/blog-posts") return cloneStatic(data.blogPosts);
  if (route === "/home-entries") return staticLimit(staticPublished(data.homeEntries, params).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), params);
  if (route === "/home-modules") return staticLimit(staticPublished(data.homeModules, params).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), params);
  if (route === "/reviews") return data.reviews.map((review) => staticReview(review, data));
  if (route === "/upcoming-departures") return staticLimit(data.slots.filter((slot) => slot.enabled !== false).map((slot) => staticSlot(slot, data)), params);
  if (route === "/activities") return data.activities.map((activity) => staticActivity(activity, data));
  if (/^\/activities\/[^/]+$/.test(route)) {
    const activity = data.activities.find((item) => item.id === route.split("/")[2]);
    if (!activity) throw new Error("活动不存在");
    return staticActivity(activity, data);
  }
  if (/^\/activities\/[^/]+\/schedule-rules$/.test(route)) return data.scheduleRules.filter((rule) => rule.activityId === route.split("/")[2]);
  if (/^\/activities\/[^/]+\/slots$/.test(route)) return data.slots.filter((slot) => slot.activityId === route.split("/")[2]);
  if (route === "/orders") return data.orders.map((order) => staticOrder(order, data));
  if (/^\/orders\/[^/]+$/.test(route)) return staticOrder(data.orders.find((order) => order.id === route.split("/")[2]) ?? data.orders[0], data);
  if (route === "/customers") return data.customers.map((customer) => staticCustomer(customer, data));
  if (route === "/admin-accounts") return data.adminAccounts.map((account) => staticAccount(account, data));
  if (route === "/ai/settings") return cloneStatic(data.aiSettings);
  if (route === "/ai/questions") return cloneStatic(data.aiQuestions ?? []);
  if (route === "/faqs") return cloneStatic(data.faqs ?? []);
  if (method === "GET" && route === "/guide-calendar") return staticGuideCalendar(data, params.get("adminAccountId") ?? "account-owner");
  if (method === "PATCH" && route === "/guide-calendar") {
    data.guideAvailability = (data.guideAvailability ?? []).filter((item) => !(item.guideId === body.guideId && item.date === body.date));
    if (body.status !== "FREE") data.guideAvailability.push({ id: `demo-guide-${Date.now()}`, guideId: body.guideId, date: body.date, status: body.status, updatedBy: body.adminAccountId ?? "account-owner", updatedAt: new Date().toISOString() });
    return staticGuideCalendar(data, body.adminAccountId ?? "account-owner");
  }
  if (method === "PATCH" && route === "/guides/reorder") {
    data.guides.forEach((guide) => { guide.sortOrder = body.ids?.indexOf(guide.id) + 1 || guide.sortOrder || 999; });
    return data.guides.map((guide) => staticGuide(guide, data));
  }
  if (["POST", "PATCH", "DELETE"].includes(method)) return { ok: true, demo: true };
  throw new Error("静态后台 demo 暂不支持这个操作");
}

const request = async (path, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
      ...options
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message ?? "请求失败");
    return body.data;
  } catch (error) {
    console.info("使用静态后台 demo 数据", path, error.message);
    return staticRequest(path, options);
  }
};
const yuan = (cents) => `¥ ${(cents / 100).toFixed(2)}`;
const dateTime = (value) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const scheduleRange = (startsAt, endsAt) => `${startsAt.slice(0, 10)} ${startsAt.slice(11, 16)} - ${endsAt.slice(11, 16)}`;
const toast = (message) => {
  const node = $("#toast");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.hidden = true; }, 2600);
};

async function loadBaseData() {
  [state.groups, state.tags, state.guides, state.guidePage, state.topicPages, state.blogPosts, state.homeEntries, state.homeModules, state.homePreviewReviews] = await Promise.all([request("/api/groups"), request("/api/tags"), request("/api/guides"), request("/api/guide-page"), request("/api/topic-pages"), request("/api/blog-posts"), request("/api/home-entries"), request("/api/home-modules"), request("/api/reviews")]);
  renderTagFilters();
  renderDialogOptions();
  renderOrderFilterOptions();
  await loadActivities();
  if (state.currentView === "pages") renderTopicPages();
  if (state.currentView === "blog") renderBlogPosts();
}

async function loadActivities() {
  const query = state.selectedTagIds.length ? `?tagIds=${state.selectedTagIds.join(",")}` : "";
  state.activities = await request(`/api/activities${query}`);
  await loadHomePreviewSlots();
  $("#activity-count").textContent = `${state.activities.length} 个活动`;
  renderActivityList();
  renderOrderFilterOptions();
  if (state.currentActivityId && state.activities.some(({ id }) => id === state.currentActivityId)) {
    await selectActivity(state.currentActivityId);
  }
  if (state.currentView === "pages") renderHomeModules();
}

async function loadHomePreviewSlots() {
  state.homePreviewSlots = await request("/api/upcoming-departures?limit=30");
}

function renderTagFilters() {
  $("#tag-filters").innerHTML = state.tags.map((tag) => `
    <button class="tag-filter ${state.selectedTagIds.includes(tag.id) ? "selected" : ""}" data-tag-id="${tag.id}">
      ${tag.name}
    </button>
  `).join("");
  document.querySelectorAll("[data-tag-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const { tagId } = button.dataset;
      state.selectedTagIds = state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId];
      renderTagFilters();
      await loadActivities();
    });
  });
}

function renderDialogOptions() {
  $("#activity-form select[name=groupId]").innerHTML = state.groups.map((group) => `<option value="${group.id}">${group.name}</option>`).join("");
  $("#dialog-tags").innerHTML = state.tags.map((tag) => `
    <label class="checkbox-tag"><input type="checkbox" name="tagIds" value="${tag.id}" />${tag.name}</label>
  `).join("");
  $("#dialog-guides").innerHTML = state.guides.map((guide) => `
    <label class="checkbox-tag"><input type="checkbox" name="guideIds" value="${guide.id}" />${escapeHtml(guide.name)}</label>
  `).join("") || `<p class="no-rules">请先在领队库新增档案。</p>`;
  $("#topic-page-tags").innerHTML = state.tags.map((tag) => `
    <label class="checkbox-tag"><input type="checkbox" name="tagIds" value="${tag.id}" />${tag.name}</label>
  `).join("");
}

function renderTagManager() {
  $("#tag-manager-list").innerHTML = state.tags.map((tag) => `
    <span class="managed-tag">
      ${tag.name}
      <button type="button" data-delete-tag="${tag.id}" title="删除标签">×</button>
    </span>
  `).join("")
    || `<p class="no-rules">暂时没有标签。</p>`;
  document.querySelectorAll("[data-delete-tag]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("确定删除这个标签吗？")) return;
      try {
        await request(`/api/tags/${button.dataset.deleteTag}`, { method: "DELETE" });
        state.tags = await request("/api/tags");
        state.selectedTagIds = state.selectedTagIds.filter((id) => id !== button.dataset.deleteTag);
        renderTagManager();
        renderTagFilters();
        renderDialogOptions();
        await loadActivities();
        toast("标签已删除");
      } catch (error) { toast(error.message); }
    });
  });
}

function tagCode(name) {
  return `tag-${Date.now()}-${[...name].map((character) => character.codePointAt(0).toString(36)).join("").slice(0, 18)}`;
}

function renderActivityList() {
  const searchText = state.searchText.trim().toLocaleLowerCase();
  const visibleActivities = searchText
    ? state.activities.filter((activity) => activity.content.name.toLocaleLowerCase().includes(searchText))
    : state.activities;
  const sortedActivities = [...visibleActivities].sort((left, right) => {
    const leftInactive = left.schedulePaused || !left.hasSchedule;
    const rightInactive = right.schedulePaused || !right.hasSchedule;
    if (leftInactive !== rightInactive) return leftInactive ? 1 : -1;
    if (left.schedulePaused !== right.schedulePaused) return left.schedulePaused ? 1 : -1;
    if (!left.hasSchedule !== !right.hasSchedule) return !left.hasSchedule ? 1 : -1;
    return left.content.name.localeCompare(right.content.name, "zh-CN");
  });
  $("#activity-count").textContent = searchText
    ? `${visibleActivities.length} / ${state.activities.length} 个活动`
    : `${state.activities.length} 个活动`;
  $("#activity-list").innerHTML = sortedActivities.map((activity) => `
    <article class="activity-card ${activity.id === state.currentActivityId ? "selected" : ""} ${activity.schedulePaused || !activity.hasSchedule ? "inactive" : ""}" data-activity-id="${activity.id}" tabindex="0">
      <div class="activity-card-top">
        <h3>${activity.content.name}</h3>
        <div class="activity-card-actions">
          <button class="activity-card-action" data-edit-activity="${activity.id}" type="button">编辑</button>
          <button class="activity-card-action" data-pause-activity="${activity.id}" type="button">${activity.schedulePaused ? "恢复" : "暂停"}</button>
          <button class="activity-card-delete" data-delete-activity="${activity.id}" type="button">删除</button>
        </div>
      </div>
      <p>${groupName(activity.groupId)} · 提前 ${activity.advanceBookingHours} 小时预约</p>
      ${activity.schedulePaused ? `<span class="activity-state paused">暂停排班</span>` : !activity.hasSchedule ? `<span class="activity-state no-schedule">暂无排班</span>` : ""}
      <div class="card-tags">${activity.tags.map((tag) => `<span class="small-tag">${tag.name}</span>`).join("")}</div>
    </article>
  `).join("") || `<div class="empty-state"><p>${searchText ? "没有找到名称匹配的活动。" : "没有符合当前标签的活动。"}</p></div>`;
  document.querySelectorAll("[data-activity-id]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".activity-card-actions")) return;
      selectActivity(card.dataset.activityId);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest(".activity-card-actions")) return;
      event.preventDefault();
      selectActivity(card.dataset.activityId);
    });
  });
  document.querySelectorAll("[data-edit-activity]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const activity = state.activities.find((item) => item.id === button.dataset.editActivity);
      if (activity) openActivityDialog(activity);
    });
  });
  document.querySelectorAll("[data-pause-activity]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const activity = state.activities.find((item) => item.id === button.dataset.pauseActivity);
      if (activity) toggleActivitySchedulePause(activity);
    });
  });
  document.querySelectorAll("[data-delete-activity]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const activity = state.activities.find((item) => item.id === button.dataset.deleteActivity);
      if (activity) deleteActivityById(activity.id, activity.content.name);
    });
  });
}

async function toggleActivitySchedulePause(activity) {
  await request(`/api/activities/${activity.id}/schedule-pause`, {
    method: "PATCH",
    body: JSON.stringify({ paused: !activity.schedulePaused })
  });
  toast(activity.schedulePaused ? "排班已恢复" : "排班已暂停，原设定已保留");
  await loadActivities();
}

async function deleteActivityById(id, name) {
  if (!confirm(`确定删除「${name}」吗？没有订单的活动会连同排班和评价一起删除。`)) return;
  try {
    await request(`/api/activities/${id}`, { method: "DELETE" });
    toast("活动已删除");
    if (state.currentActivityId === id) {
      state.currentActivityId = null;
      $("#detail-panel").innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><h2>活动已删除</h2><p>请选择其他活动，或新建一个活动。</p></div>`;
    }
    await loadActivities();
  } catch (error) {
    toast(error.message);
  }
}

$("#activity-search").addEventListener("input", (event) => {
  state.searchText = event.currentTarget.value;
  renderActivityList();
});
document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});
$("#order-filters input[name=search]").addEventListener("input", renderOrders);
$("#order-filters").addEventListener("change", loadOrders);
$("#reset-order-filters").addEventListener("click", async () => {
  $("#order-filters").reset();
  await loadOrders();
});
$("#export-orders").addEventListener("click", exportOrders);
$("#customer-search").addEventListener("input", (event) => {
  state.customerSearchText = event.currentTarget.value;
  renderCustomers();
});

function renderOrderFilterOptions() {
  $("#order-filters select[name=groupId]").innerHTML = `<option value="">全部组</option>${state.groups.map((group) => `<option value="${group.id}">${group.name}</option>`).join("")}`;
  $("#order-filters select[name=activityId]").innerHTML = `<option value="">全部活动</option>${state.activities.map((activity) => `<option value="${activity.id}">${activity.content.name}</option>`).join("")}`;
}

function orderStatusLabel(status) {
  return {
    PENDING_PAYMENT: "待付款",
    BOOKED: "已预约",
    REFUNDED: "已退款",
    CANCELLED: "已取消",
    COMPLETED: "已完成"
  }[status] ?? status;
}

function paymentMethodLabel(method) {
  return { WECHAT: "微信支付", WALLET: "钱包余额", COMBINED: "钱包 + 微信" }[method] ?? "尚未支付";
}

async function loadOrders() {
  const values = new FormData($("#order-filters"));
  const params = new URLSearchParams();
  ["status", "groupId", "activityId", "activityDateFrom", "activityDateTo", "paymentMethod"].forEach((name) => {
    if (values.get(name)) params.set(name, values.get(name));
  });
  state.orders = await request(`/api/orders${params.size ? `?${params}` : ""}`);
  renderOrders();
}

function renderOrders() {
  const visibleOrders = getVisibleOrders();
  $("#order-count").textContent = `${visibleOrders.length} 个订单`;
  $("#order-list").innerHTML = visibleOrders.map((order) => `
    <article class="order-card">
      <div class="order-card-main">
        <div class="order-card-heading">
          <div>
            <span class="status-badge status-${order.status.toLocaleLowerCase()}">${orderStatusLabel(order.status)}</span>
            <h3>${escapeHtml(order.activityName)}</h3>
          </div>
          <strong>${yuan(order.amountCents)}</strong>
        </div>
        <div class="order-meta">
          <span>${escapeHtml(order.groupName)}</span>
          <span>${scheduleRange(order.startsAt, order.endsAt)}</span>
          <span>${escapeHtml(order.specification)} × ${order.quantity}</span>
        </div>
        <div class="order-customer">
          <strong>${escapeHtml(order.customerNickname)}</strong>
          <span>${escapeHtml(order.customerMobile)}</span>
          <span>${paymentMethodLabel(order.paymentMethod)}</span>
        </div>
        <p class="order-number">${escapeHtml(order.orderNo)}</p>
      </div>
      <div class="order-actions">
        ${["PENDING_PAYMENT", "BOOKED"].includes(order.status) ? `<button class="danger-button" data-cancel-order="${order.id}">取消订单</button>` : ""}
      </div>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><h2>没有符合条件的订单</h2><p>可以调整筛选条件再看看。</p></div>`;
  document.querySelectorAll("[data-cancel-order]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cancellingOrderId = button.dataset.cancelOrder;
      $("#cancel-order-form").reset();
      $("#cancel-order-dialog").showModal();
    });
  });
}

function getVisibleOrders() {
  const search = new FormData($("#order-filters")).get("search").trim().toLocaleLowerCase();
  return state.orders.filter((order) =>
    !search || [order.orderNo, order.customerNickname, order.customerMobile, order.activityName]
      .some((value) => String(value ?? "").toLocaleLowerCase().includes(search))
  );
}

function exportOrders() {
  const orders = getVisibleOrders();
  if (!orders.length) return toast("当前筛选条件下没有可导出的订单");
  const headers = ["订单号", "订单状态", "活动组", "活动名称", "活动日期", "开始时间", "结束时间", "顾客昵称", "顾客手机号", "规格", "数量", "单价（元）", "订单金额（元）", "支付方式", "创建时间", "支付时间", "完成时间", "取消时间", "退款金额（元）", "取消备注", "集合地点"];
  const rows = orders.map((order) => [
    order.orderNo, orderStatusLabel(order.status), order.groupName, order.activityName,
    order.startsAt.slice(0, 10), order.startsAt.slice(11, 16), order.endsAt.slice(11, 16),
    order.customerNickname, order.customerMobile, order.specification, order.quantity,
    centsAsYuan(order.unitPriceCents), centsAsYuan(order.amountCents), paymentMethodLabel(order.paymentMethod),
    readableExportDate(order.createdAt), readableExportDate(order.paidAt), readableExportDate(order.completedAt),
    readableExportDate(order.cancelledAt), centsAsYuan(order.refundAmountCents), order.cancellationNote ?? "",
    order.meetingPointName ?? ""
  ]);
  const url = URL.createObjectURL(new Blob([`\ufeff${buildSpreadsheetXml(headers, rows)}`], { type: "application/vnd.ms-excel;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `订单导出_${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
  toast(`已导出 ${orders.length} 个订单`);
}

function buildSpreadsheetXml(headers, rows) {
  const cell = (value, style = "") => `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value ?? "")}</Data></Cell>`;
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#D9EEF7" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="订单"><Table><Row>${headers.map((header) => cell(header, "Header")).join("")}</Row>${rows.map((row) => `<Row>${row.map((value) => cell(value)).join("")}</Row>`).join("")}</Table></Worksheet></Workbook>`;
}

const centsAsYuan = (cents) => Number(((cents ?? 0) / 100).toFixed(2));
const readableExportDate = (value) => value ? value.replace("T", " ").slice(0, 19) : "";
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

async function loadAiPage() {
  const [settings, questions, faqs] = await Promise.all([
    request("/api/ai/settings"),
    request("/api/ai/questions"),
    request("/api/faqs")
  ]);
  state.aiSettings = settings;
  state.aiQuestions = questions;
  state.faqs = faqs;
  renderAiPage();
}

function renderAiPage() {
  renderAiSettings();
  renderAiQuestions();
  renderFaqs();
  if (!state.editingFaqId) resetFaqForm();
}

function renderAiSettings() {
  if (!state.aiSettings || !$("#ai-settings-form")) return;
  const form = $("#ai-settings-form");
  form.elements.model.value = state.aiSettings.model ?? "deepseek-chat";
  form.elements.monthlyBudgetYuan.value = Math.round((state.aiSettings.monthlyBudgetCents ?? 0) / 100);
  form.elements.enabled.checked = state.aiSettings.enabled !== false;
}

function renderAiQuestions() {
  const list = $("#ai-question-list");
  if (!list) return;
  list.innerHTML = state.aiQuestions.length ? state.aiQuestions.map((question) => `
    <article class="ai-question-card">
      <header><strong>${escapeHtml(question.question)}</strong><time>${readableExportDate(question.createdAt).slice(0, 16)}</time></header>
      <p>${escapeHtml(question.answer)}</p>
      <div class="ai-recommendation-mini">${(question.recommendations ?? []).map((item) => `<span>${escapeHtml(item.name)}</span>`).join("")}</div>
      <button class="secondary-button" data-question-to-faq="${question.id}" ${question.faqId ? "disabled" : ""}>${question.faqId ? "已生成 FAQ" : "生成 FAQ"}</button>
    </article>
  `).join("") : `<div class="empty-state compact-empty"><h2>还没有提问记录</h2><p>客人在首页问过之后，会出现在这里。</p></div>`;
  document.querySelectorAll("[data-question-to-faq]").forEach((button) => button.addEventListener("click", async () => {
    await request(`/api/ai/questions/${button.dataset.questionToFaq}/faq`, { method: "POST", body: "{}" });
    toast("已生成 FAQ");
    await loadAiPage();
  }));
}

function resetFaqForm(faq = null) {
  state.editingFaqId = faq?.id ?? null;
  const form = $("#faq-form");
  if (!form) return;
  form.elements.id.value = faq?.id ?? "";
  form.elements.question.value = faq?.question ?? "";
  form.elements.answer.value = faq?.answer ?? "";
  form.elements.sortOrder.value = faq?.sortOrder ?? "";
  form.elements.published.checked = faq?.published !== false;
}

function renderFaqs() {
  const list = $("#faq-list");
  if (!list) return;
  list.innerHTML = state.faqs.length ? state.faqs.map((faq) => `
    <article class="faq-card">
      <header><strong>${escapeHtml(faq.question)}</strong><span>${faq.published === false ? "隐藏" : "显示"}</span></header>
      <p>${escapeHtml(faq.answer)}</p>
      <div class="faq-card-actions">
        <button class="secondary-button" data-edit-faq="${faq.id}">编辑</button>
        <button class="danger-button" data-delete-faq="${faq.id}">删除</button>
      </div>
    </article>
  `).join("") : `<div class="empty-state compact-empty"><h2>还没有 FAQ</h2><p>可以手动添加，或从客人提问生成。</p></div>`;
  document.querySelectorAll("[data-edit-faq]").forEach((button) => button.addEventListener("click", () => resetFaqForm(state.faqs.find((faq) => faq.id === button.dataset.editFaq))));
  document.querySelectorAll("[data-delete-faq]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("确定删除这个 FAQ 吗？")) return;
    await request(`/api/faqs/${button.dataset.deleteFaq}`, { method: "DELETE" });
    toast("FAQ 已删除");
    await loadAiPage();
  }));
}

const adminAccountId = () => "account-owner";
const guideSlotLabels = { FREE: "空", MORNING: "上午", AFTERNOON: "下午", FULL: "全天" };
const guideSlotStatus = (guideId, date) => state.guideCalendar.availability.find((item) => item.guideId === guideId && item.date === date)?.status ?? "FREE";
const guideSlotOccupied = (status, slot) => status === "FULL" || status === slot;
const guideNextHalfStatus = (status, slot) => {
  const morning = slot === "MORNING" ? !guideSlotOccupied(status, "MORNING") : guideSlotOccupied(status, "MORNING");
  const afternoon = slot === "AFTERNOON" ? !guideSlotOccupied(status, "AFTERNOON") : guideSlotOccupied(status, "AFTERNOON");
  if (morning && afternoon) return "FULL";
  if (morning) return "MORNING";
  if (afternoon) return "AFTERNOON";
  return "FREE";
};
const guideDateLabel = (date) => {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
};
const guideWeekLabel = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return "日一二三四五六"[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
};

async function loadGuideCalendar() {
  state.guideCalendar = await request(`/api/guide-calendar?adminAccountId=${adminAccountId()}`);
  renderGuideCalendar();
}

function renderGuideCalendar() {
  document.querySelectorAll("[data-guide-calendar-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.guideCalendarMode === state.guideCalendarMode);
  });
  if (state.guideCalendarMode === "free") return renderGuideFreeCalendar();
  return renderGuideMarkCalendar();
}

function renderGuideMarkCalendar() {
  const container = $("#guide-calendar-content");
  const { dates, guides } = state.guideCalendar;
  container.innerHTML = guides.length ? `
    <div class="guide-calendar-help">每个日期分上午、下午两格，点击对应半天即可标记或取消占用。</div>
    <section class="guide-calendar-mark-list">
      ${guides.map((guide) => `
        <article class="guide-calendar-card">
          <header>
            ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<span>${escapeHtml(guide.name.slice(0, 1))}</span>`}
            <div>
              <h2>${escapeHtml(guide.name)}</h2>
              <p>${guide.activities.length} 条相关路线</p>
            </div>
          </header>
          <div class="guide-calendar-day-grid">
            ${dates.map((date) => {
              const status = guideSlotStatus(guide.id, date);
              return `<article class="guide-day-cell status-${status.toLowerCase()}">
                <header><strong>${guideDateLabel(date)}</strong><small>周${guideWeekLabel(date)}</small></header>
                <button class="guide-half ${guideSlotOccupied(status, "MORNING") ? "occupied" : ""}" type="button" data-guide-availability="${guide.id}" data-guide-date="${date}" data-guide-status="${status}" data-guide-slot="MORNING">
                  <b>上午</b><span>${guideSlotOccupied(status, "MORNING") ? "🔒 占用" : "空"}</span>
                </button>
                <button class="guide-half ${guideSlotOccupied(status, "AFTERNOON") ? "occupied" : ""}" type="button" data-guide-availability="${guide.id}" data-guide-date="${date}" data-guide-status="${status}" data-guide-slot="AFTERNOON">
                  <b>下午</b><span>${guideSlotOccupied(status, "AFTERNOON") ? "🔒 占用" : "空"}</span>
                </button>
              </article>`;
            }).join("")}
          </div>
        </article>
      `).join("")}
    </section>
  ` : `<div class="empty-state compact-empty"><h2>暂无可管理领队</h2><p>先在活动里关联领队，这里会自动出现。</p></div>`;
  document.querySelectorAll("[data-guide-availability]").forEach((button) => button.addEventListener("click", () => updateGuideAvailability(button)));
}

function renderGuideFreeCalendar() {
  const container = $("#guide-calendar-content");
  const { dates, guides } = state.guideCalendar;
  container.innerHTML = guides.length ? `
    <section class="guide-free-list">
      ${dates.map((date) => {
        const allDay = guides.filter((guide) => guideSlotStatus(guide.id, date) === "FREE");
        const morning = guides.filter((guide) => !["MORNING", "FULL"].includes(guideSlotStatus(guide.id, date)));
        const afternoon = guides.filter((guide) => !["AFTERNOON", "FULL"].includes(guideSlotStatus(guide.id, date)));
        const names = (items) => items.map((guide) => `<span>${escapeHtml(guide.name)}</span>`).join("") || `<em>暂无</em>`;
        return `<article class="guide-free-day">
          <header><strong>${guideDateLabel(date)}</strong><small>周${guideWeekLabel(date)}</small></header>
          <div><b>全天空</b>${names(allDay)}</div>
          <div><b>上午空</b>${names(morning)}</div>
          <div><b>下午空</b>${names(afternoon)}</div>
        </article>`;
      }).join("")}
    </section>
  ` : `<div class="empty-state compact-empty"><h2>暂无可管理领队</h2><p>先在活动里关联领队，这里会自动出现。</p></div>`;
}

async function updateGuideAvailability(button) {
  const status = guideNextHalfStatus(button.dataset.guideStatus ?? "FREE", button.dataset.guideSlot);
  button.disabled = true;
  try {
    state.guideCalendar = await request("/api/guide-calendar", {
      method: "PATCH",
      body: JSON.stringify({
        adminAccountId: adminAccountId(),
        guideId: button.dataset.guideAvailability,
        date: button.dataset.guideDate,
        status
      })
    });
    renderGuideCalendar();
  } catch (error) {
    toast(error.message);
    button.disabled = false;
  }
}

async function showView(view) {
  if (!["activities", "orders", "reviews", "guides", "guide-calendar", "customers", "pages", "blog", "ai", "settings"].includes(view)) return toast("这个模块会在后续版本接入");
  state.currentView = view;
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $("#activity-topbar").hidden = view !== "activities";
  $("#activity-workspace").hidden = view !== "activities";
  $("#orders-page").hidden = view !== "orders";
  $("#reviews-page").hidden = view !== "reviews";
  $("#guides-page").hidden = view !== "guides";
  $("#guide-calendar-page").hidden = view !== "guide-calendar";
  $("#customers-page").hidden = view !== "customers";
  $("#pages-page").hidden = view !== "pages";
  $("#blog-page").hidden = view !== "blog";
  $("#ai-page").hidden = view !== "ai";
  $("#settings-page").hidden = view !== "settings";
  if (view === "orders") {
    renderOrderFilterOptions();
    await loadOrders();
  }
  if (view === "customers") await loadCustomers();
  if (view === "reviews") await loadReviews();
  if (view === "guides") renderGuides();
  if (view === "guide-calendar") await loadGuideCalendar();
  if (view === "pages") renderTopicPages();
  if (view === "blog") renderBlogPosts();
  if (view === "ai") await loadAiPage();
  if (view === "settings") await loadSettings();
}

function renderTopicPages() {
  renderHomeModules();
  renderHomeEntries();
  $("#topic-page-list").innerHTML = state.topicPages.map((page) => `
    <article class="topic-page-card">
      ${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />` : `<div class="topic-page-placeholder">入口图</div>`}
      <div>
        <span class="status-badge ${page.published ? "status-booked" : "status-cancelled"}">${page.published ? "首页展示" : "已隐藏"}</span>
        <h3>${escapeHtml(page.title)}</h3>
        <p>${escapeHtml(page.summary) || "暂未填写入口简介"}</p>
        <small>${page.tags.map((tag) => escapeHtml(tag.name)).join(" + ") || "全部活动"} · ${page.activities.length} 个活动</small>
      </div>
      <button class="secondary-button" data-edit-topic-page="${page.id}">编辑</button>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><h2>还没有专题页</h2><p>可以先新增一个徒步或亲子专题。</p></div>`;
  document.querySelectorAll("[data-edit-topic-page]").forEach((button) => button.addEventListener("click", () => openTopicPageDialog(state.topicPages.find((page) => page.id === button.dataset.editTopicPage))));
}

const stripHtml = (html) => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const blogSummary = (post) => post.summary?.trim() || stripHtml(post.contentHtml).slice(0, 150);
const blogTags = (post) => Array.isArray(post.tags) ? post.tags : [];
const blogTagNames = () => [...new Set(state.blogPosts.flatMap((post) => blogTags(post)))].sort((a, b) => a.localeCompare(b, "zh-CN"));
const filteredBlogPosts = () => state.blogTagFilter ? state.blogPosts.filter((post) => blogTags(post).includes(state.blogTagFilter)) : state.blogPosts;
const renderBlogTags = (post) => {
  const tags = blogTags(post);
  if (!tags.length) return "";
  return `<div class="blog-tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
};
const toDatetimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const bodyToHtml = (value) => {
  const text = String(value ?? "").trim();
  if (text.includes("<")) return text;
  return text.split(/\n+/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`).join("");
};

function renderBlogPosts() {
  const tagNames = blogTagNames();
  if (state.blogTagFilter && !tagNames.includes(state.blogTagFilter)) state.blogTagFilter = "";
  const posts = filteredBlogPosts();
  const tagFilter = $("#blog-tag-filters");
  tagFilter.innerHTML = [
    `<button class="${state.blogTagFilter ? "" : "active"}" data-blog-tag-filter="">全部</button>`,
    ...tagNames.map((tag) => `<button class="${state.blogTagFilter === tag ? "active" : ""}" data-blog-tag-filter="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`)
  ].join("");
  tagFilter.querySelectorAll("[data-blog-tag-filter]").forEach((button) => button.addEventListener("click", () => {
    state.blogTagFilter = button.dataset.blogTagFilter;
    renderBlogPosts();
  }));
  $("#blog-count").textContent = state.blogTagFilter ? `${posts.length} / ${state.blogPosts.length} 篇文章 · ${state.blogTagFilter}` : `${state.blogPosts.length} 篇文章`;
  $("#blog-post-list").innerHTML = posts.map((post) => `
    <article class="topic-page-card">
      ${post.coverUrl ? `<img src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.title)}" />` : `<div class="topic-page-placeholder">封面</div>`}
      <div>
        <span class="status-badge ${post.published ? "status-booked" : "status-cancelled"}">${post.published ? "已发布" : "草稿"}</span>
        <h3>${escapeHtml(post.title)}</h3>
        ${renderBlogTags(post)}
        <p>${escapeHtml(blogSummary(post)) || "暂未填写摘要"}</p>
        <small>${new Date(post.publishedAt).toLocaleString("zh-CN").slice(0, 16)} · ${post.comments?.length ?? 0} 条评论</small>
      </div>
      <div class="topic-card-actions">
        <button class="secondary-button" data-toggle-blog-post="${post.id}">${post.published ? "隐藏" : "显示"}</button>
        <button class="secondary-button" data-edit-blog-post="${post.id}">编辑</button>
      </div>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><h2>还没有文章</h2><p>可以先新增一篇生活记录。</p></div>`;
  document.querySelectorAll("[data-edit-blog-post]").forEach((button) => button.addEventListener("click", () => openBlogPostDialog(state.blogPosts.find((post) => post.id === button.dataset.editBlogPost))));
  document.querySelectorAll("[data-toggle-blog-post]").forEach((button) => button.addEventListener("click", async () => {
    const post = state.blogPosts.find((item) => item.id === button.dataset.toggleBlogPost);
    if (!post) return;
    try {
      await request(`/api/blog-posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          coverUrl: post.coverUrl,
          tags: blogTags(post),
          summary: post.summary,
          contentHtml: post.contentHtml,
          publishedAt: post.publishedAt,
          published: !post.published
        })
      });
      state.blogPosts = await request("/api/blog-posts");
      renderBlogPosts();
      toast(post.published ? "文章已隐藏" : "文章已显示");
    } catch (error) { toast(error.message); }
  }));
}

function openBlogPostDialog(post = null) {
  state.editingBlogPostId = post?.id ?? null;
  state.blogPostContentDraft = post?.contentHtml ?? "";
  const form = $("#blog-post-form");
  form.reset();
  form.querySelector("h2").textContent = post ? "编辑文章" : "新增文章";
  form.elements.published.checked = post?.published ?? true;
  if (post) {
    form.elements.title.value = post.title;
    form.elements.slug.value = post.slug;
    form.elements.coverUrl.value = post.coverUrl ?? "";
    form.elements.tags.value = blogTags(post).join(", ");
    form.elements.summary.value = post.summary ?? "";
    form.elements.contentHtml.value = post.contentHtml ?? "";
    form.elements.publishedAt.value = toDatetimeLocal(post.publishedAt);
  } else {
    form.elements.publishedAt.value = toDatetimeLocal(new Date().toISOString());
  }
  renderBlogPostContentStatus();
  $("#delete-blog-post").hidden = !post;
  $("#blog-post-dialog").showModal();
}

const homeModuleNames = { CUBE: "魔方", NAV: "文本导航", ACTIVITIES: "活动", TOPICS: "专题", GUIDES: "领队", REVIEWS: "评价", UPCOMING: "即将出发的旅行", BANNER: "图片广告", TEXT: "标题文本", COLLAPSE: "折叠文本", DIVIDER: "辅助分割" };
const homeModuleIcons = { CUBE: "▦", NAV: "≡", ACTIVITIES: "▤", TOPICS: "▧", GUIDES: "♟", REVIEWS: "★", UPCOMING: "◷", BANNER: "▰", TEXT: "Ｔ", COLLAPSE: "▣", DIVIDER: "—" };
const builderCover = "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=80";

function moduleStyle(module) {
  return {
    layout: module.style?.layout || "",
    cardStyle: module.style?.cardStyle || "PLAIN",
    radius: module.style?.radius ?? 6,
    gap: module.style?.gap ?? 8,
    padding: module.style?.padding ?? 11,
    textAlign: module.style?.textAlign || "LEFT",
    dividerStyle: module.style?.dividerStyle || "SPACE",
    height: module.style?.height ?? 24,
    backgroundColor: module.style?.backgroundColor || "#ffffff"
  };
}

function modulePreviewVars(module) {
  const style = moduleStyle(module);
  return `style="--module-radius:${style.radius}px;--module-gap:${style.gap}px;--module-padding:${style.padding}px;--module-background:${escapeHtml(style.backgroundColor)}"`;
}

function navigationTargetOptions(selectedType = "GUIDES", selectedValue = "") {
  const selected = (type, value = "") => type === selectedType && value === selectedValue ? " selected" : "";
  return [
    `<option value="GUIDES:"${selected("GUIDES")}>领队主页</option>`,
    ...state.topicPages.map((page) => `<option value="TOPIC:${escapeHtml(page.slug)}"${selected("TOPIC", page.slug)}>专题：${escapeHtml(page.title)}</option>`),
    ...state.activities.map((activity) => `<option value="ACTIVITY:${activity.id}"${selected("ACTIVITY", activity.id)}>活动：${escapeHtml(activity.content.name)}</option>`)
  ].join("");
}

function homeModulePreview(module) {
  const style = moduleStyle(module);
  const vars = modulePreviewVars(module);
  const heading = `<div class="builder-preview-heading"><span>${homeModuleIcons[module.type]}</span><strong>${escapeHtml(module.title)}</strong></div>`;
  if (module.type === "CUBE") return `<div class="builder-preview-cube layout-${style.layout || "TWO"} card-${style.cardStyle}" ${vars}>${state.homeEntries.slice(0, module.limit).map((entry) => `
    <div>${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="" />` : ""}<strong>${escapeHtml(entry.title)}</strong></div>`).join("")}</div>`;
  if (module.type === "NAV") return `<div class="builder-preview-nav layout-${style.layout || "FOUR"}" ${vars}>${(module.navItems ?? []).slice(0, module.limit).map((entry) => `
    <div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.subtitle || "DISCOVER")}</small></div>`).join("")}</div>`;
  if (module.type === "UPCOMING") return `${heading}<div class="builder-preview-scroll">${state.homePreviewSlots.slice(0, module.limit).map((slot) => `
    <div class="builder-preview-upcoming"><span>${escapeHtml(slot.customerDisplayName)}</span><img src="${builderCover}" alt="" /><strong>${escapeHtml(slot.activityName)}</strong><small>${slot.startsAt.slice(5, 10)} ${slot.startsAt.slice(11, 16)}-${slot.endsAt.slice(11, 16)}</small><em>已有 ${slot.bookedCount} 人报名</em></div>`).join("") || `<small>暂无已有报名的未来活动</small>`}</div>`;
  if (module.type === "TOPICS") return `${heading}<div class="builder-preview-grid">${state.topicPages.slice(0, module.limit).map((page) => `
    <div>${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="" />` : ""}<strong>${escapeHtml(page.title)}</strong></div>`).join("") || `<small>暂无专题</small>`}</div>`;
  if (module.type === "REVIEWS") return `${heading}<div class="builder-preview-scroll">${state.homePreviewReviews.slice(0, module.limit).map((review) => `
    <div class="builder-preview-review"><strong>${escapeHtml(review.displayName)}</strong><span>${"★".repeat(review.rating)}</span><p>${escapeHtml(review.content)}</p><small>${escapeHtml(review.activityName)}</small></div>`).join("") || `<small>暂无公开评价</small>`}</div>`;
  if (module.type === "ACTIVITIES") {
    const activities = state.activities.filter((activity) => module.tagIds.every((tagId) => activity.tags.some((tag) => tag.id === tagId))).slice(0, module.limit);
    return `${heading}<div class="builder-preview-scroll builder-preview-services layout-${style.layout || "LIST"} card-${style.cardStyle}" ${vars}>${activities.map((activity) => `
      <div class="builder-preview-activity"><img src="${builderCover}" alt="" /><strong>${escapeHtml(activity.content.name)}</strong><small>${activity.tags.map((tag) => escapeHtml(tag.name)).join(" · ")}</small></div>`).join("") || `<small>暂无匹配活动</small>`}</div>`;
  }
  if (module.type === "GUIDES") return `${heading}<div class="builder-preview-scroll">${state.guides.slice(0, module.limit).map((guide) => `
    <div class="builder-preview-guide">${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="" />` : ""}<strong>${escapeHtml(guide.name)}</strong></div>`).join("") || `<small>暂无领队</small>`}</div>`;
  if (module.type === "BANNER") {
    const images = (module.imageUrls?.length ? module.imageUrls : [module.imageUrl]).filter(Boolean);
    return `<div class="builder-preview-banners layout-${style.layout || "SINGLE"} card-${style.cardStyle}" ${vars}>${images.map((imageUrl) => `<div class="builder-preview-banner"><img src="${escapeHtml(imageUrl)}" alt="" /><strong>${escapeHtml(module.title)}</strong></div>`).join("") || `<div class="builder-preview-banner"><strong>${escapeHtml(module.title)}</strong></div>`}</div>`;
  }
  if (module.type === "COLLAPSE") return `<div class="builder-preview-collapse" style="padding:${style.padding}px;background:${escapeHtml(style.backgroundColor)}"><strong>${escapeHtml(module.title)}</strong>${(module.items ?? []).slice(0, module.limit).map((item) => `
    <div class="builder-preview-collapse-row"><span>☏</span><p>${escapeHtml(item.title)}</p><em>⌄</em></div>`).join("") || `<small>暂无折叠内容</small>`}</div>`;
  if (module.type === "DIVIDER") return `<div class="builder-preview-divider ${style.dividerStyle === "LINE" ? "is-line" : "is-space"}" style="height:${style.height}px"><span></span></div>`;
  return `<div class="builder-preview-text" style="padding:${style.padding}px;text-align:${style.textAlign === "CENTER" ? "center" : "left"};background:${escapeHtml(style.backgroundColor)}"><strong>${escapeHtml(module.title)}</strong><p>${escapeHtml(module.subtitle ?? "")}</p></div>`;
}

function collapseItemsText(module) {
  return (module.items ?? []).map((item) => `${item.title}\n${item.content}`).join("\n\n");
}

function parseCollapseItems(text) {
  return text.split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      return { title: lines.shift().trim(), content: lines.join("\n").trim() };
    })
    .filter((item) => item.title);
}

let homeModuleDragScrollFrame = null;
let homeModuleDragScrollSpeed = 0;
let homeModuleDragActive = false;

function stopHomeModuleDragScroll() {
  homeModuleDragActive = false;
  homeModuleDragScrollSpeed = 0;
  if (homeModuleDragScrollFrame) cancelAnimationFrame(homeModuleDragScrollFrame);
  homeModuleDragScrollFrame = null;
}

function runHomeModuleDragScroll() {
  if (!homeModuleDragScrollSpeed) {
    homeModuleDragScrollFrame = null;
    return;
  }
  window.scrollBy({ top: homeModuleDragScrollSpeed });
  homeModuleDragScrollFrame = requestAnimationFrame(runHomeModuleDragScroll);
}

function updateHomeModuleDragScroll(event) {
  if (!homeModuleDragActive) return;
  const edgeSize = Math.min(120, Math.max(72, window.innerHeight * 0.14));
  const distanceFromBottom = window.innerHeight - event.clientY;
  let speed = 0;
  if (event.clientY < edgeSize) speed = -Math.ceil((edgeSize - event.clientY) / 5);
  if (distanceFromBottom < edgeSize) speed = Math.ceil((edgeSize - distanceFromBottom) / 5);
  homeModuleDragScrollSpeed = speed;
  if (speed) window.scrollBy({ top: speed });
  if (speed && !homeModuleDragScrollFrame) homeModuleDragScrollFrame = requestAnimationFrame(runHomeModuleDragScroll);
}

document.addEventListener("dragover", updateHomeModuleDragScroll);
document.addEventListener("drop", stopHomeModuleDragScroll);
document.addEventListener("dragend", stopHomeModuleDragScroll);

function renderHomeModules() {
  $("#home-module-list").innerHTML = state.homeModules.map((module) => `
    <article class="home-module-card ${module.id === state.selectedHomeModuleId ? "selected" : ""} ${module.published ? "" : "is-hidden"}" draggable="true" data-home-module="${module.id}">
      <div class="module-toolbar">
        <span class="module-drag" title="拖动排序">⠿ 拖动排序</span>
        <small>${homeModuleNames[module.type]} · ${module.limit} 条${module.published ? "" : " · 已隐藏"}</small>
      </div>
      <div class="builder-module-preview">${homeModulePreview(module)}</div>
    </article>
  `).join("") || `<div class="builder-empty">点击左侧添加首页模块</div>`;
  document.querySelectorAll("[data-home-module]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedHomeModuleId = card.dataset.homeModule;
      renderHomeModules();
      renderHomeModuleSettings();
    });
    card.addEventListener("dragstart", (event) => {
      homeModuleDragActive = true;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.homeModule);
    });
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("drop", async (event) => {
      event.preventDefault();
      const draggedId = event.dataTransfer.getData("text/plain");
      const targetId = card.dataset.homeModule;
      if (!draggedId || draggedId === targetId) return;
      const ids = state.homeModules.map((item) => item.id).filter((id) => id !== draggedId);
      ids.splice(ids.indexOf(targetId), 0, draggedId);
      state.homeModules = await request("/api/home-modules/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
      renderHomeModules();
      toast("首页顺序已更新");
    });
  });
}

function renderHomeModuleSettings() {
  const module = state.homeModules.find((item) => item.id === state.selectedHomeModuleId);
  if (!module) return;
  const style = moduleStyle(module);
  const showTags = module.type === "ACTIVITIES";
  const showMedia = module.type === "BANNER";
  const showSubtitle = ["TEXT", "BANNER"].includes(module.type);
  const showLayout = ["CUBE", "NAV", "ACTIVITIES", "BANNER"].includes(module.type);
  const showCardStyle = ["CUBE", "ACTIVITIES", "BANNER"].includes(module.type);
  const showSpacing = ["CUBE", "ACTIVITIES", "BANNER"].includes(module.type);
  const showTextStyle = module.type === "TEXT";
  const showCollapse = module.type === "COLLAPSE";
  const showCollapseStyle = module.type === "COLLAPSE";
  const showDivider = module.type === "DIVIDER";
  const showNavigation = module.type === "NAV";
  const layoutOptions = module.type === "CUBE"
    ? [["TWO", "1 行 2 个"], ["THREE", "1 行 3 个"], ["FEATURE", "1 大 2 小"]]
    : module.type === "NAV"
      ? [["FOUR", "1 行 4 个"], ["THREE", "1 行 3 个"]]
    : module.type === "ACTIVITIES"
      ? [["LIST", "详细列表"], ["GRID", "1 行 2 个"], ["SCROLL", "横向滚动"]]
      : [["SINGLE", "单图"], ["CAROUSEL", "轮播海报"], ["SCROLL", "横向滚动"]];
  $("#home-module-settings").innerHTML = `
    <form id="home-module-settings-form">
      <div class="builder-settings-heading"><h2>${homeModuleNames[module.type]}</h2><button type="button" class="module-delete" title="删除模块">删除</button></div>
      ${showDivider ? "" : `<label>模块标题<input name="title" maxlength="40" value="${escapeHtml(module.title)}" /></label>`}
      ${showSubtitle ? `<label>补充文字<textarea name="subtitle" rows="4">${escapeHtml(module.subtitle ?? "")}</textarea></label>` : ""}
      ${showCollapse ? `<label>折叠内容<textarea name="itemsText" rows="12" placeholder="我们从哪里来？&#10;在这里写正文。&#10;&#10;我们在做什么？&#10;在这里写正文。">${escapeHtml(collapseItemsText(module))}</textarea><small>每一段第一行是标题，下面是正文；段落之间空一行。</small></label>` : ""}
      ${showMedia ? `<label>图片地址，每行一张<textarea name="imageUrls" rows="5" placeholder="https://...">${escapeHtml((module.imageUrls?.length ? module.imageUrls : [module.imageUrl]).filter(Boolean).join("\n"))}</textarea></label><label>跳转链接<input name="linkUrl" value="${escapeHtml(module.linkUrl ?? "")}" placeholder="https://..." /></label>` : ""}
      ${showNavigation ? `<fieldset class="navigation-items-fieldset"><legend>导航内容</legend><div class="navigation-item-list">${(module.navItems ?? []).map((item, index) => `
        <div class="navigation-item-editor">
          <input name="navTitle" maxlength="20" value="${escapeHtml(item.title)}" placeholder="中文标题" />
          <input name="navSubtitle" maxlength="30" value="${escapeHtml(item.subtitle)}" placeholder="英文小标题" />
          <select name="navTarget">${navigationTargetOptions(item.targetType, item.targetValue)}</select>
          <button type="button" class="navigation-item-remove" data-remove-nav-item="${index}" title="删除导航项">×</button>
        </div>`).join("")}</div><button type="button" class="navigation-item-add" ${module.navItems?.length >= 8 ? "disabled" : ""}>＋ 增加导航项</button></fieldset>` : ""}
      ${showDivider ? "" : `<label>显示数量<input name="limit" type="number" min="1" max="20" value="${module.limit}" /></label>`}
      ${showTags ? `<fieldset><legend>按标签挑选活动</legend><div class="checkbox-tags">${state.tags.map((tag) => `<label class="checkbox-tag"><input type="checkbox" name="tagIds" value="${tag.id}" ${module.tagIds.includes(tag.id) ? "checked" : ""} />${escapeHtml(tag.name)}</label>`).join("")}</div></fieldset>` : ""}
      ${showLayout ? `<fieldset><legend>排列样式</legend><div class="builder-option-grid">${layoutOptions.map(([value, label]) => `<label><input type="radio" name="layout" value="${value}" ${style.layout === value || (!style.layout && value === layoutOptions[0][0]) ? "checked" : ""} /><span>${label}</span></label>`).join("")}</div></fieldset>` : ""}
      ${showCardStyle ? `<fieldset><legend>图片样式</legend><div class="builder-option-grid"><label><input type="radio" name="cardStyle" value="PLAIN" ${style.cardStyle === "PLAIN" ? "checked" : ""} /><span>常规</span></label><label><input type="radio" name="cardStyle" value="SHADOW" ${style.cardStyle === "SHADOW" ? "checked" : ""} /><span>投影</span></label></div></fieldset>` : ""}
      ${showSpacing ? `<label>圆角 <span class="builder-value">${style.radius}px</span><input name="radius" type="range" min="0" max="24" value="${style.radius}" /></label><label>内容间距 <span class="builder-value">${style.gap}px</span><input name="gap" type="range" min="0" max="32" value="${style.gap}" /></label><label>页面边距 <span class="builder-value">${style.padding}px</span><input name="padding" type="range" min="0" max="32" value="${style.padding}" /></label>` : ""}
      ${showTextStyle ? `<fieldset><legend>文字位置</legend><div class="builder-option-grid"><label><input type="radio" name="textAlign" value="LEFT" ${style.textAlign === "LEFT" ? "checked" : ""} /><span>居左</span></label><label><input type="radio" name="textAlign" value="CENTER" ${style.textAlign === "CENTER" ? "checked" : ""} /><span>居中</span></label></div></fieldset><label>内边距 <span class="builder-value">${style.padding}px</span><input name="padding" type="range" min="0" max="32" value="${style.padding}" /></label><label>背景颜色<input name="backgroundColor" type="color" value="${escapeHtml(style.backgroundColor)}" /></label>` : ""}
      ${showCollapseStyle ? `<label>内边距 <span class="builder-value">${style.padding}px</span><input name="padding" type="range" min="0" max="32" value="${style.padding}" /></label><label>背景颜色<input name="backgroundColor" type="color" value="${escapeHtml(style.backgroundColor)}" /></label>` : ""}
      ${showDivider ? `<fieldset><legend>分割类型</legend><div class="builder-option-grid"><label><input type="radio" name="dividerStyle" value="SPACE" ${style.dividerStyle === "SPACE" ? "checked" : ""} /><span>辅助留白</span></label><label><input type="radio" name="dividerStyle" value="LINE" ${style.dividerStyle === "LINE" ? "checked" : ""} /><span>分割线</span></label></div></fieldset><label>高度 <span class="builder-value">${style.height}px</span><input name="height" type="range" min="4" max="80" value="${style.height}" /></label>` : ""}
      <label class="checkbox-tag"><input name="published" type="checkbox" ${module.published ? "checked" : ""} />在客人首页展示</label>
      <button class="primary-button">保存模块</button>
    </form>`;
  $("#home-module-settings-form").addEventListener("submit", saveHomeModule);
  $("#home-module-settings-form").addEventListener("input", previewHomeModuleSettings);
  $(".module-delete").addEventListener("click", deleteHomeModule);
  $(".navigation-item-add")?.addEventListener("click", addNavigationItem);
  document.querySelectorAll("[data-remove-nav-item]").forEach((button) => button.addEventListener("click", () => removeNavigationItem(Number(button.dataset.removeNavItem))));
}

function homeModuleValues(form, module) {
  const values = new FormData(form);
  const style = moduleStyle(module);
  const numberValue = (name, fallback) => values.has(name) ? Number(values.get(name)) : fallback;
  return {
    title: values.get("title") ?? module.title,
    subtitle: values.get("subtitle") ?? "",
    imageUrl: values.get("imageUrls")?.split("\n").map((value) => value.trim()).filter(Boolean)[0] ?? "",
    imageUrls: values.get("imageUrls")?.split("\n").map((value) => value.trim()).filter(Boolean) ?? [],
      navItems: [...form.querySelectorAll(".navigation-item-editor")].map((row) => {
      const [targetType, ...targetParts] = row.querySelector("[name=navTarget]").value.split(":");
      return {
        title: row.querySelector("[name=navTitle]").value,
        subtitle: row.querySelector("[name=navSubtitle]").value,
        targetType,
        targetValue: targetParts.join(":")
      };
    }),
    items: values.has("itemsText") ? parseCollapseItems(values.get("itemsText")) : (module.items ?? []),
    linkUrl: values.get("linkUrl") ?? "",
    limit: values.has("limit") ? Number(values.get("limit")) : module.limit,
    tagIds: values.getAll("tagIds"),
    published: values.get("published") === "on",
    style: {
      layout: values.get("layout") ?? style.layout,
      cardStyle: values.get("cardStyle") ?? style.cardStyle,
      radius: numberValue("radius", style.radius),
      gap: numberValue("gap", style.gap),
      padding: numberValue("padding", style.padding),
      textAlign: values.get("textAlign") ?? style.textAlign,
      dividerStyle: values.get("dividerStyle") ?? style.dividerStyle,
      height: numberValue("height", style.height),
      backgroundColor: values.get("backgroundColor") ?? style.backgroundColor
    }
  };
}

function addNavigationItem() {
  const module = state.homeModules.find((item) => item.id === state.selectedHomeModuleId);
  Object.assign(module, homeModuleValues($("#home-module-settings-form"), module));
  module.navItems = [...(module.navItems ?? []), { title: "新入口", subtitle: "DISCOVER", targetType: "GUIDES", targetValue: "" }];
  renderHomeModules();
  renderHomeModuleSettings();
}

function removeNavigationItem(index) {
  const module = state.homeModules.find((item) => item.id === state.selectedHomeModuleId);
  Object.assign(module, homeModuleValues($("#home-module-settings-form"), module));
  module.navItems.splice(index, 1);
  renderHomeModules();
  renderHomeModuleSettings();
}

function previewHomeModuleSettings(event) {
  const module = state.homeModules.find((item) => item.id === state.selectedHomeModuleId);
  Object.assign(module, homeModuleValues(event.currentTarget, module));
  renderHomeModules();
  document.querySelectorAll(".builder-value").forEach((label) => {
    const range = label.nextElementSibling;
    if (range) label.textContent = `${range.value}px`;
  });
}

async function saveHomeModule(event) {
  event.preventDefault();
  const module = state.homeModules.find((item) => item.id === state.selectedHomeModuleId);
  try {
    await request(`/api/home-modules/${module.id}`, { method: "PATCH", body: JSON.stringify(homeModuleValues(event.currentTarget, module)) });
    state.homeModules = await request("/api/home-modules");
    renderHomeModules();
    renderHomeModuleSettings();
    toast("首页模块已保存");
  } catch (error) { toast(error.message); }
}

async function deleteHomeModule() {
  if (!window.confirm("确定删除这个首页模块吗？")) return;
  await request(`/api/home-modules/${state.selectedHomeModuleId}`, { method: "DELETE" });
  state.homeModules = await request("/api/home-modules");
  state.selectedHomeModuleId = null;
  renderHomeModules();
  $("#home-module-settings").innerHTML = `<div class="builder-settings-empty"><h2>模块设置</h2><p>选择中间的模块后，在这里修改内容。</p></div>`;
  toast("首页模块已删除");
}

function homeEntryTargetLabel(entry) {
  if (entry.targetType === "GUIDES") return "领队主页";
  if (entry.targetType === "EXTERNAL") return "外部内容";
  if (entry.targetType === "TOPIC") return `专题：${state.topicPages.find((page) => page.slug === entry.targetValue)?.title ?? entry.targetValue}`;
  return `活动：${state.activities.find((activity) => activity.id === entry.targetValue)?.content.name ?? entry.targetValue}`;
}

function renderHomeEntries() {
  $("#home-entry-list").innerHTML = state.homeEntries.map((entry) => `
    <article class="home-entry-card">
      ${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.title)}" />` : `<div class="home-entry-placeholder">入口图</div>`}
      <div>
        <span class="status-badge ${entry.published ? "status-booked" : "status-cancelled"}">${entry.published ? "首页展示" : "已隐藏"}</span>
        <h3>${escapeHtml(entry.title)}</h3>
        <small>${escapeHtml(entry.subtitle || "未填写英文小标题")}</small>
        <p>${escapeHtml(homeEntryTargetLabel(entry))} · 顺序 ${entry.sortOrder}</p>
      </div>
      <button class="secondary-button" data-edit-home-entry="${entry.id}">编辑</button>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><p>还没有首页入口。</p></div>`;
  document.querySelectorAll("[data-edit-home-entry]").forEach((button) => button.addEventListener("click", () => openHomeEntryDialog(state.homeEntries.find((entry) => entry.id === button.dataset.editHomeEntry))));
}

function renderHomeEntryTargetOptions(selectedValue = "") {
  const form = $("#home-entry-form");
  const label = $("#home-entry-target-value-label");
  const targetType = form.elements.targetType.value;
  if (targetType === "GUIDES") {
    label.hidden = true;
    if (form.elements.targetValue.tagName !== "SELECT") form.elements.targetValue.outerHTML = `<select name="targetValue"></select>`;
    form.elements.targetValue.innerHTML = `<option value="">领队主页</option>`;
    return;
  }
  label.hidden = false;
  if (targetType === "EXTERNAL") {
    label.childNodes[0].textContent = "外部链接";
    form.elements.targetValue.outerHTML = `<input name="targetValue" placeholder="https://..." value="${escapeHtml(selectedValue)}" />`;
    return;
  }
  if (form.elements.targetValue.tagName !== "SELECT") {
    form.elements.targetValue.outerHTML = `<select name="targetValue"></select>`;
  }
  label.childNodes[0].textContent = "跳转目标";
  const options = targetType === "TOPIC"
    ? state.topicPages.map((page) => `<option value="${page.slug}">${escapeHtml(page.title)}</option>`)
    : state.activities.map((activity) => `<option value="${activity.id}">${escapeHtml(activity.content.name)}</option>`);
  form.elements.targetValue.innerHTML = options.join("");
  form.elements.targetValue.value = selectedValue;
}

function openHomeEntryDialog(entry = null) {
  state.editingHomeEntryId = entry?.id ?? null;
  const form = $("#home-entry-form");
  form.reset();
  form.querySelector("h2").textContent = entry ? "编辑首页入口" : "新增首页入口";
  form.elements.published.checked = entry?.published ?? true;
  if (entry) {
    form.elements.title.value = entry.title;
    form.elements.subtitle.value = entry.subtitle ?? "";
    form.elements.imageUrl.value = entry.imageUrl ?? "";
    form.elements.targetType.value = entry.targetType;
    form.elements.sortOrder.value = entry.sortOrder;
  }
  renderHomeEntryTargetOptions(entry?.targetValue ?? "");
  $("#delete-home-entry").hidden = !entry;
  $("#home-entry-dialog").showModal();
}

function openTopicPageDialog(page = null) {
  state.editingTopicPageId = page?.id ?? null;
  state.topicPageIntroductionDraft = page?.introductionHtml ?? "";
  const form = $("#topic-page-form");
  form.reset();
  form.querySelector("h2").textContent = page ? "编辑专题页" : "新增专题页";
  form.elements.published.checked = page?.published ?? true;
  if (page) {
    form.elements.title.value = page.title;
    form.elements.slug.value = page.slug;
    form.elements.summary.value = page.summary ?? "";
    form.elements.imageUrl.value = page.imageUrl ?? "";
    form.elements.externalUrl.value = page.externalUrl ?? "";
    const selectedTagIds = new Set(page.tagIds);
    form.querySelectorAll("input[name=tagIds]").forEach((input) => { input.checked = selectedTagIds.has(input.value); });
  }
  $("#delete-topic-page").hidden = !page;
  renderTopicPageDescriptionStatus();
  $("#topic-page-dialog").showModal();
}

function renderTopicPageDescriptionStatus() {
  const text = state.topicPageIntroductionDraft.replace(/<[^>]+>/g, "").trim();
  $("#topic-page-description-status").textContent = text || state.topicPageIntroductionDraft.includes("<") ? "已填写，可继续编辑" : "暂未填写详细介绍";
}

function renderGuides() {
  renderGuidePageStatus();
  $("#guide-list").innerHTML = state.guides.map((guide, index) => `
    <article class="guide-card ${state.guideDragIndex === index ? "dragging" : ""}" draggable="true" data-guide-index="${index}">
      ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<div class="guide-placeholder">照片</div>`}
      <div class="guide-card-copy">
        <span class="guide-card-order">#${index + 1}</span>
        <h3>${escapeHtml(guide.name)}</h3>
        <p>${escapeHtml(guide.descriptionHtml.replace(/<[^>]+>/g, "")) || "暂未填写详细介绍"}</p>
        <small>${guide.activities.length} 个关联活动 · ${(guide.images ?? []).length} 张相册照片</small>
      </div>
      <div class="guide-card-actions">
        <button class="secondary-button" data-edit-guide="${guide.id}">编辑</button>
        <button class="danger-button" data-delete-guide="${guide.id}">删除</button>
      </div>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><h2>还没有领队档案</h2><p>可以先新增一位领队。</p></div>`;
  bindGuideOrderEvents();
  document.querySelectorAll("[data-edit-guide]").forEach((button) => button.addEventListener("click", () => openGuideDialog(state.guides.find((guide) => guide.id === button.dataset.editGuide))));
  document.querySelectorAll("[data-delete-guide]").forEach((button) => button.addEventListener("click", () => deleteGuide(button.dataset.deleteGuide)));
}

function moveGuide(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.guides.length || toIndex >= state.guides.length) return;
  const [guide] = state.guides.splice(fromIndex, 1);
  state.guides.splice(toIndex, 0, guide);
  state.guideDragIndex = toIndex;
  state.guideOrderDirty = true;
  renderGuides();
}

async function saveGuideOrder() {
  if (!state.guideOrderDirty) return;
  try {
    state.guides = await request("/api/guides/reorder", {
      method: "PATCH",
      body: JSON.stringify({ ids: state.guides.map((guide) => guide.id) })
    });
    state.guideOrderDirty = false;
    renderDialogOptions();
    renderGuides();
    toast("领队顺序已保存");
  } catch (error) {
    toast(error.message);
    state.guides = await request("/api/guides");
    state.guideOrderDirty = false;
    renderGuides();
  }
}

function bindGuideOrderEvents() {
  document.querySelectorAll("[data-guide-index]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      state.guideDragIndex = Number(card.dataset.guideIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.guideIndex);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", async () => {
      card.classList.remove("dragging");
      state.guideDragIndex = null;
      await saveGuideOrder();
    });
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("dragenter", (event) => {
      event.preventDefault();
      const targetIndex = Number(card.dataset.guideIndex);
      if (state.guideDragIndex !== null && state.guideDragIndex !== targetIndex) moveGuide(state.guideDragIndex, targetIndex);
    });
    card.addEventListener("drop", async (event) => {
      event.preventDefault();
      state.guideDragIndex = null;
      await saveGuideOrder();
    });
  });
}

async function deleteGuide(id) {
  const guide = state.guides.find((item) => item.id === id);
  if (!guide) return;
  const linkedCount = (guide.activities ?? []).length;
  const message = linkedCount
    ? `确定删除“${guide.name}”吗？系统会同时从 ${linkedCount} 个活动里移除这个领队。`
    : `确定删除“${guide.name}”吗？`;
  if (!window.confirm(message)) return;
  try {
    await request(`/api/guides/${id}`, { method: "DELETE" });
    await loadActivities();
    state.guides = await request("/api/guides");
    renderDialogOptions();
    renderGuides();
    toast(linkedCount ? "领队已删除，活动关联已同步移除" : "领队档案已删除");
  } catch (error) {
    toast(error.message);
  }
}

function openGuideDialog(guide = null) {
  state.editingGuideId = guide?.id ?? null;
  state.guideDescriptionDraft = guide?.descriptionHtml ?? "";
  state.guidePhotoDraft = guide?.photoUrl ?? "";
  state.guideGalleryDraft = normalizeActivityGallery(guide?.images ?? []);
  state.guideGallerySelectedIds = new Set();
  state.guideGalleryDragIndex = null;
  state.guideGalleryEditorOpen = false;
  const form = $("#guide-form");
  form.reset();
  form.querySelector("h2").textContent = guide ? "编辑领队" : "新增领队";
  if (guide) {
    form.elements.name.value = guide.name;
  }
  renderGuidePhotoPreview();
  renderGuideGallery();
  renderGuideDescriptionStatus();
  $("#guide-dialog").showModal();
}

function renderGuidePhotoPreview() {
  const preview = $("#guide-photo-preview");
  preview.hidden = !state.guidePhotoDraft;
  preview.src = state.guidePhotoDraft || "";
}

function renderGuideGallery() {
  const grid = $("#guide-gallery-grid");
  const preview = $("#guide-gallery-preview");
  const editor = $("#guide-gallery-editor");
  const moreButton = $("#guide-gallery-more");
  if (!grid || !preview || !editor || !moreButton) return;
  const selectedCount = state.guideGallerySelectedIds.size;
  $("#guide-gallery-status").textContent = state.guideGalleryDraft.length
    ? `共 ${state.guideGalleryDraft.length} 张${selectedCount ? `，已选 ${selectedCount} 张` : "，可拖动调整顺序"}`
    : "暂未上传照片";
  preview.innerHTML = state.guideGalleryDraft.length
    ? state.guideGalleryDraft.slice(0, 7).map((image, index) => `<img src="${escapeHtml(activityGalleryImageUrl(image))}" alt="领队照片 ${index + 1}" />`).join("")
    : `<div class="activity-gallery-preview-empty">暂无照片</div>`;
  editor.hidden = !state.guideGalleryEditorOpen;
  moreButton.textContent = state.guideGalleryEditorOpen ? "收起" : "更多";
  const deleteButton = $("#guide-gallery-delete-selected");
  deleteButton.disabled = selectedCount === 0;
  deleteButton.textContent = selectedCount ? `删除所选 ${selectedCount}` : "删除所选";
  grid.innerHTML = state.guideGalleryDraft.length
    ? state.guideGalleryDraft.map((image, index) => `
      <article class="activity-gallery-item ${state.guideGallerySelectedIds.has(image.id) ? "selected" : ""}" draggable="true" data-guide-gallery-index="${index}">
        <img src="${escapeHtml(activityGalleryImageUrl(image))}" alt="领队照片 ${index + 1}" />
        <span class="activity-gallery-order">${index + 1}</span>
        <label class="activity-gallery-check" title="选择照片">
          <input type="checkbox" data-guide-gallery-select="${image.id}" ${state.guideGallerySelectedIds.has(image.id) ? "checked" : ""} />
        </label>
      </article>
    `).join("")
    : `<div class="activity-gallery-empty">上传后会在这里全览照片，也可以拖动排序。</div>`;
  bindGuideGalleryEvents();
}

function reorderGuideGallery(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.guideGalleryDraft.length || toIndex >= state.guideGalleryDraft.length) return;
  const [image] = state.guideGalleryDraft.splice(fromIndex, 1);
  state.guideGalleryDraft.splice(toIndex, 0, image);
  state.guideGalleryDragIndex = toIndex;
  renderGuideGallery();
}

function bindGuideGalleryEvents() {
  document.querySelectorAll("[data-guide-gallery-select]").forEach((input) => input.addEventListener("change", () => {
    if (input.checked) {
      state.guideGallerySelectedIds.add(input.dataset.guideGallerySelect);
    } else {
      state.guideGallerySelectedIds.delete(input.dataset.guideGallerySelect);
    }
    renderGuideGallery();
  }));
  document.querySelectorAll("[data-guide-gallery-index]").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      item.classList.add("dragging");
      state.guideGalleryDragIndex = Number(item.dataset.guideGalleryIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.guideGalleryIndex);
    });
    item.addEventListener("dragend", () => {
      state.guideGalleryDragIndex = null;
      item.classList.remove("dragging");
    });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("dragenter", (event) => {
      event.preventDefault();
      const targetIndex = Number(item.dataset.guideGalleryIndex);
      if (state.guideGalleryDragIndex !== null && state.guideGalleryDragIndex !== targetIndex) {
        reorderGuideGallery(state.guideGalleryDragIndex, targetIndex);
      }
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      state.guideGalleryDragIndex = null;
    });
  });
}

function renderGuideDescriptionStatus() {
  const text = state.guideDescriptionDraft.replace(/<[^>]+>/g, "").trim();
  $("#guide-description-status").textContent = text || state.guideDescriptionDraft.includes("<") ? "已填写，可继续编辑" : "暂未填写详细介绍";
}

function renderGuidePageStatus() {
  const text = state.guidePage.introductionHtml.replace(/<[^>]+>/g, "").trim();
  $("#guide-page-status").textContent = text || state.guidePage.introductionHtml.includes("<") ? "已填写，可继续编辑" : "暂未填写总介绍";
}

async function loadReviews() {
  state.reviews = await request("/api/reviews?includeHidden=true");
  $("#review-count").textContent = `${state.reviews.length} 条评价`;
  $("#admin-review-list").innerHTML = state.reviews.map((review) => `
    <article class="admin-review-card">
      <div class="admin-review-heading">
        <div>
          <span class="status-badge ${review.hidden ? "status-cancelled" : "status-booked"}">${review.hidden ? "已隐藏" : "公开展示"}</span>
          <h3>${escapeHtml(review.activityName)}</h3>
        </div>
        <span class="review-stars">${"★".repeat(review.rating)}</span>
      </div>
      <p>${escapeHtml(review.content)}</p>
      <div class="admin-review-replies">
        ${(review.replies ?? []).map((reply) => `<p><strong>${escapeHtml(reply.displayName)}</strong>${escapeHtml(reply.content)}</p>`).join("")}
      </div>
      <div class="admin-review-meta">
        <span>${escapeHtml(review.displayName)}</span>
        <span>${escapeHtml(review.createdAt.slice(0, 10))}</span>
      </div>
      <div class="admin-review-actions">
        <button class="secondary-button" data-reply-review="${review.id}">回复</button>
        <button class="${review.hidden ? "secondary-button" : "danger-button"}" data-toggle-review="${review.id}" data-next-hidden="${!review.hidden}">
          ${review.hidden ? "恢复显示" : "隐藏评价"}
        </button>
      </div>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><h2>还没有评价</h2><p>客人发布评价后会显示在这里。</p></div>`;
  document.querySelectorAll("[data-toggle-review]").forEach((button) => {
    button.addEventListener("click", async () => {
      await request(`/api/reviews/${button.dataset.toggleReview}/hidden`, {
        method: "PATCH",
        body: JSON.stringify({ hidden: button.dataset.nextHidden === "true" })
      });
      toast(button.dataset.nextHidden === "true" ? "评价已隐藏" : "评价已恢复显示");
      await loadReviews();
    });
  });
  document.querySelectorAll("[data-reply-review]").forEach((button) => {
    button.addEventListener("click", () => {
      state.replyingReviewId = button.dataset.replyReview;
      $("#review-reply-form").reset();
      $("#review-reply-dialog").showModal();
    });
  });
}

async function loadSettings() {
  state.adminAccounts = await request("/api/admin-accounts");
  renderGroups();
  renderTtyyMigrationPreview();
  renderAdminAccounts();
}

function renderGroups() {
  $("#group-list").innerHTML = state.groups.map((group) => {
    const activityCount = state.activities.filter((activity) => activity.groupId === group.id).length;
    return `
      <article class="group-card">
        <div>
          <h3>${escapeHtml(group.name)}</h3>
          <p>${activityCount} 个活动</p>
        </div>
        <div class="group-actions">
          <button class="secondary-button" data-edit-group="${group.id}">改名</button>
          <button class="delete-icon" title="删除组" data-delete-group="${group.id}">×</button>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-state compact-empty"><h2>暂时没有组</h2><p>点击右上角新增一个组。</p></div>`;
  document.querySelectorAll("[data-edit-group]").forEach((button) => {
    button.addEventListener("click", () => openGroupDialog(state.groups.find((group) => group.id === button.dataset.editGroup)));
  });
  document.querySelectorAll("[data-delete-group]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("确定删除这个组吗？")) return;
      try {
        await request(`/api/groups/${button.dataset.deleteGroup}`, { method: "DELETE" });
        await refreshGroups();
        toast("组已删除");
      } catch (error) { toast(error.message); }
    });
  });
}

function renderTtyyMigrationPreview() {
  const pendingCount = ttyyMigrationPreview.filter((item) => !state.activities.some((activity) => activity.content.name === item.name)).length;
  const importAllButton = $("#import-ttyy-preview");
  if (importAllButton) {
    importAllButton.disabled = pendingCount === 0;
    importAllButton.textContent = pendingCount ? `导入未导入项（${pendingCount}）` : "没有待导入项";
  }
  $("#ttyy-migration-list").innerHTML = ttyyMigrationPreview.map((item) => {
    const importedGroup = state.groups.some((group) => group.name === item.groupName);
    const importedActivity = state.activities.some((activity) => activity.content.name === item.name);
    return `
      <article class="migration-card">
        <div class="migration-card-main">
          <div class="migration-card-heading">
            <h3>${escapeHtml(item.name)}</h3>
            <span class="status-badge ${importedActivity ? "status-booked" : ""}">${importedActivity ? "活动已导入" : "待导入"}</span>
          </div>
          <p>${escapeHtml(item.groupName)} · ${escapeHtml(item.category)} · ${escapeHtml(item.paymentType)}</p>
          <div class="migration-fields">
            <span>${yuan(item.priceCents)}</span>
            <span>容量 ${item.capacity}</span>
            <span>${weekdayName(item.weekday)} ${item.startsAt}-${item.endsAt}</span>
            <span>${importedGroup ? "小组已存在" : "将新建小组"}</span>
          </div>
        </div>
        <button class="secondary-button" type="button" data-import-ttyy="${item.id}" ${importedActivity ? "disabled" : ""}>
          ${importedActivity ? "已导入" : "导入这条"}
        </button>
      </article>
    `;
  }).join("");
  document.querySelectorAll("[data-import-ttyy]").forEach((button) => {
    button.addEventListener("click", () => importTtyyItem(button.dataset.importTtyy));
  });
}

async function ensureTtyyGroup(name) {
  const existing = state.groups.find((group) => group.name === name);
  if (existing) return existing;
  try {
    return await request("/api/groups", { method: "POST", body: JSON.stringify({ name }) });
  } catch (error) {
    if (!error.message.includes("已存在")) throw error;
    state.groups = await request("/api/groups");
    return state.groups.find((group) => group.name === name);
  }
}

async function importTtyyItem(id) {
  const item = ttyyMigrationPreview.find((candidate) => candidate.id === id);
  if (!item) return;
  if (state.activities.some((activity) => activity.content.name === item.name)) return toast("这条活动已经导入过了");
  try {
    const group = await ensureTtyyGroup(item.groupName);
    const tagIds = [];
    const activity = await request("/api/activities", {
      method: "POST",
      body: JSON.stringify({
        groupId: group.id,
        advanceBookingHours: item.advanceBookingHours,
        leaderWechat: "",
        tagIds,
        translations: {
          "zh-CN": {
            name: item.name,
            summary: item.summary,
            meetingPointName: item.meetingPointName,
            suitableAge: item.suitableAge
          },
          en: {
            name: item.name,
            summary: "Imported from Tiantian Booking for migration testing.",
            meetingPointName: item.meetingPointName,
            suitableAge: item.suitableAge
          }
        },
        images: [{ cosKey: "demo/forest-hike-cover.jpg" }]
      })
    });
    await request(`/api/activities/${activity.id}/regular-schedule-rules`, {
      method: "POST",
      body: JSON.stringify({
        weekdays: [item.weekday],
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        capacity: item.capacity,
        priceOptions: [{ name: "成人", priceCents: item.priceCents }]
      })
    });
    state.groups = await request("/api/groups");
    await loadActivities();
    renderDialogOptions();
    renderOrderFilterOptions();
    renderGroups();
    renderTtyyMigrationPreview();
    toast("已导入这条天天预约活动");
  } catch (error) { toast(error.message); }
}

async function importTtyyPendingItems() {
  const pendingItems = ttyyMigrationPreview.filter((item) => !state.activities.some((activity) => activity.content.name === item.name));
  if (!pendingItems.length) return toast("没有待导入的活动");
  for (const item of pendingItems) {
    await importTtyyItem(item.id);
  }
}

function openGroupDialog(group = null) {
  const form = $("#group-form");
  form.reset();
  state.editingGroupId = group?.id ?? null;
  form.querySelector("h2").textContent = group ? "修改组名称" : "新增组";
  form.querySelector(".primary-button").textContent = group ? "保存修改" : "保存组";
  form.querySelector("input[name=name]").value = group?.name ?? "";
  $("#group-dialog").showModal();
}

async function refreshGroups() {
  state.groups = await request("/api/groups");
  renderDialogOptions();
  renderOrderFilterOptions();
  renderGroups();
  renderAdminAccounts();
  renderActivityList();
}

function renderAdminAccounts() {
  $("#admin-account-list").innerHTML = state.adminAccounts.map((account) => `
    <article class="account-card">
      <div>
        <div class="account-heading">
          <h3>${escapeHtml(account.displayName)}</h3>
          <span class="status-badge ${account.enabled ? "status-booked" : "status-cancelled"}">${account.enabled ? "启用" : "已停用"}</span>
        </div>
        <p>${escapeHtml(account.mobile)}</p>
        <div class="card-tags">${account.groups.map((group) => `<span class="small-tag">${escapeHtml(group.name)}</span>`).join("")}</div>
      </div>
      <div class="group-actions">
        ${account.role === "SUBACCOUNT" ? `
          <button class="secondary-button" data-toggle-account="${account.id}" data-next-enabled="${!account.enabled}">${account.enabled ? "停用" : "启用"}</button>
          <button class="secondary-button" data-edit-account="${account.id}">编辑权限</button>
        ` : `<span class="status-badge">主账号</span>`}
      </div>
    </article>
  `).join("");
  document.querySelectorAll("[data-edit-account]").forEach((button) => {
    button.addEventListener("click", () => openAdminAccountDialog(state.adminAccounts.find((account) => account.id === button.dataset.editAccount)));
  });
  document.querySelectorAll("[data-toggle-account]").forEach((button) => {
    button.addEventListener("click", async () => {
      await request(`/api/admin-accounts/${button.dataset.toggleAccount}/enabled`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: button.dataset.nextEnabled === "true" })
      });
      toast(button.dataset.nextEnabled === "true" ? "子账户已启用" : "子账户已停用");
      await loadSettings();
    });
  });
}

function openAdminAccountDialog(account = null) {
  const form = $("#admin-account-form");
  form.reset();
  state.editingAdminAccountId = account?.id ?? null;
  form.querySelector("h2").textContent = account ? "编辑子账户权限" : "新增子账户";
  form.querySelector(".primary-button").textContent = account ? "保存修改" : "保存子账户";
  form.querySelector("input[name=displayName]").value = account?.displayName ?? "";
  form.querySelector("input[name=mobile]").value = account?.mobile ?? "";
  const selected = new Set(account?.groupIds ?? []);
  $("#admin-account-groups").innerHTML = state.groups.map((group) => `
    <label class="checkbox-tag"><input type="checkbox" name="groupIds" value="${group.id}" ${selected.has(group.id) ? "checked" : ""} />${escapeHtml(group.name)}</label>
  `).join("");
  $("#admin-account-dialog").showModal();
}

async function loadCustomers() {
  state.customers = await request("/api/customers");
  renderCustomers();
}

function renderCustomers() {
  const search = state.customerSearchText.trim().toLocaleLowerCase();
  const customers = state.customers.filter((customer) =>
    !search || [customer.nickname, customer.mobile].some((value) => String(value ?? "").toLocaleLowerCase().includes(search))
  );
  $("#customer-count").textContent = `${customers.length} 位顾客`;
  $("#customer-list").innerHTML = customers.map((customer) => `
    <article class="customer-card">
      <div class="customer-card-heading">
        <div>
          <span class="customer-avatar">${escapeHtml(customer.nickname.slice(0, 1).toUpperCase())}</span>
          <div>
            <h3>${escapeHtml(customer.nickname)}</h3>
            <p>${escapeHtml(customer.mobile)}</p>
          </div>
        </div>
        <span class="status-badge ${customer.frozen ? "status-cancelled" : "status-booked"}">${customer.frozen ? "已冻结" : "正常使用"}</span>
      </div>
      <div class="wallet-summary">
        <span>钱包余额</span>
        <strong>${yuan(customer.walletBalanceCents)}</strong>
      </div>
      <div class="customer-actions">
        <button class="secondary-button" data-toggle-frozen="${customer.id}" data-next-frozen="${!customer.frozen}">${customer.frozen ? "解除冻结" : "冻结预约"}</button>
        <button class="primary-button" data-credit-wallet="${customer.id}">赠送余额</button>
      </div>
      <details>
        <summary>余额记录 ${customer.walletTransactions.length ? `(${customer.walletTransactions.length})` : ""}</summary>
        <div class="wallet-history">
          ${customer.walletTransactions.map((transaction) => `
            <div>
              <span>${dateTime(transaction.createdAt)}</span>
              <span>${escapeHtml(transaction.note)}</span>
              <strong>+ ${yuan(transaction.amountCents)}</strong>
            </div>
          `).join("") || `<p>暂时没有余额记录。</p>`}
        </div>
      </details>
    </article>
  `).join("") || `<div class="empty-state compact-empty"><h2>没有找到顾客</h2><p>可以换一个昵称或手机号搜索。</p></div>`;
  document.querySelectorAll("[data-toggle-frozen]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await request(`/api/customers/${button.dataset.toggleFrozen}/frozen`, {
          method: "PATCH",
          body: JSON.stringify({ frozen: button.dataset.nextFrozen === "true" })
        });
        toast(button.dataset.nextFrozen === "true" ? "顾客已冻结，预约时会显示系统故障" : "顾客已解除冻结");
        await loadCustomers();
      } catch (error) { toast(error.message); }
    });
  });
  document.querySelectorAll("[data-credit-wallet]").forEach((button) => {
    button.addEventListener("click", () => {
      state.walletCustomerId = button.dataset.creditWallet;
      $("#wallet-form").reset();
      $("#wallet-dialog").showModal();
    });
  });
}

async function selectActivity(id) {
  state.currentActivityId = id;
  const [activity, rules, slots] = await Promise.all([
    request(`/api/activities/${id}`),
    request(`/api/activities/${id}/schedule-rules`),
    request(`/api/activities/${id}/slots`)
  ]);
  const regularRules = rules.filter((rule) => rule.ruleType === "REGULAR");
  const restDays = rules.filter((rule) => rule.ruleType === "REST_DAY");
  renderActivityList();
  $("#detail-panel").innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${groupName(activity.groupId)}</p>
        <h2>${activity.content.name}</h2>
        <p>${activity.content.summary || "暂无简介"}</p>
        <div class="detail-tags">${activity.tags.map((tag) => `<span class="small-tag">${tag.name}</span>`).join("")}</div>
      </div>
      <div class="actions">
        <button id="edit-activity" class="secondary-button">编辑活动</button>
        <button id="toggle-pause" class="${activity.schedulePaused ? "primary-button" : "secondary-button"}">
          ${activity.schedulePaused ? "恢复排班" : "暂停排班"}
        </button>
        <button id="delete-activity" class="danger-button">删除活动</button>
      </div>
    </div>
    ${activity.schedulePaused ? `<div class="paused-notice">排班已暂停。原来的时间段仍然保留，恢复后可以继续预约。</div>` : ""}
    <div class="schedule-editor">
      <div class="schedule-tabs">
        <button class="schedule-tab ${state.activeScheduleTab === "regular" ? "active" : ""}" data-schedule-tab="regular">服务排班</button>
        <button class="schedule-tab ${state.activeScheduleTab === "rest" ? "active" : ""}" data-schedule-tab="rest">休息日</button>
        <button class="schedule-tab ${state.activeScheduleTab === "special" ? "active" : ""}" data-schedule-tab="special">特殊排班</button>
      </div>
      <div id="schedule-tab-content" class="schedule-editor-body">
        ${state.activeScheduleTab === "rest" ? renderRestDays(restDays) : state.activeScheduleTab === "special" ? renderSpecialSlots(slots) : renderRegularRules(regularRules)}
      </div>
    </div>
  `;
  $("#edit-activity").addEventListener("click", () => openActivityDialog(activity));
  $("#toggle-pause").addEventListener("click", async () => {
    await toggleActivitySchedulePause(activity);
  });
  $("#delete-activity").addEventListener("click", () => deleteActivityById(id, activity.content.name));
  if (state.activeScheduleTab === "rest") bindRestDayActions();
  else if (state.activeScheduleTab === "special") bindSpecialSlotActions(slots, regularRules);
  else bindRegularRuleActions(regularRules);
  document.querySelectorAll("[data-schedule-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeScheduleTab = button.dataset.scheduleTab;
      document.querySelectorAll("[data-schedule-tab]").forEach((item) => item.classList.toggle("active", item === button));
      const target = $("#schedule-tab-content");
      if (button.dataset.scheduleTab === "regular") {
        target.innerHTML = renderRegularRules(regularRules);
        bindRegularRuleActions(regularRules);
      }
      if (button.dataset.scheduleTab === "rest") {
        target.innerHTML = renderRestDays(restDays);
        bindRestDayActions();
      }
      if (button.dataset.scheduleTab === "special") {
        target.innerHTML = renderSpecialSlots(slots);
        bindSpecialSlotActions(slots, regularRules);
      }
    });
  });
}

function groupName(id) {
  return state.groups.find((group) => group.id === id)?.name ?? "未分组";
}

function weekdayName(weekday) {
  return ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"][weekday] ?? "未知";
}

function renderRegularRules(rules) {
  const hasPlan = rules.length > 0;
  return `
    <div class="section-heading">
      <div><h2>每周服务排班</h2><p>每个活动只有一套服务排班。保存后按星期编辑，时间以 15 分钟为单位。</p></div>
      <button id="${hasPlan ? "edit-regular-plan" : "new-regular-rule"}" class="${hasPlan ? "secondary-button" : "primary-button"}">
        ${hasPlan ? "编辑服务排班" : "＋ 新增服务排班"}
      </button>
    </div>
    ${[1, 2, 3, 4, 5, 6, 7].map((weekday) => {
      const dayRules = rules.filter((rule) => rule.weekday === weekday);
      return `
        <section class="day-schedule">
          <div class="day-heading">
            <h3>${weekdayName(weekday)}</h3>
            <div class="day-actions">
              <button class="compact-button" data-copy-weekday="${weekday}" ${dayRules.length ? "" : "disabled"}>复制排班</button>
              <button class="compact-button" data-add-weekday="${weekday}">＋ 添加时间段</button>
            </div>
          </div>
          ${dayRules.length ? `
            <div class="day-slot day-slot-head"><span>服务时间</span><span>规格价格</span><span>数量</span><span></span></div>
            ${dayRules.map((rule) => `
              <div class="day-slot">
                <span>${rule.startsAt} - ${rule.endsAt}</span>
                <span class="price-list">${renderPriceList(rule.priceOptions)}</span>
                <span>${rule.capacity || "待设置"} 人</span>
                <span class="rule-actions">
                  <button class="compact-button" data-edit-rule="${rule.id}">编辑</button>
                  <button class="delete-icon" title="删除排班" data-delete-rule="${rule.id}">×</button>
                </span>
              </div>
            `).join("")}
          ` : `<p class="no-rules">当天暂时没有排班。</p>`}
        </section>
      `;
    }).join("")}
  `;
}

function renderSpecialSlots(slots) {
  const slotsByDate = slots.reduce((groups, slot) => {
    const date = slot.startsAt.slice(0, 10);
    groups[date] = [...(groups[date] ?? []), slot];
    return groups;
  }, {});
  return `
    <div class="section-heading">
      <div><h2>特殊排班</h2><p>选择某一天后，在当天常规排班的基础上调整。特殊排班优先于休息日和常规排班。</p></div>
      <button id="new-slot" class="secondary-button">＋ 新增特殊排班</button>
    </div>
    <div class="special-day-list">
      ${Object.entries(slotsByDate).map(([date, daySlots]) => `
        <section class="special-day-card">
          <div class="day-heading">
            <h3>${date} · ${weekdayName(weekdayForDate(date))}</h3>
            <button class="compact-button" data-edit-special-day="${date}">编辑当天排班</button>
          </div>
          <div class="day-slot day-slot-head"><span>服务时间</span><span>规格价格</span><span>报名情况</span><span></span></div>
          ${daySlots.map((slot) => `
            <div class="day-slot">
              <span>${slot.startsAt.slice(11, 16)} - ${slot.endsAt.slice(11, 16)}</span>
              <span class="price-list">${renderPriceList(slot.priceOptions)}</span>
              <span class="capacity">已有 ${slot.bookedCount} 人报名，最多 ${slot.capacity} 人</span>
              <span class="rule-actions"><button class="delete-icon" title="删除特殊排班" data-delete-slot="${slot.id}">×</button></span>
            </div>
          `).join("")}
        </section>
      `).join("") || `<p class="no-rules">暂时没有特殊排班。</p>`}
    </div>
  `;
}

function renderRestDays(rules) {
  return `
    <div class="section-heading">
      <div><h2>休息日</h2><p>日期范围内暂停常规排班。若同一天另有特殊排班，特殊排班仍然有效。</p></div>
      <button id="new-rest-day" class="secondary-button">＋ 新增休息日</button>
    </div>
    <div class="rest-day-list">
      ${rules.map((rule) => `
        <div class="rest-day-row">
          <div><strong>${rule.validFrom}${rule.validFrom === rule.validUntil ? "" : ` 至 ${rule.validUntil}`}</strong><p>${rule.note || "休息日"}</p></div>
          <button class="delete-icon" title="删除休息日" data-delete-rest-day="${rule.id}">×</button>
        </div>
      `).join("") || `<p class="no-rules">暂时没有休息日。</p>`}
    </div>
  `;
}

function bindRestDayActions() {
  $("#new-rest-day").addEventListener("click", () => $("#rest-day-dialog").showModal());
  document.querySelectorAll("[data-delete-rest-day]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await request(`/api/schedule-rules/${button.dataset.deleteRestDay}`, { method: "DELETE" });
        toast("休息日已删除");
        await selectActivity(state.currentActivityId);
      } catch (error) { toast(error.message); }
    });
  });
}

function weekdayForDate(date) {
  return new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
}

function cloneScheduleSlot(slot) {
  return {
    id: slot.id,
    startsAt: slot.startsAt.includes("T") ? slot.startsAt.slice(11, 16) : slot.startsAt,
    endsAt: slot.endsAt.includes("T") ? slot.endsAt.slice(11, 16) : slot.endsAt,
    capacity: slot.capacity,
    bookedCount: slot.bookedCount ?? 0,
    priceOptions: slot.priceOptions.map(({ id, name, priceCents }) => ({ id, name, priceCents }))
  };
}

function renderSpecialDayEditor() {
  const container = $("#special-day-slots");
  container.innerHTML = state.specialDialogSlots.map((slot, index) => `
    <fieldset class="special-day-slot" data-special-slot-index="${index}" data-slot-id="${slot.id ?? ""}">
      <div class="special-slot-heading">
        <legend>时间段 ${index + 1}</legend>
        <button type="button" class="delete-icon" title="删除时间段" data-remove-special-slot="${index}">×</button>
      </div>
      <div class="form-grid">
        <label>开始时间<input name="startsAt" type="time" step="900" value="${slot.startsAt}" required /></label>
        <label>结束时间<input name="endsAt" type="time" step="900" value="${slot.endsAt}" required /></label>
      </div>
      <label>最多人数<input name="capacity" type="number" min="${Math.max(1, slot.bookedCount)}" value="${slot.capacity}" required /></label>
      <div>
        <p class="field-label">规格与价格</p>
        <div id="special-price-options-${index}" class="price-options"></div>
        <button type="button" class="compact-button" data-add-special-price="${index}">＋ 添加规格</button>
      </div>
    </fieldset>
  `).join("") || `<p class="no-rules">当天没有时间段。可以点击下方按钮添加。</p>`;
  state.specialDialogSlots.forEach((slot, index) => renderPriceOptions(`special-price-options-${index}`, slot.priceOptions));
  document.querySelectorAll("[data-add-special-price]").forEach((button) => {
    button.addEventListener("click", () => addPriceOption(`special-price-options-${button.dataset.addSpecialPrice}`));
  });
  document.querySelectorAll("[data-remove-special-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      state.specialDialogSlots.splice(Number(button.dataset.removeSpecialSlot), 1);
      renderSpecialDayEditor();
    });
  });
}

function loadSpecialDayDraft(date, slots, regularRules) {
  const existing = slots.filter((slot) => slot.startsAt.slice(0, 10) === date);
  state.specialDialogExistingSlots = existing.map(cloneScheduleSlot);
  state.specialDialogSlots = (existing.length
    ? existing
    : regularRules.filter((rule) => rule.weekday === weekdayForDate(date))
  ).map(cloneScheduleSlot);
  renderSpecialDayEditor();
}

function openSlotDialog({ date = "", slots = [], regularRules = [] } = {}) {
  const form = $("#slot-form");
  form.reset();
  state.specialDialogSlots = [];
  state.specialDialogExistingSlots = [];
  form.querySelector("h2").textContent = date ? "编辑当天特殊排班" : "新增特殊排班";
  form.querySelector("input[name=specialDate]").value = date;
  if (date) loadSpecialDayDraft(date, slots, regularRules);
  else renderSpecialDayEditor();
  form.querySelector("input[name=specialDate]").onchange = (event) => loadSpecialDayDraft(event.currentTarget.value, slots, regularRules);
  $("#slot-dialog").showModal();
}

function bindSpecialSlotActions(slots, regularRules) {
  $("#new-slot").addEventListener("click", () => openSlotDialog({ slots, regularRules }));
  document.querySelectorAll("[data-edit-special-day]").forEach((button) => {
    button.addEventListener("click", () => openSlotDialog({ date: button.dataset.editSpecialDay, slots, regularRules }));
  });
  document.querySelectorAll("[data-delete-slot]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await request(`/api/slots/${button.dataset.deleteSlot}`, { method: "DELETE" });
        toast("特殊排班已删除");
        await selectActivity(state.currentActivityId);
      } catch (error) { toast(error.message); }
    });
  });
}

function renderPriceList(options = []) {
  return options.map((option) => `<span class="small-tag">${option.name} ${yuan(option.priceCents)}</span>`).join("") || "待设置";
}

function renderPriceOptions(containerId, options = [{ name: "成人", priceCents: 26800 }]) {
  const container = $(`#${containerId}`);
  container.innerHTML = "";
  options.forEach((option) => addPriceOption(containerId, option));
}

function addPriceOption(containerId, option = { name: "", priceCents: 0 }) {
  const container = $(`#${containerId}`);
  const row = document.createElement("div");
  row.className = "price-option";
  row.dataset.priceOptionId = option.id ?? "";
  row.innerHTML = `
    <input name="priceOptionName" required maxlength="30" placeholder="规格名称，例如：成人" value="${option.name ?? ""}">
    <input name="priceOptionYuan" required type="number" min="0" step="0.01" placeholder="价格" value="${(option.priceCents ?? 0) / 100}">
    <button type="button" class="delete-icon" title="删除规格">×</button>
  `;
  row.querySelector(".delete-icon").addEventListener("click", () => {
    if (container.children.length === 1) return toast("请至少保留一个规格");
    row.remove();
  });
  container.append(row);
}

function readPriceOptions(form) {
  return [...form.querySelectorAll(".price-option")].map((row) => ({
    id: row.dataset.priceOptionId || undefined,
    name: row.querySelector("input[name=priceOptionName]").value.trim(),
    priceCents: Math.round(Number(row.querySelector("input[name=priceOptionYuan]").value) * 100)
  }));
}

function bindRegularRuleActions(rules) {
  const newPlan = $("#new-regular-rule");
  if (newPlan) newPlan.addEventListener("click", () => openRegularRuleDialog());
  const editPlan = $("#edit-regular-plan");
  if (editPlan) editPlan.addEventListener("click", () => toast("请在对应星期中编辑或添加时间段"));
  document.querySelectorAll("[data-add-weekday]").forEach((button) => {
    button.addEventListener("click", () => openRegularRuleDialog({ weekdays: [Number(button.dataset.addWeekday)] }));
  });
  document.querySelectorAll("[data-copy-weekday]").forEach((button) => {
    button.addEventListener("click", () => {
      const source = rules.find((rule) => rule.weekday === Number(button.dataset.copyWeekday));
      openRegularRuleDialog(source ? {
        ...source,
        weekdays: [],
        priceOptions: source.priceOptions.map(({ name, priceCents }) => ({ name, priceCents }))
      } : {});
    });
  });
  document.querySelectorAll("[data-edit-rule]").forEach((button) => {
    button.addEventListener("click", () => openRegularRuleDialog(rules.find((rule) => rule.id === button.dataset.editRule), true));
  });
  document.querySelectorAll("[data-delete-rule]").forEach((button) => {
    button.addEventListener("click", async () => {
      await request(`/api/schedule-rules/${button.dataset.deleteRule}`, { method: "DELETE" });
      toast("排班已删除");
      await selectActivity(state.currentActivityId);
    });
  });
}

function openRegularRuleDialog(rule = {}, editing = false) {
  const form = $("#regular-rule-form");
  form.reset();
  state.editingRuleId = editing ? rule.id : null;
  form.querySelectorAll("input[name=weekdays]").forEach((input) => {
    input.checked = (rule.weekdays ?? (editing ? [rule.weekday] : [])).includes(Number(input.value));
    input.disabled = editing;
  });
  form.querySelector("input[name=startsAt]").value = rule.startsAt ?? "14:00";
  form.querySelector("input[name=endsAt]").value = rule.endsAt ?? "18:00";
  form.querySelector("input[name=capacity]").value = rule.capacity ?? 12;
  renderPriceOptions("regular-price-options", rule.priceOptions);
  form.querySelector("h2").textContent = editing ? `编辑${weekdayName(rule.weekday)}排班` : "新增每周排班";
  form.querySelector(".primary-button").textContent = editing ? "保存修改" : "保存每周排班";
  $("#regular-rule-dialog").showModal();
}

function openActivityDialog(activity = null) {
  const form = $("#activity-form");
  form.reset();
  state.editingActivityId = activity?.id ?? null;
  state.descriptionDraft = activity?.content.descriptionHtml ?? "";
  state.activityGalleryDraft = normalizeActivityGallery(activity?.images);
  state.activityGallerySelectedIds = new Set();
  state.activityGalleryEditorOpen = false;
  form.querySelector(".eyebrow").textContent = activity ? "EDIT ACTIVITY" : "NEW ACTIVITY";
  form.querySelector("h2").textContent = activity ? "编辑活动" : "新增活动";
  form.querySelector(".primary-button").textContent = activity ? "保存修改" : "保存活动";
  if (activity) {
    form.querySelector("input[name=name]").value = activity.content.name;
    form.querySelector("select[name=groupId]").value = activity.groupId;
    form.querySelector("input[name=advanceBookingHours]").value = activity.advanceBookingHours;
    form.querySelector("textarea[name=summary]").value = activity.content.summary ?? "";
    form.querySelector("input[name=leaderWechat]").value = activity.leaderWechat ?? "";
    form.querySelector("input[name=meetingPointName]").value = activity.content.meetingPointName ?? "";
    form.querySelector("input[name=meetingLatitude]").value = activity.meetingLatitude ?? "";
    form.querySelector("input[name=meetingLongitude]").value = activity.meetingLongitude ?? "";
    const selectedTagIds = new Set(activity.tags.map((tag) => tag.id));
    form.querySelectorAll("input[name=tagIds]").forEach((input) => {
      input.checked = selectedTagIds.has(input.value);
    });
    const selectedGuideIds = new Set(activity.guides.map((guide) => guide.id));
    form.querySelectorAll("input[name=guideIds]").forEach((input) => {
      input.checked = selectedGuideIds.has(input.value);
    });
  }
  renderDescriptionStatus();
  renderActivityGallery();
  $("#activity-dialog").showModal();
}

function renderDescriptionStatus() {
  const text = state.descriptionDraft.replace(/<[^>]+>/g, "").trim();
  $("#description-status").textContent = text || state.descriptionDraft.includes("<") ? "已填写，可继续编辑" : "暂未填写详细介绍";
}

function normalizeActivityGallery(images = []) {
  return images
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((image, index) => ({
      id: image.id ?? `gallery-${Date.now()}-${index}`,
      cosKey: image.cosKey ?? image.url ?? "",
      sortOrder: index + 1
    }))
    .filter((image) => image.cosKey);
}

function activityGalleryImageUrl(image) {
  const value = image?.cosKey ?? "";
  if (value.startsWith("http") || value.startsWith("data:")) return value;
  return demoImageUrls[value] ?? "";
}

function renderActivityGallery() {
  const grid = $("#activity-gallery-grid");
  const preview = $("#activity-gallery-preview");
  const editor = $("#activity-gallery-editor");
  const moreButton = $("#activity-gallery-more");
  if (!grid || !preview || !editor || !moreButton) return;
  const selectedCount = state.activityGallerySelectedIds.size;
  $("#activity-gallery-status").textContent = state.activityGalleryDraft.length
    ? `共 ${state.activityGalleryDraft.length} 张${selectedCount ? `，已选 ${selectedCount} 张` : "，可拖动调整顺序"}`
    : "暂未上传照片";
  preview.innerHTML = state.activityGalleryDraft.length
    ? state.activityGalleryDraft.slice(0, 7).map((image, index) => `<img src="${escapeHtml(activityGalleryImageUrl(image))}" alt="活动照片 ${index + 1}" />`).join("")
    : `<div class="activity-gallery-preview-empty">暂无照片</div>`;
  editor.hidden = !state.activityGalleryEditorOpen;
  moreButton.textContent = state.activityGalleryEditorOpen ? "收起" : "更多";
  const deleteButton = $("#activity-gallery-delete-selected");
  deleteButton.disabled = selectedCount === 0;
  deleteButton.textContent = selectedCount ? `删除所选 ${selectedCount}` : "删除所选";
  grid.innerHTML = state.activityGalleryDraft.length
    ? state.activityGalleryDraft.map((image, index) => `
      <article class="activity-gallery-item ${state.activityGallerySelectedIds.has(image.id) ? "selected" : ""}" draggable="true" data-gallery-index="${index}">
        <img src="${escapeHtml(activityGalleryImageUrl(image))}" alt="活动照片 ${index + 1}" />
        <span class="activity-gallery-order">${index + 1}</span>
        <label class="activity-gallery-check" title="选择照片">
          <input type="checkbox" data-gallery-select="${image.id}" ${state.activityGallerySelectedIds.has(image.id) ? "checked" : ""} />
        </label>
      </article>
    `).join("")
    : `<div class="activity-gallery-empty">上传后会在这里全览照片，也可以拖动排序。</div>`;
  bindActivityGalleryEvents();
}

function reorderActivityGallery(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.activityGalleryDraft.length || toIndex >= state.activityGalleryDraft.length) return;
  const [image] = state.activityGalleryDraft.splice(fromIndex, 1);
  state.activityGalleryDraft.splice(toIndex, 0, image);
  state.activityGalleryDragIndex = toIndex;
  renderActivityGallery();
}

function bindActivityGalleryEvents() {
  document.querySelectorAll("[data-gallery-select]").forEach((input) => input.addEventListener("change", () => {
    if (input.checked) {
      state.activityGallerySelectedIds.add(input.dataset.gallerySelect);
    } else {
      state.activityGallerySelectedIds.delete(input.dataset.gallerySelect);
    }
    renderActivityGallery();
  }));
  document.querySelectorAll(".activity-gallery-item").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      item.classList.add("dragging");
      state.activityGalleryDragIndex = Number(item.dataset.galleryIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.galleryIndex);
    });
    item.addEventListener("dragend", () => {
      state.activityGalleryDragIndex = null;
      item.classList.remove("dragging");
    });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("dragenter", (event) => {
      event.preventDefault();
      const targetIndex = Number(item.dataset.galleryIndex);
      if (state.activityGalleryDragIndex !== null && state.activityGalleryDragIndex !== targetIndex) {
        reorderActivityGallery(state.activityGalleryDragIndex, targetIndex);
      }
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      state.activityGalleryDragIndex = null;
    });
  });
}

function renderBlogPostContentStatus() {
  const text = stripHtml(state.blogPostContentDraft);
  $("#blog-post-content-status").textContent = text || state.blogPostContentDraft.includes("<") ? "已填写，可继续编辑" : "暂未填写正文";
  $("#blog-post-form").elements.contentHtml.value = state.blogPostContentDraft;
}

function openDescriptionEditor(target) {
  state.editorTarget = target;
  const config = {
    activity: { eyebrow: "ACTIVITY DESCRIPTION", title: "编辑活动详细介绍", html: state.descriptionDraft },
    guide: { eyebrow: "GUIDE DESCRIPTION", title: "编辑领队详细介绍", html: state.guideDescriptionDraft },
    guidePage: { eyebrow: "GUIDE PAGE INTRODUCTION", title: "编辑领队主页总介绍", html: state.guidePage.introductionHtml },
    topicPage: { eyebrow: "TOPIC PAGE INTRODUCTION", title: "编辑专题页详细介绍", html: state.topicPageIntroductionDraft },
    blogPost: { eyebrow: "BLOG POST", title: "编辑文章正文", html: state.blogPostContentDraft }
  }[target];
  $("#description-editor-eyebrow").textContent = config.eyebrow;
  $("#description-editor-title").textContent = config.title;
  $("#description-editor").innerHTML = config.html;
  $("#description-dialog").showModal();
}

function insertDescriptionHtml(html) {
  $("#description-editor").focus();
  document.execCommand("insertHTML", false, html);
}

function readFilesAsDataUrls(files, callback) {
  [...files].forEach((file) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result, file));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

function safeContentUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:", "weixin:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function insertContentLink(kind, defaultLabel) {
  const label = window.prompt(`${kind}显示名称`, defaultLabel);
  if (!label) return;
  const url = safeContentUrl(window.prompt(`${kind}链接地址`) ?? "");
  if (!url) return;
  insertDescriptionHtml(`<a class="content-link" href="${url}" target="_blank" rel="noopener noreferrer">${kind} · ${escapeHtml(label)}</a><p><br></p>`);
}

$("#new-activity").addEventListener("click", () => openActivityDialog());
$("#new-guide").addEventListener("click", () => openGuideDialog());
document.querySelectorAll("[data-guide-calendar-mode]").forEach((button) => button.addEventListener("click", () => {
  state.guideCalendarMode = button.dataset.guideCalendarMode;
  renderGuideCalendar();
}));
$("#new-topic-page").addEventListener("click", () => openTopicPageDialog());
$("#new-home-entry").addEventListener("click", () => openHomeEntryDialog());
document.querySelectorAll("[data-add-home-module]").forEach((button) => button.addEventListener("click", async () => {
  const type = button.dataset.addHomeModule;
  try {
    const payload = { type, title: homeModuleNames[type], sortOrder: state.homeModules.length + 1, limit: type === "REVIEWS" ? 5 : 4, tagIds: [], published: true };
    if (type === "COLLAPSE") {
      Object.assign(payload, {
        title: "常见问题",
        limit: 3,
        items: [
          { title: "我们从哪里来？", content: "我们是大理在地生活和自然体验的组织者，慢慢整理适合旅行者参与的路线、手作和社区活动。" },
          { title: "我们在做什么？", content: "我们希望把没有太多游客的森林、溪流、植物和村庄体验，用更轻松、更可靠的方式分享给来大理的朋友。" },
          { title: "预订前需要知道什么？", content: "每个活动都会写明适合年龄、集合地点、提前预约时间和取消规则。天气原因需要调整时，请先联系领队。" }
        ],
        style: { backgroundColor: "#fffaf0", padding: 16 }
      });
    }
    const module = await request("/api/home-modules", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.homeModules = await request("/api/home-modules");
    state.selectedHomeModuleId = module.id;
    renderHomeModules();
    renderHomeModuleSettings();
    toast("首页模块已添加");
  } catch (error) { toast(error.message); }
}));
$("#edit-guide-page").addEventListener("click", () => openDescriptionEditor("guidePage"));
$("#open-topic-page-editor").addEventListener("click", () => openDescriptionEditor("topicPage"));
$("#manage-tags").addEventListener("click", () => {
  renderTagManager();
  $("#tag-dialog").showModal();
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("[data-add-price-option]").forEach((button) => {
  button.addEventListener("click", () => addPriceOption(`${button.dataset.addPriceOption}-price-options`));
});
$("#add-special-day-slot").addEventListener("click", () => {
  state.specialDialogSlots.push({
    startsAt: "14:00",
    endsAt: "18:00",
    capacity: 12,
    bookedCount: 0,
    priceOptions: [{ name: "成人", priceCents: 26800 }]
  });
  renderSpecialDayEditor();
});
$("#open-description-editor").addEventListener("click", () => {
  openDescriptionEditor("activity");
});
$("#activity-gallery-more").addEventListener("click", () => {
  state.activityGalleryEditorOpen = !state.activityGalleryEditorOpen;
  renderActivityGallery();
});
$("#activity-gallery-delete-selected").addEventListener("click", () => {
  const selectedCount = state.activityGallerySelectedIds.size;
  if (!selectedCount) return;
  state.activityGalleryDraft = state.activityGalleryDraft.filter((image) => !state.activityGallerySelectedIds.has(image.id));
  state.activityGallerySelectedIds = new Set();
  renderActivityGallery();
  toast(`已删除 ${selectedCount} 张照片`);
});
$("#activity-gallery-input").addEventListener("change", (event) => {
  const files = [...event.currentTarget.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  let loaded = 0;
  readFilesAsDataUrls(files, (dataUrl) => {
    state.activityGalleryDraft.push({
      id: `gallery-${Date.now()}-${loaded}`,
      cosKey: dataUrl,
      sortOrder: state.activityGalleryDraft.length + 1
    });
    loaded += 1;
    if (loaded === files.length) {
      event.currentTarget.value = "";
      renderActivityGallery();
      toast(`已加入 ${files.length} 张照片`);
    }
  });
});
$("#open-guide-description-editor").addEventListener("click", () => openDescriptionEditor("guide"));
$("#open-blog-post-editor").addEventListener("click", () => openDescriptionEditor("blogPost"));
$("#guide-photo-input").addEventListener("change", (event) => {
  readFilesAsDataUrls(event.currentTarget.files, (url) => {
    state.guidePhotoDraft = url;
    renderGuidePhotoPreview();
  });
  event.currentTarget.value = "";
});
$("#guide-gallery-more").addEventListener("click", () => {
  state.guideGalleryEditorOpen = !state.guideGalleryEditorOpen;
  renderGuideGallery();
});
$("#guide-gallery-delete-selected").addEventListener("click", () => {
  const selectedCount = state.guideGallerySelectedIds.size;
  if (!selectedCount) return;
  state.guideGalleryDraft = state.guideGalleryDraft.filter((image) => !state.guideGallerySelectedIds.has(image.id));
  state.guideGallerySelectedIds = new Set();
  renderGuideGallery();
  toast(`已删除 ${selectedCount} 张照片`);
});
$("#guide-gallery-input").addEventListener("change", (event) => {
  const files = [...event.currentTarget.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  let loaded = 0;
  readFilesAsDataUrls(files, (dataUrl) => {
    state.guideGalleryDraft.push({
      id: `guide-gallery-${Date.now()}-${loaded}`,
      cosKey: dataUrl,
      sortOrder: state.guideGalleryDraft.length + 1
    });
    loaded += 1;
    if (loaded === files.length) {
      event.currentTarget.value = "";
      renderGuideGallery();
      toast(`已加入 ${files.length} 张照片`);
    }
  });
});
document.querySelectorAll("[data-close-description]").forEach((button) => {
  button.addEventListener("click", () => $("#description-dialog").close());
});
$("#toggle-description-fullscreen").addEventListener("click", () => {
  $("#description-dialog").classList.toggle("fullscreen");
});
$("#save-description").addEventListener("click", async () => {
  const html = $("#description-editor").innerHTML;
  if (state.editorTarget === "activity") {
    state.descriptionDraft = html;
    renderDescriptionStatus();
  }
  if (state.editorTarget === "guide") {
    state.guideDescriptionDraft = html;
    renderGuideDescriptionStatus();
  }
  if (state.editorTarget === "guidePage") {
    try {
      state.guidePage = await request("/api/guide-page", { method: "PATCH", body: JSON.stringify({ introductionHtml: html }) });
      renderGuidePageStatus();
      toast("领队主页总介绍已保存");
    } catch (error) {
      return toast(error.message);
    }
  }
  if (state.editorTarget === "topicPage") {
    state.topicPageIntroductionDraft = html;
    renderTopicPageDescriptionStatus();
  }
  if (state.editorTarget === "blogPost") {
    state.blogPostContentDraft = html;
    renderBlogPostContentStatus();
  }
  $("#description-dialog").close();
});
$("#description-font-size").addEventListener("change", (event) => {
  $("#description-editor").focus();
  document.execCommand("fontSize", false, event.currentTarget.value);
});
document.querySelectorAll("[data-editor-command]").forEach((button) => {
  button.addEventListener("click", () => {
    $("#description-editor").focus();
    document.execCommand(button.dataset.editorCommand);
  });
});
$("#description-image-input").addEventListener("change", (event) => {
  readFilesAsDataUrls(event.currentTarget.files, (url, file) => {
    insertDescriptionHtml(`<img src="${url}" alt="${file.name}"><p><br></p>`);
  });
  event.currentTarget.value = "";
});
$("#description-video-input").addEventListener("change", (event) => {
  readFilesAsDataUrls(event.currentTarget.files, (url) => {
    insertDescriptionHtml(`<video controls src="${url}"></video><p><br></p>`);
  });
  event.currentTarget.value = "";
});
document.querySelectorAll("[data-editor-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.editorAction === "image") return $("#description-image-input").click();
    if (button.dataset.editorAction === "video") return $("#description-video-input").click();
    if (button.dataset.editorAction === "location") return insertContentLink("集合地点", "点击查看导航");
    if (button.dataset.editorAction === "article") return insertContentLink("公众号文章", "点击阅读相关文章");
    if (button.dataset.editorAction === "channels") return insertContentLink("视频号内容", "点击查看视频号内容");
  });
});
$("#tag-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const name = values.get("name").trim();
  const englishName = values.get("englishName").trim();
  try {
    await request("/api/tags", {
      method: "POST",
      body: JSON.stringify({
        code: tagCode(name),
        translations: { "zh-CN": name, ...(englishName ? { en: englishName } : {}) }
      })
    });
    state.tags = await request("/api/tags");
    form.reset();
    renderTagManager();
    renderTagFilters();
    renderDialogOptions();
    toast("标签已添加");
  } catch (error) { toast(error.message); }
});

$("#activity-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    const editing = Boolean(state.editingActivityId);
    const activity = await request(editing ? `/api/activities/${state.editingActivityId}` : "/api/activities", {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify({
        groupId: values.get("groupId"),
        advanceBookingHours: Number(values.get("advanceBookingHours")),
        leaderWechat: values.get("leaderWechat"),
        tagIds: values.getAll("tagIds"),
        guideIds: values.getAll("guideIds"),
        images: state.activityGalleryDraft.map((image, index) => ({ id: image.id, cosKey: image.cosKey, sortOrder: index + 1 })),
        meetingLatitude: values.get("meetingLatitude") ? Number(values.get("meetingLatitude")) : null,
        meetingLongitude: values.get("meetingLongitude") ? Number(values.get("meetingLongitude")) : null,
        translations: { "zh-CN": { name: values.get("name"), summary: values.get("summary"), meetingPointName: values.get("meetingPointName"), descriptionHtml: state.descriptionDraft } }
      })
    });
    $("#activity-dialog").close();
    form.reset();
    state.currentActivityId = editing ? state.editingActivityId : activity.id;
    state.editingActivityId = null;
    toast(editing ? "活动已修改" : "活动已新增");
    await loadActivities();
  } catch (error) { toast(error.message); }
});

$("#guide-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    await request(state.editingGuideId ? `/api/guides/${state.editingGuideId}` : "/api/guides", {
      method: state.editingGuideId ? "PATCH" : "POST",
      body: JSON.stringify({
        name: values.get("name"),
        photoUrl: state.guidePhotoDraft,
        descriptionHtml: state.guideDescriptionDraft,
        images: state.guideGalleryDraft.map((image, index) => ({ id: image.id, cosKey: image.cosKey, sortOrder: index + 1 }))
      })
    });
    $("#guide-dialog").close();
    state.guides = await request("/api/guides");
    renderDialogOptions();
    renderGuides();
    toast(state.editingGuideId ? "领队档案已修改" : "领队档案已新增");
    state.editingGuideId = null;
  } catch (error) { toast(error.message); }
});

$("#topic-page-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    await request(state.editingTopicPageId ? `/api/topic-pages/${state.editingTopicPageId}` : "/api/topic-pages", {
      method: state.editingTopicPageId ? "PATCH" : "POST",
      body: JSON.stringify({
        title: values.get("title"),
        slug: values.get("slug"),
        summary: values.get("summary"),
        imageUrl: values.get("imageUrl"),
        externalUrl: values.get("externalUrl"),
        tagIds: values.getAll("tagIds"),
        introductionHtml: state.topicPageIntroductionDraft,
        published: values.get("published") === "on"
      })
    });
    $("#topic-page-dialog").close();
    state.topicPages = await request("/api/topic-pages");
    renderTopicPages();
    toast(state.editingTopicPageId ? "专题页已修改" : "专题页已新增");
    state.editingTopicPageId = null;
  } catch (error) { toast(error.message); }
});

$("#new-blog-post").addEventListener("click", () => openBlogPostDialog());
$("#blog-post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    await request(state.editingBlogPostId ? `/api/blog-posts/${state.editingBlogPostId}` : "/api/blog-posts", {
      method: state.editingBlogPostId ? "PATCH" : "POST",
      body: JSON.stringify({
        title: values.get("title"),
        slug: values.get("slug"),
        coverUrl: values.get("coverUrl"),
        tags: values.get("tags"),
        summary: values.get("summary"),
        contentHtml: bodyToHtml(state.blogPostContentDraft),
        publishedAt: values.get("publishedAt") ? new Date(values.get("publishedAt")).toISOString() : new Date().toISOString(),
        published: values.get("published") === "on"
      })
    });
    $("#blog-post-dialog").close();
    state.blogPosts = await request("/api/blog-posts");
    renderBlogPosts();
    toast(state.editingBlogPostId ? "文章已修改" : "文章已新增");
    state.editingBlogPostId = null;
  } catch (error) { toast(error.message); }
});

$("#delete-blog-post").addEventListener("click", async () => {
  if (!state.editingBlogPostId || !window.confirm("确定删除这篇文章吗？")) return;
  try {
    await request(`/api/blog-posts/${state.editingBlogPostId}`, { method: "DELETE" });
    $("#blog-post-dialog").close();
    state.blogPosts = await request("/api/blog-posts");
    state.editingBlogPostId = null;
    renderBlogPosts();
    toast("文章已删除");
  } catch (error) { toast(error.message); }
});

$("#home-entry-form").elements.targetType.addEventListener("change", () => renderHomeEntryTargetOptions());
$("#home-entry-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    await request(state.editingHomeEntryId ? `/api/home-entries/${state.editingHomeEntryId}` : "/api/home-entries", {
      method: state.editingHomeEntryId ? "PATCH" : "POST",
      body: JSON.stringify({
        title: values.get("title"),
        subtitle: values.get("subtitle"),
        imageUrl: values.get("imageUrl"),
        targetType: values.get("targetType"),
        targetValue: values.get("targetValue"),
        sortOrder: Number(values.get("sortOrder")),
        published: values.get("published") === "on"
      })
    });
    $("#home-entry-dialog").close();
    state.homeEntries = await request("/api/home-entries");
    renderHomeEntries();
    toast(state.editingHomeEntryId ? "首页入口已修改" : "首页入口已新增");
    state.editingHomeEntryId = null;
  } catch (error) { toast(error.message); }
});

$("#delete-home-entry").addEventListener("click", async () => {
  if (!state.editingHomeEntryId || !window.confirm("确定删除这个首页入口吗？")) return;
  try {
    await request(`/api/home-entries/${state.editingHomeEntryId}`, { method: "DELETE" });
    $("#home-entry-dialog").close();
    state.homeEntries = await request("/api/home-entries");
    state.editingHomeEntryId = null;
    renderHomeEntries();
    toast("首页入口已删除");
  } catch (error) { toast(error.message); }
});

$("#delete-topic-page").addEventListener("click", async () => {
  if (!state.editingTopicPageId || !window.confirm("确定删除这个专题页吗？")) return;
  try {
    await request(`/api/topic-pages/${state.editingTopicPageId}`, { method: "DELETE" });
    $("#topic-page-dialog").close();
    state.topicPages = await request("/api/topic-pages");
    state.editingTopicPageId = null;
    renderTopicPages();
    toast("专题页已删除");
  } catch (error) { toast(error.message); }
});

$("#slot-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    const specialDate = values.get("specialDate");
    const rows = [...form.querySelectorAll("[data-special-slot-index]")];
    const nextSlots = rows.map((row) => ({
      id: row.dataset.slotId || null,
      startsAt: `${specialDate}T${row.querySelector("input[name=startsAt]").value}:00+08:00`,
      endsAt: `${specialDate}T${row.querySelector("input[name=endsAt]").value}:00+08:00`,
      capacity: Number(row.querySelector("input[name=capacity]").value),
      priceOptions: readPriceOptions(row)
    }));
    if (nextSlots.length === 0) throw new Error("请至少保留一个时间段；整天休息请使用“休息日”");
    const keptIds = new Set(nextSlots.map((slot) => slot.id).filter(Boolean));
    const deletedSlots = state.specialDialogExistingSlots.filter((slot) => slot.id && !keptIds.has(slot.id));
    for (const slot of deletedSlots) await request(`/api/slots/${slot.id}`, { method: "DELETE" });
    for (const slot of nextSlots) {
      await request(slot.id ? `/api/slots/${slot.id}` : `/api/activities/${state.currentActivityId}/slots`, {
        method: slot.id ? "PATCH" : "POST",
        body: JSON.stringify(slot)
      });
    }
    $("#slot-dialog").close();
    form.reset();
    state.specialDialogSlots = [];
    state.specialDialogExistingSlots = [];
    toast("当天特殊排班已保存");
    await selectActivity(state.currentActivityId);
  } catch (error) { toast(error.message); }
});

$("#rest-day-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    await request(`/api/activities/${state.currentActivityId}/schedule-rules`, {
      method: "POST",
      body: JSON.stringify({
        ruleType: "REST_DAY",
        validFrom: values.get("validFrom"),
        validUntil: values.get("validUntil"),
        note: values.get("note")
      })
    });
    $("#rest-day-dialog").close();
    form.reset();
    toast("休息日已新增");
    await selectActivity(state.currentActivityId);
  } catch (error) { toast(error.message); }
});

$("#cancel-order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await request(`/api/orders/${state.cancellingOrderId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ note: new FormData(form).get("note") })
    });
    $("#cancel-order-dialog").close();
    state.cancellingOrderId = null;
    toast("订单已取消，名额已经释放");
    await loadOrders();
    if (state.currentActivityId) await selectActivity(state.currentActivityId);
  } catch (error) { toast(error.message); }
});

$("#wallet-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    await request(`/api/customers/${state.walletCustomerId}/wallet-adjustments`, {
      method: "POST",
      body: JSON.stringify({
        amountCents: Math.round(Number(values.get("amountYuan")) * 100),
        note: values.get("note")
      })
    });
    $("#wallet-dialog").close();
    state.walletCustomerId = null;
    toast("余额已赠送，记录已保存");
    await loadCustomers();
  } catch (error) { toast(error.message); }
});

$("#new-group").addEventListener("click", () => openGroupDialog());
$("#import-ttyy-preview").addEventListener("click", importTtyyPendingItems);
$("#review-reply-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request(`/api/reviews/${state.replyingReviewId}/replies`, {
      method: "POST",
      body: JSON.stringify({ adminAccountId: "account-owner", content: new FormData(event.currentTarget).get("content") })
    });
    $("#review-reply-dialog").close();
    toast("管理员回复已发送");
    await loadReviews();
  } catch (error) { toast(error.message); }
});
$("#group-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = new FormData(form).get("name");
  try {
    await request(state.editingGroupId ? `/api/groups/${state.editingGroupId}` : "/api/groups", {
      method: state.editingGroupId ? "PATCH" : "POST",
      body: JSON.stringify({ name })
    });
    $("#group-dialog").close();
    toast(state.editingGroupId ? "组名称已修改" : "组已新增");
    state.editingGroupId = null;
    await refreshGroups();
  } catch (error) { toast(error.message); }
});

$("#new-admin-account").addEventListener("click", () => openAdminAccountDialog());
$("#admin-account-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    await request(state.editingAdminAccountId ? `/api/admin-accounts/${state.editingAdminAccountId}` : "/api/admin-accounts", {
      method: state.editingAdminAccountId ? "PATCH" : "POST",
      body: JSON.stringify({
        displayName: values.get("displayName"),
        mobile: values.get("mobile"),
        groupIds: values.getAll("groupIds")
      })
    });
    $("#admin-account-dialog").close();
    toast(state.editingAdminAccountId ? "子账户权限已修改" : "子账户已新增");
    state.editingAdminAccountId = null;
    await loadSettings();
  } catch (error) { toast(error.message); }
});

$("#regular-rule-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    const payload = {
      weekdays: values.getAll("weekdays").map(Number),
      startsAt: values.get("startsAt"),
      endsAt: values.get("endsAt"),
      capacity: Number(values.get("capacity")),
      priceOptions: readPriceOptions(form)
    };
    if (state.editingRuleId) {
      delete payload.weekdays;
      await request(`/api/schedule-rules/${state.editingRuleId}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      await request(`/api/activities/${state.currentActivityId}/regular-schedule-rules`, { method: "POST", body: JSON.stringify(payload) });
    }
    $("#regular-rule-dialog").close();
    form.reset();
    toast(state.editingRuleId ? "排班已修改" : "每周排班已新增");
    state.editingRuleId = null;
    await selectActivity(state.currentActivityId);
  } catch (error) { toast(error.message); }
});

$("#ai-settings-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  await request("/api/ai/settings", {
    method: "PATCH",
    body: JSON.stringify({
      model: values.get("model"),
      monthlyBudgetCents: Math.round(Number(values.get("monthlyBudgetYuan") || 0) * 100),
      enabled: values.get("enabled") === "on"
    })
  });
  toast("AI 设置已保存");
  await loadAiPage();
});

$("#refresh-ai-questions")?.addEventListener("click", loadAiPage);

$("#faq-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const id = values.get("id");
  const payload = {
    question: values.get("question"),
    answer: values.get("answer"),
    sortOrder: Number(values.get("sortOrder") || state.faqs.length + 1),
    published: values.get("published") === "on"
  };
  await request(id ? `/api/faqs/${id}` : "/api/faqs", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
  toast("FAQ 已保存");
  resetFaqForm();
  await loadAiPage();
});

$("#reset-faq-form")?.addEventListener("click", () => resetFaqForm());

loadBaseData().then(async () => {
  const initialView = new URLSearchParams(window.location.search).get("view");
  if (initialView) await showView(initialView);
}).catch((error) => {
  $("#detail-panel").innerHTML = `<div class="empty-state"><h2>本地 API 尚未启动</h2><p>${error.message}</p></div>`;
});
