import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { seedData } from "../src/seed-data.js";
import { MemoryStore } from "../src/store.js";

const request = async (app, path, options = {}) => {
  const payload = options.body ? Buffer.from(options.body) : null;
  const request = {
    method: options.method ?? "GET",
    url: path,
    async *[Symbol.asyncIterator]() {
      if (payload) yield payload;
    }
  };
  let status;
  let data = "";
  const response = {
    writeHead(nextStatus) {
      status = nextStatus;
    },
    end(chunk = "") {
      data += chunk;
    }
  };
  await app(request, response);
  return { status, json: () => JSON.parse(data) };
};

test("lists localized activities and filters tags with AND semantics", async () => {
  const app = createApp();

  const response = await request(app, "/api/activities?locale=en&tagIds=tag-hiking,tag-beginner");
  assert.equal(response.status, 200);
  const body = response.json();
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].content.name, "Fern Forest Hike");

  const emptyResponse = await request(app, "/api/activities?tagIds=tag-family,tag-water");
  assert.deepEqual(emptyResponse.json().data, []);
});

test("lists public upcoming departures with masked customer names", () => {
  const store = new MemoryStore();
  const departures = store.listUpcomingDepartures({ now: new Date("2026-06-02T00:00:00.000Z") });

  assert.equal(departures.length, 7);
  const forest = departures.find((departure) => departure.activityId === "activity-forest-hike");
  assert.equal(forest.customerDisplayName, "M**");
  assert.equal(forest.bookedCount, 3);
  assert.equal("customerMobile" in forest, false);
});

test("lists related activities for customers who also booked or shared tags", async () => {
  const app = createApp();
  const response = await request(app, "/api/activities/activity-forest-hike/related?limit=3");

  assert.equal(response.status, 200);
  const related = response.json().data;
  assert.equal(related.length, 3);
  assert.equal(related.every((activity) => activity.id !== "activity-forest-hike"), true);
  assert.equal(new Set(related.map((activity) => activity.id)).size, 3);
  assert.equal(related.every((activity) => activity.content.name && activity.coverUrl), true);
});

test("lists available activities by date and filters tags", () => {
  const store = new MemoryStore();
  const now = new Date("2026-06-02T00:00:00.000Z");
  const activities = store.listAvailableActivities({ date: "2026-06-06", now });

  assert.equal(activities.length, 4);
  const forest = activities.find((activity) => activity.id === "activity-forest-hike");
  assert.equal(forest.groupName, "徒步组");
  assert.equal(forest.slots[0].id, "slot-forest-demo");

  assert.deepEqual(store.listAvailableActivities({ date: "2026-06-06", tagIds: ["tag-family", "tag-water"], now }), []);
  assert.deepEqual(store.listAvailableActivities({ date: "2026-06-07", now }), []);
});

test("generates future bookable slots from the permanent weekly rhythm", () => {
  const store = new MemoryStore();
  const now = new Date("2026-06-02T00:00:00.000Z");

  const activities = store.listAvailableActivities({ date: "2026-06-13", now });
  const forest = activities.find((activity) => activity.id === "activity-forest-hike");

  assert.equal(forest.slots.length, 1);
  assert.equal(forest.slots[0].startsAt, "2026-06-13T14:00:00+08:00");
  assert.equal(forest.slots[0].endsAt, "2026-06-13T18:00:00+08:00");
  assert.equal(forest.slots[0].generatedFromRuleId, "rule-forest-weekend");
  assert.equal(store.listSlots("activity-forest-hike").some((slot) => slot.generatedFromRuleId), false);
  assert.equal(store.listSlots("activity-forest-hike", { date: "2026-06-13", includeGenerated: true }).length, 1);
});

test("lets rest days hide weekly slots while explicit special schedules remain available", () => {
  const store = new MemoryStore();
  const now = new Date("2026-06-02T00:00:00.000Z");
  store.createScheduleRule("activity-forest-hike", { ruleType: "REST_DAY", validFrom: "2026-06-13", validUntil: "2026-06-20" });

  assert.equal(store.listAvailableActivities({ date: "2026-06-13", now }).some((activity) => activity.id === "activity-forest-hike"), false);

  store.createSlot("activity-forest-hike", {
    startsAt: "2026-06-20T09:00:00+08:00",
    endsAt: "2026-06-20T12:00:00+08:00",
    capacity: 8,
    priceOptions: [{ name: "成人", priceCents: 19800 }]
  });
  const forest = store.listAvailableActivities({ date: "2026-06-20", now }).find((activity) => activity.id === "activity-forest-hike");

  assert.equal(forest.slots.length, 1);
  assert.equal(forest.slots[0].startsAt, "2026-06-20T09:00:00+08:00");
  assert.equal("generatedFromRuleId" in forest.slots[0], false);
});

