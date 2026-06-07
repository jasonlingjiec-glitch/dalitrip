const API = "http://localhost:3000/api";
const accountId = new URLSearchParams(location.search).get("accountId") || "account-guide-demo";
const state = { account: null, groups: [], tags: [], guides: [], activities: [], orders: [], reviews: [], notifications: [], guideCalendar: { dates: [], guides: [], availability: [] }, guideCalendarMode: "mark", guideCalendarFilter: "all", activeTab: "active", activeView: "workbench", cancellingOrderId: null, editingActivityId: null, editingMeetingPoint: null, editingGuideId: null, guidePhotoDraft: "", guideDescriptionHtmlDraft: "", guideDescriptionTextOriginal: "", scheduleActivity: null, scheduleRules: [], restDays: [], specialSlots: [], activeScheduleTab: "regular", editingRuleId: null, replyingReviewId: null, specialDraftRows: [], specialExistingSlots: [], savingSpecialDay: false };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const yuan = (cents) => `¥${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const dateOnly = (value) => String(value).slice(0, 10);
const timeOnly = (value) => String(value).slice(11, 16);
const managerBody = (input = {}) => JSON.stringify({ ...input, adminAccountId: accountId });
const managerPath = (path) => `${path}${path.includes("?") ? "&" : "?"}adminAccountId=${accountId}`;
const htmlToText = (value) => String(value ?? "").replace(/<[^>]+>/g, "").trim();
const nonActivityGuideNames = new Set(["深夜食堂旧时光", "大家在一起的时间", "在一起的日子"]);
const isActivitySelectableGuide = (guide) => !nonActivityGuideNames.has(guide?.name);
const sortGuidesForDisplay = (guides = []) => [...guides].sort((left, right) => {
  const leftArchived = isActivitySelectableGuide(left) ? 0 : 1;
  const rightArchived = isActivitySelectableGuide(right) ? 0 : 1;
  return leftArchived - rightArchived || (left.sortOrder ?? 9999) - (right.sortOrder ?? 9999);
});
let staticDataPromise;

const loadStaticData = async () => {
  if (!staticDataPromise) {
    staticDataPromise = fetch("../../data/runtime-data.json").then((response) => {
      if (!response.ok) throw new Error("静态数据读取失败");
      return response.json();
    });
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

const localizedContent = (activity) => activity?.content ?? activity?.translations?.["zh-CN"] ?? activity?.translations?.en ?? {};
const staticAccount = (data, id) => {
  const account = data.adminAccounts.find((item) => item.id === id) ?? data.adminAccounts[0];
  return account ? { ...account, groups: account.groupIds.map((groupId) => data.groups.find((group) => group.id === groupId)).filter(Boolean) } : null;
};
const staticPresentActivity = (activity, data) => ({
  ...activity,
  content: localizedContent(activity),
  groupName: data.groups.find((group) => group.id === activity.groupId)?.name ?? "活动"
});
const staticPresentGuide = (guide, data) => ({
  ...guide,
  activities: data.activities
    .filter((activity) => (activity.guideIds ?? []).includes(guide.id))
    .map((activity) => ({ id: activity.id, name: localizedContent(activity).name, summary: localizedContent(activity).summary }))
});
const staticManagedGuideIds = (data, adminAccountId) => {
  const account = staticAccount(data, adminAccountId);
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
const staticGuideCalendar = (data, adminAccountId) => {
  const dates = staticCalendarDates();
  const managedGuideIds = staticManagedGuideIds(data, adminAccountId);
  return {
    dates,
    guides: data.guides.filter((guide) => managedGuideIds.has(guide.id)).map((guide) => staticPresentGuide(guide, data)),
    availability: (data.guideAvailability ?? []).filter((item) => managedGuideIds.has(item.guideId) && dates.includes(item.date))
  };
};
const staticOrder = (order, data) => {
  const activity = data.activities.find((item) => item.id === order.activityId);
  const slot = data.slots.find((item) => item.id === order.slotId);
  const customer = data.customers.find((item) => item.id === order.customerId);
  return {
    ...order,
    activityName: localizedContent(activity).name ?? "活动",
    groupName: data.groups.find((group) => group.id === order.groupId)?.name ?? "活动",
    startsAt: slot?.startsAt ?? order.createdAt,
    endsAt: slot?.endsAt ?? order.createdAt,
    customerNickname: customer?.profile?.nickname ?? "客人",
    customerMobile: customer?.profile?.mobile ?? ""
  };
};

async function staticRequest(path, options = {}) {
  const data = await loadStaticData();
  const url = new URL(path, "https://dalitrip.local");
  const route = url.pathname;
  const method = (options.method || "GET").toUpperCase();
  const adminAccountId = url.searchParams.get("adminAccountId") || parseBody(options).adminAccountId || accountId;
  const account = staticAccount(data, adminAccountId);

  if (route === "/admin-accounts") return data.adminAccounts.map((item) => staticAccount(data, item.id));
  if (route === "/groups") return data.groups;
  if (route === "/tags") return data.tags;
  if (route === "/guides") return sortGuidesForDisplay(data.guides).map((guide) => staticPresentGuide(guide, data));
  if (route === "/notifications") return data.notifications ?? [];
  if (route === "/orders") return data.orders.filter((order) => !account || account.groupIds.includes(order.groupId)).map((order) => staticOrder(order, data));
  if (route === "/activities") return data.activities.filter((activity) => !account || account.groupIds.includes(activity.groupId)).map((activity) => staticPresentActivity(activity, data));
  if (method === "GET" && route === "/guide-calendar") return staticGuideCalendar(data, adminAccountId);
  if (method === "PATCH" && route === "/guide-calendar") {
    const body = parseBody(options);
    data.guideAvailability = (data.guideAvailability ?? []).filter((item) => !(item.guideId === body.guideId && item.date === body.date));
    if (body.status !== "FREE") data.guideAvailability.push({ id: `demo-guide-${Date.now()}`, guideId: body.guideId, date: body.date, status: body.status, updatedBy: adminAccountId, updatedAt: new Date().toISOString() });
    return staticGuideCalendar(data, adminAccountId);
  }
  if (/^\/activities\/[^/]+$/.test(route)) {
    const activity = data.activities.find((item) => item.id === route.split("/")[2]);
    if (!activity) throw new Error("活动不存在");
    return staticPresentActivity(activity, data);
  }
  if (/^\/activities\/[^/]+\/schedule-rules$/.test(route)) return data.scheduleRules.filter((rule) => rule.activityId === route.split("/")[2]);
  if (/^\/activities\/[^/]+\/slots$/.test(route)) return data.slots.filter((slot) => slot.activityId === route.split("/")[2]);
  if (route === "/reviews") return data.reviews.filter((review) => !url.searchParams.get("activityId") || review.activityId === url.searchParams.get("activityId"));
  throw new Error("静态演示暂不支持这个操作");
}

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API}${path}`, { headers: { "content-type": "application/json" }, ...options });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "请求失败");
    return payload.data;
  } catch (error) {
    console.info("使用静态演示数据", path, error.message);
    return staticRequest(path, options);
  }
}

