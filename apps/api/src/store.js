import { randomUUID } from "node:crypto";
import { assert } from "./errors.js";
import { seedData } from "./seed-data.js";

const clone = (value) => structuredClone(value);
const localized = (translations, locale = "zh-CN") =>
  translations[locale] ?? translations["zh-CN"] ?? Object.values(translations)[0];

export class MemoryStore {
  constructor(data = seedData) {
    this.groups = clone(data.groups);
    this.adminAccounts = clone(data.adminAccounts ?? []);
    this.tags = clone(data.tags);
    this.guides = clone(data.guides ?? []);
    this.guidePage = clone(data.guidePage ?? { introductionHtml: "" });
    this.topicPages = clone(data.topicPages ?? []);
    this.blogPosts = clone(data.blogPosts ?? []);
    this.blogComments = clone(data.blogComments ?? []);
    this.homeEntries = clone(data.homeEntries ?? []);
    this.homeModules = clone(data.homeModules ?? []);
    this.activities = clone(data.activities);
    this.scheduleRules = clone(data.scheduleRules);
    this.slots = clone(data.slots);
    this.customers = clone(data.customers ?? []);
    this.walletTransactions = clone(data.walletTransactions ?? []);
    this.notifications = clone(data.notifications ?? []);
    this.reviews = clone(data.reviews ?? []);
    this.orders = clone(data.orders ?? []);
  }

  snapshot() {
    return clone({
      groups: this.groups,
      adminAccounts: this.adminAccounts,
      tags: this.tags,
      guides: this.guides,
      guidePage: this.guidePage,
      topicPages: this.topicPages,
      blogPosts: this.blogPosts,
      blogComments: this.blogComments,
      homeEntries: this.homeEntries,
      homeModules: this.homeModules,
      activities: this.activities,
      scheduleRules: this.scheduleRules,
      slots: this.slots,
      customers: this.customers,
      walletTransactions: this.walletTransactions,
      notifications: this.notifications,
      reviews: this.reviews,
      orders: this.orders
    });
  }

  listGroups() {
    return clone(this.groups);
  }

  createGroup(input) {
    assert(input.name?.trim(), 400, "组名称不能为空");
    assert(!this.groups.some((group) => group.name === input.name.trim()), 409, "组名称已存在");
    const group = { id: randomUUID(), name: input.name.trim() };
    this.groups.push(group);
    return clone(group);
  }

  updateGroup(id, input) {
    const group = this.#requireGroup(id);
    assert(input.name?.trim(), 400, "组名称不能为空");
    assert(!this.groups.some((item) => item.id !== id && item.name === input.name.trim()), 409, "组名称已存在");
    group.name = input.name.trim();
    return clone(group);
  }

  deleteGroup(id) {
    const group = this.#requireGroup(id);
    assert(!this.activities.some((activity) => activity.groupId === id), 409, "组正在被活动使用，请先调整相关活动");
    assert(!this.orders.some((order) => order.groupId === id), 409, "组已有订单记录，不能删除");
    this.groups = this.groups.filter((item) => item.id !== id);
    this.adminAccounts.forEach((account) => {
      account.groupIds = account.groupIds.filter((groupId) => groupId !== id);
    });
    return clone(group);
  }

  listAdminAccounts() {
    return this.adminAccounts.map((account) => this.#presentAdminAccount(account));
  }

  createAdminAccount(input) {
    const fields = this.#validateAdminAccountInput(input);
    const account = { id: randomUUID(), role: "SUBACCOUNT", enabled: true, ...fields };
    this.adminAccounts.push(account);
    return this.#presentAdminAccount(account);
  }

  updateAdminAccount(id, input) {
    const account = this.#requireAdminAccount(id);
    assert(account.role === "SUBACCOUNT", 400, "主账号不能在这里修改");
    const fields = this.#validateAdminAccountInput({ ...account, ...clone(input) });
    Object.assign(account, fields);
    return this.#presentAdminAccount(account);
  }

  setAdminAccountEnabled(id, enabled) {
    assert(typeof enabled === "boolean", 400, "enabled 必须为布尔值");
    const account = this.#requireAdminAccount(id);
    assert(account.role === "SUBACCOUNT", 400, "主账号不能停用");
    account.enabled = enabled;
    return this.#presentAdminAccount(account);
  }

  #validateAdminAccountInput(input) {
    assert(input.displayName?.trim(), 400, "子账户姓名不能为空");
    assert(input.mobile?.trim(), 400, "子账户手机号不能为空");
    assert(Array.isArray(input.groupIds) && input.groupIds.length > 0, 400, "请至少授权一个组");
    const groupIds = [...new Set(input.groupIds)];
    for (const groupId of groupIds) assert(this.groups.some((group) => group.id === groupId), 400, "授权组不存在");
    return { displayName: input.displayName.trim(), mobile: input.mobile.trim(), groupIds };
  }

  listTags(locale) {
    return this.tags.map((tag) => ({ ...clone(tag), name: localized(tag.translations, locale) }));
  }

  createTag(input) {
    assert(input.code?.trim(), 400, "标签 code 不能为空");
    assert(input.translations?.["zh-CN"]?.trim(), 400, "标签中文名称不能为空");
    assert(!this.tags.some((tag) => tag.code === input.code.trim()), 409, "标签 code 已存在");
    assert(!this.tags.some((tag) => tag.translations["zh-CN"] === input.translations["zh-CN"].trim()), 409, "标签名称已存在");
    const tag = {
      id: randomUUID(),
      code: input.code.trim(),
      translations: { ...clone(input.translations), "zh-CN": input.translations["zh-CN"].trim() }
    };
    this.tags.push(tag);
    return clone(tag);
  }

  deleteTag(id) {
    const index = this.tags.findIndex((tag) => tag.id === id);
    assert(index >= 0, 404, "标签不存在");
    assert(!this.activities.some((activity) => activity.tagIds.includes(id)), 409, "标签正在被活动使用，请先从活动中移除");
    assert(!this.topicPages.some((page) => page.tagIds.includes(id)), 409, "标签正在被专题页使用，请先从专题中移除");
    const [removed] = this.tags.splice(index, 1);
    return clone(removed);
  }

