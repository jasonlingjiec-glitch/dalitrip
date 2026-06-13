const app = getApp();

const request = (path, options = {}) => new Promise((resolve, reject) => {
  wx.request({
    url: `${app.globalData.apiBase}${path}`,
    method: options.method || "GET",
    data: options.data,
    header: { "content-type": "application/json" },
    success: (response) => {
      const body = response.data || {};
      if (response.statusCode >= 400 || body.error) {
        reject(new Error(body.error?.message || `请求失败 ${response.statusCode}`));
        return;
      }
      resolve(body.data);
    },
    fail: reject
  });
});

const wxLogin = () => new Promise((resolve, reject) => {
  wx.login({
    success: (result) => result.code ? resolve(result.code) : reject(new Error("微信登录没有返回 code")),
    fail: reject
  });
});

const wxPay = (payment) => new Promise((resolve, reject) => {
  wx.requestPayment({
    timeStamp: payment.timeStamp,
    nonceStr: payment.nonceStr,
    package: payment.package,
    signType: payment.signType,
    paySign: payment.paySign,
    success: resolve,
    fail: reject
  });
});

const cleanText = (value, fallback = "") => String(value || fallback).replace(/\s+/g, " ").trim();
const assetBase = "https://api.dalitripapp.cn";
const safeImage = (value) => {
  const text = String(value || "");
  if (/^https:\/\//.test(text)) return text;
  if (text.startsWith("/imported-assets/")) return `${assetBase}${text}`;
  if (text.startsWith("/dalitrip-mvp/imported-assets/")) return `${assetBase}${text.replace("/dalitrip-mvp", "")}`;
  if (text.startsWith("http://localhost:8890/dalitrip-mvp/imported-assets/")) return text.replace("http://localhost:8890/dalitrip-mvp", assetBase);
  if (text.startsWith("http://127.0.0.1:8890/dalitrip-mvp/imported-assets/")) return text.replace("http://127.0.0.1:8890/dalitrip-mvp", assetBase);
  return "";
};
const money = (cents = 0) => `¥${(Number(cents) / 100).toFixed(Number(cents) % 100 === 0 ? 0 : 2)}`;
const isoDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};
const dateOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const timeText = (slot) => `${slot.startsAt.slice(0, 10)} ${slot.startsAt.slice(11, 16)}-${slot.endsAt.slice(11, 16)}`;
const priceText = (slot) => {
  const prices = (slot.priceOptions || []).map((item) => item.priceCents || 0);
  return prices.length ? `最低 ${money(Math.min(...prices))}` : "待定价";
};
const compactText = (value, limit = 120) => {
  const text = cleanText(value);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};
const plainText = (value) => cleanText(String(value || "").replace(/<[^>]+>/g, " "));
const imageFromList = (images = []) => {
  const image = images.slice().sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0))[0] || {};
  return image.url || image.cosKey || "";
};
const activityView = (item) => ({
  id: item.id,
  name: cleanText(item.content?.name || item.translations?.["zh-CN"]?.name, "未命名活动"),
  summary: cleanText(item.content?.summary || item.translations?.["zh-CN"]?.summary, "一段慢一点的自然体验。"),
  coverUrl: safeImage(item.coverUrl || imageFromList(item.images)),
  tags: (item.tags || []).slice(0, 4).map((tag) => tag.name)
});
const slotView = (slot) => ({
  ...slot,
  timeText: timeText(slot),
  priceText: priceText(slot)
});
const reviewView = (review) => ({
  id: review.id,
  activityId: review.activityId || "",
  activityName: cleanText(review.activityName, "苍山徒步之家"),
  displayName: cleanText(review.displayName, "旅行者"),
  avatar: cleanText(review.displayName, "旅").slice(0, 1),
  ratingStars: "★★★★★".slice(0, Math.max(0, Math.min(5, Number(review.rating) || 5))),
  createdAtText: String(review.createdAt || "").slice(0, 10),
  content: compactText(review.content, 240),
  imageUrls: (review.imageUrls || []).map(safeImage).filter(Boolean).slice(0, 5),
  canExpand: cleanText(review.content).length > 90
});
const blogView = (post) => ({
  id: post.id || post.slug,
  slug: post.slug || post.id,
  title: cleanText(post.title, "文章"),
  summary: compactText(post.summary || plainText(post.contentHtml), 72),
  coverUrl: safeImage(post.coverUrl),
  publishedAtText: String(post.publishedAt || "").slice(0, 10)
});
const guideView = (guide) => ({
  id: guide.id,
  name: cleanText(guide.name, "领队"),
  photoUrl: safeImage(guide.photoUrl || imageFromList(guide.images)),
  summary: compactText(plainText(guide.descriptionHtml), 76),
  activityCount: guide.activityCount || guide.activities?.length || 0
});
const bookableSlots = (slots) => (slots || [])
  .filter((slot) => slot.enabled !== false && Date.parse(slot.startsAt) > Date.now() && (slot.bookedCount || 0) < slot.capacity)
  .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
  .map(slotView);
