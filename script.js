const SHEET_URL = "https://opensheet.elk.sh/1EZweNHWV3pBZ9po1CWiVKALbhFRHVCrA779PMOH_8bQ/工作表1";
const GAS_URL = "https://script.google.com/macros/s/AKfycbzo3Waa4Xd39BNO2zIFIq5INi1Z_f9nsgbobJLJwb6HTEO5Xaiu7HLyEmHqHiAUGimbbg/exec";

// 從分享連結抽 File ID
function extractFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

fetch(SHEET_URL)
  .then(res => res.json())
  .then(data => {
    renderGallery(data);
  })
  .catch(err => {
    console.error("讀取 Google Sheet JSON 失敗：", err);
  });

function renderGallery(items) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  items.forEach(item => {
    const fileId = extractFileId(item["圖片網址"]);
    let imgUrl = "";
    if (fileId) {
      imgUrl = `${GAS_URL}?id=${fileId}`;
    }
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${imgUrl}" alt="${item["作品名稱"]}">
      <h2>${item["作品名稱"]}</h2>
      <p>${item["作品描述"]}</p>
    `;
    gallery.appendChild(card);
  });
}