function statusLabel(status) {
  return { PENDING_PAYMENT: "待付款", BOOKED: "已预约", COMPLETED: "已完成", REFUNDED: "退款完成", CANCELLED: "已取消" }[status] || status;
}

function activeOrders() {
  const day = $("#active-date").value;
  const groupId = $("#group-filter").value;
  return state.orders.filter((order) => {
    if (groupId && order.groupId !== groupId) return false;
    if (day && dateOnly(order.startsAt) !== day) return false;
    if (state.activeTab === "active") return ["PENDING_PAYMENT", "BOOKED"].includes(order.status);
    if (state.activeTab === "finished") return order.status === "COMPLETED";
    return ["REFUNDED", "CANCELLED"].includes(order.status);
  });
}

function renderWorkbench() {
  const orders = activeOrders();
  $("#pending-count").textContent = state.orders.filter((order) => ["PENDING_PAYMENT", "BOOKED"].includes(order.status)).length;
  $("#month-completed-count").textContent = state.orders.filter((order) => order.status === "COMPLETED").length;
  $("#manager-order-list").innerHTML = orders.map((order) => `
    <article class="order-card">
      <div class="order-top"><span>${escapeHtml(order.groupName)}</span><strong>${yuan(order.amountCents)}</strong></div>
      <h3>${escapeHtml(order.activityName)}</h3>
      <p>${timeOnly(order.startsAt)}-${timeOnly(order.endsAt)} · ${escapeHtml(order.specification)} × ${order.quantity}</p>
      <p class="customer">${escapeHtml(order.customerNickname)} ${escapeHtml(order.customerMobile)}</p>
      <div class="order-bottom">
        <small>${escapeHtml(order.orderNo)}</small>
        <div class="actions">
          <button class="secondary" data-detail="${order.id}">查看</button>
          ${["PENDING_PAYMENT", "BOOKED"].includes(order.status) ? `<button class="danger" data-cancel="${order.id}">取消</button>` : ""}
        </div>
      </div>
    </article>
  `).join("") || `<div class="empty">这一天没有符合条件的订单</div>`;
  bindOrderActions();
  renderNotificationSummary();
}

function renderNotificationSummary() {
  const unread = state.notifications.filter((notification) => !notification.read);
  $("#notification-summary-text").textContent = unread.length ? `${unread.length} 条未读，点击查看` : "暂无未读消息";
  $("#notification-unread-count").hidden = unread.length === 0;
  $("#notification-unread-count").textContent = unread.length;
}

function renderManagerNotifications() {
  $("#manager-notification-list").innerHTML = state.notifications.map((notification) => `
    <button class="manager-notification-card ${notification.read ? "" : "unread"}" data-open-notification="${notification.id}">
      <span>${notification.read ? "已读" : "未读"}</span>
      <strong>${escapeHtml(notification.title)}</strong>
      <p>${escapeHtml(notification.message)}</p>
      <small>${escapeHtml(notification.activityName)}</small>
    </button>
  `).join("") || `<div class="empty">暂时没有评价互动提醒</div>`;
  document.querySelectorAll("[data-open-notification]").forEach((button) => button.addEventListener("click", async () => {
    const notification = state.notifications.find((item) => item.id === button.dataset.openNotification);
    if (!notification.read) {
      await request(`/notifications/${notification.id}/read`, { method: "PATCH", body: managerBody() });
      notification.read = true;
      renderNotificationSummary();
    }
    $("#manager-notifications-dialog").close();
    await openManagerReviews(notification.activityId);
  }));
}

async function openManagerNotifications() {
  await refreshNotifications();
  renderManagerNotifications();
  $("#manager-notifications-dialog").showModal();
}

async function refreshNotifications({ announce = false } = {}) {
  const previousUnread = state.notifications.filter((notification) => !notification.read).length;
  state.notifications = await request(managerPath("/notifications"));
  const unread = state.notifications.filter((notification) => !notification.read).length;
  renderNotificationSummary();
  if (announce && unread > previousUnread) toast("收到新的评价互动提醒");
}

function renderActivities() {
  const allowed = state.activities.filter((activity) => state.account.groupIds.includes(activity.groupId));
  $("#manager-activity-list").innerHTML = allowed.map((activity) => `
    <article class="activity-card">
      <div class="activity-top"><h3>${escapeHtml(activity.content.name)}</h3><div class="activity-actions"><button class="secondary" data-edit-activity="${activity.id}">编辑</button><button class="secondary" data-manage-activity="${activity.id}">管理排班</button><button class="secondary" data-review-activity="${activity.id}">评价回复</button></div></div>
      <p>${escapeHtml(activity.content.summary)}</p>
      <span class="tag">${activity.schedulePaused ? "排班已暂停" : "排班进行中"}</span>
    </article>
  `).join("") || `<div class="empty">当前账户还没有可管理的活动</div>`;
  document.querySelectorAll("[data-manage-activity]").forEach((button) => button.addEventListener("click", () => openSchedule(button.dataset.manageActivity)));
  document.querySelectorAll("[data-edit-activity]").forEach((button) => button.addEventListener("click", () => openActivityEdit(state.activities.find((activity) => activity.id === button.dataset.editActivity))));
  document.querySelectorAll("[data-review-activity]").forEach((button) => button.addEventListener("click", () => openManagerReviews(button.dataset.reviewActivity)));
}