test("creates tags and rejects duplicate Chinese tag names", async () => {
  const app = createApp();
  const created = await request(app, "/api/tags", {
    method: "POST",
    body: JSON.stringify({ code: "kid-friendly", translations: { "zh-CN": "适合儿童", en: "Kid friendly" } })
  });
  assert.equal(created.status, 201);

  const tags = await request(app, "/api/tags");
  assert.equal(tags.json().data.some((tag) => tag.name === "适合儿童"), true);
  const createdTagId = created.json().data.id;

  const duplicate = await request(app, "/api/tags", {
    method: "POST",
    body: JSON.stringify({ code: "kid-friendly-2", translations: { "zh-CN": "适合儿童" } })
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.json().error.message, "标签名称已存在");

  const removed = await request(app, `/api/tags/${createdTagId}`, { method: "DELETE" });
  assert.equal(removed.status, 200);
  assert.equal(removed.json().data.id, createdTagId);

  const used = await request(app, "/api/tags/tag-hiking", { method: "DELETE" });
  assert.equal(used.status, 409);
  assert.equal(used.json().error.message, "标签正在被活动使用，请先从活动中移除");
});

test("edits an activity while preserving untranslated locale content", async () => {
  const app = createApp();
  const response = await request(app, "/api/activities/activity-forest-hike", {
    method: "PATCH",
    body: JSON.stringify({
      groupId: "group-hiking",
      advanceBookingHours: 24,
      tagIds: ["tag-family"],
      translations: { "zh-CN": { name: "亲子森林散步", summary: "适合家庭参加。", descriptionHtml: "<h2>森林介绍</h2><p>溪流边散步。</p>" } }
    })
  });
  assert.equal(response.status, 200);

  const chinese = await request(app, "/api/activities/activity-forest-hike");
  assert.equal(chinese.json().data.content.name, "亲子森林散步");
  assert.equal(chinese.json().data.advanceBookingHours, 24);
  assert.equal(chinese.json().data.tags[0].id, "tag-family");
  assert.equal(chinese.json().data.content.descriptionHtml, "<h2>森林介绍</h2><p>溪流边散步。</p>");

  const english = await request(app, "/api/activities/activity-forest-hike?locale=en");
  assert.equal(english.json().data.content.name, "Fern Forest Hike");
});

test("creates overlapping slots and rejects cross-day spans", async () => {
  const app = createApp();
  const body = {
    startsAt: "2026-06-06T15:00:00+08:00",
    endsAt: "2026-06-06T18:00:00+08:00",
    capacity: 8,
    priceOptions: [{ name: "成人", priceCents: 19800 }]
  };

  const overlapping = await request(app, "/api/activities/activity-forest-hike/slots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  assert.equal(overlapping.status, 201);

  const tooLong = await request(app, "/api/activities/activity-forest-hike/slots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, endsAt: "2026-06-07T18:00:00+08:00" })
  });
  assert.equal(tooLong.status, 400);
});

test("creates rest-day ranges and rejects reversed dates", async () => {
  const app = createApp();
  const created = await request(app, "/api/activities/activity-forest-hike/schedule-rules", {
    method: "POST",
    body: JSON.stringify({ ruleType: "REST_DAY", validFrom: "2026-06-10", validUntil: "2026-06-12", note: "休息" })
  });
  assert.equal(created.status, 201);
  assert.equal(created.json().data.note, "休息");

  const reversed = await request(app, "/api/activities/activity-forest-hike/schedule-rules", {
    method: "POST",
    body: JSON.stringify({ ruleType: "REST_DAY", validFrom: "2026-06-12", validUntil: "2026-06-10" })
  });
  assert.equal(reversed.status, 400);
  assert.equal(reversed.json().error.message, "休息日结束日期不能早于开始日期");
});

test("edits and deletes an empty special schedule", async () => {
  const app = createApp();
  const created = await request(app, "/api/activities/activity-forest-hike/slots", {
    method: "POST",
    body: JSON.stringify({
      startsAt: "2026-06-08T09:00:00+08:00",
      endsAt: "2026-06-08T12:00:00+08:00",
      capacity: 8,
      priceOptions: [{ name: "成人", priceCents: 19800 }]
    })
  });
  const slot = created.json().data;
  const updated = await request(app, `/api/slots/${slot.id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...slot, capacity: 10, priceOptions: [{ name: "成人", priceCents: 22800 }] })
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.json().data.capacity, 10);
  assert.equal(updated.json().data.priceOptions[0].priceCents, 22800);

  const removed = await request(app, `/api/slots/${slot.id}`, { method: "DELETE" });
  assert.equal(removed.status, 200);
});

test("pauses schedules while preserving slots", async () => {
  const app = createApp();

  const pause = await request(app, "/api/activities/activity-forest-hike/schedule-pause", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paused: true })
  });
  assert.equal(pause.status, 200);

  const activity = await request(app, "/api/activities/activity-forest-hike");
  assert.equal(activity.json().data.schedulePaused, true);

  const slots = await request(app, "/api/activities/activity-forest-hike/slots");
  assert.equal(slots.json().data.length, 1);
});

test("locks capacity for pending payment and releases it after cancellation", async () => {
  const app = createApp();
  const orderResponse = await request(app, "/api/orders", {
    method: "POST",
    body: JSON.stringify({ customerId: "customer-demo", slotId: "slot-forest-demo", quantity: 2 })
  });
  assert.equal(orderResponse.status, 201);
  const order = orderResponse.json().data;
  assert.equal(order.status, "PENDING_PAYMENT");

  const lockedSlots = await request(app, "/api/activities/activity-forest-hike/slots");
  assert.equal(lockedSlots.json().data[0].bookedCount, 5);

  const cancelResponse = await request(app, `/api/orders/${order.id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ note: "行程变化" })
  });
  assert.equal(cancelResponse.status, 200);
  assert.equal(cancelResponse.json().data.status, "CANCELLED");

  const releasedSlots = await request(app, "/api/activities/activity-forest-hike/slots");
  assert.equal(releasedSlots.json().data[0].bookedCount, 3);
});

