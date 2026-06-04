const API = "http://localhost:3000/api";
const CUSTOMER_ID = "customer-demo";
const cover = "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=85";
const state = { activities: [], tags: [], guides: [], guidePage: { introductionHtml: "" }, topicPages: [], topicPage: null, blogPosts: [], blogPost: null, homeEntries: [], homeModules: [], homeReviews: [], upcomingSlots: [], selectedTags: [], bookingDate: "", bookingTags: [], bookingSearch: "", bookingActivities: [], activity: null, activityDate: "", activityDateAvailability: [], slots: [], reviews: [], relatedActivities: [], reviewImages: [], reviewVideo: "", bookingSlot: null, orders: [], cancellingOrderId: null, replyingReviewId: null };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[character]));
const money = (cents) => `¥${(cents / 100).toFixed(Number(cents) % 100 === 0 ? 0 : 2)}`;
const dateOnly = (value) => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
const timeOnly = (value) => value.slice(11, 16);
const readableDate = (value) => value ? value.replace("T", " ").slice(0, 16) : "";
const shortDateTime = (startsAt, endsAt) => {
  const date = new Date(startsAt);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${timeOnly(startsAt)}-${timeOnly(endsAt)}`;
};
const plainText = (html) => {
  const node = document.createElement("div");
  node.innerHTML = html ?? "";
  return (node.textContent || "").replace(/\s+/g, " ").trim();
};
const blogSummary = (post) => post.summary?.trim() || plainText(post.contentHtml).slice(0, 150);
const formatBlogDate = (value) => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
const demoImageUrls = {
  "demo/forest-hike-cover.jpg": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
  "demo/forest-ferns-1.jpg": "https://images.unsplash.com/photo-1530968033775-2c92736b131e?auto=format&fit=crop&w=900&q=85",
  "demo/forest-ferns-2.jpg": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85",
  "demo/forest-stream.jpg": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=900&q=85",
  "demo/forest-moss.jpg": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=85",
  "demo/lake-kayak.jpg": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85",
  "demo/pottery.jpg": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=85",
  "demo/tie-dye.jpg": "https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=900&q=85",
  "demo/wild-tea.jpg": "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=85",
  "demo/mushroom.jpg": "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=900&q=85",
  "demo/sup.jpg": "https://images.unsplash.com/photo-1526188717906-ab4a2f70b5d3?auto=format&fit=crop&w=900&q=85"
};
const isoDate = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};
const chunks = (items, size) => items.reduce((pages, item, index) => {
  if (index % size === 0) pages.push([]);
  pages[pages.length - 1].push(item);
  return pages;
}, []);
function paragraphs(value) {
  const manual = String(value ?? "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
  if (manual.length > 1) return manual;
  const text = manual[0] || "";
  if (text.length <= 220) return text ? [text] : [];
  const parts = [];
  let buffer = "";
  for (const segment of text.split(/(?<=[。！？.!?])/)) {
    if (!segment) continue;
    if (buffer && (buffer + segment).length > 190) {
      parts.push(buffer.trim());
      buffer = "";
    }
    buffer += segment;
  }
  if (buffer.trim()) parts.push(buffer.trim());
  return parts.length ? parts : [text];
}
function renderParagraphs(value) {
  return paragraphs(value).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}
function detailDateValues(selectedDate) {
  const today = isoDate();
  const selectedTimestamp = Date.parse(`${selectedDate}T00:00:00`);
  const todayTimestamp = Date.parse(`${today}T00:00:00`);
  const startDate = selectedTimestamp >= todayTimestamp && selectedTimestamp <= todayTimestamp + 6 * 86400000 ? today : selectedDate;
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}
function renderDetailReview(review, compact = false) {
  if (!review) return `<div class="empty">还没有评价，欢迎写下第一条体验。</div>`;
  const images = compact ? review.imageUrls.slice(0, 6) : review.imageUrls;
  return `
    <article class="review-card ${compact ? "detail-latest-review" : ""}">
      <div class="detail-review-head">
        <span class="review-avatar">${escapeHtml(review.displayName.slice(0, 1))}</span>
        <div><strong>${escapeHtml(review.displayName)}</strong><em>${"★".repeat(review.rating)}</em></div>
        <time>${review.createdAt.slice(0, 10)}</time>
      </div>
      <section class="review-body">${renderParagraphs(review.content)}</section>
      ${compact && review.content.length > 180 ? `<button type="button" class="detail-review-expand" data-expand-detail-review>展开</button>` : ""}
      ${images.length ? `<div class="review-images">${images.map((url, index) => `<button type="button" data-preview-review="${review.id}" data-preview-index="${index}"><img src="${escapeHtml(url)}" alt="评价照片" /></button>`).join("")}</div>` : ""}
      ${review.imageUrls.length > images.length ? `<button type="button" class="review-more-images" data-preview-review="${review.id}" data-preview-index="${images.length}">更多照片</button>` : ""}
      ${review.videoUrl ? `<video class="review-video" src="${escapeHtml(review.videoUrl)}" controls preload="metadata"></video>` : ""}
      <section class="review-replies">
        ${(review.replies ?? []).map((reply) => `
          <p><strong class="reply-role reply-${reply.authorRole.toLocaleLowerCase()}">${escapeHtml(reply.displayName)}</strong>${escapeHtml(reply.content)}</p>
        `).join("")}
      </section>
      <div class="review-card-actions">
        <button data-reply-review="${review.id}">回复</button>
        ${review.customerId === CUSTOMER_ID ? `<button class="review-delete" data-delete-review="${review.id}">删除我的评价</button>` : ""}
      </div>
    </article>
  `;
}
function bindReviewActions() {
  document.querySelectorAll("[data-expand-detail-review]").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest(".detail-latest-review");
    const expanded = card.classList.toggle("expanded");
    button.textContent = expanded ? "收起" : "展开";
  }));
  document.querySelectorAll("[data-reply-review]").forEach((button) => button.addEventListener("click", () => openReply(button.dataset.replyReview)));
  document.querySelectorAll("[data-preview-review]").forEach((button) => button.addEventListener("click", () => {
    const review = state.reviews.find((item) => item.id === button.dataset.previewReview);
    openImagePreview(review?.imageUrls ?? [], Number(button.dataset.previewIndex));
  }));
  document.querySelectorAll("[data-delete-review]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("确定删除这条评价吗？")) return;
    const wasReviewsPage = !$("#activity-reviews-view").hidden;
    await request(`/reviews/${button.dataset.deleteReview}?customerId=${CUSTOMER_ID}`, { method: "DELETE" });
    toast("评价已删除");
    await openActivity(state.activity.id, state.activityDate);
    if (wasReviewsPage) openActivityReviews();
  }));
  syncReviewGalleryRatios();
}
const statusText = (status) => ({ PENDING_PAYMENT: "待付款", BOOKED: "已预约", COMPLETED: "已完成", REFUNDED: "退款完成", CANCELLED: "已取消" }[status] ?? status);
const mapUrl = (activity) => {
  if (activity.meetingLatitude === null || activity.meetingLatitude === undefined || activity.meetingLongitude === null || activity.meetingLongitude === undefined) return null;
  return `https://uri.amap.com/marker?position=${activity.meetingLongitude},${activity.meetingLatitude}&name=${encodeURIComponent(activity.content.meetingPointName || "集合地点")}`;
};
const orderMapUrl = (order) => mapUrl({
  meetingLatitude: order.meetingLatitude,
  meetingLongitude: order.meetingLongitude,
  content: { meetingPointName: order.meetingPointName }
});
const activityCover = (activity) => activity?.coverUrl || cover;
const activityImageUrl = (image) => image?.url || (image?.cosKey?.startsWith("http") ? image.cosKey : demoImageUrls[image?.cosKey]) || "";
const activityGalleryImages = (activity) => {
  const images = (activity?.images ?? [])
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map(activityImageUrl)
    .filter(Boolean);
  return images.length ? images : [activityCover(activity)];
};
const slotHighestPrice = (slot) => Math.max(...(slot.priceOptions ?? []).map((option) => option.priceCents ?? 0));
function syncActivityGalleryRatio() {
  const gallery = document.querySelector(".activity-gallery");
  const image = gallery?.querySelector("img");
  if (!gallery || !image) return;
  const applyRatio = () => {
    const width = image.naturalWidth || 3;
    const height = image.naturalHeight || 4;
    const ratio = width / Math.max(height, 1);
    gallery.style.setProperty("--gallery-ratio", `${width} / ${height}`);
    gallery.style.setProperty("--gallery-card-width", ratio >= 1 ? "86%" : ratio >= 0.82 ? "72%" : "62%");
    gallery.style.setProperty("--gallery-card-max", ratio >= 1 ? "340px" : ratio >= 0.82 ? "280px" : "235px");
  };
  if (image.complete) applyRatio();
  else image.addEventListener("load", applyRatio, { once: true });
}
function syncReviewGalleryRatios() {
  document.querySelectorAll(".review-images, .home-review-images").forEach((gallery) => {
    const image = gallery.querySelector("img");
    if (!image) return;
    const applyRatio = () => {
      const width = image.naturalWidth || 1;
      const height = image.naturalHeight || 1;
      gallery.style.setProperty("--review-gallery-ratio", `${width} / ${height}`);
    };
    if (image.complete) applyRatio();
    else image.addEventListener("load", applyRatio, { once: true });
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { "content-type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "请求失败");
  return payload.data;
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { $("#toast").hidden = true; }, 1800);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== `${name}-view`; });
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function renderTags() {
  $("#tag-filter").innerHTML = state.tags.map((tag) => `
    <button class="${state.selectedTags.includes(tag.id) ? "active" : ""}" data-tag="${tag.id}">${tag.name}</button>
  `).join("");
  document.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", async () => {
    state.selectedTags = state.selectedTags.includes(button.dataset.tag)
      ? state.selectedTags.filter((id) => id !== button.dataset.tag)
      : [...state.selectedTags, button.dataset.tag];
    await loadActivities();
  }));
}

