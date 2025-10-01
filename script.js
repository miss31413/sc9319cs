async function fetchData() {
  try {
    const res = await fetch("data.json"); // 直接抓 Repo 裡的 data.json
    if (!res.ok) throw new Error("無法載入 data.json");
    const items = await res.json();
    return items;
  } catch (error) {
    console.error("載入 data.json 出錯:", error);
    return [];
  }
}

async function renderGallery(category = "全部") {
  const items = await fetchData();
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  items.forEach(item => {
    if (category === "全部" || item.category === category) {
      const card = document.createElement("div");
      card.className = "card";

      let mediaElement;
      if (item.link.endsWith(".mp4")) {
        mediaElement = `
          <video controls width="320">
            <source src="${item.link}" type="video/mp4">
            你的瀏覽器不支援影片播放
          </video>`;
      } else {
        mediaElement = `<img src="${item.link}" alt="${item.name}" width="320">`;
      }

      card.innerHTML = `
        <h2>${item.name}</h2>
        <p>${item.desc}</p>
        ${mediaElement}
      `;
      gallery.appendChild(card);
    }
  });
}

function filterGallery(category) {
  renderGallery(category);
}

// 預設載入
renderGallery();
