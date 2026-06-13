import { X509Certificate, createDecipheriv, createHash, createSign, createVerify, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const optional = (value) => String(value ?? "").trim();
const env = (key) => optional(process.env[key]);
const base64 = (value) => Buffer.from(value).toString("base64");

export function wechatConfig() {
  return {
    customerAppId: env("WECHAT_CUSTOMER_APP_ID"),
    customerAppSecret: env("WECHAT_CUSTOMER_APP_SECRET"),
    managerAppId: env("WECHAT_MANAGER_APP_ID"),
    managerAppSecret: env("WECHAT_MANAGER_APP_SECRET"),
    merchantId: env("WECHAT_PAY_MCH_ID"),
    payAppId: env("WECHAT_PAY_APP_ID") || env("WECHAT_CUSTOMER_APP_ID"),
    apiV3Key: env("WECHAT_PAY_API_V3_KEY"),
    certPath: env("WECHAT_PAY_CERT_PATH"),
    keyPath: env("WECHAT_PAY_KEY_PATH"),
    platformPublicKeyId: env("WECHAT_PAY_PLATFORM_PUBLIC_KEY_ID"),
    platformPublicKeyPath: env("WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH"),
    notifyUrl: env("WECHAT_PAY_NOTIFY_URL") || "https://api.dalitripapp.cn/api/wechat/pay/notify"
  };
}

export function assertWechatLoginConfigured(kind = "customer") {
  const config = wechatConfig();
  const appId = kind === "manager" ? config.managerAppId : config.customerAppId;
  const appSecret = kind === "manager" ? config.managerAppSecret : config.customerAppSecret;
  if (!appId || !appSecret) throw new Error("微信登录配置不完整");
  return { appId, appSecret };
}

export function assertWechatPayConfigured() {
  const config = wechatConfig();
  const missing = [
    ["merchantId", config.merchantId],
    ["payAppId", config.payAppId],
    ["apiV3Key", config.apiV3Key],
    ["certPath", config.certPath],
    ["keyPath", config.keyPath],
    ["platformPublicKeyId", config.platformPublicKeyId],
    ["platformPublicKeyPath", config.platformPublicKeyPath]
  ].filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`微信支付配置不完整: ${missing.join(", ")}`);
  return config;
}

export async function codeToSession(kind, code) {
  const { appId, appSecret } = assertWechatLoginConfigured(kind);
  const params = new URLSearchParams({
    appid: appId,
    secret: appSecret,
    js_code: code,
    grant_type: "authorization_code"
  });
  const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params}`);
  const payload = await response.json();
  if (!response.ok || payload.errcode) {
    throw new Error(payload.errmsg || "微信登录失败");
  }
  return payload;
}

async function merchantPrivateKey(config) {
  return readFile(config.keyPath, "utf8");
}

async function merchantSerialNo(config) {
  const cert = new X509Certificate(await readFile(config.certPath));
  return cert.serialNumber.replaceAll(":", "");
}

async function signWechatPayMessage(message, config = assertWechatPayConfigured()) {
  const signer = createSign("RSA-SHA256");
  signer.update(message);
  signer.end();
  return signer.sign(await merchantPrivateKey(config), "base64");
}

async function authorization(method, pathWithQuery, body, config) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomUUID().replaceAll("-", "");
  const bodyText = body ? JSON.stringify(body) : "";
  const message = `${method}\n${pathWithQuery}\n${timestamp}\n${nonce}\n${bodyText}\n`;
  const signature = await signWechatPayMessage(message, config);
  return {
    bodyText,
    value: `WECHATPAY2-SHA256-RSA2048 mchid="${config.merchantId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${await merchantSerialNo(config)}",signature="${signature}"`
  };
}

function requestPaymentPackage(prepayId, config) {
  return { package: `prepay_id=${prepayId}`, signType: "RSA" };
}

export async function createJsapiTransaction(input) {
  const config = assertWechatPayConfigured();
  const path = "/v3/pay/transactions/jsapi";
  const body = {
    appid: config.payAppId,
    mchid: config.merchantId,
    description: input.description.slice(0, 127),
    out_trade_no: input.outTradeNo,
    notify_url: config.notifyUrl,
    amount: { total: input.amountCents, currency: "CNY" },
    payer: { openid: input.openid }
  };
  const auth = await authorization("POST", path, body, config);
  const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
    method: "POST",
    headers: {
      "authorization": auth.value,
      "content-type": "application/json",
      "accept": "application/json",
      "user-agent": "DaliTrip/1.0"
    },
    body: auth.bodyText
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.detail?.message || "微信预支付下单失败");
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = randomUUID().replaceAll("-", "");
  const packageInfo = requestPaymentPackage(payload.prepay_id, config);
  const paySign = await signWechatPayMessage(`${config.payAppId}\n${timestamp}\n${nonceStr}\n${packageInfo.package}\n`, config);
  return {
    appId: config.payAppId,
    timeStamp: timestamp,
    nonceStr,
    ...packageInfo,
    paySign,
    prepayId: payload.prepay_id
  };
}

export function decryptWechatResource(resource) {
  const config = assertWechatPayConfigured();
  const key = Buffer.from(config.apiV3Key, "utf8");
  const ciphertext = Buffer.from(resource.ciphertext, "base64");
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decryptor = createDecipheriv("aes-256-gcm", key, Buffer.from(resource.nonce, "utf8"));
  decryptor.setAuthTag(authTag);
  decryptor.setAAD(Buffer.from(resource.associated_data ?? "", "utf8"));
  return JSON.parse(Buffer.concat([decryptor.update(data), decryptor.final()]).toString("utf8"));
}

export async function verifyWechatPaySignature(headers, bodyText) {
  const config = assertWechatPayConfigured();
  const timestamp = headers["wechatpay-timestamp"];
  const nonce = headers["wechatpay-nonce"];
  const signature = headers["wechatpay-signature"];
  const serial = headers["wechatpay-serial"];
  if (!timestamp || !nonce || !signature) return false;
  if (serial && serial !== config.platformPublicKeyId) return false;
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${timestamp}\n${nonce}\n${bodyText}\n`);
  verifier.end();
  return verifier.verify(await readFile(config.platformPublicKeyPath, "utf8"), signature, "base64");
}

export function paymentHash(value) {
  return base64(createHash("sha256").update(String(value ?? "")).digest()).slice(0, 16);
}
