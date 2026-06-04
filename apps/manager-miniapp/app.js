const API = "http://localhost:3000/api";
const accountId = new URLSearchParams(location.search).get("accountId") || "account-guide-demo";
const state = { account: null, groups: [], tags: [], guides: [], activities: [], orders: [], reviews: [], notifications: [], activeTab: "active", activeView: "workbench", cancellingOrderId: null, editingActivityId: null, editingMeetingPoint: null, editingGuideId: null, guidePhotoDraft: "", guideDescriptionHtmlDraft: "", guideDescriptionTextOriginal: "", scheduleActivity: null, scheduleRules: [], restDays: [], specialSlots: [], activeScheduleTab: "regular", editingRuleId: null, replyingReviewId: null, specialDraftRows: [], specialExistingSlots: [], savingSpecialDay: false };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const yuan = (cents) => `¥${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const dateOnly = (value) => String(value).slice(0, 10);
const timeOnly = (value) => String(value).slice(11, 16);
const managerBody = (input = {}) => JSON.stringify({ ...input, adminAccountId: accountId });
const managerPath = (path) => `${path}${path.includes("?") ? "&" : "?"}adminAccountId=${accountId}`;
const htmlToText = (value) => String(value ?? "").replace(/<[^>]+>/g, "").trim();

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { "content-type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "请求失败");
  return payload.data;
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
  $("#activity-edit-guides").innerHTML = state.guides.map((guide) => `<label><input type="checkbox" name="guideIds" value="${guide.id}" ${(activity.guideIds ?? []).includes(guide.id) ? "checked" : ""} /> ${escapeHtml(guide.name)}</label>`).join("") || `<p>请先在领队库新增档案。</p>`;
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
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === view || (view === "schedule" && button.dataset.view === "activities")));
  if (view === "activities") renderActivities();
  if (view === "guides") renderManagerGuides();
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
  state.guides = guides;
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
$("#open-manager-notifications").addEventListener("click", openManagerNotifications);
$("#back-to-profile").addEventListener("click", () => showView("profile"));
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
    for (const slot of state.specialExistingSlots.filter((row) => row.id && !keptIds.has(row.id))) {
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
    state.guides = await request("/guides");
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