const localInfoTagParts = (name) => {
  const parts = String(name || "").split("·").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? { group: parts[0], child: parts.slice(1).join(" · ") } : { group: parts[0] || "", child: "" };
};
const localInfoHasTag = (item, tagName) => {
  if (!tagName) return true;
  const selectedParts = localInfoTagParts(tagName);
  return (item.tags || []).some((tag) => tag === tagName || (!selectedParts.child && localInfoTagParts(tag).group === selectedParts.group));
};
const localInfoText = (item) => `${item?.title || ""} ${item?.summary || ""} ${item?.contentText || ""}`;
const lunarMonthNumber = (value) => {
  const text = String(value || "").replace(/闰|月/g, "");
  if (/^\d+$/.test(text)) return Number(text);
  return { 正: 1, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 冬: 11, 十一: 11, 腊: 12, 十二: 12 }[text] || 0;
};
const lunarDayNumber = (value) => {
  const text = String(value || "").replace(/日|号/g, "");
  if (/^\d+$/.test(text)) return Number(text);
  const map = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
    初一: 1, 初二: 2, 初三: 3, 初四: 4, 初五: 5, 初六: 6, 初七: 7, 初八: 8, 初九: 9, 初十: 10,
    十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15, 十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
    廿一: 21, 廿二: 22, 廿三: 23, 廿四: 24, 廿五: 25, 廿六: 26, 廿七: 27, 廿八: 28, 廿九: 29, 三十: 30
  };
  return map[text] || map[text.replace(/^二/, "廿")] || 0;
};
const lunarPartsForDate = (date) => {
  try {
    if (typeof Intl === "undefined") return null;
    const parts = new Intl.DateTimeFormat("zh-u-ca-chinese", { year: "numeric", month: "long", day: "numeric" }).formatToParts(date);
    const lookup = parts.reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return { month: lunarMonthNumber(lookup.month), day: lunarDayNumber(lookup.day) };
  } catch (error) {
    return null;
  }
};
const nextLunarDate = (rules, horizonDays = 420) => {
  const today = isoDate();
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const value = addDays(today, offset);
    const parts = lunarPartsForDate(new Date(`${value}T00:00:00`));
    if (!parts) return "";
    if (rules.some((rule) => (!rule.month || rule.month === parts.month) && rule.days.includes(parts.day))) return value;
  }
  return "";
};
const localEventDateLabel = (value) => {
  if (!value) return "近期";
  const today = isoDate();
  if (value === today) return "今天";
  if (value === addDays(today, 1)) return "明天";
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};
const weekdayNumber = (value) => ({ 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 }[value] || 0);
const nextWeekdayDate = (weekday) => {
  const today = new Date(`${isoDate()}T00:00:00`);
  return addDays(isoDate(), (weekday - today.getDay() + 7) % 7);
};
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
  if (marketDays.length) {
    const raw = text.match(/逢\s*([一二三四五六七八九十0-9])\s*[、,，和]\s*([一二三四五六七八九十0-9])/)?.[0] || "赶集日";
    return { nextDate: nextLunarDate([{ days: marketDays }], 90), meta: `农历${raw}` };
  }
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
const localInfoByTag = (items, tagName, matcher = () => true) => items.find((item) => localInfoHasTag(item, tagName) && item.coverUrl && matcher(item)) || items.find((item) => localInfoHasTag(item, tagName) && matcher(item));
const localSceneCards = (items) => {
  const dining = localInfoByTag(items, "餐馆", (item) => /深夜食堂|餐|饭|素/.test(localInfoText(item))) || localInfoByTag(items, "餐馆");
  const cafe = localInfoByTag(items, "咖啡馆") || localInfoByTag(items, "酒吧");
  const stay = localInfoByTag(items, "民宿");
  return [
    { tag: "餐馆", title: "吃一顿舒服的饭", subtitle: "本地菜、素食、夜宵、亲子友好", imageUrl: dining?.coverUrl || "", itemId: dining?.id || "" },
    { tag: "咖啡馆", title: "咖啡和面包", subtitle: "可以坐下来的小店和社区空间", imageUrl: cafe?.coverUrl || "", itemId: cafe?.id || "" },
    { tag: "民宿", title: "找个住处", subtitle: "亲子、可月租、乡村民宿", imageUrl: stay?.coverUrl || "", itemId: stay?.id || "" }
  ];
};
const localUpcomingEvents = (items, upcoming = [], activities = []) => {
  const localMatches = items
    .filter((item) => (item.tags || []).some((tag) => tag.includes("节日")) || /节|庙会|赶集|市集|集市|太子会|刀杆会|火把/.test(item.title || ""))
    .map((item) => {
      const timing = localEventRule(item);
      return { kind: "local", id: item.id, title: item.title, imageUrl: item.coverUrl, day: localEventDateLabel(timing.nextDate), nextDate: timing.nextDate, meta: timing.meta };
    });
  const scheduledActivityMatches = upcoming
    .filter((slot) => /赶集|市集|集市|节/.test(`${slot.activityName || ""}`))
    .map((slot) => ({ kind: "activity", id: slot.activityId, title: slot.activityName || "社区活动", imageUrl: slot.coverUrl, day: localEventDateLabel(slot.startsAt?.slice(0, 10)), nextDate: slot.startsAt?.slice(0, 10) || "", meta: slot.timeText || "查看可预约时间" }));
  const ruleActivityMatches = activities
    .filter((activity) => /赶集|市集|集市|节/.test(`${activity.name || ""}`))
    .map((activity) => {
      const timing = localEventRule({ title: activity.name, summary: activity.summary });
      return { kind: "activity", id: activity.id, title: activity.name, imageUrl: activity.coverUrl, day: localEventDateLabel(timing.nextDate), nextDate: timing.nextDate, meta: timing.meta };
    });
  const unique = {};
  [...localMatches, ...scheduledActivityMatches, ...ruleActivityMatches].forEach((item) => {
    const key = `${item.kind}:${item.id}`;
    if (!unique[key] || (item.nextDate && item.nextDate < (unique[key].nextDate || "9999-12-31"))) unique[key] = item;
  });
  return Object.values(unique).sort((a, b) => (a.nextDate || "9999-12-31").localeCompare(b.nextDate || "9999-12-31")).slice(0, 5);
};

