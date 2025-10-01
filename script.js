const galleryEl = document.getElementById("gallery");
const navEl = document.getElementById("category-nav");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const lightboxEl = document.getElementById("lightbox");
const lightboxImageEl = document.getElementById("lightbox-image");
const lightboxCaptionEl = document.getElementById("lightbox-caption");
const lightboxCloseBtn = document.querySelector(".lightbox__close");

const SKELETON_COUNT = 6;
const INVALID_LINK_PATTERNS = [/\.gitkeep$/i, /\.ds_store$/i];
const VIDEO_EXTENSION_PATTERN = /\.mp4(\?.*)?$/i;
const collator = new Intl.Collator("zh-Hant", { sensitivity: "base", numeric: true });

let lastFocusedElement = null;

const state = {
  items: [],
  currentCategory: "全部",
};

let cachedItems = null;

function isValidLink(link) {
  if (!link) return false;
  const trimmedLink = link.trim();
  if (!trimmedLink) return false;
  const lowerLink = trimmedLink.toLowerCase();
  if (lowerLink.startsWith("javascript:")) {
    return false;
  }

  return !INVALID_LINK_PATTERNS.some(pattern => pattern.test(trimmedLink));
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map(item => {
      const link = typeof item?.link === "string" ? item.link.trim() : "";
      const category = item?.category?.trim() || "未分類";

      return {
        name: item?.name?.trim() || "未命名作品",
        desc: item?.desc?.trim() || "這個作品尚未提供描述。",
        link,
        category,
        type: VIDEO_EXTENSION_PATTERN.test(link) ? "video" : "image",
      };
    })
    .filter(item => isValidLink(item.link));
}

async function fetchData() {
  if (cachedItems) {
    return cachedItems;
  }

  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("無法載入 data.json");
    }
    const rawItems = await res.json();
    cachedItems = normalizeItems(rawItems);
    return cachedItems;
  } catch (error) {
    console.error("載入 data.json 出錯:", error);
    throw error;
  }
}

function showStatus(message, { loading = false } = {}) {
  if (!message) {
    hideStatus();
    return;
  }

  statusEl.innerHTML = loading
    ? `<span class="spinner" aria-hidden="true"></span><span>${message}</span>`
    : `<span>${message}</span>`;
  statusEl.classList.add("is-visible");
}

function hideStatus() {
  statusEl.classList.remove("is-visible");
  statusEl.textContent = "";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function renderSkeletons(count = SKELETON_COUNT) {
  galleryEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const skeleton = document.createElement("article");
    skeleton.className = "card card--skeleton";
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.tabIndex = -1;
    skeleton.innerHTML = `
      <div class="card__media">
        <div class="skeleton skeleton--media" aria-hidden="true"></div>
      </div>
      <h2 class="card__title">
        <span class="skeleton skeleton--title" aria-hidden="true"></span>
      </h2>
      <p class="card__desc">
        <span class="skeleton skeleton--text" aria-hidden="true"></span>
        <span class="skeleton skeleton--text skeleton--text-short" aria-hidden="true"></span>
      </p>`;
    fragment.appendChild(skeleton);
  }

  galleryEl.appendChild(fragment);
  galleryEl.setAttribute("aria-busy", "true");
}

function buildCategoryNav(items) {
  const categories = Array.from(
    new Set(items.map(item => item.category).filter(Boolean))
  ).sort(collator.compare);

  const uncategorizedIndex = categories.indexOf("未分類");
  if (uncategorizedIndex > -1) {
    categories.splice(uncategorizedIndex, 1);
    categories.push("未分類");
  }

  navEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const allCategories = ["全部", ...categories];

  if (!allCategories.includes(state.currentCategory)) {
    state.currentCategory = "全部";
  }

  allCategories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", category === state.currentCategory);
    button.classList.toggle("is-active", category === state.currentCategory);
    button.addEventListener("click", () => {
      if (state.currentCategory === category) return;
      setCategory(category);
    });
    fragment.appendChild(button);
  });

  navEl.appendChild(fragment);
  navEl.hidden = allCategories.length <= 1;
}