test("confirms payment and hides frozen-customer reason behind a generic error", async () => {
  const app = createApp();
  const orderResponse = await request(app, "/api/orders", {
    method: "POST",
    body: JSON.stringify({ customerId: "customer-demo", slotId: "slot-forest-demo", quantity: 1 })
  });
  const order = orderResponse.json().data;
  const paymentResponse = await request(app, `/api/orders/${order.id}/confirm-payment`, {
    method: "PATCH",
    body: JSON.stringify({ paymentMethod: "WECHAT", wechatTransactionId: "demo-payment" })
  });
  assert.equal(paymentResponse.status, 200);
  assert.equal(paymentResponse.json().data.status, "BOOKED");

  const frozenResponse = await request(app, "/api/orders", {
    method: "POST",
    body: JSON.stringify({ customerId: "customer-frozen", slotId: "slot-forest-demo", quantity: 1 })
  });
  assert.equal(frozenResponse.status, 503);
  assert.equal(frozenResponse.json().error.message, "系统故障，请稍后再试");
});

test("releases an unpaid capacity lock after fifteen minutes", () => {
  const store = new MemoryStore();
  const createdAt = new Date(Date.now() + 60 * 60 * 1000);
  const order = store.createOrder(
    { customerId: "customer-demo", slotId: "slot-forest-demo", quantity: 2 },
    createdAt
  );
  assert.equal(store.listSlots("activity-forest-hike")[0].bookedCount, 5);

  store.releaseExpiredCapacityLocks(new Date(createdAt.getTime() + 16 * 60 * 1000));

  assert.equal(store.getOrder(order.id).status, "CANCELLED");
  assert.equal(store.listSlots("activity-forest-hike")[0].bookedCount, 3);
});

test("creates a weekly rhythm for multiple weekdays", async () => {
  const app = createApp();
  const response = await request(app, "/api/activities/activity-forest-hike/regular-schedule-rules", {
    method: "POST",
    body: JSON.stringify({
      weekdays: [2, 4, 6],
      startsAt: "09:30",
      endsAt: "12:30",
      capacity: 10,
      priceOptions: [{ name: "成人", priceCents: 16800 }, { name: "儿童", priceCents: 9800 }]
    })
  });
  assert.equal(response.status, 201);
  assert.deepEqual(response.json().data.map((rule) => rule.weekday), [2, 4, 6]);
});

test("edits and deletes a weekly schedule rule", async () => {
  const app = createApp();
  const created = await request(app, "/api/activities/activity-forest-hike/regular-schedule-rules", {
    method: "POST",
    body: JSON.stringify({ weekdays: [2], startsAt: "09:00", endsAt: "12:00", capacity: 10, priceOptions: [{ name: "成人", priceCents: 16800 }] })
  });
  const rule = created.json().data[0];
  const updated = await request(app, `/api/schedule-rules/${rule.id}`, {
    method: "PATCH",
    body: JSON.stringify({ capacity: 8, priceOptions: [{ name: "成人", priceCents: 19800 }, { name: "儿童", priceCents: 9800 }] })
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.json().data.capacity, 8);
  assert.equal(updated.json().data.priceOptions[1].priceCents, 9800);

  const removed = await request(app, `/api/schedule-rules/${rule.id}`, { method: "DELETE" });
  assert.equal(removed.status, 200);
  const remaining = await request(app, "/api/activities/activity-forest-hike/schedule-rules");
  assert.equal(remaining.json().data.some((item) => item.id === rule.id), false);
});

test("rejects weekly times outside fifteen-minute increments", async () => {
  const app = createApp();
  const response = await request(app, "/api/activities/activity-forest-hike/regular-schedule-rules", {
    method: "POST",
    body: JSON.stringify({ weekdays: [2], startsAt: "09:10", endsAt: "12:00", capacity: 10, priceOptions: [{ name: "成人", priceCents: 16800 }] })
  });
  assert.equal(response.status, 400);
  assert.equal(response.json().error.message, "时间必须以 15 分钟为单位");
});

test("rejects duplicate weekly time periods inside one service schedule", async () => {
  const app = createApp();
  const response = await request(app, "/api/activities/activity-forest-hike/regular-schedule-rules", {
    method: "POST",
    body: JSON.stringify({ weekdays: [6], startsAt: "14:00", endsAt: "18:00", capacity: 12, priceOptions: [{ name: "成人", priceCents: 26800 }] })
  });
  assert.equal(response.status, 409);
  assert.equal(response.json().error.message, "这个星期已经有相同时间段");
});

test("calculates an order using the selected specification price", async () => {
  const app = createApp();
  const response = await request(app, "/api/orders", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      slotId: "slot-forest-demo",
      priceOptionId: "price-slot-child",
      quantity: 2
    })
  });
  assert.equal(response.status, 201);
  assert.equal(response.json().data.specification, "儿童");
  assert.equal(response.json().data.unitPriceCents, 16800);
  assert.equal(response.json().data.amountCents, 33600);
});

