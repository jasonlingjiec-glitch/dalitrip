import { readFile } from "node:fs/promises";

const env = await readFile(new URL("../.env.example", import.meta.url), "utf8");
const requiredPublicValues = [
  "CUSTOMER_MINIAPP_APPID=wx529c2cef053abefb",
  "MANAGER_MINIAPP_APPID=wx71c7c2f4bcff4434",
  "WECHAT_PAY_MCHID=1113392062",
  "COS_REGION=ap-guangzhou",
  "COS_BUCKET=dalitrip1-assets-1407168056"
];

for (const value of requiredPublicValues) {
  if (!env.includes(value)) {
    throw new Error(`Missing public configuration: ${value}`);
  }
}

console.log("Project public configuration is complete.");