  listGuides() {
    return this.guides.map((guide) => this.#presentGuide(guide));
  }

  getGuidePage() {
    return clone(this.guidePage);
  }

  updateGuidePage(input) {
    assert(typeof (input.introductionHtml ?? "") === "string", 400, "领队主页介绍格式无效");
    this.guidePage.introductionHtml = input.introductionHtml ?? "";
    return clone(this.guidePage);
  }

  listTopicPages({ publishedOnly = false } = {}) {
    return this.topicPages
      .filter((page) => !publishedOnly || page.published)
      .map((page) => this.#presentTopicPage(page));
  }

  getTopicPage(idOrSlug) {
    return this.#presentTopicPage(this.#requireTopicPage(idOrSlug));
  }

  createTopicPage(input) {
    const fields = this.#validateTopicPageInput(input);
    const page = { id: randomUUID(), ...fields };
    this.topicPages.push(page);
    return this.#presentTopicPage(page);
  }

  updateTopicPage(id, input) {
    const page = this.#requireTopicPage(id);
    const previousSlug = page.slug;
    Object.assign(page, this.#validateTopicPageInput({ ...page, ...clone(input) }, id));
    if (page.slug !== previousSlug) {
      this.homeEntries
        .filter((entry) => entry.targetType === "TOPIC" && entry.targetValue === previousSlug)
        .forEach((entry) => { entry.targetValue = page.slug; });
    }
    return this.#presentTopicPage(page);
  }

  deleteTopicPage(id) {
    const page = this.#requireTopicPage(id);
    assert(!this.homeEntries.some((entry) => entry.targetType === "TOPIC" && entry.targetValue === page.slug), 409, "专题正在被首页入口使用，请先调整首页入口");
    this.topicPages = this.topicPages.filter((item) => item.id !== id);
    return this.#presentTopicPage(page);
  }

  listBlogPosts({ publishedOnly = false } = {}) {
    return this.blogPosts
      .filter((post) => !publishedOnly || post.published)
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .map((post) => this.#presentBlogPost(post));
  }

  getBlogPost(idOrSlug) {
    return this.#presentBlogPost(this.#requireBlogPost(idOrSlug), { includeComments: true });
  }

  createBlogPost(input) {
    const post = { id: randomUUID(), ...this.#validateBlogPostInput(input) };
    this.blogPosts.push(post);
    return this.#presentBlogPost(post);
  }

  updateBlogPost(id, input) {
    const post = this.#requireBlogPost(id);
    Object.assign(post, this.#validateBlogPostInput({ ...post, ...clone(input) }, id));
    return this.#presentBlogPost(post);
  }

  deleteBlogPost(id) {
    const post = this.#requireBlogPost(id);
    this.blogPosts = this.blogPosts.filter((item) => item.id !== id);
    this.blogComments = this.blogComments.filter((comment) => comment.postId !== id);
    return this.#presentBlogPost(post);
  }

  createBlogComment(postId, input) {
    const post = this.#requireBlogPost(postId);
    assert(post.published, 400, "文章暂未发布");
    this.#requireCustomer(input.customerId);
    const comment = {
      id: randomUUID(),
      postId: post.id,
      customerId: input.customerId,
      hidden: false,
      createdAt: new Date().toISOString(),
      ...this.#validateBlogCommentInput(input)
    };
    this.blogComments.push(comment);
    return this.#presentBlogComment(comment);
  }

  listHomeEntries({ publishedOnly = false } = {}) {
    return clone(this.homeEntries
      .filter((entry) => !publishedOnly || entry.published)
      .sort((left, right) => left.sortOrder - right.sortOrder));
  }

  createHomeEntry(input) {
    const entry = { id: randomUUID(), ...this.#validateHomeEntryInput(input) };
    this.homeEntries.push(entry);
    return clone(entry);
  }

  updateHomeEntry(id, input) {
    const entry = this.#requireHomeEntry(id);
    Object.assign(entry, this.#validateHomeEntryInput({ ...entry, ...clone(input) }));
    return clone(entry);
  }

  deleteHomeEntry(id) {
    const entry = this.#requireHomeEntry(id);
    this.homeEntries = this.homeEntries.filter((item) => item.id !== id);
    return clone(entry);
  }

  listHomeModules({ publishedOnly = false } = {}) {
    return clone(this.homeModules
      .filter((module) => !publishedOnly || module.published)
      .sort((left, right) => left.sortOrder - right.sortOrder));
  }

  createHomeModule(input) {
    const module = { id: randomUUID(), ...this.#validateHomeModuleInput(input) };
    this.homeModules.push(module);
    return clone(module);
  }

  updateHomeModule(id, input) {
    const module = this.#requireHomeModule(id);
    Object.assign(module, this.#validateHomeModuleInput({ ...module, ...clone(input) }));
    return clone(module);
  }

  deleteHomeModule(id) {
    const module = this.#requireHomeModule(id);
    this.homeModules = this.homeModules.filter((item) => item.id !== id);
    return clone(module);
  }

  reorderHomeModules(ids) {
    assert(Array.isArray(ids) && ids.length === this.homeModules.length, 400, "首页模块排序内容不完整");
    assert(new Set(ids).size === ids.length, 400, "首页模块排序存在重复项");
    ids.forEach((id, index) => { this.#requireHomeModule(id).sortOrder = index + 1; });
    return this.listHomeModules();
  }

  createGuide(input) {
    const fields = this.#validateGuideInput(input);
    const guide = { id: randomUUID(), ...fields };
    this.guides.push(guide);
    return this.#presentGuide(guide);
  }

  updateGuide(id, input) {
    const guide = this.#requireGuide(id);
    Object.assign(guide, this.#validateGuideInput({ ...guide, ...clone(input) }));
    return this.#presentGuide(guide);
  }

  listActivities({ locale = "zh-CN", tagIds = [], adminAccountId } = {}) {
    const account = adminAccountId ? this.#requireEnabledAdminAccount(adminAccountId) : null;
    return this.activities
      .filter((activity) => !account || account.groupIds.includes(activity.groupId))
      .filter((activity) => tagIds.every((tagId) => activity.tagIds.includes(tagId)))
      .map((activity) => this.#presentActivity(activity, locale));
  }

  listAvailableActivities({ date, locale = "zh-CN", tagIds = [], now = new Date() } = {}) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(date ?? ""), 400, "请选择有效日期");
    const nowTimestamp = now.getTime();
    this.releaseExpiredCapacityLocks(now);
    this.activities.forEach((activity) => this.#ensureGeneratedSlots(activity.id, date));
    return this.activities
      .filter((activity) => !activity.schedulePaused)
      .filter((activity) => tagIds.every((tagId) => activity.tagIds.includes(tagId)))
      .map((activity) => {
        const slots = this.slots
          .filter((slot) => slot.activityId === activity.id)
          .filter((slot) => slot.enabled && slot.startsAt.slice(0, 10) === date)
          .filter((slot) => slot.bookedCount < slot.capacity && Date.parse(slot.startsAt) > nowTimestamp)
          .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
        if (!slots.length) return null;
        return {
          ...this.#presentActivity(activity, locale),
          groupName: this.#requireGroup(activity.groupId).name,
          slots: clone(slots)
        };
      })
      .filter(Boolean);
  }

  getActivity(id, locale = "zh-CN", adminAccountId) {
    const activity = this.#requireActivity(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    return this.#presentActivity(activity, locale);
  }

  listRelatedActivities(activityId, { locale = "zh-CN", limit = 3 } = {}) {
    const activity = this.#requireActivity(activityId);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 3, 1), 3);
    const qualifyingStatuses = new Set(["BOOKED", "COMPLETED"]);
    const customers = new Set(this.orders
      .filter((order) => order.activityId === activityId && qualifyingStatuses.has(order.status))
      .map((order) => order.customerId));
    const coBookedCounts = new Map();
    this.orders
      .filter((order) => order.activityId !== activityId && qualifyingStatuses.has(order.status) && customers.has(order.customerId))
      .forEach((order) => coBookedCounts.set(order.activityId, (coBookedCounts.get(order.activityId) ?? 0) + 1));

    return this.activities
      .filter((candidate) => candidate.id !== activityId)
      .map((candidate) => ({
        activity: candidate,
        coBookedCount: coBookedCounts.get(candidate.id) ?? 0,
        sharedTagCount: candidate.tagIds.filter((tagId) => activity.tagIds.includes(tagId)).length
      }))
      .filter((item) => item.coBookedCount > 0 || item.sharedTagCount > 0)
      .sort((left, right) =>
        right.coBookedCount - left.coBookedCount ||
        right.sharedTagCount - left.sharedTagCount ||
        localized(left.activity.translations, locale).name.localeCompare(localized(right.activity.translations, locale).name, "zh-CN")
      )
      .slice(0, normalizedLimit)
      .map((item) => ({ ...this.#presentActivity(item.activity, locale), coBookedCount: item.coBookedCount }));
  }

  createActivity(input) {
    this.#validateActivityInput(input);
    const activity = {
      id: randomUUID(),
      groupId: input.groupId,
      advanceBookingHours: input.advanceBookingHours ?? 0,
      schedulePaused: false,
      meetingLatitude: input.meetingLatitude ?? null,
      meetingLongitude: input.meetingLongitude ?? null,
      leaderWechat: input.leaderWechat?.trim() ?? "",
      guideIds: clone(input.guideIds ?? []),
      translations: clone(input.translations),
      tagIds: clone(input.tagIds ?? []),
      images: clone(input.images ?? []).map((image, index) => ({
        id: randomUUID(),
        cosKey: image.cosKey,
        sortOrder: index + 1
      }))
    };
    this.activities.push(activity);
    return this.#presentActivity(activity);
  }

  updateActivity(id, input, adminAccountId) {
    const activity = this.#requireActivity(id);
    if (adminAccountId) {
      this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
      this.#assertAdminAccountCanAccessGroup(adminAccountId, input.groupId ?? activity.groupId);
    }
    const candidate = {
      ...activity,
      ...clone(input),
      translations: input.translations
        ? Object.fromEntries(
            Object.entries({ ...activity.translations, ...clone(input.translations) }).map(([locale, content]) => [
              locale,
              { ...(activity.translations[locale] ?? {}), ...content }
            ])
          )
        : activity.translations
    };
    this.#validateActivityInput(candidate);
    Object.assign(activity, candidate);
    return this.#presentActivity(activity);
  }

  deleteActivity(id, adminAccountId) {
    const activity = this.#requireActivity(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    assert(!this.orders.some((order) => order.activityId === id), 409, "这个活动已经有订单记录，不能删除；可以暂停排班。");
    this.activities = this.activities.filter((item) => item.id !== id);
    this.scheduleRules = this.scheduleRules.filter((rule) => rule.activityId !== id);
    this.slots = this.slots.filter((slot) => slot.activityId !== id);
    this.reviews = this.reviews.filter((review) => review.activityId !== id);
    this.homeEntries = this.homeEntries.filter((entry) => !(entry.targetType === "ACTIVITY" && entry.targetValue === id));
    this.homeModules.forEach((module) => {
      module.activityIds = (module.activityIds ?? []).filter((activityId) => activityId !== id);
    });
    return this.#presentActivity(activity);
  }

  setSchedulePaused(activityId, paused, adminAccountId) {
    assert(typeof paused === "boolean", 400, "paused 必须为布尔值");
    const activity = this.#requireActivity(activityId);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    activity.schedulePaused = paused;
    return { activityId, schedulePaused: paused };
  }

  listScheduleRules(activityId, adminAccountId) {
    const activity = this.#requireActivity(activityId);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    return clone(this.scheduleRules.filter((rule) => rule.activityId === activityId));
  }

  createScheduleRule(activityId, input, adminAccountId) {
    const activity = this.#requireActivity(activityId);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    assert(["REGULAR", "REST_DAY", "SPECIAL"].includes(input.ruleType), 400, "排班规则类型无效");
    if (input.ruleType === "REGULAR") {
      assert(Number.isInteger(input.weekday) && input.weekday >= 1 && input.weekday <= 7, 400, "常规排班需要 1 到 7 的 weekday");
      assert(input.startsAt && input.endsAt, 400, "常规排班需要开始和结束时间");
      assert(input.endsAt > input.startsAt, 400, "结束时间必须晚于开始时间");
      assert(this.#isQuarterHour(input.startsAt) && this.#isQuarterHour(input.endsAt), 400, "时间必须以 15 分钟为单位");
      assert(
        !this.scheduleRules.some(
          (rule) =>
            rule.activityId === activityId &&
            rule.ruleType === "REGULAR" &&
            rule.weekday === input.weekday &&
            rule.startsAt === input.startsAt &&
            rule.endsAt === input.endsAt
        ),
        409,
        "这个星期已经有相同时间段"
      );
    }
    if (input.ruleType === "REST_DAY") {
      assert(input.validFrom && input.validUntil, 400, "休息日需要日期范围");
      assert(/^\d{4}-\d{2}-\d{2}$/.test(input.validFrom) && /^\d{4}-\d{2}-\d{2}$/.test(input.validUntil), 400, "休息日日期格式无效");
      assert(input.validUntil >= input.validFrom, 400, "休息日结束日期不能早于开始日期");
    }
    const rule = {
      id: randomUUID(),
      activityId,
      enabled: true,
      ...clone(input)
    };
    this.scheduleRules.push(rule);
    return clone(rule);
  }

  createRegularScheduleRules(activityId, input, adminAccountId) {
    const activity = this.#requireActivity(activityId);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    assert(Array.isArray(input.weekdays) && input.weekdays.length > 0, 400, "请至少选择一个星期");
    assert(input.startsAt && input.endsAt && input.endsAt > input.startsAt, 400, "结束时间必须晚于开始时间");
    assert(this.#isQuarterHour(input.startsAt) && this.#isQuarterHour(input.endsAt), 400, "时间必须以 15 分钟为单位");
    assert(Number.isInteger(input.capacity) && input.capacity > 0, 400, "总可订人数必须大于 0");
    const priceOptions = this.#validatePriceOptions(input.priceOptions);
    const weekdays = [...new Set(input.weekdays)];
    return weekdays.map((weekday) =>
      this.createScheduleRule(activityId, {
        ruleType: "REGULAR",
        weekday,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        capacity: input.capacity,
        priceOptions
      })
    );
  }

  updateScheduleRule(id, input, adminAccountId) {
    const rule = this.#requireScheduleRule(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessActivity(adminAccountId, rule.activityId);
    assert(rule.ruleType === "REGULAR", 400, "当前只支持编辑每周常规排班");
    const candidate = { ...rule, ...clone(input) };
    assert(candidate.startsAt && candidate.endsAt && candidate.endsAt > candidate.startsAt, 400, "结束时间必须晚于开始时间");
    assert(this.#isQuarterHour(candidate.startsAt) && this.#isQuarterHour(candidate.endsAt), 400, "时间必须以 15 分钟为单位");
    assert(Number.isInteger(candidate.capacity) && candidate.capacity > 0, 400, "总可订人数必须大于 0");
    candidate.priceOptions = this.#validatePriceOptions(candidate.priceOptions);
    Object.assign(rule, candidate);
    return clone(rule);
  }

  deleteScheduleRule(id, adminAccountId) {
    const rule = this.#requireScheduleRule(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessActivity(adminAccountId, rule.activityId);
    this.scheduleRules = this.scheduleRules.filter((item) => item.id !== id);
    return clone(rule);
  }

  listSlots(activityId, { from, to, date, includeGenerated = false, adminAccountId } = {}) {
    const activity = this.#requireActivity(activityId);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    this.releaseExpiredCapacityLocks();
    if (date) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 400, "请选择有效日期");
      this.#ensureGeneratedSlots(activityId, date);
    }
    return clone(
      this.slots.filter((slot) => {
        if (slot.activityId !== activityId) return false;
        if (!includeGenerated && slot.generatedFromRuleId) return false;
        if (date && slot.startsAt.slice(0, 10) !== date) return false;
        if (from && Date.parse(slot.endsAt) < Date.parse(from)) return false;
        if (to && Date.parse(slot.startsAt) > Date.parse(to)) return false;
        return true;
      })
    );
  }

  createSlot(activityId, input, adminAccountId) {
    const activity = this.#requireActivity(activityId);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, activity.groupId);
    const fields = this.#validateSlotInput(input);
    this.#suppressGeneratedSlots(activityId, fields.startsAt.slice(0, 10));
    const slot = {
      id: randomUUID(),
      activityId,
      ...fields,
      bookedCount: 0,
      enabled: true
    };
    this.slots.push(slot);
    return clone(slot);
  }

  updateSlot(id, input, adminAccountId) {
    const slot = this.#requireSlot(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessActivity(adminAccountId, slot.activityId);
    const candidate = { ...slot, ...clone(input) };
    const fields = this.#validateSlotInput(candidate);
    assert(fields.capacity >= slot.bookedCount, 400, "总可订人数不能少于已订人数");
    Object.assign(slot, fields);
    return clone(slot);
  }

  deleteSlot(id, adminAccountId) {
    const slot = this.#requireSlot(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessActivity(adminAccountId, slot.activityId);
    assert(slot.bookedCount === 0, 409, "已有报名的特殊排班不能删除");
    this.slots = this.slots.filter((item) => item.id !== id);
    return clone(slot);
  }

  listCustomers() {
    return this.customers.map((customer) => this.#presentCustomer(customer));
  }

  getCustomer(id) {
    return this.#presentCustomer(this.#requireCustomer(id));
  }

  setCustomerFrozen(id, frozen) {
    assert(typeof frozen === "boolean", 400, "frozen 必须为布尔值");
    const customer = this.#requireCustomer(id);
    customer.frozen = frozen;
    return this.#presentCustomer(customer);
  }

  adjustCustomerWallet(id, input) {
    const customer = this.#requireCustomer(id);
    assert(Number.isInteger(input.amountCents) && input.amountCents > 0, 400, "赠送金额必须大于 0");
    assert(input.note?.trim(), 400, "请填写余额变动备注");
    customer.walletBalanceCents += input.amountCents;
    const transaction = {
      id: randomUUID(),
      customerId: id,
      type: "GIFT_CREDIT",
      amountCents: input.amountCents,
      note: input.note.trim(),
      createdAt: new Date().toISOString()
    };
    this.walletTransactions.push(transaction);
    return this.#presentCustomer(customer);
  }

  #validateSlotInput(input) {
    const start = Date.parse(input.startsAt);
    const end = Date.parse(input.endsAt);
    assert(Number.isFinite(start) && Number.isFinite(end), 400, "排班需要有效的开始和结束时间");
    assert(end > start, 400, "结束时间必须晚于开始时间");
    assert(new Date(start).toDateString() === new Date(end).toDateString(), 400, "单个排班必须在同一天内完成");
    assert(this.#isQuarterHour(input.startsAt) && this.#isQuarterHour(input.endsAt), 400, "时间必须以 15 分钟为单位");
    assert(Number.isInteger(input.capacity) && input.capacity > 0, 400, "总可订人数必须大于 0");
    const priceOptions = this.#validatePriceOptions(input.priceOptions);
    return {
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
      priceOptions
    };
  }

  #ensureGeneratedSlots(activityId, date) {
    const dateSlots = this.slots.filter((slot) => slot.activityId === activityId && slot.startsAt.slice(0, 10) === date);
    const explicitSlots = dateSlots.filter((slot) => !slot.generatedFromRuleId);
    if (explicitSlots.length) {
      this.#suppressGeneratedSlots(activityId, date);
      return;
    }

    const isRestDay = this.scheduleRules.some(
      (rule) =>
        rule.activityId === activityId &&
        rule.ruleType === "REST_DAY" &&
        rule.enabled !== false &&
        rule.validFrom <= date &&
        rule.validUntil >= date
    );
    const weekday = this.#weekdayForDate(date);
    const rules = isRestDay
      ? []
      : this.scheduleRules.filter(
          (rule) =>
            rule.activityId === activityId &&
            rule.ruleType === "REGULAR" &&
            rule.enabled !== false &&
            rule.weekday === weekday
        );
    const desiredRuleIds = new Set(rules.map((rule) => rule.id));

    this.slots
      .filter((slot) => slot.activityId === activityId && slot.startsAt.slice(0, 10) === date && slot.generatedFromRuleId)
      .forEach((slot) => {
        if (desiredRuleIds.has(slot.generatedFromRuleId)) return;
        if (slot.bookedCount > 0) slot.enabled = false;
        else this.slots = this.slots.filter((item) => item.id !== slot.id);
      });

    for (const rule of rules) {
      const startsAt = `${date}T${rule.startsAt}:00+08:00`;
      const endsAt = `${date}T${rule.endsAt}:00+08:00`;
      const existing = this.slots.find(
        (slot) =>
          slot.activityId === activityId &&
          slot.generatedFromRuleId === rule.id &&
          slot.startsAt.slice(0, 10) === date
      );
      if (existing) {
        if (existing.bookedCount === 0) {
          existing.startsAt = startsAt;
          existing.endsAt = endsAt;
          existing.capacity = rule.capacity;
          existing.priceOptions = clone(rule.priceOptions);
        }
        existing.enabled = true;
        continue;
      }
      this.slots.push({
        id: randomUUID(),
        activityId,
        generatedFromRuleId: rule.id,
        startsAt,
        endsAt,
        capacity: rule.capacity,
        bookedCount: 0,
        priceOptions: clone(rule.priceOptions),
        enabled: true
      });
    }
  }

  #suppressGeneratedSlots(activityId, date) {
    this.slots
      .filter((slot) => slot.activityId === activityId && slot.startsAt.slice(0, 10) === date && slot.generatedFromRuleId)
      .forEach((slot) => {
        if (slot.bookedCount > 0) slot.enabled = false;
        else this.slots = this.slots.filter((item) => item.id !== slot.id);
      });
  }

  #weekdayForDate(date) {
    const weekday = new Date(`${date}T12:00:00+08:00`).getUTCDay();
    return weekday === 0 ? 7 : weekday;
  }

  listOrders({ customerId, groupId, activityId, activityDate, activityDateFrom, activityDateTo, status, paymentMethod, adminAccountId, now = new Date() } = {}) {
    this.releaseExpiredCapacityLocks(now);
    this.completeEndedOrders(now);
    const account = adminAccountId ? this.#requireEnabledAdminAccount(adminAccountId) : null;
    return this.orders
      .filter((order) => {
        if (account && !account.groupIds.includes(order.groupId)) return false;
        if (customerId && order.customerId !== customerId) return false;
        if (groupId && order.groupId !== groupId) return false;
        if (activityId && order.activityId !== activityId) return false;
        const bookedDate = this.#requireSlot(order.slotId).startsAt.slice(0, 10);
        if (activityDate && bookedDate !== activityDate) return false;
        if (activityDateFrom && bookedDate < activityDateFrom) return false;
        if (activityDateTo && bookedDate > activityDateTo) return false;
        if (status && order.status !== status) return false;
        if (paymentMethod && order.paymentMethod !== paymentMethod) return false;
        return true;
      })
      .map((order) => this.#presentOrder(order));
  }

  listUpcomingDepartures({ locale = "zh-CN", limit = 30, now = new Date() } = {}) {
    this.releaseExpiredCapacityLocks();
    const nowTimestamp = now.getTime();
    return this.slots
      .filter((slot) => slot.enabled && slot.bookedCount > 0 && Date.parse(slot.startsAt) >= nowTimestamp)
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
      .slice(0, Math.min(Math.max(Number(limit) || 30, 1), 30))
      .map((slot) => {
        const activity = this.#requireActivity(slot.activityId);
        const latestOrder = this.orders
          .filter((order) => order.slotId === slot.id && order.status === "BOOKED")
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
        const customer = latestOrder ? this.customers.find((item) => item.id === latestOrder.customerId) : null;
        const nickname = customer?.nickname?.trim() || "匿名用户";
        return clone({
          slotId: slot.id,
        activityId: activity.id,
        activityName: localized(activity.translations, locale).name,
        coverUrl: activity.coverUrl ?? "",
        startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          bookedCount: slot.bookedCount,
          customerDisplayName: `${Array.from(nickname)[0]}**`
        });
      });
  }

  getOrder(id, adminAccountId, now = new Date()) {
    this.releaseExpiredCapacityLocks(now);
    this.completeEndedOrders(now);
    const order = this.#requireOrder(id);
    if (adminAccountId) this.#assertAdminAccountCanAccessGroup(adminAccountId, order.groupId);
    return this.#presentOrder(order);
  }

  createOrder(input, now = new Date()) {
    this.releaseExpiredCapacityLocks(now);
    const customer = this.customers.find((item) => item.id === input.customerId);
    assert(customer, 400, "顾客不存在");
    assert(!customer.frozen, 503, "系统故障，请稍后再试");
    const slot = this.slots.find((item) => item.id === input.slotId);
    assert(slot?.enabled, 400, "排班不存在或不可预约");
    const activity = this.#requireActivity(slot.activityId);
    assert(!activity.schedulePaused, 409, "当前活动暂时不可预约");
    assert(Number.isInteger(input.quantity) && input.quantity > 0, 400, "预约人数必须大于 0");
    assert(slot.bookedCount + input.quantity <= slot.capacity, 409, "剩余名额不足");

    const priceOption = slot.priceOptions.find((option) => option.id === input.priceOptionId) ?? slot.priceOptions[0];
    slot.bookedCount += input.quantity;
    const order = {
      id: randomUUID(),
      orderNo: `DT${now.toISOString().replace(/\D/g, "").slice(0, 14)}${randomUUID().slice(0, 8).toUpperCase()}`,
      customerId: customer.id,
      groupId: activity.groupId,
      activityId: activity.id,
      slotId: slot.id,
      quantity: input.quantity,
      priceOptionId: priceOption.id,
      specification: priceOption.name,
      unitPriceCents: priceOption.priceCents,
      amountCents: priceOption.priceCents * input.quantity,
      status: "PENDING_PAYMENT",
      capacityLockExpiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
      profile: clone(input.profile ?? {}),
      createdAt: now.toISOString()
    };
    this.orders.push(order);
    return clone(order);
  }

  confirmOrderPayment(id, input = {}) {
    this.releaseExpiredCapacityLocks();
    const order = this.#requireOrder(id);
    assert(order.status === "PENDING_PAYMENT", 409, "订单状态不允许付款确认");
    order.status = "BOOKED";
    order.paymentMethod = input.paymentMethod ?? "WECHAT";
    order.wechatTransactionId = input.wechatTransactionId;
    order.paidAt = new Date().toISOString();
    order.capacityLockExpiresAt = null;
    return clone(order);
  }

  getCancellationPreview(id, input = {}, now = new Date()) {
    this.completeEndedOrders(now);
    const order = this.#requireOrder(id);
    if (input.customerId) assert(order.customerId === input.customerId, 403, "不能取消其他顾客的订单");
    if (input.adminAccountId) this.#assertAdminAccountCanAccessGroup(input.adminAccountId, order.groupId);
    assert(["PENDING_PAYMENT", "BOOKED"].includes(order.status), 409, "订单状态不允许取消");
    const slot = this.slots.find((item) => item.id === order.slotId);
    assert(slot, 404, "预约时间不存在");
    const isAdmin = !input.customerId;
    if (!isAdmin) assert(Date.parse(slot.startsAt) > now.getTime(), 409, "活动已经开始，不能取消预约");
    const refundRate = order.status === "PENDING_PAYMENT" ? 0 : isAdmin ? 1 : this.#customerRefundRate(slot.startsAt, now);
    return {
      orderId: order.id,
      amountCents: order.amountCents,
      refundRate,
      refundAmountCents: Math.round(order.amountCents * refundRate),
      retainedAmountCents: order.amountCents - Math.round(order.amountCents * refundRate),
      leaderWechat: this.#requireActivity(order.activityId).leaderWechat ?? ""
    };
  }

  cancelOrder(id, input = {}, now = new Date()) {
    const order = this.#requireOrder(id);
    const preview = this.getCancellationPreview(id, input, now);
    const slot = this.slots.find((item) => item.id === order.slotId);
    slot.bookedCount -= order.quantity;
    order.status = order.status === "BOOKED" ? "REFUNDED" : "CANCELLED";
    order.refundRate = preview.refundRate;
    order.refundAmountCents = preview.refundAmountCents;
    order.retainedAmountCents = preview.retainedAmountCents;
    order.cancellationNote = input.note?.trim() || null;
    order.cancelledAt = new Date().toISOString();
    order.capacityLockExpiresAt = null;
    return clone(order);
  }

  #customerRefundRate(startsAt, now) {
    const hoursUntilStart = (Date.parse(startsAt) - now.getTime()) / (60 * 60 * 1000);
    if (hoursUntilStart >= 48) return 1;
    if (hoursUntilStart >= 24) return 0.7;
    if (hoursUntilStart >= 12) return 0.5;
    return 0.3;
  }

  releaseExpiredCapacityLocks(now = new Date()) {
    for (const order of this.orders) {
      if (order.status !== "PENDING_PAYMENT" || !order.capacityLockExpiresAt) continue;
      if (Date.parse(order.capacityLockExpiresAt) > now.getTime()) continue;
      const slot = this.slots.find((item) => item.id === order.slotId);
      slot.bookedCount -= order.quantity;
      order.status = "CANCELLED";
      order.cancellationNote = "待付款超时自动释放名额";
      order.cancelledAt = now.toISOString();
      order.capacityLockExpiresAt = null;
    }
  }

  completeEndedOrders(now = new Date()) {
    for (const order of this.orders) {
      if (order.status !== "BOOKED") continue;
      const slot = this.slots.find((item) => item.id === order.slotId);
      if (!slot || Date.parse(slot.endsAt) > now.getTime()) continue;
      order.status = "COMPLETED";
      order.completedAt = now.toISOString();
    }
  }

  listReviews({ activityId, customerId, includeHidden = false, adminAccountId } = {}) {
    const account = adminAccountId ? this.#requireEnabledAdminAccount(adminAccountId) : null;
    return this.reviews
      .filter((review) => !activityId || review.activityId === activityId)
      .filter((review) => !customerId || review.customerId === customerId)
      .filter((review) => !account || account.groupIds.includes(this.#requireActivity(review.activityId).groupId))
      .filter((review) => includeHidden || !review.hidden)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((review) => this.#presentReview(review));
  }

  createReview(activityId, input) {
    this.#requireActivity(activityId);
    this.#requireCustomer(input.customerId);
    const fields = this.#validateReviewInput(input);
    const review = { id: randomUUID(), activityId, customerId: input.customerId, replies: [], hidden: false, createdAt: new Date().toISOString(), ...fields };
    this.reviews.push(review);
    this.#notifyActivitySubaccounts(activityId, {
      type: "NEW_REVIEW",
      reviewId: review.id,
      title: "收到新的活动评价",
      message: `${review.displayName} 评价了「${localized(this.#requireActivity(activityId).translations).name}」`
    });
    return this.#presentReview(review);
  }

  deleteReview(id, customerId) {
    const review = this.#requireReview(id);
    assert(review.customerId === customerId, 403, "不能删除其他顾客的评价");
    this.reviews = this.reviews.filter((item) => item.id !== id);
    return this.#presentReview(review);
  }

  setReviewHidden(id, hidden) {
    assert(typeof hidden === "boolean", 400, "hidden 必须为布尔值");
    const review = this.#requireReview(id);
    review.hidden = hidden;
    return this.#presentReview(review);
  }

  createReviewReply(id, input) {
    const review = this.#requireReview(id);
    const activity = this.#requireActivity(review.activityId);
    assert(typeof input.content === "string" && input.content.trim(), 400, "回复内容不能为空");
    assert(input.content.trim().length <= 500, 400, "回复内容不能超过 500 字");
    let authorRole = "CUSTOMER";
    let displayName;
    if (input.adminAccountId) {
      const account = this.#requireEnabledAdminAccount(input.adminAccountId);
      this.#assertAdminAccountCanAccessGroup(account.id, activity.groupId);
      authorRole = account.role === "OWNER" ? "ADMIN" : "LEADER";
      displayName = authorRole === "ADMIN" ? "管理员回复" : "领队回复";
    } else {
      const customer = this.#requireCustomer(input.customerId);
      displayName = input.displayName?.trim() || customer.nickname || "匿名用户";
    }
    const reply = { id: randomUUID(), authorRole, displayName, content: input.content.trim(), createdAt: new Date().toISOString() };
    review.replies ??= [];
    review.replies.push(reply);
    this.#notifyActivitySubaccounts(review.activityId, {
      type: "REVIEW_REPLY",
      reviewId: review.id,
      title: "评价有新的留言",
      message: `${reply.displayName} 留言：${reply.content}`,
      excludedAdminAccountId: input.adminAccountId
    });
    return clone(reply);
  }

  listNotifications(adminAccountId) {
    this.#requireEnabledAdminAccount(adminAccountId);
    return this.notifications
      .filter((notification) => notification.adminAccountId === adminAccountId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || (right.sequence ?? 0) - (left.sequence ?? 0))
      .map((notification) => this.#presentNotification(notification));
  }

  markNotificationRead(id, adminAccountId) {
    this.#requireEnabledAdminAccount(adminAccountId);
    const notification = this.notifications.find((item) => item.id === id);
    assert(notification, 404, "通知不存在");
    assert(notification.adminAccountId === adminAccountId, 403, "不能读取其他账户的通知");
    notification.read = true;
    return this.#presentNotification(notification);
  }

  #presentActivity(activity, locale) {
    return {
      ...clone(activity),
      hasSchedule: this.scheduleRules.some((rule) => rule.activityId === activity.id && rule.ruleType === "REGULAR") ||
        this.slots.some((slot) => slot.activityId === activity.id && slot.enabled),
      content: localized(activity.translations, locale),
      tags: activity.tagIds.map((tagId) => {
        const tag = this.tags.find((item) => item.id === tagId);
        return { id: tag.id, code: tag.code, name: localized(tag.translations, locale) };
      }),
      guides: (activity.guideIds ?? []).map((guideId) => clone(this.#requireGuide(guideId)))
    };
  }

  #presentOrder(order) {
    const activity = this.activities.find((item) => item.id === order.activityId);
    const group = this.groups.find((item) => item.id === order.groupId);
    const customer = this.customers.find((item) => item.id === order.customerId);
    const slot = this.slots.find((item) => item.id === order.slotId);
    return clone({
      ...order,
      activityName: localized(activity.translations).name,
      meetingPointName: localized(activity.translations).meetingPointName,
      meetingLatitude: activity.meetingLatitude ?? null,
      meetingLongitude: activity.meetingLongitude ?? null,
      leaderWechat: activity.leaderWechat ?? "",
      groupName: group.name,
      customerNickname: customer.nickname,
      customerMobile: customer.mobile,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt
    });
  }

  #requireEnabledAdminAccount(id) {
    const account = this.#requireAdminAccount(id);
    assert(account.enabled, 403, "子账户已停用");
    return account;
  }

  #assertAdminAccountCanAccessGroup(accountId, groupId) {
    const account = this.#requireEnabledAdminAccount(accountId);
    assert(account.groupIds.includes(groupId), 403, "没有权限访问这个组");
  }

  #assertAdminAccountCanAccessActivity(accountId, activityId) {
    this.#assertAdminAccountCanAccessGroup(accountId, this.#requireActivity(activityId).groupId);
  }

  #presentCustomer(customer) {
    return clone({
      ...customer,
      walletTransactions: this.walletTransactions
        .filter((transaction) => transaction.customerId === customer.id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    });
  }

  #presentReview(review) {
    const activity = this.#requireActivity(review.activityId);
    return clone({ ...review, replies: review.replies ?? [], activityName: localized(activity.translations).name });
  }

  #presentNotification(notification) {
    const activity = this.#requireActivity(notification.activityId);
    return clone({ ...notification, activityName: localized(activity.translations).name });
  }

  #presentTopicPage(page) {
    return clone({
      ...page,
      tags: page.tagIds.map((tagId) => {
        const tag = this.tags.find((item) => item.id === tagId);
        return { id: tag.id, code: tag.code, name: localized(tag.translations) };
      }),
      activities: this.activities
        .filter((activity) => page.tagIds.every((tagId) => activity.tagIds.includes(tagId)))
        .map((activity) => ({ id: activity.id, name: localized(activity.translations).name, summary: localized(activity.translations).summary }))
    });
  }

  #plainText(html) {
    return String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  #presentBlogPost(post, { includeComments = false } = {}) {
    const summary = post.summary?.trim() || this.#plainText(post.contentHtml).slice(0, 150);
    return clone({
      ...post,
      summary,
      comments: includeComments
        ? this.blogComments
          .filter((comment) => comment.postId === post.id && !comment.hidden)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
          .map((comment) => this.#presentBlogComment(comment))
        : undefined
    });
  }

  #presentBlogComment(comment) {
    const customer = this.customers.find((item) => item.id === comment.customerId);
    return clone({
      ...comment,
      customerName: customer?.profile?.nickname ?? comment.displayName
    });
  }

  #notifyActivitySubaccounts(activityId, input) {
    const activity = this.#requireActivity(activityId);
    const createdAt = new Date().toISOString();
    this.adminAccounts
      .filter((account) => account.role === "SUBACCOUNT" && account.enabled && account.groupIds.includes(activity.groupId))
      .filter((account) => account.id !== input.excludedAdminAccountId)
      .forEach((account) => {
        this.notifications.push({
          id: randomUUID(),
          adminAccountId: account.id,
          groupId: activity.groupId,
          activityId,
          reviewId: input.reviewId,
          type: input.type,
          title: input.title,
          message: input.message,
          read: false,
          sequence: this.notifications.length + 1,
          createdAt
        });
      });
  }

  #presentGuide(guide) {
    return clone({
      ...guide,
      activities: this.activities
        .filter((activity) => (activity.guideIds ?? []).includes(guide.id))
        .map((activity) => ({ id: activity.id, name: localized(activity.translations).name, summary: localized(activity.translations).summary }))
    });
  }

  #requireActivity(id) {
    const activity = this.activities.find((item) => item.id === id);
    assert(activity, 404, "活动不存在");
    return activity;
  }

  #requireOrder(id) {
    const order = this.orders.find((item) => item.id === id);
    assert(order, 404, "订单不存在");
    return order;
  }

  #requireCustomer(id) {
    const customer = this.customers.find((item) => item.id === id);
    assert(customer, 404, "顾客不存在");
    return customer;
  }

  #requireGuide(id) {
    const guide = this.guides.find((item) => item.id === id);
    assert(guide, 404, "领队档案不存在");
    return guide;
  }

  #requireTopicPage(idOrSlug) {
    const page = this.topicPages.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
    assert(page, 404, "专题页不存在");
    return page;
  }

  #requireBlogPost(idOrSlug) {
    const post = this.blogPosts.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
    assert(post, 404, "博客文章不存在");
    return post;
  }