test("creates one order with multiple specification line items", async () => {
  const app = createApp();
  const response = await request(app, "/api/orders", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      slotId: "slot-forest-demo",
      lineItems: [
        { priceOptionId: "price-slot-adult", quantity: 1 },
        { priceOptionId: "price-slot-child", quantity: 1 }
      ]
    })
  });
  assert.equal(response.status, 201);
  assert.equal(response.json().data.quantity, 2);
  assert.equal(response.json().data.specification, "成人 × 1，儿童 × 1");
  assert.equal(response.json().data.amountCents, 43600);
  assert.deepEqual(response.json().data.lineItems.map((item) => [item.specification, item.quantity, item.amountCents]), [["成人", 1, 26800], ["儿童", 1, 16800]]);
});

test("lists enriched orders and filters by activity and payment method", async () => {
  const app = createApp();
  const response = await request(app, "/api/orders?activityId=activity-forest-hike&paymentMethod=WECHAT");
  assert.equal(response.status, 200);
  assert.equal(response.json().data.length, 1);
  assert.equal(response.json().data[0].activityName, "徒步蕨类森林");
  assert.equal(response.json().data[0].customerNickname, "Mia");
  assert.equal(response.json().data[0].startsAt, "2026-06-06T14:00:00+08:00");
});

test("filters orders by the booked activity date", async () => {
  const app = createApp();
  const matching = await request(app, "/api/orders?activityDate=2026-06-06");
  assert.equal(matching.status, 200);
  assert.equal(matching.json().data.length, 1);
  assert.equal(matching.json().data[0].activityName, "徒步蕨类森林");

  const empty = await request(app, "/api/orders?activityDate=2026-06-07");
  assert.equal(empty.status, 200);
  assert.equal(empty.json().data.length, 0);

  const range = await request(app, "/api/orders?activityDateFrom=2026-06-01&activityDateTo=2026-06-30");
  assert.equal(range.status, 200);
  assert.equal(range.json().data.length, 1);

  const outsideRange = await request(app, "/api/orders?activityDateFrom=2026-06-07&activityDateTo=2026-06-30");
  assert.equal(outsideRange.status, 200);
  assert.equal(outsideRange.json().data.length, 0);
});

test("releases capacity immediately when an admin cancels a booked order", async () => {
  const data = structuredClone(seedData);
  const slot = data.slots.find((item) => item.id === "slot-forest-demo");
  slot.startsAt = "2099-06-06T14:00:00+08:00";
  slot.endsAt = "2099-06-06T18:00:00+08:00";
  const app = createApp(new MemoryStore(data));
  const cancelled = await request(app, "/api/orders/order-demo-booked/cancel", {
    method: "PATCH",
    body: JSON.stringify({ note: "客人临时改变行程" })
  });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.json().data.status, "REFUNDED");
  assert.equal(cancelled.json().data.cancellationNote, "客人临时改变行程");

  const slots = await request(app, "/api/activities/activity-forest-hike/slots");
  assert.equal(slots.json().data[0].bookedCount, 0);
});

test("automatically completes booked orders after the activity ends", () => {
  const store = new MemoryStore();
  const now = new Date("2026-06-06T10:01:00.000Z");

  const order = store.getOrder("order-demo-booked", null, now);

  assert.equal(order.status, "COMPLETED");
  assert.equal(order.completedAt, now.toISOString());
  assert.equal(store.listSlots("activity-forest-hike")[0].bookedCount, 3);
  assert.throws(
    () => store.getCancellationPreview("order-demo-booked", {}, now),
    (error) => error.status === 409 && error.message === "订单状态不允许取消"
  );
});

test("calculates customer cancellation refunds by hours before the activity", () => {
  const store = new MemoryStore();
  const twoDaysBefore = store.getCancellationPreview("order-demo-booked", { customerId: "customer-demo" }, new Date("2026-06-04T05:00:00.000Z"));
  assert.equal(twoDaysBefore.refundRate, 1);
  assert.equal(twoDaysBefore.refundAmountCents, 80400);
  assert.equal(twoDaysBefore.leaderWechat, "dalitrip-guide");

  const oneDayBefore = store.getCancellationPreview("order-demo-booked", { customerId: "customer-demo" }, new Date("2026-06-05T05:00:00.000Z"));
  assert.equal(oneDayBefore.refundRate, 0.7);
  assert.equal(oneDayBefore.refundAmountCents, 56280);

  const twelveHoursBefore = store.getCancellationPreview("order-demo-booked", { customerId: "customer-demo" }, new Date("2026-06-05T18:00:00.000Z"));
  assert.equal(twelveHoursBefore.refundRate, 0.5);

  const shortlyBefore = store.getCancellationPreview("order-demo-booked", { customerId: "customer-demo" }, new Date("2026-06-06T04:00:00.000Z"));
  assert.equal(shortlyBefore.refundRate, 0.3);
});