function renderActivities() {
  $("#activity-count").textContent = `${state.activities.length} 个活动`;
  $("#customer-activity-list").innerHTML = state.activities.map((activity) => `
    <article class="activity-card" data-activity="${activity.id}">
      <img src="${activityCover(activity)}" alt="${activity.content.name}" />
      <div>
        <h3>${activity.content.name}</h3>
        <p>${activity.content.summary || "查看活动详情与可预约时间。"}</p>
        ${activity.tags.map((tag) => `<span>${tag.name}</span>`).join("")}
      </div>
    </article>
  `).join("") || `<div class="empty">暂时没有符合这些标签的活动。</div>`;
  document.querySelectorAll("[data-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.activity)));
}

function renderTopicPages() {
  $("#topic-page-count").textContent = `${state.topicPages.length} 个专题`;
  $("#topic-page-list").innerHTML = state.topicPages.map((page) => `
    <button class="topic-page-card" data-topic-page="${page.slug}" data-external-url="${escapeHtml(page.externalUrl)}">
      ${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />` : ""}
      <span>
        <strong>${escapeHtml(page.title)}</strong>
        <small>${escapeHtml(page.summary) || "打开专题查看更多活动"}</small>
      </span>
    </button>
  `).join("") || `<div class="empty topic-empty">专题内容正在整理中。</div>`;
  document.querySelectorAll("[data-topic-page]").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.externalUrl) return window.open(button.dataset.externalUrl, "_blank", "noopener,noreferrer");
    await openTopicPage(button.dataset.topicPage);
  }));
}

function renderBlogCard(post) {
  return `
    <button class="blog-card" data-blog-post="${escapeHtml(post.slug)}">
      ${post.coverUrl ? `<img src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.title)}" />` : ""}
      <span>
        <strong>${escapeHtml(post.title)}</strong>
        <time>${formatBlogDate(post.publishedAt)}</time>
        <small>${escapeHtml(blogSummary(post))}</small>
      </span>
    </button>
  `;
}

function bindBlogCards() {
  document.querySelectorAll("[data-blog-post]").forEach((button) => {
    button.addEventListener("click", () => openBlogPost(button.dataset.blogPost));
  });
}

function renderBlogPreview() {
  $("#blog-preview-list").innerHTML = state.blogPosts.slice(0, 4).map(renderBlogCard).join("") || `<div class="empty">生活记录正在整理中。</div>`;
  bindBlogCards();
}

function openBlogList() {
  $("#blog-list").innerHTML = state.blogPosts.map(renderBlogCard).join("") || `<div class="empty">生活记录正在整理中。</div>`;
  bindBlogCards();
  showView("blog");
  scrollToPageTop();
}

async function openBlogPost(slug) {
  state.blogPost = await request(`/blog-posts/${slug}`);
  renderBlogDetail();
  showView("blog-detail");
  scrollToPageTop();
}

function renderBlogDetail() {
  const post = state.blogPost;
  $("#blog-detail").innerHTML = `
    ${post.coverUrl ? `<img class="blog-detail-cover" src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.title)}" />` : ""}
    <section class="blog-detail-copy">
      <h1>${escapeHtml(post.title)}</h1>
      <time>${formatBlogDate(post.publishedAt)}</time>
      <div class="blog-content">${post.contentHtml}</div>
    </section>
    <section class="blog-comments">
      <h2>评论(${post.comments.length})</h2>
      <div class="blog-comment-list">
        ${post.comments.map((comment) => `
          <article class="blog-comment-card">
            <strong>${escapeHtml(comment.displayName)}</strong>
            <time>${readableDate(comment.createdAt)}</time>
            <p>${escapeHtml(comment.content)}</p>
          </article>
        `).join("") || `<div class="empty">还没有评论。</div>`}
      </div>
      <form id="blog-comment-form" class="blog-comment-form">
        <input name="displayName" maxlength="60" value="Mia" required />
        <textarea name="content" rows="4" maxlength="1500" required placeholder="写下你的想法"></textarea>
        <button>发布评论</button>
      </form>
    </section>
  `;
  $("#blog-comment-form").addEventListener("submit", submitBlogComment);
}

async function submitBlogComment(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  await request(`/blog-posts/${state.blogPost.id}/comments`, {
    method: "POST",
    body: JSON.stringify({
      customerId: CUSTOMER_ID,
      displayName: values.get("displayName"),
      content: values.get("content")
    })
  });
  toast("评论已发布");
  await openBlogPost(state.blogPost.id);
}

function renderHomeEntries() {
  $("#home-entry-list").innerHTML = state.homeEntries.map((entry) => `
    <button class="home-entry-card" data-home-entry="${entry.id}">
      ${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.title)}" />` : ""}
      <strong>${escapeHtml(entry.title)}</strong>
    </button>
  `).join("");
  document.querySelectorAll("[data-home-entry]").forEach((button) => button.addEventListener("click", async () => {
    const entry = state.homeEntries.find((item) => item.id === button.dataset.homeEntry);
    if (entry.targetType === "TOPIC") return openTopicPage(entry.targetValue);
    if (entry.targetType === "ACTIVITY") return openActivity(entry.targetValue);
    if (entry.targetType === "GUIDES") {
      await loadGuideHome();
      return showView("guides");
    }
    window.open(entry.targetValue, "_blank", "noopener,noreferrer");
  }));
}

async function openTopicPage(slug) {
  state.topicPage = await request(`/topic-pages/${slug}`);
  $("#topic-detail").innerHTML = `
    ${state.topicPage.imageUrl ? `<img class="topic-cover" src="${escapeHtml(state.topicPage.imageUrl)}" alt="${escapeHtml(state.topicPage.title)}" />` : ""}
    <section class="topic-copy">
      <p>DALITRIP TOPIC</p>
      <h1>${escapeHtml(state.topicPage.title)}</h1>
      <span>${escapeHtml(state.topicPage.summary)}</span>
      <div class="topic-introduction">${state.topicPage.introductionHtml || "<p>专题介绍正在整理中。</p>"}</div>
    </section>
    <section class="section-heading topic-activity-heading">
      <div>
        <p>RELATED ACTIVITIES</p>
        <h2>相关活动</h2>
      </div>
      <span>${state.topicPage.activities.length} 个活动</span>
    </section>
    <section class="activity-list">
      ${state.topicPage.activities.map((activity) => `
        <article class="activity-card" data-topic-activity="${activity.id}">
          <img src="${activityCover(activity)}" alt="${escapeHtml(activity.name)}" />
          <div>
            <h3>${escapeHtml(activity.name)}</h3>
            <p>${escapeHtml(activity.summary) || "查看活动详情与可预约时间。"}</p>
          </div>
        </article>
      `).join("") || `<div class="empty">这个专题暂时没有可展示的活动。</div>`}
    </section>
  `;
  document.querySelectorAll("[data-topic-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.topicActivity)));
  showView("topic");
}

async function loadActivities() {
  const query = state.selectedTags.length ? `?tagIds=${state.selectedTags.join(",")}` : "";
  state.activities = await request(`/activities${query}`);
  await loadUpcomingSlots();
  renderHomepageModules();
}

async function loadUpcomingSlots() {
  state.upcomingSlots = await request("/upcoming-departures?limit=30");
}

function renderBookingDateStrip() {
  const today = isoDate();
  const selectedTimestamp = Date.parse(`${state.bookingDate}T00:00:00`);
  const todayTimestamp = Date.parse(`${today}T00:00:00`);
  const startDate = selectedTimestamp >= todayTimestamp && selectedTimestamp <= todayTimestamp + 6 * 86400000 ? today : state.bookingDate;
  $("#booking-selected-date").textContent = dateOnly(`${state.bookingDate}T00:00:00`);
  $("#booking-date-picker").value = state.bookingDate;
  $("#booking-date-strip").innerHTML = Array.from({ length: 7 }, (_, index) => {
    const value = addDays(startDate, index);
    const date = new Date(`${value}T00:00:00`);
    return `
      <button class="${value === state.bookingDate ? "active" : ""}" data-booking-date="${value}">
        <span>${new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date)}</span>
        <strong>${date.getDate()}</strong>
        <small>${value === state.bookingDate ? "已选" : "选择"}</small>
      </button>
    `;
  }).join("");
  document.querySelectorAll("[data-booking-date]").forEach((button) => button.addEventListener("click", async () => {
    state.bookingDate = button.dataset.bookingDate;
    await loadBookingActivities();
  }));
}

function renderBookingTags() {
  $("#booking-tag-filter").innerHTML = `
    <button class="${state.bookingTags.length ? "" : "active"}" data-booking-tag="">全部</button>
    ${state.tags.map((tag) => `<button class="${state.bookingTags.includes(tag.id) ? "active" : ""}" data-booking-tag="${tag.id}">${escapeHtml(tag.name)}</button>`).join("")}
  `;
  document.querySelectorAll("[data-booking-tag]").forEach((button) => button.addEventListener("click", async () => {
    if (!button.dataset.bookingTag) {
      state.bookingTags = [];
    } else {
      state.bookingTags = state.bookingTags.includes(button.dataset.bookingTag)
        ? state.bookingTags.filter((id) => id !== button.dataset.bookingTag)
        : [...state.bookingTags, button.dataset.bookingTag];
    }
    await loadBookingActivities();
  }));
}

function renderBookingActivities() {
  const search = state.bookingSearch.trim().toLocaleLowerCase();
  const filtered = state.bookingActivities.filter((activity) => !search || activity.content.name.toLocaleLowerCase().includes(search) || activity.tags.some((tag) => tag.name.toLocaleLowerCase().includes(search)));
  const grouped = filtered.reduce((groups, activity) => {
    (groups[activity.groupName] ??= []).push(activity);
    return groups;
  }, {});
  $("#booking-discovery-list").innerHTML = Object.entries(grouped).map(([groupName, activities]) => `
    <section class="booking-activity-group">
      <header><h2>${escapeHtml(groupName)}</h2><span>${activities.reduce((count, activity) => count + activity.slots.length, 0)} 个时间可约</span></header>
      <div>${activities.flatMap((activity) => activity.slots.map((slot) => {
        const minimumPrice = Math.min(...slot.priceOptions.map((option) => option.priceCents));
        return `
          <article class="booking-discovery-card">
            <img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" />
            <div>
              <h3>${escapeHtml(activity.content.name)}</h3>
              <strong>${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)}</strong>
              <p>${money(minimumPrice)} 起 · 已有 ${slot.bookedCount} 人报名，最多 ${slot.capacity} 人</p>
              <aside>${activity.tags.map((tag) => `<span>${escapeHtml(tag.name)}</span>`).join("")}</aside>
            </div>
            <button data-booking-activity="${activity.id}">预约</button>
          </article>
        `;
      })).join("")}</div>
    </section>
  `).join("") || `<div class="empty">这一天暂时没有符合条件的活动，可以换一个日期或减少标签。</div>`;
  document.querySelectorAll("[data-booking-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.bookingActivity, state.bookingDate)));
}

async function loadBookingActivities() {
  if (!state.bookingDate) state.bookingDate = state.upcomingSlots[0]?.startsAt.slice(0, 10) || isoDate();
  const tags = state.bookingTags.length ? `&tagIds=${state.bookingTags.join(",")}` : "";
  state.bookingActivities = await request(`/available-activities?date=${state.bookingDate}${tags}`);
  renderBookingDateStrip();
  renderBookingTags();
  renderBookingActivities();
}

function moduleHeading(module, eyebrow = "DISCOVER") {
  const title = module.type === "UPCOMING" && module.title === "即将成行" ? "即将出发的旅行" : module.title;
  return `<section class="section-heading"><div><p>${eyebrow}</p><h2>${escapeHtml(title)}</h2>${module.subtitle ? `<span>${escapeHtml(module.subtitle)}</span>` : ""}</div></section>`;
}

function homeModuleStyle(module) {
  return {
    layout: module.style?.layout || "",
    cardStyle: module.style?.cardStyle || "PLAIN",
    radius: module.style?.radius ?? 6,
    gap: module.style?.gap ?? 8,
    padding: module.style?.padding ?? 11,
    textAlign: module.style?.textAlign || "LEFT",
    dividerStyle: module.style?.dividerStyle || "SPACE",
    height: module.style?.height ?? 24,
    backgroundColor: module.style?.backgroundColor || "#ffffff"
  };
}

function homeModuleVars(module) {
  const style = homeModuleStyle(module);
  return `style="--module-radius:${style.radius}px;--module-gap:${style.gap}px;--module-padding:${style.padding}px;--module-background:${escapeHtml(style.backgroundColor)}"`;
}

function renderRichTextParagraphs(text = "") {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function renderHomepageModules() {
  $("#home-module-container").innerHTML = state.homeModules.map((module) => {
    const style = homeModuleStyle(module);
    if (module.type === "CUBE") return `<section class="home-entry-list layout-${style.layout || "TWO"} card-${style.cardStyle}" ${homeModuleVars(module)}>${state.homeEntries.slice(0, module.limit).map((entry) => `
      <button class="home-entry-card" data-home-entry="${entry.id}">${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.title)}" />` : ""}<strong>${escapeHtml(entry.title)}</strong></button>`).join("")}</section>`;
    if (module.type === "NAV") return `<nav class="home-text-nav layout-${style.layout || "FOUR"}" ${homeModuleVars(module)}>${(module.navItems ?? []).slice(0, module.limit).map((entry) => `
      <button data-nav-type="${entry.targetType}" data-nav-value="${escapeHtml(entry.targetValue)}"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.subtitle || "DISCOVER")}</small></button>`).join("")}</nav>`;
    if (module.type === "TOPICS") return `${moduleHeading(module, "DISCOVER MORE")}<section class="topic-page-list">${state.topicPages.slice(0, module.limit).map((page) => `
      <button class="topic-page-card" data-topic-page="${page.slug}" data-external-url="${escapeHtml(page.externalUrl)}">${page.imageUrl ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" />` : ""}<span><strong>${escapeHtml(page.title)}</strong><small>${escapeHtml(page.summary) || "打开专题查看更多活动"}</small></span></button>`).join("")}</section>`;
    if (module.type === "ACTIVITIES") {
      const items = state.activities.filter((activity) => module.tagIds.every((tagId) => activity.tags.some((tag) => tag.id === tagId))).slice(0, module.limit);
      return `<section class="home-activity-module">${moduleHeading(module, "EXPLORE")}<section class="tag-filter">${state.tags.map((tag) => `<button class="${state.selectedTags.includes(tag.id) ? "active" : ""}" data-tag="${tag.id}">${tag.name}</button>`).join("")}</section><section class="activity-list layout-${style.layout || "LIST"} card-${style.cardStyle}" ${homeModuleVars(module)}>${items.map((activity) => `
        <article class="activity-card" data-activity="${activity.id}"><img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" /><div><h3>${escapeHtml(activity.content.name)}</h3><p>${escapeHtml(activity.content.summary) || "查看活动详情与可预约时间。"}</p>${activity.tags.map((tag) => `<span>${escapeHtml(tag.name)}</span>`).join("")}</div></article>`).join("") || `<div class="empty">暂时没有符合这些标签的活动。</div>`}</section></section>`;
    }
    if (module.type === "GUIDES") return `${moduleHeading(module, "MEET THE GUIDES")}<section class="home-guide-list">${state.guides.slice(0, module.limit).map((guide) => `
      <button data-guide="${guide.id}">${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : ""}<strong>${escapeHtml(guide.name)}</strong></button>`).join("")}</section>`;
    if (module.type === "REVIEWS") return `${moduleHeading(module, "LATEST STORIES")}<section class="home-review-strip">${state.homeReviews.slice(0, module.limit).map((review) => `
      <article class="home-review-card" data-review-activity="${review.activityId}">
        <div class="home-review-head">
          <span class="review-avatar">${escapeHtml(review.displayName.slice(0, 1))}</span>
          <div>
            <strong>${escapeHtml(review.displayName)}</strong>
            <em>${"★".repeat(review.rating)}</em>
          </div>
          <time>${readableDate(review.createdAt)}</time>
        </div>
        <div class="home-review-copy">
            <div class="home-review-text">
              <p>${escapeHtml(review.content)}</p>
              ${review.content.length > 80 ? `<button type="button" class="review-expand" data-expand-review>展开</button>` : ""}
            </div>
            <small>#${escapeHtml(review.activityName)}</small>
            ${(review.imageUrls ?? []).length ? `<div class="home-review-images">${review.imageUrls.slice(0, 3).map((url, index) => `<button type="button" data-home-preview-review="${review.id}" data-preview-index="${index}"><img src="${escapeHtml(url)}" alt="评价照片" /></button>`).join("")}${review.imageUrls.length > 3 ? `<button type="button" class="more" data-home-preview-review="${review.id}" data-preview-index="3">更多</button>` : ""}</div>` : ""}
        </div>
      </article>`).join("") || `<div class="empty">最新评价正在整理中。</div>`}</section>`;
    if (module.type === "UPCOMING") return `${moduleHeading(module, "NEXT DEPARTURES")}<section class="upcoming-strip">${state.upcomingSlots.slice(0, 20).map((slot) => `
      <button data-upcoming-activity="${slot.activityId}">
        <img src="${slot.coverUrl || cover}" alt="${escapeHtml(slot.activityName)}" />
        <span class="upcoming-copy">
          <small><b>${escapeHtml(slot.customerDisplayName)}</b> 预约了 · ${slot.bookedCount} 人报名</small>
          <strong>${escapeHtml(slot.activityName)}</strong>
          <time>${shortDateTime(slot.startsAt, slot.endsAt)}</time>
        </span>
      </button>`).join("") || `<div class="empty">近期活动正在准备中。</div>`}</section>`;
    if (module.type === "BANNER") {
      const images = (module.imageUrls?.length ? module.imageUrls : [module.imageUrl]).filter(Boolean);
      return `<section class="home-banners layout-${style.layout || "SINGLE"} card-${style.cardStyle}" ${homeModuleVars(module)}>${(images.length ? images : [""]).map((imageUrl) => `<a class="home-banner" href="${escapeHtml(module.linkUrl || "#")}" ${module.linkUrl ? `target="_blank" rel="noopener noreferrer"` : ""}>${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(module.title)}" />` : ""}<strong>${escapeHtml(module.title)}</strong></a>`).join("")}</section>`;
    }
    if (module.type === "COLLAPSE") return `<section class="home-collapse-module" style="padding:${style.padding}px;background:${escapeHtml(style.backgroundColor)}">
      <h2>${escapeHtml(module.title)}</h2>
      <div class="home-collapse-list">${(module.items ?? []).slice(0, module.limit).map((item, index) => `
        <article class="home-collapse-item">
          <button type="button" data-collapse-item="${module.id}-${index}" aria-expanded="false"><span>☏</span><strong>${escapeHtml(item.title)}</strong><em>⌄</em></button>
          <div class="home-collapse-body">${renderRichTextParagraphs(item.content)}</div>
        </article>`).join("") || `<p class="empty">暂时没有内容。</p>`}</div>
    </section>`;
    if (module.type === "DIVIDER") return `<div class="home-divider ${style.dividerStyle === "LINE" ? "is-line" : "is-space"}" style="height:${style.height}px"><span></span></div>`;
    return `<section class="home-text-module" style="padding:${style.padding}px;text-align:${style.textAlign === "CENTER" ? "center" : "left"};background:${escapeHtml(style.backgroundColor)}"><h2>${escapeHtml(module.title)}</h2><p>${escapeHtml(module.subtitle)}</p></section>`;
  }).join("");
  bindHomepageModules();
}