  #requireHomeEntry(id) {
    const entry = this.homeEntries.find((item) => item.id === id);
    assert(entry, 404, "首页入口不存在");
    return entry;
  }

  #requireHomeModule(id) {
    const module = this.homeModules.find((item) => item.id === id);
    assert(module, 404, "首页模块不存在");
    return module;
  }

  #requireReview(id) {
    const review = this.reviews.find((item) => item.id === id);
    assert(review, 404, "评价不存在");
    return review;
  }

  #requireGroup(id) {
    const group = this.groups.find((item) => item.id === id);
    assert(group, 404, "组不存在");
    return group;
  }

  #requireAdminAccount(id) {
    const account = this.adminAccounts.find((item) => item.id === id);
    assert(account, 404, "子账户不存在");
    return account;
  }

  #presentAdminAccount(account) {
    return clone({
      ...account,
      groups: account.groupIds.map((groupId) => this.#requireGroup(groupId))
    });
  }

  #requireScheduleRule(id) {
    const rule = this.scheduleRules.find((item) => item.id === id);
    assert(rule, 404, "排班规则不存在");
    return rule;
  }

  #requireSlot(id) {
    const slot = this.slots.find((item) => item.id === id);
    assert(slot, 404, "特殊排班不存在");
    return slot;
  }

  #validateActivityInput(input) {
    assert(this.groups.some((group) => group.id === input.groupId), 400, "请选择有效的组");
    assert(input.translations?.["zh-CN"]?.name?.trim(), 400, "活动中文名称不能为空");
    assert(Number.isInteger(input.advanceBookingHours) && input.advanceBookingHours >= 0, 400, "提前预约小时数无效");
    assert(typeof (input.leaderWechat ?? "") === "string", 400, "领队微信格式无效");
    const hasLatitude = input.meetingLatitude !== null && input.meetingLatitude !== undefined && input.meetingLatitude !== "";
    const hasLongitude = input.meetingLongitude !== null && input.meetingLongitude !== undefined && input.meetingLongitude !== "";
    assert(hasLatitude === hasLongitude, 400, "集合地点的纬度和经度需要同时填写");
    if (hasLatitude) {
      assert(Number.isFinite(Number(input.meetingLatitude)) && Number(input.meetingLatitude) >= -90 && Number(input.meetingLatitude) <= 90, 400, "集合地点纬度无效");
      assert(Number.isFinite(Number(input.meetingLongitude)) && Number(input.meetingLongitude) >= -180 && Number(input.meetingLongitude) <= 180, 400, "集合地点经度无效");
    }
    for (const tagId of input.tagIds ?? []) {
      assert(this.tags.some((tag) => tag.id === tagId), 400, `标签不存在: ${tagId}`);
    }
    for (const guideId of input.guideIds ?? []) {
      assert(this.guides.some((guide) => guide.id === guideId), 400, `领队档案不存在: ${guideId}`);
    }
  }

  #validateGuideInput(input) {
    assert(input.name?.trim(), 400, "领队名字不能为空");
    assert(typeof (input.photoUrl ?? "") === "string", 400, "领队照片格式无效");
    assert(typeof (input.descriptionHtml ?? "") === "string", 400, "领队详细内容格式无效");
    return { name: input.name.trim(), photoUrl: input.photoUrl?.trim() ?? "", descriptionHtml: input.descriptionHtml ?? "" };
  }

  #validateTopicPageInput(input, editingId = null) {
    assert(input.title?.trim(), 400, "专题页标题不能为空");
    assert(input.slug?.trim() && /^[a-z0-9-]+$/.test(input.slug.trim()), 400, "专题页地址只能使用小写字母、数字和短横线");
    assert(!this.topicPages.some((page) => page.id !== editingId && page.slug === input.slug.trim()), 409, "专题页地址已存在");
    assert(typeof (input.summary ?? "") === "string", 400, "专题页简介格式无效");
    assert(typeof (input.imageUrl ?? "") === "string", 400, "专题页入口图格式无效");
    assert(typeof (input.introductionHtml ?? "") === "string", 400, "专题页内容格式无效");
    assert(typeof (input.externalUrl ?? "") === "string", 400, "专题页外部链接格式无效");
    if (input.externalUrl?.trim()) assert(/^https?:\/\//.test(input.externalUrl.trim()), 400, "外部链接需要以 http:// 或 https:// 开头");
    assert(Array.isArray(input.tagIds ?? []), 400, "专题页标签格式无效");
    for (const tagId of input.tagIds ?? []) assert(this.tags.some((tag) => tag.id === tagId), 400, `标签不存在: ${tagId}`);
    return {
      title: input.title.trim(),
      slug: input.slug.trim(),
      summary: input.summary?.trim() ?? "",
      imageUrl: input.imageUrl?.trim() ?? "",
      externalUrl: input.externalUrl?.trim() ?? "",
      introductionHtml: input.introductionHtml ?? "",
      tagIds: [...new Set(input.tagIds ?? [])],
      published: input.published !== false
    };
  }

  #validateBlogPostInput(input, editingId = null) {
    assert(input.title?.trim(), 400, "文章标题不能为空");
    assert(input.slug?.trim() && /^[a-z0-9-]+$/.test(input.slug.trim()), 400, "文章地址只能使用小写字母、数字和短横线");
    assert(!this.blogPosts.some((post) => post.id !== editingId && post.slug === input.slug.trim()), 409, "文章地址已存在");
    assert(typeof (input.coverUrl ?? "") === "string", 400, "文章封面格式无效");
    assert(typeof (input.summary ?? "") === "string", 400, "文章摘要格式无效");
    assert((input.summary ?? "").length <= 300, 400, "文章摘要最多 300 字");
    assert(typeof (input.contentHtml ?? "") === "string", 400, "文章正文格式无效");
    assert(input.contentHtml?.trim(), 400, "文章正文不能为空");
    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
    assert(!Number.isNaN(publishedAt.getTime()), 400, "发布时间无效");
    return {
      title: input.title.trim(),
      slug: input.slug.trim(),
      coverUrl: input.coverUrl?.trim() ?? "",
      summary: input.summary?.trim() ?? "",
      contentHtml: input.contentHtml ?? "",
      publishedAt: publishedAt.toISOString(),
      published: input.published !== false
    };
  }

  #validateBlogCommentInput(input) {
    assert(input.displayName?.trim(), 400, "评论昵称不能为空");
    assert(input.content?.trim(), 400, "评论内容不能为空");
    assert(input.content.length <= 1500, 400, "评论最多 1500 字");
    return { displayName: input.displayName.trim(), content: input.content.trim() };
  }

  #validateHomeEntryInput(input) {
    assert(input.title?.trim(), 400, "首页入口标题不能为空");
    assert(typeof (input.subtitle ?? "") === "string", 400, "首页入口英文标题格式无效");
    assert(typeof (input.imageUrl ?? "") === "string", 400, "首页入口图片格式无效");
    assert(["TOPIC", "ACTIVITY", "GUIDES", "EXTERNAL"].includes(input.targetType), 400, "首页入口跳转类型无效");
    const targetValue = input.targetValue?.trim() ?? "";
    if (input.targetType === "TOPIC") this.#requireTopicPage(targetValue);
    if (input.targetType === "ACTIVITY") this.#requireActivity(targetValue);
    if (input.targetType === "EXTERNAL") assert(/^https?:\/\//.test(targetValue), 400, "外部链接需要以 http:// 或 https:// 开头");
    assert(Number.isInteger(input.sortOrder) && input.sortOrder >= 0, 400, "首页入口排序必须为非负整数");
    return {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() ?? "",
      imageUrl: input.imageUrl?.trim() ?? "",
      targetType: input.targetType,
      targetValue,
      sortOrder: input.sortOrder,
      published: input.published !== false
    };
  }

  #validateHomeModuleInput(input) {
    assert(["CUBE", "NAV", "ACTIVITIES", "TOPICS", "GUIDES", "REVIEWS", "UPCOMING", "BANNER", "TEXT", "DIVIDER", "COLLAPSE"].includes(input.type), 400, "首页模块类型无效");
    assert(input.title?.trim(), 400, "首页模块标题不能为空");
    assert(Number.isInteger(input.sortOrder) && input.sortOrder >= 0, 400, "首页模块排序必须为非负整数");
    assert(Number.isInteger(input.limit) && input.limit >= 1 && input.limit <= 20, 400, "首页模块展示数量需要在 1 到 20 之间");
    const tagIds = [...new Set(input.tagIds ?? [])];
    tagIds.forEach((id) => assert(this.tags.some((tag) => tag.id === id), 400, "首页模块标签不存在"));
    const imageUrls = Array.isArray(input.imageUrls) ? input.imageUrls : [];
    imageUrls.forEach((url) => assert(typeof url === "string", 400, "首页模块图片格式无效"));
    const navItems = Array.isArray(input.navItems) ? input.navItems : [];
    assert(navItems.length <= 8, 400, "文字导航最多设置 8 项");
    const normalizedNavItems = navItems.map((item) => {
      assert(item.title?.trim(), 400, "文字导航标题不能为空");
      assert(typeof (item.subtitle ?? "") === "string", 400, "文字导航英文小标题格式无效");
      assert(["TOPIC", "ACTIVITY", "GUIDES", "EXTERNAL"].includes(item.targetType), 400, "文字导航跳转类型无效");
      const targetValue = item.targetValue?.trim() ?? "";
      if (item.targetType === "TOPIC") this.#requireTopicPage(targetValue);
      if (item.targetType === "ACTIVITY") this.#requireActivity(targetValue);
      if (item.targetType === "EXTERNAL") assert(/^https?:\/\//.test(targetValue), 400, "外部链接需要以 http:// 或 https:// 开头");
      return { title: item.title.trim(), subtitle: item.subtitle?.trim() ?? "", targetType: item.targetType, targetValue };
    });
    const collapseItems = Array.isArray(input.items) ? input.items : [];
    assert(collapseItems.length <= 12, 400, "折叠文本最多设置 12 条");
    const normalizedCollapseItems = collapseItems.map((item) => {
      assert(item.title?.trim(), 400, "折叠文本标题不能为空");
      assert(typeof (item.content ?? "") === "string", 400, "折叠文本正文格式无效");
      return { title: item.title.trim(), content: item.content.trim() };
    });
    const style = input.style ?? {};
    const numberSetting = (value, fallback, max = 40) => Number.isInteger(value) && value >= 0 && value <= max ? value : fallback;
    return {
      type: input.type,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() ?? "",
      imageUrl: input.imageUrl?.trim() ?? "",
      imageUrls: imageUrls.map((url) => url.trim()).filter(Boolean).slice(0, 10),
      navItems: normalizedNavItems,
      items: normalizedCollapseItems,
      linkUrl: input.linkUrl?.trim() ?? "",
      sortOrder: input.sortOrder,
      limit: input.limit,
      tagIds,
      style: {
        layout: typeof style.layout === "string" ? style.layout.trim() : "",
        cardStyle: typeof style.cardStyle === "string" ? style.cardStyle.trim() : "PLAIN",
        radius: numberSetting(style.radius, 6, 24),
        gap: numberSetting(style.gap, 8, 32),
        padding: numberSetting(style.padding, 11, 32),
        textAlign: ["LEFT", "CENTER"].includes(style.textAlign) ? style.textAlign : "LEFT",
        dividerStyle: ["SPACE", "LINE"].includes(style.dividerStyle) ? style.dividerStyle : "SPACE",
        height: numberSetting(style.height, 24, 80),
        backgroundColor: /^#[0-9a-f]{6}$/i.test(style.backgroundColor ?? "") ? style.backgroundColor : "#ffffff"
      },
      published: input.published !== false
    };
  }

  #validatePriceOptions(priceOptions) {
    assert(Array.isArray(priceOptions) && priceOptions.length > 0, 400, "请至少设置一个规格价格");
    const normalized = priceOptions.map((option) => ({
      id: option.id ?? randomUUID(),
      name: option.name?.trim(),
      priceCents: option.priceCents
    }));
    for (const option of normalized) {
      assert(option.name, 400, "规格名称不能为空");
      assert(Number.isInteger(option.priceCents) && option.priceCents >= 0, 400, "规格价格必须使用非负整数分");
    }
    assert(new Set(normalized.map((option) => option.name)).size === normalized.length, 400, "规格名称不能重复");
    return normalized;
  }

  #validateReviewInput(input) {
    assert(input.displayName?.trim(), 400, "评价显示名称不能为空");
    assert(Number.isInteger(input.rating) && input.rating >= 1 && input.rating <= 5, 400, "评分需要为 1 到 5 星");
    assert(typeof input.content === "string" && input.content.trim(), 400, "评价内容不能为空");
    assert(input.content.trim().length <= 1500, 400, "评价内容不能超过 1500 字");
    assert(Array.isArray(input.imageUrls ?? []), 400, "评价图片格式无效");
    assert((input.imageUrls ?? []).length <= 9, 400, "评价图片最多上传 9 张");
    for (const url of input.imageUrls ?? []) {
      assert(typeof url === "string" && (url.startsWith("data:image/") || url.startsWith("https://")), 400, "评价图片地址无效");
    }
    assert(!input.videoUrl || (typeof input.videoUrl === "string" && (input.videoUrl.startsWith("data:video/") || input.videoUrl.startsWith("https://"))), 400, "评价视频地址无效");
    return { displayName: input.displayName.trim(), rating: input.rating, content: input.content.trim(), imageUrls: clone(input.imageUrls ?? []), videoUrl: input.videoUrl || "" };
  }

  #isQuarterHour(value) {
    const match = String(value).match(/T?(\d{2}):(\d{2})/);
    return Boolean(match) && Number(match[2]) % 15 === 0;
  }
}