test("gifts wallet credit with an auditable note", async () => {
  const app = createApp();
  const adjusted = await request(app, "/api/customers/customer-demo/wallet-adjustments", {
    method: "POST",
    body: JSON.stringify({ amountCents: 8800, note: "老客赠送" })
  });
  assert.equal(adjusted.status, 201);
  assert.equal(adjusted.json().data.walletBalanceCents, 8800);
  assert.equal(adjusted.json().data.walletTransactions[0].note, "老客赠送");

  const missingNote = await request(app, "/api/customers/customer-demo/wallet-adjustments", {
    method: "POST",
    body: JSON.stringify({ amountCents: 100 })
  });
  assert.equal(missingNote.status, 400);
});

test("freezes and unfreezes a customer booking permission", async () => {
  const app = createApp();
  const frozen = await request(app, "/api/customers/customer-demo/frozen", {
    method: "PATCH",
    body: JSON.stringify({ frozen: true })
  });
  assert.equal(frozen.status, 200);
  assert.equal(frozen.json().data.frozen, true);

  const blockedOrder = await request(app, "/api/orders", {
    method: "POST",
    body: JSON.stringify({ customerId: "customer-demo", slotId: "slot-forest-demo", quantity: 1 })
  });
  assert.equal(blockedOrder.status, 503);
  assert.equal(blockedOrder.json().error.message, "系统故障，请稍后再试");

  const unfrozen = await request(app, "/api/customers/customer-demo/frozen", {
    method: "PATCH",
    body: JSON.stringify({ frozen: false })
  });
  assert.equal(unfrozen.status, 200);
  assert.equal(unfrozen.json().data.frozen, false);
});

test("creates renames and deletes an unused group while protecting used groups", async () => {
  const app = createApp();
  const created = await request(app, "/api/groups", {
    method: "POST",
    body: JSON.stringify({ name: "观鸟组" })
  });
  assert.equal(created.status, 201);
  const groupId = created.json().data.id;

  const renamed = await request(app, `/api/groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: "自然观察组" })
  });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.json().data.name, "自然观察组");

  const account = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "观鸟领队", mobile: "13800007777", groupIds: [groupId] })
  });
  assert.equal(account.status, 201);

  const removed = await request(app, `/api/groups/${groupId}`, { method: "DELETE" });
  assert.equal(removed.status, 200);
  const accounts = await request(app, "/api/admin-accounts");
  assert.deepEqual(
    accounts
      .json()
      .data.find((item) => item.id === account.json().data.id).groupIds,
    []
  );

  const used = await request(app, "/api/groups/group-hiking", { method: "DELETE" });
  assert.equal(used.status, 409);
  assert.equal(used.json().error.message, "组正在被活动使用，请先调整相关活动");
});

test("creates edits and disables a group-scoped subaccount", async () => {
  const app = createApp();
  const created = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "阿青", mobile: "13800009999", groupIds: ["group-hiking"] })
  });
  assert.equal(created.status, 201);
  const account = created.json().data;
  assert.equal(account.groups[0].name, "徒步组");

  const edited = await request(app, `/api/admin-accounts/${account.id}`, {
    method: "PATCH",
    body: JSON.stringify({ displayName: "阿青", mobile: "13800009999", groupIds: ["group-craft", "group-water"] })
  });
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.json().data.groupIds, ["group-craft", "group-water"]);

  const disabled = await request(app, `/api/admin-accounts/${account.id}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled: false })
  });
  assert.equal(disabled.status, 200);
  assert.equal(disabled.json().data.enabled, false);
});

test("requires at least one subaccount group and protects the owner account", async () => {
  const app = createApp();
  const missingGroups = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "未授权", mobile: "13800008888", groupIds: [] })
  });
  assert.equal(missingGroups.status, 400);

  const owner = await request(app, "/api/admin-accounts/account-owner/enabled", {
    method: "PATCH",
    body: JSON.stringify({ enabled: false })
  });
  assert.equal(owner.status, 400);
  assert.equal(owner.json().error.message, "主账号不能停用");
});

test("limits manager order access to the subaccount groups", async () => {
  const app = createApp();
  const account = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "水上领队", mobile: "13800006666", groupIds: ["group-water"] })
  });
  const accountId = account.json().data.id;

  const visibleOrders = await request(app, `/api/orders?adminAccountId=${accountId}`);
  assert.equal(visibleOrders.status, 200);
  assert.equal(visibleOrders.json().data.length, 0);

  const detail = await request(app, `/api/orders/order-demo-booked?adminAccountId=${accountId}`);
  assert.equal(detail.status, 403);

  const cancelled = await request(app, "/api/orders/order-demo-booked/cancel", {
    method: "PATCH",
    body: JSON.stringify({ adminAccountId: accountId })
  });
  assert.equal(cancelled.status, 403);
});

test("limits manager activity and schedule changes to the subaccount groups", async () => {
  const app = createApp();
  const account = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "水上领队", mobile: "13800005555", groupIds: ["group-water"] })
  });
  const accountId = account.json().data.id;

  const activities = await request(app, `/api/activities?adminAccountId=${accountId}`);
  assert.equal(activities.status, 200);
  assert.equal(activities.json().data.length, 2);
  assert.equal(activities.json().data.every((activity) => activity.groupId === "group-water"), true);

  const activity = await request(app, `/api/activities/activity-forest-hike?adminAccountId=${accountId}`);
  assert.equal(activity.status, 403);

  const pause = await request(app, "/api/activities/activity-forest-hike/schedule-pause", {
    method: "PATCH",
    body: JSON.stringify({ paused: true, adminAccountId: accountId })
  });
  assert.equal(pause.status, 403);

  const rules = await request(app, `/api/activities/activity-forest-hike/schedule-rules?adminAccountId=${accountId}`);
  assert.equal(rules.status, 403);
});