function renderManagerGuides() {
  $("#manager-guide-list").innerHTML = state.guides.map((guide) => `
    <article class="manager-guide-card">
      ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<div class="manager-guide-placeholder">照片</div>`}
      <div>
        <h3>${escapeHtml(guide.name)}</h3>
        <p>${escapeHtml(htmlToText(guide.descriptionHtml)) || "暂未填写领队介绍"}</p>
        <span>${guide.activities.length} 个相关活动</span>
      </div>
      <button class="secondary" data-edit-manager-guide="${guide.id}">编辑</button>
    </article>
  `).join("") || `<div class="empty">还没有领队档案</div>`;
  document.querySelectorAll("[data-edit-manager-guide]").forEach((button) => button.addEventListener("click", () => openManagerGuide(state.guides.find((guide) => guide.id === button.dataset.editManagerGuide))));
}

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
const currentAccountGuide = () => state.guideCalendar.guides.find((guide) => guide.name === state.account?.displayName) ?? null;
const guideHasOpenSlot = (guide) => state.guideCalendar.dates.some((date) => guideSlotStatus(guide.id, date) !== "FULL");
const visibleCalendarGuides = () => {
  if (state.guideCalendarFilter === "mine") {
    const guide = currentAccountGuide();
    return guide ? [guide] : [];
  }
  if (state.guideCalendarFilter === "available") return state.guideCalendar.guides.filter(guideHasOpenSlot);
  return state.guideCalendar.guides;
};
const guideDateLabel = (date) => {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
};
const guideWeekLabel = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return "日一二三四五六"[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
};

async function loadManagerGuideCalendar() {
  state.guideCalendar = await request(managerPath("/guide-calendar"));
  renderManagerGuideCalendar();
}

function renderManagerGuideCalendar() {
  document.querySelectorAll("[data-manager-guide-calendar-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.managerGuideCalendarMode === state.guideCalendarMode);
  });
  document.querySelectorAll("[data-manager-guide-calendar-filter]").forEach((button) => {
    const filter = button.dataset.managerGuideCalendarFilter;
    button.classList.toggle("active", filter === state.guideCalendarFilter);
    if (filter === "mine") button.disabled = !currentAccountGuide();
  });
  if (state.guideCalendarMode === "free") return renderManagerGuideFreeCalendar();
  return renderManagerGuideMarkCalendar();
}

function renderManagerGuideMarkCalendar() {
  const { dates } = state.guideCalendar;
  const guides = visibleCalendarGuides();
  $("#manager-guide-calendar-content").innerHTML = guides.length ? `
    <div class="manager-guide-calendar-help">每个日期分上午、下午两格，点击对应半天即可标记或取消占用。</div>
    <section class="manager-guide-calendar-list">
      ${guides.map((guide) => `
        <article class="manager-calendar-card">
          <header>
            ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<span>${escapeHtml(guide.name.slice(0, 1))}</span>`}
            <div>
              <h2>${escapeHtml(guide.name)}</h2>
              <p>${guide.activities.length} 条相关路线</p>
            </div>
          </header>
          <div class="manager-calendar-grid">
            ${dates.map((date) => {
              const status = guideSlotStatus(guide.id, date);
              return `<article class="manager-guide-day status-${status.toLowerCase()}">
                <header><strong>${guideDateLabel(date)}</strong><small>周${guideWeekLabel(date)}</small></header>
                <button class="manager-guide-half ${guideSlotOccupied(status, "MORNING") ? "occupied" : ""}" type="button" data-manager-guide-availability="${guide.id}" data-manager-guide-date="${date}" data-manager-guide-status="${status}" data-manager-guide-slot="MORNING">
                  <b>上午</b><span>${guideSlotOccupied(status, "MORNING") ? "🔒 占用" : "空"}</span>
                </button>
                <button class="manager-guide-half ${guideSlotOccupied(status, "AFTERNOON") ? "occupied" : ""}" type="button" data-manager-guide-availability="${guide.id}" data-manager-guide-date="${date}" data-manager-guide-status="${status}" data-manager-guide-slot="AFTERNOON">
                  <b>下午</b><span>${guideSlotOccupied(status, "AFTERNOON") ? "🔒 占用" : "空"}</span>
                </button>
              </article>`;
            }).join("")}
          </div>
        </article>
      `).join("")}
    </section>
  ` : `<div class="empty">${state.guideCalendarFilter === "mine" ? "当前账号还没有匹配到同名领队档案。" : "暂无符合条件的领队。"}</div>`;
  document.querySelectorAll("[data-manager-guide-availability]").forEach((button) => button.addEventListener("click", () => updateManagerGuideAvailability(button)));
}

function renderManagerGuideFreeCalendar() {
  const { dates } = state.guideCalendar;
  const guides = visibleCalendarGuides();
  $("#manager-guide-calendar-content").innerHTML = guides.length ? `
    <section class="manager-free-list">
      ${dates.map((date) => {
        const allDay = guides.filter((guide) => guideSlotStatus(guide.id, date) === "FREE");
        const morning = guides.filter((guide) => !["MORNING", "FULL"].includes(guideSlotStatus(guide.id, date)));
        const afternoon = guides.filter((guide) => !["AFTERNOON", "FULL"].includes(guideSlotStatus(guide.id, date)));
        const names = (items) => items.map((guide) => `<span>${escapeHtml(guide.name)}</span>`).join("") || `<em>暂无</em>`;
        return `<article class="manager-free-day">
          <header><strong>${guideDateLabel(date)}</strong><small>周${guideWeekLabel(date)}</small></header>
          <div><b>全天空</b><p>${names(allDay)}</p></div>
          <div><b>上午空</b><p>${names(morning)}</p></div>
          <div><b>下午空</b><p>${names(afternoon)}</p></div>
        </article>`;
      }).join("")}
    </section>
  ` : `<div class="empty">${state.guideCalendarFilter === "mine" ? "当前账号还没有匹配到同名领队档案。" : "暂无符合条件的领队。"}</div>`;
}

async function updateManagerGuideAvailability(button) {
  const status = guideNextHalfStatus(button.dataset.managerGuideStatus ?? "FREE", button.dataset.managerGuideSlot);
  button.disabled = true;
  try {
    state.guideCalendar = await request("/guide-calendar", {
      method: "PATCH",
      body: managerBody({
        guideId: button.dataset.managerGuideAvailability,
        date: button.dataset.managerGuideDate,
        status
      })
    });
    renderManagerGuideCalendar();
    toast(status === "FREE" ? "已清空占用" : `已标记${guideSlotLabels[status]}`);
  } catch (error) {
    toast(error.message);
    button.disabled = false;
  }
}

function renderManagerGuidePhoto() {
  const preview = $("#manager-guide-photo-preview");
  preview.hidden = !state.guidePhotoDraft;
  preview.src = state.guidePhotoDraft || "";
}

function openManagerGuide(guide = null) {
  state.editingGuideId = guide?.id ?? null;
  state.guidePhotoDraft = guide?.photoUrl ?? "";
  state.guideDescriptionHtmlDraft = guide?.descriptionHtml ?? "";
  state.guideDescriptionTextOriginal = htmlToText(guide?.descriptionHtml);
  const form = $("#manager-guide-form");
  form.reset();
  form.querySelector("h2").textContent = guide ? "编辑领队" : "新增领队";
  form.elements.name.value = guide?.name ?? "";
  form.elements.description.value = state.guideDescriptionTextOriginal;
  renderManagerGuidePhoto();
  $("#manager-guide-dialog").showModal();
}

async function openManagerReviews(activityId) {
  state.reviews = await request(managerPath(`/reviews?activityId=${activityId}`));
  $("#manager-review-list").innerHTML = state.reviews.map((review) => `
    <article class="manager-review-card">
      <div><strong>${escapeHtml(review.displayName)}</strong><span>${"★".repeat(review.rating)}</span></div>
      <p>${escapeHtml(review.content)}</p>
      <section>${(review.replies ?? []).map((reply) => `<p><strong>${escapeHtml(reply.displayName)}</strong>${escapeHtml(reply.content)}</p>`).join("")}</section>
      <button class="secondary" data-manager-reply="${review.id}">回复</button>
    </article>
  `).join("") || `<div class="empty">当前活动还没有评价</div>`;
  document.querySelectorAll("[data-manager-reply]").forEach((button) => button.addEventListener("click", () => {
    state.replyingReviewId = button.dataset.managerReply;
    $("#manager-reply-form").reset();
    $("#manager-reply-dialog").showModal();
  }));
  if (!$("#manager-reviews-dialog").open) $("#manager-reviews-dialog").showModal();
}

function openActivityEdit(activity) {
  state.editingActivityId = activity.id;
  state.editingMeetingPoint = activity.meetingLatitude !== null && activity.meetingLatitude !== undefined
    ? { name: activity.content.meetingPointName, latitude: activity.meetingLatitude, longitude: activity.meetingLongitude }
    : null;
  const form = $("#activity-edit-form");
  form.reset();
  form.elements.name.value = activity.content.name;
  form.elements.groupId.innerHTML = state.groups.map((group) => `<option value="${group.id}" ${group.id === activity.groupId ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("");
  form.elements.advanceBookingHours.value = activity.advanceBookingHours;
  form.elements.leaderWechat.value = activity.leaderWechat ?? "";
  form.elements.summary.value = activity.content.summary ?? "";
  $("#activity-edit-tags").innerHTML = state.tags.map((tag) => `<label><input type="checkbox" name="tagIds" value="${tag.id}" ${activity.tagIds.includes(tag.id) ? "checked" : ""} /> ${escapeHtml(tag.name)}</label>`).join("");
  const activityGuides = state.guides.filter(isActivitySelectableGuide);
  $("#activity-edit-guides").innerHTML = activityGuides.map((guide) => `<label><input type="checkbox" name="guideIds" value="${guide.id}" ${(activity.guideIds ?? []).includes(guide.id) ? "checked" : ""} /> ${escapeHtml(guide.name)}</label>`).join("") || `<p>请先在领队库新增档案。</p>`;
  renderEditingMeetingPoint();
  $("#activity-edit-dialog").showModal();
}

function renderEditingMeetingPoint() {
  const point = state.editingMeetingPoint;
  $("#activity-edit-meeting-point").textContent = point
    ? `${point.name || "已选地点"} · ${Number(point.latitude).toFixed(6)}, ${Number(point.longitude).toFixed(6)}`
    : "尚未选择集合地点";
  $("#clear-meeting-point").hidden = !point;
}

function chooseMeetingPoint() {
  if (globalThis.wx?.chooseLocation) {
    globalThis.wx.chooseLocation({
      success(result) {
        state.editingMeetingPoint = { name: result.name || result.address || "集合地点", latitude: result.latitude, longitude: result.longitude };
        renderEditingMeetingPoint();
      }
    });
    return;
  }
  state.editingMeetingPoint = { name: "大理苍山游客中心", latitude: 25.689326, longitude: 100.166334 };
  renderEditingMeetingPoint();
  toast("本地预览：已模拟从微信地图选择地点");
}

const weekdayNames = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const toCents = (value) => Math.round(Number(value) * 100);
const quarterHourOptions = (selected) => Array.from({ length: 96 }, (_, index) => {
  const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`;
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`;
}).join("");

async function openSchedule(activityId) {
  const [activity, rules, slots] = await Promise.all([request(managerPath(`/activities/${activityId}`)), request(managerPath(`/activities/${activityId}/schedule-rules`)), request(managerPath(`/activities/${activityId}/slots`))]);
  state.scheduleActivity = activity;
  state.scheduleRules = rules.filter((rule) => rule.ruleType === "REGULAR");
  state.restDays = rules.filter((rule) => rule.ruleType === "REST_DAY");
  state.specialSlots = slots;
  $("#schedule-activity-name").textContent = activity.content.name;
  renderSchedule();
  showView("schedule");
}

function renderSchedule() {
  const activity = state.scheduleActivity;
  $("#toggle-schedule-pause").textContent = activity.schedulePaused ? "恢复排班" : "暂停排班";
  $("#toggle-schedule-pause").className = activity.schedulePaused ? "primary" : "secondary";
  const banner = activity.schedulePaused ? `<div class="paused-banner">排班已暂停，原有设定仍然保留。</div>` : "";
  if (state.activeScheduleTab === "rest") return renderRestDays(banner);
  if (state.activeScheduleTab === "special") return renderSpecialDays(banner);
  $("#new-schedule-item").textContent = "＋ 新增时间段";
  $("#manager-schedule-list").innerHTML = banner + Array.from({ length: 7 }, (_, index) => index + 1).map((weekday) => {
    const rules = state.scheduleRules.filter((rule) => rule.weekday === weekday);
    return `
      <article class="weekday-card">
        <h3>${weekdayNames[weekday]}</h3>
        ${rules.map((rule) => `
          <div class="weekly-rule">
            <div class="weekly-rule-top"><strong>${rule.startsAt}-${rule.endsAt}</strong><span>${rule.capacity} 人</span></div>
            <p class="weekly-rule-meta">${rule.priceOptions.map((option) => `${escapeHtml(option.name)} ${yuan(option.priceCents)}`).join(" · ")}</p>
            <div class="weekly-rule-actions">
              <button class="secondary" data-edit-rule="${rule.id}">编辑</button>
              <button class="danger" data-delete-rule="${rule.id}">删除</button>
            </div>
          </div>
        `).join("") || `<div class="weekly-rule"><p class="weekly-rule-meta">当天没有排班</p></div>`}
      </article>
    `;
  }).join("");
  document.querySelectorAll("[data-edit-rule]").forEach((button) => button.addEventListener("click", () => openWeeklyRuleDialog(state.scheduleRules.find((rule) => rule.id === button.dataset.editRule))));
  document.querySelectorAll("[data-delete-rule]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("确定删除这个时间段吗？")) return;
    await request(managerPath(`/schedule-rules/${button.dataset.deleteRule}`), { method: "DELETE" });
    state.scheduleRules = state.scheduleRules.filter((rule) => rule.id !== button.dataset.deleteRule);
    renderSchedule();
    toast("时间段已删除");
  }));
}

function renderRestDays(banner = "") {
  $("#new-schedule-item").textContent = "＋ 新增休息日";
  $("#manager-schedule-list").innerHTML = banner + (state.restDays.map((rule) => `
    <article class="rest-card">
      <div><strong>${rule.validFrom}${rule.validFrom === rule.validUntil ? "" : ` 至 ${rule.validUntil}`}</strong><p>${escapeHtml(rule.note || "休息日")}</p></div>
      <button class="danger" data-delete-rest="${rule.id}">删除</button>
    </article>
  `).join("") || `<div class="empty">暂时没有休息日</div>`);
  document.querySelectorAll("[data-delete-rest]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("确定删除这个休息日吗？")) return;
    await request(managerPath(`/schedule-rules/${button.dataset.deleteRest}`), { method: "DELETE" });
    state.restDays = state.restDays.filter((rule) => rule.id !== button.dataset.deleteRest);
    renderSchedule();
    toast("休息日已删除");
  }));
}

function renderSpecialDays(banner = "") {
  $("#new-schedule-item").textContent = "＋ 新增特殊排班";
  const grouped = state.specialSlots.reduce((result, slot) => {
    const date = dateOnly(slot.startsAt);
    result[date] = [...(result[date] ?? []), slot];
    return result;
  }, {});
  $("#manager-schedule-list").innerHTML = banner + (Object.entries(grouped).map(([date, slots]) => `
    <article class="special-card">
      <div class="special-card-header"><strong>${date} · ${weekdayNames[weekdayForDate(date)]}</strong><button class="secondary" data-edit-special="${date}">编辑</button></div>
      <div class="special-slots">
        ${slots.map((slot) => `<div class="special-slot"><span>${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)} · 已订 ${slot.bookedCount}/${slot.capacity}</span>${slot.bookedCount ? "" : `<button class="danger" data-delete-special="${slot.id}">删除</button>`}</div>`).join("")}
      </div>
    </article>
  `).join("") || `<div class="empty">暂时没有特殊排班</div>`);
  document.querySelectorAll("[data-edit-special]").forEach((button) => button.addEventListener("click", () => openSpecialDayDialog(button.dataset.editSpecial)));
  document.querySelectorAll("[data-delete-special]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("确定删除这个特殊排班吗？")) return;
    await request(managerPath(`/slots/${button.dataset.deleteSpecial}`), { method: "DELETE" });
    state.specialSlots = state.specialSlots.filter((slot) => slot.id !== button.dataset.deleteSpecial);
    renderSchedule();
    toast("特殊排班已删除");
  }));
}

function weekdayForDate(date) {
  return new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
}

function cloneSpecialRow(source) {
  return {
    id: String(source.startsAt).includes("T") ? source.id : null,
    startsAt: String(source.startsAt).includes("T") ? timeOnly(source.startsAt) : source.startsAt,
    endsAt: String(source.endsAt).includes("T") ? timeOnly(source.endsAt) : source.endsAt,
    capacity: source.capacity,
    bookedCount: source.bookedCount ?? 0,
    priceOptions: source.priceOptions.map(({ id, name, priceCents }) => ({ id, name, priceCents }))
  };
}

function loadSpecialDraft(date) {
  const existing = state.specialSlots.filter((slot) => dateOnly(slot.startsAt) === date);
  state.specialExistingSlots = existing.map(cloneSpecialRow);
  state.specialDraftRows = (existing.length ? existing : state.scheduleRules.filter((rule) => rule.weekday === weekdayForDate(date))).map(cloneSpecialRow);
  renderSpecialRows();
}

function renderSpecialRows() {
  $("#special-day-rows").innerHTML = state.specialDraftRows.map((row, index) => `
    <article class="special-row" data-special-index="${index}">
      <div class="special-row-heading"><strong>时间段 ${index + 1}</strong><button class="danger" type="button" data-remove-special="${index}">删除</button></div>
      <div class="special-row-grid">
        <label>开始时间<select name="startsAt" required>${quarterHourOptions(row.startsAt)}</select></label>
        <label>结束时间<select name="endsAt" required>${quarterHourOptions(row.endsAt)}</select></label>
        <label>总可订人数<input name="capacity" type="number" min="${Math.max(1, row.bookedCount)}" value="${row.capacity}" required /></label>
        <label>成人价格<input name="adultPrice" type="number" min="0" step="0.01" value="${((row.priceOptions[0]?.priceCents ?? 26800) / 100).toFixed(2)}" required /></label>
        <label>儿童价格<input name="childPrice" type="number" min="0" step="0.01" value="${((row.priceOptions[1]?.priceCents ?? 16800) / 100).toFixed(2)}" required /></label>
      </div>
    </article>
  `).join("") || `<div class="empty">当天没有时间段，可以点击下方添加。</div>`;
  document.querySelectorAll("[data-remove-special]").forEach((button) => button.addEventListener("click", () => {
    if (!window.confirm("确定删除这个时间段吗？")) return;
    state.specialDraftRows.splice(Number(button.dataset.removeSpecial), 1);
    renderSpecialRows();
  }));
}

function addSpecialDraftRow() {
  state.specialDraftRows.push({ startsAt: "09:00", endsAt: "12:00", capacity: 10, bookedCount: 0, priceOptions: [{ name: "成人", priceCents: 26800 }, { name: "儿童", priceCents: 16800 }] });
  renderSpecialRows();
}

function openSpecialDayDialog(date = "") {
  const form = $("#special-day-form");
  form.reset();
  form.elements.specialDate.value = date;
  state.specialDraftRows = [];
  state.specialExistingSlots = [];
  if (date) loadSpecialDraft(date);
  else renderSpecialRows();
  $("#special-day-dialog").showModal();
}

function openWeeklyRuleDialog(rule = null) {
  state.editingRuleId = rule?.id ?? null;
  const form = $("#weekly-rule-form");
  form.reset();
  $("#weekly-rule-title").textContent = rule ? `编辑${weekdayNames[rule.weekday]}排班` : "新增每周排班";
  $("#weekday-fields").hidden = Boolean(rule);
  form.elements.startsAt.innerHTML = quarterHourOptions(rule?.startsAt ?? "09:00");
  form.elements.endsAt.innerHTML = quarterHourOptions(rule?.endsAt ?? "12:00");
  form.elements.capacity.value = rule?.capacity ?? 10;
  form.elements.adultName.value = rule?.priceOptions?.[0]?.name ?? "成人";
  form.elements.adultPrice.value = ((rule?.priceOptions?.[0]?.priceCents ?? 26800) / 100).toFixed(2);
  form.elements.childName.value = rule?.priceOptions?.[1]?.name ?? "儿童";
  form.elements.childPrice.value = ((rule?.priceOptions?.[1]?.priceCents ?? 16800) / 100).toFixed(2);
  $("#weekly-rule-dialog").showModal();
}

function renderProfile() {
  $("#profile-name").textContent = state.account.displayName;
  $("#profile-groups").textContent = state.account.groups.map((group) => group.name).join("、");
  $("#group-count").textContent = state.account.groupIds.length;
  $("#today-orders").textContent = state.orders.filter((order) => dateOnly(order.createdAt) === dateOnly(new Date().toISOString())).length;
  const income = state.orders.filter((order) => dateOnly(order.createdAt) === dateOnly(new Date().toISOString()) && order.status === "BOOKED").reduce((sum, order) => sum + order.amountCents, 0);
  $("#today-income").textContent = yuan(income);
}

function renderDetail(order) {
  $("#order-detail").innerHTML = `
    <h3 class="detail-status">${statusLabel(order.status)}</h3>
    <div class="detail-row"><span>服务项目</span><strong>${escapeHtml(order.activityName)}</strong></div>
    <div class="detail-row"><span>活动组</span><strong>${escapeHtml(order.groupName)}</strong></div>
    <div class="detail-row"><span>预约时间</span><strong>${dateOnly(order.startsAt)} ${timeOnly(order.startsAt)}-${timeOnly(order.endsAt)}</strong></div>
    <div class="detail-row"><span>顾客信息</span><strong>${escapeHtml(order.customerNickname)} ${escapeHtml(order.customerMobile)}</strong></div>
    <div class="detail-row"><span>规格数量</span><strong>${escapeHtml(order.specification)} × ${order.quantity}</strong></div>
    <div class="detail-row"><span>总价</span><strong>${yuan(order.amountCents)}</strong></div>
    <div class="detail-row"><span>订单号</span><strong>${escapeHtml(order.orderNo)}</strong></div>
    ${["PENDING_PAYMENT", "BOOKED"].includes(order.status) ? `<div class="detail-actions"><button class="danger" data-cancel="${order.id}">取消订单</button></div>` : ""}
  `;
  bindOrderActions();
  $("#order-detail-dialog").showModal();
}

function bindOrderActions() {
  document.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", async () => {
    const order = await request(`/orders/${button.dataset.detail}?adminAccountId=${accountId}`);
    renderDetail(order);
  }));
  document.querySelectorAll("[data-cancel]").forEach((button) => button.addEventListener("click", () => {
    state.cancellingOrderId = button.dataset.cancel;
    $("#order-detail-dialog").close();
    $("#cancel-form").reset();
    $("#cancel-dialog").showModal();
  }));
}

function changeDate(days) {
  const [year, month, day] = $("#active-date").value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  $("#active-date").value = date.toISOString().slice(0, 10);
  renderWorkbench();
}

function showView(view) {
  state.activeView = view;
  document.querySelectorAll(".view").forEach((section) => section.hidden = section.id !== `${view}-view`);
  const activeRoot = view === "schedule" ? "activities" : view === "guides" ? "profile" : view;
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === activeRoot));
  if (view === "activities") renderActivities();
  if (view === "guides") renderManagerGuides();
  if (view === "guide-calendar") loadManagerGuideCalendar().catch((error) => toast(error.message));
  if (view === "profile") renderProfile();
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  setTimeout(() => $("#toast").hidden = true, 1800);
}

async function boot() {
  const [accounts, groups, tags, guides, activities, orders, notifications] = await Promise.all([
    request("/admin-accounts"), request("/groups"), request("/tags"), request("/guides"), request(managerPath("/activities")), request(`/orders?adminAccountId=${accountId}`), request(managerPath("/notifications"))
  ]);
  state.account = accounts.find((account) => account.id === accountId);
  if (!state.account) throw new Error("当前管理账户不存在");
  state.groups = groups.filter((group) => state.account.groupIds.includes(group.id));
  state.tags = tags;
  state.guides = sortGuidesForDisplay(guides);
  state.activities = activities;
  state.orders = orders;
  state.notifications = notifications;
  $("#account-name").textContent = `${state.account.displayName} · ${state.account.groups.map((group) => group.name).join("、")}`;
  $("#group-filter").innerHTML = `<option value="">全部授权组</option>${state.groups.map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join("")}`;
  $("#active-date").value = orders.find((order) => ["PENDING_PAYMENT", "BOOKED"].includes(order.status)) ? dateOnly(orders.find((order) => ["PENDING_PAYMENT", "BOOKED"].includes(order.status)).startsAt) : new Date().toISOString().slice(0, 10);
  renderWorkbench();
}

document.querySelectorAll("[data-order-tab]").forEach((button) => button.addEventListener("click", () => {
  state.activeTab = button.dataset.orderTab;
  document.querySelectorAll("[data-order-tab]").forEach((item) => item.classList.toggle("active", item === button));
  renderWorkbench();
}));
document.querySelectorAll(".bottom-nav button").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
$("#group-filter").addEventListener("change", renderWorkbench);
$("#active-date").addEventListener("change", renderWorkbench);
$("#previous-date").addEventListener("click", () => changeDate(-1));
$("#next-date").addEventListener("click", () => changeDate(1));
document.querySelectorAll("[data-close-detail]").forEach((button) => button.addEventListener("click", () => $("#order-detail-dialog").close()));
document.querySelectorAll("[data-close-cancel]").forEach((button) => button.addEventListener("click", () => $("#cancel-dialog").close()));
document.querySelectorAll("[data-close-rule]").forEach((button) => button.addEventListener("click", () => $("#weekly-rule-dialog").close()));
document.querySelectorAll("[data-close-activity-edit]").forEach((button) => button.addEventListener("click", () => $("#activity-edit-dialog").close()));
$("#choose-meeting-point").addEventListener("click", chooseMeetingPoint);
$("#clear-meeting-point").addEventListener("click", () => {
  state.editingMeetingPoint = null;
  renderEditingMeetingPoint();
});
document.querySelectorAll("[data-close-rest-day]").forEach((button) => button.addEventListener("click", () => $("#rest-day-dialog").close()));
document.querySelectorAll("[data-close-special-day]").forEach((button) => button.addEventListener("click", () => $("#special-day-dialog").close()));
document.querySelectorAll("[data-close-reviews]").forEach((button) => button.addEventListener("click", () => $("#manager-reviews-dialog").close()));
document.querySelectorAll("[data-close-manager-reply]").forEach((button) => button.addEventListener("click", () => $("#manager-reply-dialog").close()));
document.querySelectorAll("[data-close-notifications]").forEach((button) => button.addEventListener("click", () => $("#manager-notifications-dialog").close()));
document.querySelectorAll("[data-close-manager-guide]").forEach((button) => button.addEventListener("click", () => $("#manager-guide-dialog").close()));
$("#open-manager-guides").addEventListener("click", () => showView("guides"));
$("#open-manager-guide-calendar").addEventListener("click", () => showView("guide-calendar"));
$("#open-manager-notifications").addEventListener("click", openManagerNotifications);
$("#back-to-profile").addEventListener("click", () => showView("profile"));
$("#back-calendar-to-profile").addEventListener("click", () => showView("profile"));
$("#new-manager-guide").addEventListener("click", () => openManagerGuide());
$("#manager-guide-photo-input").addEventListener("change", (event) => {
  const [file] = event.currentTarget.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.guidePhotoDraft = reader.result;
    renderManagerGuidePhoto();
  });
  reader.readAsDataURL(file);
  event.currentTarget.value = "";
});
document.querySelectorAll("[data-schedule-tab]").forEach((button) => button.addEventListener("click", () => {
  state.activeScheduleTab = button.dataset.scheduleTab;
  document.querySelectorAll("[data-schedule-tab]").forEach((item) => item.classList.toggle("active", item === button));
  renderSchedule();
}));
document.querySelectorAll("[data-manager-guide-calendar-mode]").forEach((button) => button.addEventListener("click", () => {
  state.guideCalendarMode = button.dataset.managerGuideCalendarMode;
  renderManagerGuideCalendar();
}));
document.querySelectorAll("[data-manager-guide-calendar-filter]").forEach((button) => button.addEventListener("click", () => {
  state.guideCalendarFilter = button.dataset.managerGuideCalendarFilter;
  renderManagerGuideCalendar();
}));
$("#back-to-activities").addEventListener("click", () => showView("activities"));
$("#new-schedule-item").addEventListener("click", () => {
  if (state.activeScheduleTab === "rest") return $("#rest-day-dialog").showModal();
  if (state.activeScheduleTab === "special") return openSpecialDayDialog();
  openWeeklyRuleDialog();
});
$("#add-special-row").addEventListener("click", addSpecialDraftRow);
$("#special-day-form input[name=specialDate]").addEventListener("change", (event) => loadSpecialDraft(event.currentTarget.value));
$("#toggle-schedule-pause").addEventListener("click", async () => {
  await request(`/activities/${state.scheduleActivity.id}/schedule-pause`, {
    method: "PATCH",
    body: managerBody({ paused: !state.scheduleActivity.schedulePaused })
  });
  state.scheduleActivity.schedulePaused = !state.scheduleActivity.schedulePaused;
  const activity = state.activities.find((item) => item.id === state.scheduleActivity.id);
  activity.schedulePaused = state.scheduleActivity.schedulePaused;
  renderSchedule();
  toast(state.scheduleActivity.schedulePaused ? "排班已暂停" : "排班已恢复");
});
$("#weekly-rule-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const values = new FormData(event.currentTarget);
    const priceOptions = [
      { id: state.editingRuleId ? state.scheduleRules.find((rule) => rule.id === state.editingRuleId).priceOptions[0]?.id : undefined, name: values.get("adultName"), priceCents: toCents(values.get("adultPrice")) },
      { id: state.editingRuleId ? state.scheduleRules.find((rule) => rule.id === state.editingRuleId).priceOptions[1]?.id : undefined, name: values.get("childName"), priceCents: toCents(values.get("childPrice")) }
    ];
    const payload = { startsAt: values.get("startsAt"), endsAt: values.get("endsAt"), capacity: Number(values.get("capacity")), priceOptions };
    if (state.editingRuleId) {
      await request(`/schedule-rules/${state.editingRuleId}`, { method: "PATCH", body: managerBody(payload) });
    } else {
      payload.weekdays = values.getAll("weekday").map(Number);
      await request(`/activities/${state.scheduleActivity.id}/regular-schedule-rules`, { method: "POST", body: managerBody(payload) });
    }
    state.scheduleRules = (await request(managerPath(`/activities/${state.scheduleActivity.id}/schedule-rules`))).filter((rule) => rule.ruleType === "REGULAR");
    $("#weekly-rule-dialog").close();
    renderSchedule();
    toast("排班已保存");
  } catch (error) {
    toast(error.message);
  }
});
$("#rest-day-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const values = new FormData(form);
    const restDay = await request(`/activities/${state.scheduleActivity.id}/schedule-rules`, {
      method: "POST",
      body: managerBody({ ruleType: "REST_DAY", validFrom: values.get("validFrom"), validUntil: values.get("validUntil"), note: values.get("note") })
    });
    state.restDays.push(restDay);
    $("#rest-day-dialog").close();
    form.reset();
    renderSchedule();
    toast("休息日已保存");
  } catch (error) {
    toast(error.message);
  }
});
$("#special-day-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.savingSpecialDay) return;
  state.savingSpecialDay = true;
  try {
    const values = new FormData(event.currentTarget);
    const date = values.get("specialDate");
    const rows = [...event.currentTarget.querySelectorAll("[data-special-index]")].map((element, index) => {
      const draft = state.specialDraftRows[index];
      return {
        id: draft.id,
        startsAt: `${date}T${element.querySelector("input[name=startsAt]").value}:00+08:00`,
        endsAt: `${date}T${element.querySelector("input[name=endsAt]").value}:00+08:00`,
        capacity: Number(element.querySelector("input[name=capacity]").value),
        priceOptions: [
          { id: draft.priceOptions[0]?.id, name: draft.priceOptions[0]?.name ?? "成人", priceCents: toCents(element.querySelector("input[name=adultPrice]").value) },
          { id: draft.priceOptions[1]?.id, name: draft.priceOptions[1]?.name ?? "儿童", priceCents: toCents(element.querySelector("input[name=childPrice]").value) }
        ]
      };
    });
    if (!rows.length) throw new Error("请至少保留一个时间段；整天休息请使用休息日");
    const keptIds = new Set(rows.map((row) => row.id).filter(Boolean));
    const deletedSlots = state.specialExistingSlots.filter((row) => row.id && !keptIds.has(row.id));
    if (deletedSlots.length && !window.confirm(`保存后会删除 ${deletedSlots.length} 个已有特殊排班，确定继续吗？`)) return;
    for (const slot of deletedSlots) {
      await request(managerPath(`/slots/${slot.id}`), { method: "DELETE" });
    }
    for (const row of rows) {
      await request(row.id ? `/slots/${row.id}` : `/activities/${state.scheduleActivity.id}/slots`, {
        method: row.id ? "PATCH" : "POST",
        body: managerBody(row)
      });
    }
    state.specialSlots = await request(managerPath(`/activities/${state.scheduleActivity.id}/slots`));
    $("#special-day-dialog").close();
    renderSchedule();
    toast("当天特殊排班已保存");
  } catch (error) {
    toast(error.message);
  } finally {
    state.savingSpecialDay = false;
  }
});
$("#activity-edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const values = new FormData(event.currentTarget);
    const activity = await request(`/activities/${state.editingActivityId}`, {
      method: "PATCH",
      body: managerBody({
        groupId: values.get("groupId"),
        advanceBookingHours: Number(values.get("advanceBookingHours")),
        leaderWechat: values.get("leaderWechat"),
        meetingLatitude: state.editingMeetingPoint?.latitude ?? null,
        meetingLongitude: state.editingMeetingPoint?.longitude ?? null,
        tagIds: values.getAll("tagIds"),
        guideIds: values.getAll("guideIds"),
        translations: { "zh-CN": { name: values.get("name"), summary: values.get("summary"), meetingPointName: state.editingMeetingPoint?.name ?? "" } }
      })
    });
    const index = state.activities.findIndex((item) => item.id === state.editingActivityId);
    state.activities[index] = { ...state.activities[index], ...activity, content: activity.translations["zh-CN"] };
    $("#activity-edit-dialog").close();
    renderActivities();
    toast("活动已保存");
  } catch (error) {
    toast(error.message);
  }
});
$("#manager-guide-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const values = new FormData(event.currentTarget);
    const description = values.get("description");
    await request(state.editingGuideId ? `/guides/${state.editingGuideId}` : "/guides", {
      method: state.editingGuideId ? "PATCH" : "POST",
      body: JSON.stringify({
        name: values.get("name"),
        photoUrl: state.guidePhotoDraft,
        descriptionHtml: description === state.guideDescriptionTextOriginal
          ? state.guideDescriptionHtmlDraft
          : `<p>${escapeHtml(description).replaceAll("\n", "<br>")}</p>`
      })
    });
    state.guides = sortGuidesForDisplay(await request("/guides"));
    $("#manager-guide-dialog").close();
    renderManagerGuides();
    toast(state.editingGuideId ? "领队档案已修改" : "领队档案已新增");
    state.editingGuideId = null;
  } catch (error) {
    toast(error.message);
  }
});
$("#cancel-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request(`/orders/${state.cancellingOrderId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ adminAccountId: accountId, note: new FormData(event.currentTarget).get("note") })
    });
    state.orders = await request(`/orders?adminAccountId=${accountId}`);
    $("#cancel-dialog").close();
    renderWorkbench();
    toast("订单已取消，名额已经释放");
  } catch (error) {
    toast(error.message);
  }
});
$("#manager-reply-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request(`/reviews/${state.replyingReviewId}/replies`, {
      method: "POST",
      body: managerBody({ content: new FormData(event.currentTarget).get("content") })
    });
    $("#manager-reply-dialog").close();
    toast("领队回复已发送");
    const review = state.reviews.find((item) => item.id === state.replyingReviewId);
    await openManagerReviews(review.activityId);
  } catch (error) {
    toast(error.message);
  }
});

boot().catch((error) => toast(error.message));
setInterval(() => refreshNotifications({ announce: true }).catch(() => {}), 15000);
window.addEventListener("focus", () => refreshNotifications({ announce: true }).catch(() => {}));