function bindHomepageModules() {
  document.querySelectorAll("[data-nav-type]").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.navType === "TOPIC") return openTopicPage(button.dataset.navValue);
    if (button.dataset.navType === "ACTIVITY") return openActivity(button.dataset.navValue);
    if (button.dataset.navType === "GUIDES") { await loadGuideHome(); return showView("guides"); }
    window.open(button.dataset.navValue, "_blank", "noopener,noreferrer");
  }));
  document.querySelectorAll("[data-home-entry]").forEach((button) => button.addEventListener("click", async () => {
    const entry = state.homeEntries.find((item) => item.id === button.dataset.homeEntry);
    if (entry.targetType === "TOPIC") return openTopicPage(entry.targetValue);
    if (entry.targetType === "ACTIVITY") return openActivity(entry.targetValue);
    if (entry.targetType === "GUIDES") { await loadGuideHome(); return showView("guides"); }
    window.open(entry.targetValue, "_blank", "noopener,noreferrer");
  }));
  document.querySelectorAll("[data-topic-page]").forEach((button) => button.addEventListener("click", async () => button.dataset.externalUrl ? window.open(button.dataset.externalUrl, "_blank", "noopener,noreferrer") : openTopicPage(button.dataset.topicPage)));
  document.querySelectorAll("[data-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.activity)));
  document.querySelectorAll("[data-guide]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guide)));
  document.querySelectorAll("[data-review-activity]").forEach((card) => card.addEventListener("click", () => openActivity(card.dataset.reviewActivity)));
  document.querySelectorAll("[data-expand-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = button.closest(".home-review-card");
    const expanded = card.classList.toggle("expanded");
    button.textContent = expanded ? "收起" : "展开";
  }));
  document.querySelectorAll("[data-home-preview-review]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const review = state.homeReviews.find((item) => item.id === button.dataset.homePreviewReview);
    openImagePreview(review?.imageUrls ?? [], Number(button.dataset.previewIndex));
  }));
  document.querySelectorAll("[data-collapse-item]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const item = button.closest(".home-collapse-item");
    const isOpen = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  }));
  syncReviewGalleryRatios();
  document.querySelectorAll("[data-upcoming-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.upcomingActivity)));
  document.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", async () => {
    state.selectedTags = state.selectedTags.includes(button.dataset.tag) ? state.selectedTags.filter((id) => id !== button.dataset.tag) : [...state.selectedTags, button.dataset.tag];
    await loadActivities();
  }));
}

