App({
  globalData: {
    apiBase: "https://api.dalitripapp.cn/api",
    adminAccountId: wx.getStorageSync("dalitripManagerAccountId") || "account-owner"
  }
});
