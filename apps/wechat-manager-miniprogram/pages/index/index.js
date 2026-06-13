const app = getApp();

const accounts = [
  { id: "account-owner", name: "主账号", desc: "查看全部领队" }
];

const statusText = {
  FREE: "空",
  MORNING: "上午占用",
  AFTERNOON: "下午占用",
  FULL: "全天占用"
};

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

const dateLabel = (date) => {
  const parsed = new Date(`${date}T00:00:00+08:00`);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
};

const weekLabel = (date) => {
  const parsed = new Date(`${date}T00:00:00+08:00`);
  return ["日", "一", "二", "三", "四", "五", "六"][parsed.getDay()];
};

const occupied = (status, slot) => status === "FULL" || status === slot;

const nextStatus = (status, slot) => {
  const morning = slot === "MORNING" ? !occupied(status, "MORNING") : occupied(status, "MORNING");
  const afternoon = slot === "AFTERNOON" ? !occupied(status, "AFTERNOON") : occupied(status, "AFTERNOON");
  if (morning && afternoon) return "FULL";
  if (morning) return "MORNING";
  if (afternoon) return "AFTERNOON";
  return "FREE";
};

const initials = (name = "") => String(name).trim().slice(0, 1) || "D";

Page({
  data: {
    accounts,
    accountIndex: Math.max(0, accounts.findIndex((item) => item.id === app.globalData.adminAccountId)),
    accountId: app.globalData.adminAccountId,
    mode: "mark",
    filter: "all",
    loading: false,
    savingKey: "",
    status: "",
    dates: [],
    guides: [],
    availability: [],
    markGuides: [],
    freeDates: []
  },

  onLoad() {
    this.loadCalendar();
  },

  onPullDownRefresh() {
    this.loadCalendar().finally(() => wx.stopPullDownRefresh());
  },

  async loadCalendar() {
    this.setData({ loading: true, status: "正在加载领队日历..." });
    try {
      const data = await request(`/guide-calendar?adminAccountId=${this.data.accountId}`);
      this.setData({
        dates: data.dates || [],
        guides: data.guides || [],
        availability: data.availability || [],
        status: ""
      });
      this.prepareViews();
    } catch (error) {
      this.setData({ status: error.message || "加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  statusFor(guideId, date) {
    return (this.data.availability || []).find((item) => item.guideId === guideId && item.date === date)?.status || "FREE";
  },

  visibleGuides() {
    const { filter, guides } = this.data;
    if (filter === "available") {
      return guides.filter((guide) => this.data.dates.some((date) => this.statusFor(guide.id, date) !== "FULL"));
    }
    return guides;
  },

  prepareViews() {
    const guides = this.visibleGuides();
    const markGuides = guides.map((guide) => ({
      ...guide,
      initial: initials(guide.name),
      activityCount: (guide.activities || []).length,
      days: this.data.dates.map((date) => {
        const status = this.statusFor(guide.id, date);
        return {
          key: `${guide.id}-${date}`,
          guideId: guide.id,
          date,
          label: dateLabel(date),
          week: weekLabel(date),
          status,
          statusLabel: statusText[status],
          morningOccupied: occupied(status, "MORNING"),
          afternoonOccupied: occupied(status, "AFTERNOON")
        };
      })
    }));

    const freeDates = this.data.dates.map((date) => {
      const allDay = guides.filter((guide) => this.statusFor(guide.id, date) === "FREE");
      const morning = guides.filter((guide) => !["MORNING", "FULL"].includes(this.statusFor(guide.id, date)));
      const afternoon = guides.filter((guide) => !["AFTERNOON", "FULL"].includes(this.statusFor(guide.id, date)));
      return {
        date,
        label: dateLabel(date),
        week: weekLabel(date),
        allDay: allDay.map((guide) => guide.name).join("、") || "暂无",
        morning: morning.map((guide) => guide.name).join("、") || "暂无",
        afternoon: afternoon.map((guide) => guide.name).join("、") || "暂无"
      };
    });

    this.setData({ markGuides, freeDates });
  },

  changeAccount(event) {
    const accountIndex = Number(event.detail.value);
    const accountId = accounts[accountIndex].id;
    app.globalData.adminAccountId = accountId;
    wx.setStorageSync("dalitripManagerAccountId", accountId);
    this.setData({ accountIndex, accountId });
    this.loadCalendar();
  },

  setMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode });
  },

  setFilter(event) {
    this.setData({ filter: event.currentTarget.dataset.filter });
    this.prepareViews();
  },

  async toggleHalf(event) {
    const { guideId, date, status, slot } = event.currentTarget.dataset;
    const next = nextStatus(status || "FREE", slot);
    const savingKey = `${guideId}-${date}-${slot}`;
    this.setData({ savingKey });
    try {
      const data = await request("/guide-calendar", {
        method: "PATCH",
        data: {
          adminAccountId: this.data.accountId,
          guideId,
          date,
          status: next
        }
      });
      this.setData({
        dates: data.dates || [],
        guides: data.guides || [],
        availability: data.availability || [],
        status: ""
      });
      this.prepareViews();
      wx.showToast({ title: next === "FREE" ? "已清空" : `已标记${statusText[next]}`, icon: "none" });
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ savingKey: "" });
    }
  }
});