test("creates multiple activity reviews and hides them from the customer view", async () => {
  const app = createApp();
  const created = await request(app, "/api/activities/activity-forest-hike/reviews", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      displayName: "匿名旅人",
      rating: 4,
      content: "路线舒服，领队讲解也很清楚。",
      imageUrls: []
    })
  });
  assert.equal(created.status, 201);
  const reviewId = created.json().data.id;

  const second = await request(app, "/api/activities/activity-forest-hike/reviews", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      displayName: "Mia",
      rating: 5,
      content: "第二次参加也很好。",
      imageUrls: []
    })
  });
  assert.equal(second.status, 201);

  const hidden = await request(app, `/api/reviews/${reviewId}/hidden`, {
    method: "PATCH",
    body: JSON.stringify({ hidden: true })
  });
  assert.equal(hidden.status, 200);
  assert.equal(hidden.json().data.hidden, true);

  const customerList = await request(app, "/api/reviews?activityId=activity-forest-hike");
  assert.equal(customerList.json().data.some((review) => review.id === reviewId), false);

  const adminList = await request(app, "/api/reviews?activityId=activity-forest-hike&includeHidden=true");
  assert.equal(adminList.json().data.some((review) => review.id === reviewId), true);
});

test("lets customers delete only their own reviews and validates photo limits", async () => {
  const app = createApp();
  const invalid = await request(app, "/api/activities/activity-forest-hike/reviews", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      displayName: "Mia",
      rating: 5,
      content: "图片过多",
      imageUrls: Array.from({ length: 17 }, () => "https://example.com/photo.jpg")
    })
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.json().error.message, "评价图片最多上传 9 张");

  const created = await request(app, "/api/activities/activity-forest-hike/reviews", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      displayName: "Mia",
      rating: 5,
      content: "准备删除的评价",
      imageUrls: []
    })
  });
  const reviewId = created.json().data.id;

  const rejected = await request(app, `/api/reviews/${reviewId}?customerId=customer-frozen`, { method: "DELETE" });
  assert.equal(rejected.status, 403);

  const removed = await request(app, `/api/reviews/${reviewId}?customerId=customer-demo`, { method: "DELETE" });
  assert.equal(removed.status, 200);
  assert.equal(removed.json().data.id, reviewId);
});

test("allows customer leader and admin review replies with scoped manager access", async () => {
  const app = createApp();
  const customerReply = await request(app, "/api/reviews/review-demo/replies", {
    method: "POST",
    body: JSON.stringify({ customerId: "customer-demo", displayName: "山友", content: "请问雨天也会出发吗？" })
  });
  assert.equal(customerReply.status, 201);
  assert.equal(customerReply.json().data.authorRole, "CUSTOMER");

  const leaderReply = await request(app, "/api/reviews/review-demo/replies", {
    method: "POST",
    body: JSON.stringify({ adminAccountId: "account-guide-demo", content: "会提前联系大家确认天气情况。" })
  });
  assert.equal(leaderReply.status, 201);
  assert.equal(leaderReply.json().data.displayName, "领队回复");

  const adminReply = await request(app, "/api/reviews/review-demo/replies", {
    method: "POST",
    body: JSON.stringify({ adminAccountId: "account-owner", content: "谢谢关注。" })
  });
  assert.equal(adminReply.status, 201);
  assert.equal(adminReply.json().data.displayName, "管理员回复");

  const visible = await request(app, "/api/reviews?activityId=activity-forest-hike&adminAccountId=account-guide-demo");
  assert.equal(visible.status, 200);
  assert.equal(visible.json().data[0].replies.some((reply) => reply.displayName === "领队回复"), true);

  const waterAccount = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "水上领队", mobile: "13800004444", groupIds: ["group-water"] })
  });
  const hiddenFromOtherGroup = await request(app, `/api/reviews?adminAccountId=${waterAccount.json().data.id}`);
  assert.deepEqual(hiddenFromOtherGroup.json().data, []);

  const blocked = await request(app, "/api/reviews/review-demo/replies", {
    method: "POST",
    body: JSON.stringify({ adminAccountId: waterAccount.json().data.id, content: "越权回复" })
  });
  assert.equal(blocked.status, 403);
});

test("creates guide profiles and links them to bookable activities", async () => {
  const app = createApp();
  const created = await request(app, "/api/guides", {
    method: "POST",
    body: JSON.stringify({
      name: "阿山",
      photoUrl: "https://example.com/ashan.jpg",
      descriptionHtml: "<p>熟悉高山徒步与森林观察。</p>"
    })
  });
  assert.equal(created.status, 201);

  const guideId = created.json().data.id;
  const activity = await request(app, "/api/activities/activity-forest-hike", {
    method: "PATCH",
    body: JSON.stringify({ guideIds: ["guide-xiaobai", guideId] })
  });
  assert.equal(activity.status, 200);
  assert.deepEqual(activity.json().data.guides.map((guide) => guide.id), ["guide-xiaobai", guideId]);

  const guides = await request(app, "/api/guides");
  assert.equal(guides.status, 200);
  assert.equal(guides.json().data.find((guide) => guide.id === guideId).activities[0].id, "activity-forest-hike");
});