Page({
  data: {
    activeTab: "home",
    loading: false,
    status: "",
    customerId: app.globalData.customerId,
    topics: [],
    upcoming: [],
    homeReviews: [],
    reviewsExpanded: false,
    blogPosts: [],
    guides: [],
    activities: [],
    localInfos: [],
    localScenes: [],
    localEvents: [],
    localFilter: "",
    visibleLocalInfos: [],
    localDetailOpen: false,
    localInfoDetail: null,
    orders: [],
    detailOpen: false,
    blogDetailOpen: false,
    guideDetailOpen: false,
    blogDetail: null,
    guideDetail: null,
    detailLoading: false,
    activity: null,
    slots: [],
    selectedSlotId: "",
    payLoading: false
  },

  onLoad() {
    this.bootstrap();
  },

  onShareAppMessage() {
    if (this.data.blogDetailOpen && this.data.blogDetail) {
      return { title: this.data.blogDetail.title, path: "/pages/index/index" };
    }
    if (this.data.guideDetailOpen && this.data.guideDetail) {
      return { title: `${this.data.guideDetail.name}｜苍山徒步之家`, path: "/pages/index/index" };
    }
    if (this.data.detailOpen && this.data.activity) {
      return { title: this.data.activity.name, path: "/pages/index/index" };
    }
    return { title: "苍山徒步之家", path: "/pages/index/index" };
  },

  async bootstrap() {
    this.setData({ loading: true, status: "正在加载..." });
    const tasks = [
      this.loadHome(),
      this.loadReviews(),
      this.loadBlogs(),
      this.loadGuides(),
      this.loadActivities(),
      this.loadLocalInfos(),
      this.data.customerId ? this.loadOrders() : Promise.resolve()
    ];
    const results = await Promise.allSettled(tasks);
    const failed = results.find((result) => result.status === "rejected");
    this.setData({
      status: failed ? `部分内容加载失败：${failed.reason?.message || failed.reason?.errMsg || "请下拉重试"}` : "",
      loading: false
    });
  },

  async loadHome() {
    const [topics, upcoming] = await Promise.all([
      request("/topic-pages?published=true"),
      request("/upcoming-departures?limit=30")
    ]);
    this.setData({
      topics: (topics || []).slice(0, 4).map((item) => ({
        id: item.id,
        title: item.title,
        summary: cleanText(item.summary, "了解更多"),
        imageUrl: safeImage(item.imageUrl)
      })),
      upcoming: (upcoming || []).map((item) => ({
        ...item,
        coverUrl: safeImage(item.coverUrl),
        timeText: timeText(item)
      }))
    });
    this.refreshLocalDerived();
  },

  async loadReviews() {
    const data = await request("/reviews");
    this.setData({
      homeReviews: (data || [])
        .filter((item) => item.hidden !== true)
        .map(reviewView)
        .slice(0, 12)
    });
  },

  async loadBlogs() {
    const data = await request("/blog-posts?published=true&compact=true");
    this.setData({
      blogPosts: (data || []).map(blogView).slice(0, 6)
    });
  },

  async loadGuides() {
    const data = await request("/guides?compact=true");
    this.setData({
      guides: (data || [])
        .filter((item) => item.paused !== true)
        .map(guideView)
        .slice(0, 8)
    });
  },

  async loadActivities() {
    const data = await request("/activities?locale=zh-CN&compact=true");
    this.setData({
      activities: (data || [])
        .filter((item) => item.schedulePaused !== true)
        .map(activityView)
        .slice(0, 30)
    });
    this.refreshLocalDerived();
  },

  async loadLocalInfos() {
    const data = await request("/local-infos?published=true");
    this.setData({
      localInfos: (data || []).slice(0, 80).map((item) => ({
        id: item.id,
        title: item.title,
        summary: cleanText(item.summary || item.descriptionHtml, "在大理的本地信息"),
        coverUrl: safeImage(item.coverUrl),
        tags: item.tags || [],
        tagText: (item.tags || []).join(" · "),
        address: cleanText(item.address),
        mapUrl: item.mapUrl || "",
        contentText: cleanText(item.contentHtml || item.descriptionHtml)
      }))
    });
    this.refreshLocalDerived();
  },

  async loadOrders() {
    if (!this.data.customerId) return;
    const data = await request(`/orders?customerId=${this.data.customerId}`);
    this.setData({
      orders: (data || []).map((item) => ({
        ...item,
        amountText: money(item.amountCents),
        timeText: item.startsAt && item.endsAt ? timeText(item) : "",
        statusText: item.status === "BOOKED" ? "已预约" : item.status === "PENDING_PAYMENT" ? "待支付" : item.status
      }))
    });
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.tab;
    this.setData({ activeTab, detailOpen: false, localDetailOpen: false, blogDetailOpen: false, guideDetailOpen: false });
    if (activeTab === "mine" && this.data.customerId) this.loadOrders();
  },

  refreshLocalDerived(localFilterOverride) {
    const localInfos = this.data.localInfos || [];
    const localFilter = localFilterOverride !== undefined ? localFilterOverride : this.data.localFilter;
    this.setData({
      localScenes: localSceneCards(localInfos),
      localEvents: localUpcomingEvents(localInfos, this.data.upcoming, this.data.activities),
      visibleLocalInfos: localInfos.filter((item) => localInfoHasTag(item, localFilter)).slice(0, 30)
    });
  },

  openLocalScene(event) {
    const localFilter = event.currentTarget.dataset.tag || "";
    this.setData({ localFilter });
    this.refreshLocalDerived(localFilter);
  },

  clearLocalFilter() {
    this.setData({ localFilter: "" });
    this.refreshLocalDerived("");
  },

  toggleReviews() {
    this.setData({ reviewsExpanded: !this.data.reviewsExpanded });
  },

  previewReviewImage(event) {
    const { id, index } = event.currentTarget.dataset;
    const review = (this.data.homeReviews || []).find((item) => item.id === id);
    if (!review?.imageUrls?.length) return;
    wx.previewImage({
      urls: review.imageUrls,
      current: review.imageUrls[Number(index) || 0]
    });
  },

  openLocalInfo(event) {
    const id = event.currentTarget.dataset.id;
    const localInfoDetail = (this.data.localInfos || []).find((item) => item.id === id);
    if (!localInfoDetail) return;
    this.setData({ localDetailOpen: true, localInfoDetail });
  },

  openLocalEvent(event) {
    const { id, kind } = event.currentTarget.dataset;
    if (kind === "activity") {
      this.openActivity(event);
      return;
    }
    const localInfoDetail = (this.data.localInfos || []).find((item) => item.id === id);
    if (localInfoDetail) this.setData({ localDetailOpen: true, localInfoDetail });
  },

  closeLocalInfo() {
    this.setData({ localDetailOpen: false, localInfoDetail: null });
  },

  async openBlog(event) {
    const slug = event.currentTarget.dataset.slug;
    if (!slug) return;
    this.setData({ blogDetailOpen: true, blogDetail: null, status: "正在读取文章..." });
    try {
      const post = await request(`/blog-posts/${slug}`);
      this.setData({
        blogDetail: {
          ...blogView(post),
          contentText: plainText(post.contentHtml || post.summary)
        },
        status: ""
      });
    } catch (error) {
      this.setData({ status: `文章读取失败：${error.message || error.errMsg || error}` });
    }
  },

  closeBlog() {
    this.setData({ blogDetailOpen: false, blogDetail: null });
  },

  async openGuide(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    this.setData({ guideDetailOpen: true, guideDetail: null, status: "正在读取领队..." });
    try {
      const guide = await request(`/guides/${id}`);
      this.setData({
        guideDetail: {
          ...guideView(guide),
          images: (guide.images || []).map((image) => safeImage(image.url || image.cosKey)).filter(Boolean).slice(0, 8),
          contentText: plainText(guide.descriptionHtml)
        },
        status: ""
      });
    } catch (error) {
      this.setData({ status: `领队读取失败：${error.message || error.errMsg || error}` });
    }
  },

  closeGuide() {
    this.setData({ guideDetailOpen: false, guideDetail: null });
  },

  async ensureLogin() {
    if (this.data.customerId) return this.data.customerId;
    this.setData({ status: "正在微信登录..." });
    const code = await wxLogin();
    const customer = await request("/wechat/login", {
      method: "POST",
      data: { kind: "customer", code }
    });
    app.globalData.customerId = customer.customerId;
    wx.setStorageSync("dalitripCustomerId", customer.customerId);
    this.setData({ customerId: customer.customerId, status: "" });
    return customer.customerId;
  },

  async login() {
    try {
      await this.ensureLogin();
      await this.loadOrders();
      wx.showToast({ title: "已登录", icon: "success" });
    } catch (error) {
      this.setData({ status: `登录失败：${error.message || error.errMsg || error}` });
    }
  },

  async openActivity(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ detailOpen: true, detailLoading: true, activity: null, slots: [], selectedSlotId: "", status: "正在读取活动..." });
    try {
      const activity = activityView(await request(`/activities/${id}?compact=true`));
      const slots = await this.findSlots(id);
      this.setData({
        activity,
        slots,
        selectedSlotId: slots[0]?.id || "",
        status: slots.length ? "" : "未来 30 天暂时没有可约时间。"
      });
    } catch (error) {
      this.setData({ status: `活动读取失败：${error.message || error.errMsg || error}` });
    } finally {
      this.setData({ detailLoading: false });
    }
  },

  async findSlots(activityId) {
    for (let offset = 0; offset < 30; offset += 1) {
      const date = dateOffset(offset);
      const slots = bookableSlots(await request(`/activities/${activityId}/slots?date=${date}&includeGenerated=true`));
      if (slots.length) return slots;
    }
    return [];
  },

  closeDetail() {
    this.setData({ detailOpen: false, activity: null, slots: [], selectedSlotId: "" });
  },

  selectSlot(event) {
    this.setData({ selectedSlotId: event.currentTarget.dataset.id });
  },

  async createOrderAndPay() {
    if (this.data.payLoading) return;
    this.setData({ payLoading: true, status: "准备支付..." });
    try {
      const customerId = await this.ensureLogin();
      const slot = this.data.slots.find((item) => item.id === this.data.selectedSlotId);
      if (!slot) throw new Error("请先选择一个可预约时间");
      const priceOption = slot.priceOptions?.[0];
      if (!priceOption) throw new Error("这个排班缺少价格规格");
      const order = await request("/orders", {
        method: "POST",
        data: {
          customerId,
          slotId: slot.id,
          lineItems: [{ priceOptionId: priceOption.id, quantity: 1 }],
          profile: { nickname: "微信用户" }
        }
      });
      const payment = await request(`/orders/${order.id}/wechat-prepay`, {
        method: "POST",
        data: { customerId }
      });
      await wxPay(payment);
      await this.loadOrders();
      await this.loadHome();
      this.setData({ activeTab: "mine", detailOpen: false, status: "支付已完成，订单已预约。" });
    } catch (error) {
      this.setData({ status: `支付停止：${error.message || error.errMsg || error}` });
    } finally {
      this.setData({ payLoading: false });
    }
  }
});
