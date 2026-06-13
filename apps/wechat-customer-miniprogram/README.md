# DaliTrip 客户小程序测试版

这是用于微信开发者工具测试的原生小程序壳。

导入目录：

```text
/Users/ling/Documents/Codex/2026-05-30/attach/dalitrip-mvp/apps/wechat-customer-miniprogram
```

AppID：

```text
wx529c2cef053abefb
```

当前用于测试：

- 微信登录：`wx.login` -> `POST https://api.dalitripapp.cn/api/wechat/login`
- 创建订单：`POST https://api.dalitripapp.cn/api/orders`
- 预支付：`POST https://api.dalitripapp.cn/api/orders/:orderId/wechat-prepay`
- 拉起微信支付：`wx.requestPayment`

真实支付弹窗需要在微信开发者工具或真机里确认。