test("pauses guide profiles from public lists and activity selection", async () => {
  const app = createApp();
  const created = await request(app, "/api/guides", {
    method: "POST",
    body: JSON.stringify({
      name: "临时暂停领队",
      photoUrl: "https://example.com/paused-guide.jpg",
      descriptionHtml: "<p>用于测试暂停状态。</p>"
    })
  });
  const guideId = created.json().data.id;

  const paused = await request(app, `/api/guides/${guideId}`, {
    method: "PATCH",
    body: JSON.stringify({ paused: true })
  });
  assert.equal(paused.status, 200);
  assert.equal(paused.json().data.paused, true);

  const publicGuides = await request(app, "/api/guides");
  assert.equal(publicGuides.json().data.some((guide) => guide.id === guideId), false);

  const adminGuides = await request(app, "/api/guides?includePaused=true");
  assert.equal(adminGuides.status, 200);
  assert.equal(adminGuides.json().data.at(-1).id, guideId);

  const activity = await request(app, "/api/activities/activity-forest-hike", {
    method: "PATCH",
    body: JSON.stringify({ guideIds: [guideId] })
  });
  assert.equal(activity.status, 400);
});

test("updates the guide homepage introduction", async () => {
  const app = createApp();
  const updated = await request(app, "/api/guide-page", {
    method: "PATCH",
    body: JSON.stringify({ introductionHtml: "<h2>认识领队</h2><p>选择喜欢的带队方式。</p>" })
  });
  assert.equal(updated.status, 200);

  const guidePage = await request(app, "/api/guide-page");
  assert.equal(guidePage.status, 200);
  assert.equal(guidePage.json().data.introductionHtml, "<h2>认识领队</h2><p>选择喜欢的带队方式。</p>");
});

test("creates and filters a published topic page", async () => {
  const app = createApp();
  const created = await request(app, "/api/topic-pages", {
    method: "POST",
    body: JSON.stringify({
      slug: "forest-beginners",
      title: "森林新手专题",
      summary: "适合第一次走进森林",
      imageUrl: "https://example.com/forest.jpg",
      introductionHtml: "<h2>第一次也很轻松</h2>",
      tagIds: ["tag-hiking", "tag-beginner"],
      published: true
    })
  });
  assert.equal(created.status, 201);
  assert.equal(created.json().data.activities[0].id, "activity-forest-hike");

  const published = await request(app, "/api/topic-pages?published=true");
  assert.equal(published.status, 200);
  assert.equal(published.json().data.some((page) => page.slug === "forest-beginners"), true);

  const updated = await request(app, `/api/topic-pages/${created.json().data.id}`, {
    method: "PATCH",
    body: JSON.stringify({ published: false })
  });
  assert.equal(updated.json().data.published, false);
});

test("deletes topic pages and removes homepage references", async () => {
  const app = createApp();
  const deleted = await request(app, "/api/topic-pages/topic-light-hiking", { method: "DELETE" });
  assert.equal(deleted.status, 200);

  const topicPages = await request(app, "/api/topic-pages");
  assert.equal(topicPages.json().data.some((page) => page.id === "topic-light-hiking"), false);

  const homeEntries = await request(app, "/api/home-entries");
  assert.equal(homeEntries.json().data.some((entry) => entry.targetType === "TOPIC" && entry.targetValue === "light-hiking"), false);
});

test("creates edits and deletes a homepage entry", async () => {
  const app = createApp();
  const created = await request(app, "/api/home-entries", {
    method: "POST",
    body: JSON.stringify({
      title: "公众号攻略",
      imageUrl: "https://example.com/guide.jpg",
      targetType: "EXTERNAL",
      targetValue: "https://example.com/article",
      sortOrder: 3,
      published: true
    })
  });
  assert.equal(created.status, 201);

  const published = await request(app, "/api/home-entries?published=true");
  assert.equal(published.status, 200);
  assert.equal(published.json().data.at(-1).title, "公众号攻略");

  const updated = await request(app, `/api/home-entries/${created.json().data.id}`, {
    method: "PATCH",
    body: JSON.stringify({ published: false })
  });
  assert.equal(updated.json().data.published, false);

  const deleted = await request(app, `/api/home-entries/${created.json().data.id}`, { method: "DELETE" });
  assert.equal(deleted.status, 200);
});