function setCategory(category) {
  state.currentCategory = category;
  updateActiveCategory(category);
  renderGallery(category);
}

function updateActiveCategory(category) {
  navEl.querySelectorAll("button").forEach(button => {
    const isActive = button.dataset.category === category;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderGallery(category = state.currentCategory) {
  const isAll = category === "全部";
  const filteredItems = state.items.filter(item => isAll || item.category === category);

  galleryEl.innerHTML = "";
  galleryEl.setAttribute("aria-busy", "true");

  if (filteredItems.length === 0) {
    const emptyMessage = category === "全部"
      ? "目前沒有作品可以顯示。"
      : `${category} 分類暫無作品`;
    showStatus(emptyMessage, { loading: false });
    galleryEl.setAttribute("aria-busy", "false");
    galleryEl.dataset.count = "0";
    return;
  }

  hideStatus();
  hideError();

  const fragment = document.createDocumentFragment();
  filteredItems.forEach(item => {
    const card = createCard(item);
    fragment.appendChild(card);
  });

  galleryEl.appendChild(fragment);
  galleryEl.dataset.count = String(filteredItems.length);
  galleryEl.setAttribute("aria-busy", "false");
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.category = item.category;

  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "card__media";
  const mediaEl = createMediaElement(item);
  mediaWrapper.appendChild(mediaEl);

  const titleEl = document.createElement("h2");
  titleEl.className = "card__title";
  titleEl.textContent = item.name;
  titleEl.title = item.name;

  const descEl = document.createElement("p");
  descEl.className = "card__desc";
  descEl.textContent = item.desc;
  descEl.title = item.desc;

  card.append(mediaWrapper, titleEl, descEl);
  return card;
}

function createMediaElement(item) {
  if (item.type === "video") {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.innerHTML = `<source src="${item.link}" type="video/mp4">你的瀏覽器不支援影片播放`;
    return video;
  }

  const image = document.createElement("img");
  image.src = item.link;
  image.alt = item.name;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.alt = "圖片載入失敗";
    image.src = "https://via.placeholder.com/600x400?text=Image+Unavailable";
  });
  image.addEventListener("click", () => {
    if (!image.currentSrc && !image.src) return;
    openLightbox(image.currentSrc || image.src, item.name, item.desc);
  });

  return image;
}

function openLightbox(src, alt, caption) {
  lightboxImageEl.src = src;
  lightboxImageEl.alt = alt;
  lightboxCaptionEl.textContent = caption;
  lightboxEl.classList.add("is-open");
  lightboxEl.setAttribute("aria-hidden", "false");
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.classList.add("is-lightbox-open");
  document.addEventListener("keydown", onEscapeKey);
  lightboxCloseBtn.focus();
}

function closeLightbox() {
  lightboxEl.classList.remove("is-open");
  lightboxEl.setAttribute("aria-hidden", "true");
  lightboxImageEl.src = "";
  lightboxImageEl.alt = "";
  lightboxCaptionEl.textContent = "";
  document.body.classList.remove("is-lightbox-open");
  document.removeEventListener("keydown", onEscapeKey);
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

function onEscapeKey(event) {
  if (event.key === "Escape") {
    closeLightbox();
  }
}

lightboxEl.addEventListener("click", event => {
  if (event.target === lightboxEl) {
    closeLightbox();
  }
});

lightboxCloseBtn.addEventListener("click", closeLightbox);

async function init() {
  showStatus("載入中…", { loading: true });
  renderSkeletons();
  hideError();

  try {
    const items = await fetchData();
    state.items = items;

    if (items.length === 0) {
      showStatus("目前沒有作品可以顯示。", { loading: false });
      galleryEl.innerHTML = "";
      galleryEl.setAttribute("aria-busy", "false");
      return;
    }

    buildCategoryNav(items);
    renderGallery(state.currentCategory);
  } catch (error) {
    galleryEl.innerHTML = "";
    showError("載入作品時發生錯誤，請稍後再試。");
    showStatus("載入失敗", { loading: false });
  } finally {
    galleryEl.setAttribute("aria-busy", "false");
  }
}

init();
