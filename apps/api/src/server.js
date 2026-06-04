import { createServer } from "node:http";
import { createApp } from "./app.js";
import { MemoryStore } from "./store.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT ?? 3000);
const dataFile = process.env.DALITRIP_DATA_FILE ?? path.resolve("data/runtime-data.json");

async function loadData() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch {
    return undefined;
  }
}

const store = new MemoryStore(await loadData());
const saveData = async () => {
  try {
    await mkdir(path.dirname(dataFile), { recursive: true });
    await writeFile(dataFile, JSON.stringify(store.snapshot(), null, 2));
  } catch (error) {
    console.warn(`保存本地数据失败: ${error.message}`);
  }
};
const server = createServer(createApp(store));

setInterval(saveData, 5000).unref();
process.once("SIGINT", async () => {
  await saveData();
  process.exit(0);
});
process.once("SIGTERM", async () => {
  await saveData();
  process.exit(0);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Dali Trip API listening on http://localhost:${port}`);
});
