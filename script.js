let allData = [];

// ✅ 改成你的 Google Sheet JSON API
const SHEET_URL = "https://opensheet.elk.sh/1EZweNHWV3pBZ9po1CWiVKALbhFRHVCrA779PMOH_8bQ/作品";

fetch(SHEET_URL)
  .then(res => res.json())
  .then(data => {
    console.log("✅ 抓到的資料:", data); // Debug
    allData = data;
    renderGallery(allData);
  })
  .catch(err => console.error("❌ 讀取資料失敗:", err));

function renderGallery(items) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  if (!items || items.length === 0) {
    gallery.innerHTML = "<p>⚠ 沒有資料可以顯示</p>";
    return;
  }

  items.forEach(item => {
    console.log("📷 圖片網址:", item['圖片網址']); // Debug

    const card = document.createElement("div");
    card.className = `card ${item["分類"]}`;
    card.innerHTML = `
      <img src="${item['圖片網址']}" alt="${item['作品名稱']}" onclick="openLightbox(this)">
      <h2>${item['作品名稱']}</h2>
      <p>${item['作品描述']}</p>
    `;
    gallery.appendChild(card);
  });
}

function filterGallery(category) {
  if (category === "全部") {
    renderGallery(allData);
  } else {
    const filtered = allData.filter(item => item["分類"] === category);
    renderGallery(filtered);
  }
}

// Lightbox
function openLightbox(imgElement) {
  document.getElementById("lightbox-img").src = imgElement.src;
  document.getElementById("lightbox").style.display = "flex";
}
function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}