async function openActivity(id, date = "", options = {}) {
  const baseDate = date || isoDate();
  const detailDates = detailDateValues(baseDate);
  const [activity, reviews, relatedActivities, dateSlots] = await Promise.all([
    request(`/activities/${id}`),
    request(`/reviews?activityId=${id}`),
    request(`/activities/${id}/related?limit=3`),
    Promise.all(detailDates.map(async (value) => ({
      date: value,
      slots: await request(`/activities/${id}/slots?date=${value}&includeGenerated=true`)
    })))
  ]);
  state.activity = activity;
  state.reviews = reviews;
  state.relatedActivities = relatedActivities;
  const selectedDate = date || dateSlots.find((item) => item.slots.length > 0)?.date || baseDate;
  state.activityDate = selectedDate;
  state.slots = dateSlots.find((item) => item.date === selectedDate)?.slots ?? [];
  state.activityDateAvailability = dateSlots.map((item) => ({ date: item.date, available: item.slots.length > 0 }));
  const navigationUrl = mapUrl(state.activity);
  const latestReview = state.reviews[0];
  const activityImages = activityGalleryImages(state.activity);
  $("#activity-detail").innerHTML = `
    <section class="detail-copy detail-intro">
      <h1>${escapeHtml(state.activity.content.name)}</h1>
      <p>${escapeHtml(state.activity.content.summary) || "一段慢一点的自然体验。"}</p>
      <span>${state.activity.tags.map((tag) => escapeHtml(tag.name)).join(" / ")}</span>
    </section>
    <section class="activity-gallery" aria-label="活动照片">
      <div>
        ${activityImages.map((imageUrl, index) => `
          <button type="button" data-activity-preview-index="${index}">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(state.activity.content.name)}照片 ${index + 1}" />
          </button>
        `).join("")}
      </div>
      ${activityImages.length > 1 ? `<p>${activityImages.map((_, index) => `<span class="${index === 0 ? "active" : ""}"></span>`).join("")}</p>` : ""}
    </section>
    <nav class="detail-tabs">
      <button class="active" data-detail-section="detail-booking-section">预约</button>
      <button data-detail-section="detail-review-section">评论</button>
      <button data-detail-section="detail-info-section">详情</button>
    </nav>
    <section id="detail-booking-section" class="detail-booking-section">
      <h2>预约</h2>
      <div class="detail-date-strip">
        ${state.activityDateAvailability.map((item) => {
          const dateObject = new Date(`${item.date}T00:00:00`);
          return `
            <button class="${item.date === state.activityDate ? "active" : ""} ${item.available ? "available" : "unavailable"}" data-activity-date="${item.date}">
              <span>${new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(dateObject)}</span>
              <strong>${dateObject.getDate()}</strong>
              <small>${item.available ? "可约" : "不可约"}</small>
            </button>
          `;
        }).join("")}
      </div>
      <p class="advance-notice">需提前 ${state.activity.advanceBookingHours || 0} 小时进行预约</p>
      <h3>选择时段</h3>
      <div class="slot-list detail-slot-list">
        ${state.slots.map((slot) => `
          <article class="slot-card">
            <div>
              <strong>${timeOnly(slot.startsAt)}-${timeOnly(slot.endsAt)}</strong>
              <p>${slot.bookedCount} 人预订，最多 ${slot.capacity} 人</p>
              <em>最高 ${money(slotHighestPrice(slot))}</em>
            </div>
            <button data-book-slot="${slot.id}">预约</button>
          </article>
        `).join("") || `<div class="empty">暂时没有开放预约的时间。</div>`}
      </div>
    </section>
    <section id="detail-review-section" class="reviews-section detail-review-section">
      <div class="reviews-heading">
        <h2>评论(${state.reviews.length})</h2>
        <div>
          <button class="secondary" id="show-all-reviews">查看全部</button>
          <button class="primary" id="new-review">写评价</button>
        </div>
      </div>
      <div class="review-list detail-latest-list">
        ${renderDetailReview(latestReview, true)}
      </div>
    </section>
    <section id="detail-info-section" class="detail-copy detail-info-section">
      <h2>详情</h2>
      <section class="activity-facts">
        <div><span>年龄</span><strong>${escapeHtml(state.activity.content.suitableAge || "咨询领队")}</strong></div>
        <div><span>集合地点</span><strong>${escapeHtml(state.activity.content.meetingPointName || "出发前通知")}${navigationUrl ? `<a class="navigation-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}</strong></div>
        <div><span>领队微信</span><strong class="wechat-copy-line">${escapeHtml(state.activity.leaderWechat || "预订后沟通")}${state.activity.leaderWechat ? `<button type="button" data-copy-leader-wechat="${escapeHtml(state.activity.leaderWechat)}">复制</button>` : ""}</strong></div>
      </section>
      <section class="detail-description">
        <h3>体验内容</h3>
        ${renderParagraphs(state.activity.content.summary || "详情正在整理中。")}
      </section>
      ${(state.activity.guides ?? []).length ? `
        <section class="activity-guides">
          <h2>可能带队的领队</h2>
          <div>${(state.activity.guides ?? []).map((guide) => `
            <button data-guide="${guide.id}">
              ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : ""}
              <span>${escapeHtml(guide.name)}</span>
            </button>
          `).join("")}</div>
        </section>
      ` : ""}
      ${state.relatedActivities.length ? `
        <section class="related-activities">
          <h3>喜欢这个的人也去了</h3>
          <div>
            ${state.relatedActivities.map((activity) => `
              <button data-related-activity="${activity.id}">
                <img src="${activityCover(activity)}" alt="${escapeHtml(activity.content.name)}" />
                <strong>${escapeHtml(activity.content.name)}</strong>
              </button>
            `).join("")}
          </div>
        </section>
      ` : ""}
    </section>`;
  document.querySelectorAll("[data-book-slot]").forEach((button) => button.addEventListener("click", () => openBooking(button.dataset.bookSlot)));
  document.querySelectorAll("[data-activity-preview-index]").forEach((button) => button.addEventListener("click", () => openImagePreview(activityImages, Number(button.dataset.activityPreviewIndex))));
  $("#new-review").addEventListener("click", openReview);
  $("#show-all-reviews").addEventListener("click", openActivityReviews);
  document.querySelectorAll("[data-activity-date]").forEach((button) => button.addEventListener("click", () => openActivity(state.activity.id, button.dataset.activityDate, { scrollToTop: false })));
  document.querySelectorAll("[data-detail-section]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".detail-tabs button").forEach((item) => item.classList.toggle("active", item === button));
    document.getElementById(button.dataset.detailSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  document.querySelectorAll("[data-guide]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guide)));
  document.querySelectorAll("[data-related-activity]").forEach((button) => button.addEventListener("click", () => openActivity(button.dataset.relatedActivity)));
  document.querySelector("[data-copy-leader-wechat]")?.addEventListener("click", async (event) => {
    const value = event.currentTarget.dataset.copyLeaderWechat;
    try {
      await navigator.clipboard.writeText(value);
      toast("领队微信已复制");
    } catch {
      window.prompt("请复制领队微信", value);
    }
  });
  syncActivityGalleryRatio();
  bindReviewActions();
  showView("detail");
  if (options.scrollToTop !== false) scrollToPageTop();
}

function openActivityReviews() {
  if (!state.activity) return;
  $("#activity-reviews-title").textContent = `${state.activity.content.name} · 评论(${state.reviews.length})`;
  $("#activity-review-list").innerHTML = state.reviews.map((review) => renderDetailReview(review)).join("") || `<div class="empty">还没有评价，欢迎写下第一条体验。</div>`;
  $("#new-review-from-list").onclick = openReview;
  bindReviewActions();
  showView("activity-reviews");
}

function openImagePreview(images, index = 0) {
  if (!images.length) return;
  const dialog = $("#image-preview-dialog");
  const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
  dialog.dataset.images = JSON.stringify(images);
  dialog.dataset.index = String(safeIndex);
  renderImagePreview();
  dialog.showModal();
}

function renderImagePreview() {
  const dialog = $("#image-preview-dialog");
  const images = JSON.parse(dialog.dataset.images || "[]");
  const index = Number(dialog.dataset.index || 0);
  $("#image-preview-content").innerHTML = `
    <button type="button" data-close-image-preview aria-label="关闭">×</button>
    <div class="image-preview-track">${images.map((image) => `<img src="${escapeHtml(image)}" alt="评价照片预览" />`).join("")}</div>
    <footer><span>${index + 1} / ${images.length}</span></footer>
  `;
  document.querySelector("[data-close-image-preview]").addEventListener("click", () => dialog.close());
  const track = document.querySelector(".image-preview-track");
  requestAnimationFrame(() => {
    track.scrollLeft = track.clientWidth * index;
  });
  track.addEventListener("scroll", () => {
    const current = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    dialog.dataset.index = String(current);
    const counter = document.querySelector("#image-preview-content footer span");
    if (counter) counter.textContent = `${current + 1} / ${images.length}`;
  }, { passive: true });
}

async function openGuide(guideId) {
  if (!state.guides.length) state.guides = await request("/guides");
  const guide = state.guides.find((item) => item.id === guideId);
  $("#guide-profile").innerHTML = `
    <header><h2>${escapeHtml(guide.name)}</h2><button data-close-guide aria-label="关闭">×</button></header>
    ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : ""}
    <div class="guide-description">${guide.descriptionHtml}</div>
    <h3>可能带领的活动</h3>
    <div class="guide-activity-list">
      ${guide.activities.map((activity) => `
        <button data-guide-activity="${activity.id}">
          <strong>${escapeHtml(activity.name)}</strong>
          <span>${escapeHtml(activity.summary)}</span>
        </button>
      `).join("") || `<p>暂时没有关联活动。</p>`}
    </div>
  `;
  $("#guide-profile [data-close-guide]").addEventListener("click", () => $("#guide-dialog").close());
  document.querySelectorAll("[data-guide-activity]").forEach((button) => button.addEventListener("click", async () => {
    $("#guide-dialog").close();
    await openActivity(button.dataset.guideActivity);
  }));
  $("#guide-dialog").showModal();
}

async function loadGuideHome() {
  [state.guides, state.guidePage] = await Promise.all([request("/guides"), request("/guide-page")]);
  $("#guide-home-introduction").innerHTML = state.guidePage.introductionHtml || `<p>暂未填写领队介绍。</p>`;
  $("#guide-count").textContent = `${state.guides.length} 位领队`;
  $("#customer-guide-list").innerHTML = state.guides.map((guide) => `
    <button class="customer-guide-card" data-guide-card="${guide.id}">
      ${guide.photoUrl ? `<img src="${escapeHtml(guide.photoUrl)}" alt="${escapeHtml(guide.name)}" />` : `<span class="customer-guide-placeholder">照片</span>`}
      <div>
        <h3>${escapeHtml(guide.name)}</h3>
        <p>${escapeHtml(guide.descriptionHtml.replace(/<[^>]+>/g, "")) || "查看领队档案与可能带领的活动。"}</p>
        <span>${guide.activities.length} 个相关活动</span>
      </div>
    </button>
  `).join("") || `<div class="empty">领队档案正在整理中。</div>`;
  document.querySelectorAll("[data-guide-card]").forEach((button) => button.addEventListener("click", () => openGuide(button.dataset.guideCard)));
}

function openReply(reviewId) {
  state.replyingReviewId = reviewId;
  $("#reply-form").reset();
  $("#reply-form").elements.displayName.value = "Mia";
  $("#reply-dialog").showModal();
}

function openReview() {
  state.reviewImages = [];
  state.reviewVideo = "";
  $("#review-form").reset();
  $("#review-form").elements.displayName.value = "Mia";
  $("#review-image-preview").innerHTML = "";
  $("#review-video-preview").innerHTML = "";
  $("#review-dialog").showModal();
}

function readImageFiles(files) {
  return Promise.all([...files].map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.readAsDataURL(file);
  })));
}

function openBooking(slotId) {
  state.bookingSlot = state.slots.find((slot) => slot.id === slotId);
  const form = $("#booking-form");
  form.reset();
  form.quantity.value = 1;
  $("#booking-price-options").innerHTML = state.bookingSlot.priceOptions.map((option, index) => `
    <label>
      <input name="priceOptionId" type="radio" value="${option.id}" ${index === 0 ? "checked" : ""} required />
      <span>${option.name} · ${money(option.priceCents)}</span>
    </label>
  `).join("");
  document.querySelectorAll("input[name=priceOptionId]").forEach((input) => input.addEventListener("change", updateTotal));
  $("#booking-slot-summary").innerHTML = `<strong>${dateOnly(state.bookingSlot.startsAt)} ${timeOnly(state.bookingSlot.startsAt)}-${timeOnly(state.bookingSlot.endsAt)}</strong><br />${state.bookingSlot.bookedCount} 人预订，最多 ${state.bookingSlot.capacity} 人`;
  updateTotal();
  $("#booking-dialog").showModal();
}

function updateTotal() {
  const form = $("#booking-form");
  const option = state.bookingSlot?.priceOptions.find((item) => item.id === form.querySelector("input[name=priceOptionId]:checked")?.value);
  $("#booking-total").textContent = money((option?.priceCents ?? 0) * Number(form.quantity.value));
}

function renderOrders() {
  $("#customer-order-list").innerHTML = state.orders.map((order) => {
    const navigationUrl = orderMapUrl(order);
    return `
    <article class="customer-order">
      <div><strong>${order.groupName}</strong><span>${statusText(order.status)}</span></div>
      <h3>${order.activityName}</h3>
      <p>${dateOnly(order.startsAt)} ${timeOnly(order.startsAt)}-${timeOnly(order.endsAt)}</p>
      <p>${order.specification} × ${order.quantity} · ${money(order.amountCents)}</p>
      <p class="order-meeting-point"><strong>集合地点：</strong>${order.meetingPointName || "出发前通知"}${navigationUrl ? `<a class="navigation-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">导航</a>` : ""}</p>
      ${["PENDING_PAYMENT", "BOOKED"].includes(order.status) ? `<div class="customer-order-actions"><button class="danger" data-cancel-booking="${order.id}">取消预约</button></div>` : ""}
    </article>
  `;
  }).join("") || `<div class="empty">还没有预约记录。</div>`;
  document.querySelectorAll("[data-cancel-booking]").forEach((button) => button.addEventListener("click", () => openCancellation(button.dataset.cancelBooking)));
}

async function openCancellation(orderId) {
  try {
    const preview = await request(`/orders/${orderId}/cancellation-preview?customerId=${CUSTOMER_ID}`);
    state.cancellingOrderId = orderId;
    $("#cancel-booking-summary").innerHTML = `
      <strong>预计退款 ${money(preview.refundAmountCents)}</strong><br />
      <span>订单金额 ${money(preview.amountCents)}，扣款 ${money(preview.retainedAmountCents)}，退款比例 ${Math.round(preview.refundRate * 100)}%，款项原路退回</span>
    `;
    const contact = $("#cancel-booking-contact");
    contact.hidden = !preview.leaderWechat;
    contact.innerHTML = preview.leaderWechat
      ? `<div><span>需要沟通？联系领队微信</span><strong>${preview.leaderWechat}</strong></div><button type="button" class="secondary" data-copy-wechat="${preview.leaderWechat}">复制微信</button>`
      : "";
    contact.querySelector("[data-copy-wechat]")?.addEventListener("click", async (event) => {
      const value = event.currentTarget.dataset.copyWechat;
      try {
        await navigator.clipboard.writeText(value);
        toast("领队微信已复制");
      } catch {
        window.prompt("请复制领队微信", value);
      }
    });
    $("#cancel-booking-form").reset();
    $("#cancel-booking-dialog").showModal();
  } catch (error) {
    toast(error.message);
  }
}

async function loadOrders() {
  state.orders = await request(`/orders?customerId=${CUSTOMER_ID}`);
  renderOrders();
}

async function boot() {
  try {
    [state.tags, state.topicPages, state.blogPosts, state.homeEntries, state.homeModules, state.guides, state.homeReviews] = await Promise.all([request("/tags"), request("/topic-pages?published=true"), request("/blog-posts?published=true"), request("/home-entries?published=true"), request("/home-modules?published=true"), request("/guides"), request("/reviews")]);
    renderBlogPreview();
    await loadActivities();
  } catch (error) {
    toast(error.message);
  }
}

document.querySelectorAll(".bottom-nav button").forEach((button) => button.addEventListener("click", async () => {
  if (button.dataset.view === "orders") await loadOrders();
  if (button.dataset.view === "booking") await loadBookingActivities();
  if (button.dataset.view === "guides") await loadGuideHome();
  showView(button.dataset.view);
}));
$("#booking-date-picker").addEventListener("change", async (event) => {
  state.bookingDate = event.currentTarget.value;
  await loadBookingActivities();
});
$("#booking-search").addEventListener("input", (event) => {
  state.bookingSearch = event.currentTarget.value;
  renderBookingActivities();
});
$("#back-to-home").addEventListener("click", () => showView("home"));
$("#open-blog-list").addEventListener("click", openBlogList);
$("#back-from-blog").addEventListener("click", () => showView("home"));
$("#back-from-blog-detail").addEventListener("click", openBlogList);
$("#back-from-topic").addEventListener("click", () => showView("home"));
$("#back-to-detail-from-reviews").addEventListener("click", () => showView("detail"));
document.querySelectorAll("[data-close-booking]").forEach((button) => button.addEventListener("click", () => $("#booking-dialog").close()));
document.querySelectorAll("[data-quantity-step]").forEach((button) => button.addEventListener("click", () => {
  const input = $("#booking-form").quantity;
  const next = Math.max(1, Math.min(state.bookingSlot.capacity - state.bookingSlot.bookedCount, Number(input.value) + Number(button.dataset.quantityStep)));
  input.value = next;
  updateTotal();
}));
$("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  try {
    const order = await request("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerId: CUSTOMER_ID,
        slotId: state.bookingSlot.id,
        priceOptionId: values.get("priceOptionId"),
        quantity: Number(values.get("quantity")),
        profile: { mobile: values.get("mobile"), nickname: values.get("nickname"), childInfo: values.get("childInfo") }
      })
    });
    await request(`/orders/${order.id}/confirm-payment`, { method: "PATCH", body: JSON.stringify({ paymentMethod: "WECHAT", wechatTransactionId: `demo-${Date.now()}` }) });
    form.closest("dialog").close();
    $("#success-dialog").showModal();
  } catch (error) {
    toast(error.message);
  }
});
$("#show-orders").addEventListener("click", async () => {
  $("#success-dialog").close();
  await loadOrders();
  showView("orders");
});
document.querySelectorAll("[data-close-cancel-booking]").forEach((button) => button.addEventListener("click", () => $("#cancel-booking-dialog").close()));
document.querySelectorAll("[data-close-review]").forEach((button) => button.addEventListener("click", () => $("#review-dialog").close()));
document.querySelectorAll("[data-close-reply]").forEach((button) => button.addEventListener("click", () => $("#reply-dialog").close()));
$("#review-images").addEventListener("change", async (event) => {
  const urls = await readImageFiles(event.currentTarget.files);
  if (state.reviewImages.length + urls.length > 9) toast("评价图片最多上传 9 张");
  state.reviewImages = [...state.reviewImages, ...urls].slice(0, 9);
  $("#review-image-preview").innerHTML = state.reviewImages.map((url) => `<img src="${url}" alt="待上传照片" />`).join("");
  event.currentTarget.value = "";
});
$("#review-video").addEventListener("change", async (event) => {
  const [url] = await readImageFiles(event.currentTarget.files);
  state.reviewVideo = url || "";
  $("#review-video-preview").innerHTML = state.reviewVideo ? `<video src="${state.reviewVideo}" controls preload="metadata"></video>` : "";
  event.currentTarget.value = "";
});
$("#review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const values = new FormData(event.currentTarget);
    await request(`/activities/${state.activity.id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ customerId: CUSTOMER_ID, displayName: values.get("displayName"), rating: Number(values.get("rating")), content: values.get("content"), imageUrls: state.reviewImages, videoUrl: state.reviewVideo })
    });
    $("#review-dialog").close();
    toast("评价已发布");
    await openActivity(state.activity.id);
  } catch (error) {
    toast(error.message);
  }
});
$("#reply-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const values = new FormData(event.currentTarget);
    await request(`/reviews/${state.replyingReviewId}/replies`, {
      method: "POST",
      body: JSON.stringify({ customerId: CUSTOMER_ID, displayName: values.get("displayName"), content: values.get("content") })
    });
    $("#reply-dialog").close();
    toast("回复已发送");
    await openActivity(state.activity.id);
  } catch (error) {
    toast(error.message);
  }
});
$("#cancel-booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request(`/orders/${state.cancellingOrderId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ customerId: CUSTOMER_ID, note: new FormData(event.currentTarget).get("note") })
    });
    $("#cancel-booking-dialog").close();
    await loadOrders();
    toast("预约已取消，退款已提交");
  } catch (error) {
    toast(error.message);
  }
});

boot();
