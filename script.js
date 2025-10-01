const galleryEl = document.getElementById("gallery");
const navEl = document.getElementById("category-nav");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const lightboxEl = document.getElementById("lightbox");
const lightboxImageEl = document.getElementById("lightbox-image");
const lightboxCaptionEl = document.getElementById("lightbox-caption");
const lightboxCloseBtn = document.querySelector(".lightbox__close");

const state = {
  items: [],
  currentCategory: "全部"
};

let cachedItems = null;

async function fetchData() {
  if (cachedItems) {
    return cachedItems;
  }

  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("無法載入 data.json");
    }
    const items = await res.json();
    cachedItems = Array.isArray(items) ? items : [];
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

function buildCategoryNav(items) {
  const categories = new Set(
    items
      .map(item => item.category?.trim())
      .filter(Boolean)
  );

  navEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const allCategories = ["全部", ...categories];

  allCategories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.classList.toggle("is-active", category === state.currentCategory);
    button.addEventListener("click", () => {
      if (state.currentCategory === category) return;
      state.currentCategory = category;
      updateActiveCategory(category);
      renderGallery(category);
    });
    fragment.appendChild(button);
  });

  navEl.appendChild(fragment);
}

function updateActiveCategory(category) {
  navEl.querySelectorAll("button").forEach(button => {
    button.classList.toggle("is-active", button.textContent === category);
  });
}

function renderGallery(category = state.currentCategory) {
  const items = state.items;
  const isAll = category === "全部";
  const filteredItems = items.filter(item => isAll || item.category === category);

  galleryEl.innerHTML = "";
  galleryEl.setAttribute("aria-busy", "true");

  if (filteredItems.length === 0) {
    showStatus("此分類暫無作品", { loading: false });
    galleryEl.setAttribute("aria-busy", "false");
    return;
  }

  hideStatus();

  const fragment = document.createDocumentFragment();
  filteredItems.forEach(item => {
    const card = createCard(item);
    fragment.appendChild(card);
  });

  galleryEl.appendChild(fragment);
  galleryEl.setAttribute("aria-busy", "false");
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";

  const name = item.name?.trim() || "未命名作品";
  const desc = item.desc?.trim() || "這個作品尚未提供描述。";

  const titleEl = document.createElement("h2");
  titleEl.textContent = name;

  const descEl = document.createElement("p");
  descEl.textContent = desc;

  let mediaEl;
  if (typeof item.link === "string" && item.link.endsWith(".mp4")) {
    mediaEl = document.createElement("video");
    mediaEl.controls = true;
    mediaEl.preload = "metadata";
    mediaEl.innerHTML = `<source src="${item.link}" type="video/mp4">你的瀏覽器不支援影片播放`;
  } else {
    mediaEl = document.createElement("img");
    mediaEl.src = item.link || "";
    mediaEl.alt = name;
    mediaEl.loading = "lazy";
    mediaEl.decoding = "async";
    mediaEl.addEventListener("error", () => {
      mediaEl.alt = "圖片載入失敗";
      mediaEl.src = "https://via.placeholder.com/600x400?text=Image+Unavailable";
    });
    mediaEl.addEventListener("click", () => {
      if (!mediaEl.src) return;
      openLightbox(mediaEl.src, name, desc);
    });
  }

  card.append(titleEl, descEl, mediaEl);
  return card;
}

function openLightbox(src, alt, caption) {
  lightboxImageEl.src = src;
  lightboxImageEl.alt = alt;
  lightboxCaptionEl.textContent = caption;
  lightboxEl.classList.add("is-open");
  lightboxEl.setAttribute("aria-hidden", "false");
  document.addEventListener("keydown", onEscapeKey);
}

function closeLightbox() {
  lightboxEl.classList.remove("is-open");
  lightboxEl.setAttribute("aria-hidden", "true");
  lightboxImageEl.src = "";
  lightboxImageEl.alt = "";
  lightboxCaptionEl.textContent = "";
  document.removeEventListener("keydown", onEscapeKey);
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
  galleryEl.setAttribute("aria-busy", "true");
  hideError();

  try {
    const items = await fetchData();
    state.items = items;

    if (items.length === 0) {
      showStatus("目前沒有作品可以顯示。", { loading: false });
      galleryEl.setAttribute("aria-busy", "false");
      return;
    }

    buildCategoryNav(items);
    renderGallery(state.currentCategory);
  } catch (error) {
    showError("載入作品時發生錯誤，請稍後再試。");
    showStatus("載入失敗", { loading: false });
  } finally {
    galleryEl.setAttribute("aria-busy", "false");
  }
}

init();