test("creates edits and reorders homepage modules", async () => {
  const app = createApp();
  const created = await request(app, "/api/home-modules", {
    method: "POST",
    body: JSON.stringify({ type: "GUIDES", title: "认识领队", sortOrder: 4, limit: 4, tagIds: [], published: true })
  });
  assert.equal(created.status, 201);

  const modules = (await request(app, "/api/home-modules")).json().data;
  const reordered = await request(app, "/api/home-modules/reorder", {
    method: "PATCH",
    body: JSON.stringify({ ids: [created.json().data.id, ...modules.filter((item) => item.id !== created.json().data.id).map((item) => item.id)] })
  });
  assert.equal(reordered.status, 200);
  assert.equal(reordered.json().data[0].title, "认识领队");

  const updated = await request(app, `/api/home-modules/${created.json().data.id}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "领队档案", limit: 6 })
  });
  assert.equal(updated.json().data.title, "领队档案");
  assert.equal(updated.json().data.limit, 6);

  const divider = await request(app, "/api/home-modules", {
    method: "POST",
    body: JSON.stringify({
      type: "DIVIDER",
      title: "辅助分割",
      sortOrder: 8,
      limit: 1,
      tagIds: [],
      published: true,
      style: { dividerStyle: "LINE", height: 36 }
    })
  });
  assert.equal(divider.status, 201);
  assert.equal(divider.json().data.style.dividerStyle, "LINE");
  assert.equal(divider.json().data.style.height, 36);

  const navigation = await request(app, "/api/home-modules", {
    method: "POST",
    body: JSON.stringify({
      type: "NAV",
      title: "文本导航",
      sortOrder: 9,
      limit: 4,
      tagIds: [],
      published: true,
      navItems: [{ title: "向导", subtitle: "GUIDES", targetType: "GUIDES", targetValue: "" }],
      style: { layout: "FOUR" }
    })
  });
  assert.equal(navigation.status, 201);
  assert.equal(navigation.json().data.type, "NAV");
  assert.equal(navigation.json().data.navItems[0].title, "向导");
});

test("creates filters hides and deletes local information entries", async () => {
  const app = createApp();
  const created = await request(app, "/api/local-infos", {
    method: "POST",
    body: JSON.stringify({
      title: "测试咖啡馆",
      summary: "靠近古城的小店",
      coverUrl: "https://example.com/cafe.jpg",
      tags: "咖啡馆, 古城",
      openingHours: "10:00-18:00",
      address: "古城附近",
      contact: "微信咨询",
      contentHtml: "<p>适合坐一会儿。</p>",
      published: true,
      sortOrder: 8
    })
  });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json().data.tags, ["咖啡馆", "古城"]);

  const filtered = await request(app, "/api/local-infos?published=true&tag=咖啡馆");
  assert.equal(filtered.status, 200);
  assert.ok(filtered.json().data.some((item) => item.title === "测试咖啡馆"));

  const hidden = await request(app, `/api/local-infos/${created.json().data.id}`, {
    method: "PATCH",
    body: JSON.stringify({ published: false })
  });
  assert.equal(hidden.status, 200);
  assert.equal(hidden.json().data.published, false);

  const published = await request(app, "/api/local-infos?published=true&tag=咖啡馆");
  assert.equal(published.json().data.some((item) => item.title === "测试咖啡馆"), false);

  const deleted = await request(app, `/api/local-infos/${created.json().data.id}`, { method: "DELETE" });
  assert.equal(deleted.status, 200);
});

test("notifies only related enabled subaccounts about reviews and customer replies", async () => {
  const app = createApp();
  const waterAccount = await request(app, "/api/admin-accounts", {
    method: "POST",
    body: JSON.stringify({ displayName: "水上领队", mobile: "13800003333", groupIds: ["group-water"] })
  });

  const created = await request(app, "/api/activities/activity-forest-hike/reviews", {
    method: "POST",
    body: JSON.stringify({
      customerId: "customer-demo",
      displayName: "M**",
      rating: 5,
      content: "新的森林评价",
      imageUrls: []
    })
  });
  assert.equal(created.status, 201);

  const hikingNotifications = await request(app, "/api/notifications?adminAccountId=account-guide-demo");
  assert.equal(hikingNotifications.status, 200);
  assert.equal(hikingNotifications.json().data.length, 1);
  assert.equal(hikingNotifications.json().data[0].type, "NEW_REVIEW");

  const waterNotifications = await request(app, `/api/notifications?adminAccountId=${waterAccount.json().data.id}`);
  assert.deepEqual(waterNotifications.json().data, []);

  const reviewId = created.json().data.id;
  await request(app, `/api/reviews/${reviewId}/replies`, {
    method: "POST",
    body: JSON.stringify({ customerId: "customer-demo", displayName: "M**", content: "再补充一条留言" })
  });
  const withReply = await request(app, "/api/notifications?adminAccountId=account-guide-demo");
  assert.equal(withReply.json().data.length, 2);
  assert.equal(withReply.json().data[0].type, "REVIEW_REPLY");

  const marked = await request(app, `/api/notifications/${withReply.json().data[0].id}/read`, {
    method: "PATCH",
    body: JSON.stringify({ adminAccountId: "account-guide-demo" })
  });
  assert.equal(marked.status, 200);
  assert.equal(marked.json().data.read, true);
});

test("does not notify a subaccount about its own review reply", async () => {
  const app = createApp();
  const reply = await request(app, "/api/reviews/review-demo/replies", {
    method: "POST",
    body: JSON.stringify({ adminAccountId: "account-guide-demo", content: "领队本人回复" })
  });
  assert.equal(reply.status, 201);

  const notifications = await request(app, "/api/notifications?adminAccountId=account-guide-demo");
  assert.deepEqual(notifications.json().data, []);
});
