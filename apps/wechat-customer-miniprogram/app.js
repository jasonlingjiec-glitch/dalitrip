App({
  globalData: {
    apiBase: "https://api.dalitripapp.cn/api",
    customerId: wx.getStorageSync("dalitripCustomerId") || ""
  }
});
