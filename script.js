const devices = [
  {
    name: "Samsung Galaxy S21",
    codename: "o1s / beyond1",
    brand: "samsung",
    tags: ["twrp", "rom", "odin"],
    links: [
      { label: "TWRP", url: "#" },
      { label: "LineageOS", url: "#" },
      { label: "Odin Firmware", url: "#" }
    ]
  },
  {
    name: "Samsung Galaxy A52",
    codename: "a52q",
    brand: "samsung",
    tags: ["twrp", "rom", "odin"],
    links: [
      { label: "TWRP", url: "#" },
      { label: "Custom ROM", url: "#" },
      { label: "Stock Odin", url: "#" }
    ]
  },
  {
    name: "Samsung Galaxy S10",
    codename: "beyond1lte",
    brand: "samsung",
    tags: ["twrp", "rom", "odin"],
    links: [
      { label: "TWRP", url: "#" },
      { label: "ROM", url: "#" }
    ]
  },
  {
    name: "Google Pixel 6",
    codename: "oriole",
    brand: "other",
    tags: ["twrp", "rom"],
    links: [
      { label: "TWRP", url: "#" },
      { label: "GrapheneOS / Calyx", url: "#" }
    ]
  },
  {
    name: "Xiaomi Redmi Note 10",
    codename: "mojito",
    brand: "other",
    tags: ["twrp", "rom"],
    links: [
      { label: "TWRP", url: "#" },
      { label: "Custom ROM", url: "#" }
    ]
  },
  {
    name: "OnePlus 9",
    codename: "lemonade",
    brand: "other",
    tags: ["twrp", "rom"],
    links: [
      { label: "TWRP", url: "#" },
      { label: "OxygenOS / Custom", url: "#" }
    ]
  }
];

const grid = document.getElementById("devices");
const searchInput = document.getElementById("search");
const filterButtons = document.querySelectorAll(".filter");

function render(devicesToShow) {
  grid.innerHTML = devicesToShow.map(d => `
    <div class="card" data-brand="${d.brand}" data-tags="${d.tags.join(" ")}">
      <h3>${d.name}</h3>
      <div class="codename">${d.codename}</div>
      <div class="tags">
        ${d.tags.map(t => `<span class="tag">${t.toUpperCase()}</span>`).join("")}
      </div>
      <div class="links">
        ${d.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("")}
      </div>
    </div>
  `).join("");
}

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  const activeFilter = document.querySelector(".filter.active").dataset.filter;

  let filtered = devices.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(query) ||
      d.codename.toLowerCase().includes(query);

    const matchesFilter =
      activeFilter === "all" ||
      d.brand === activeFilter ||
      d.tags.includes(activeFilter);

    return matchesSearch && matchesFilter;
  });

  render(filtered);
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);
render(devices);

// ===== Upload Modal =====
const modal = document.getElementById("uploadModal");
const uploadBtn = document.getElementById("uploadBtn");
const closeBtn = document.querySelector(".close");
const copyBtn = document.getElementById("copyBtn");

uploadBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

copyBtn.onclick = () => {
  const device   = document.getElementById("req-device").value.trim();
  const codename = document.getElementById("req-codename").value.trim();
  const type     = document.getElementById("req-type").value;
  const links    = document.getElementById("req-links").value.trim();
  const version  = document.getElementById("req-version").value.trim();
  const hash     = document.getElementById("req-hash").value.trim();
  const notes    = document.getElementById("req-notes").value.trim();

  if (!device || !codename || !type || !links) {
    alert("Please fill the required fields marked with *");
    return;
  }

  const text = `**New Host Submission**

**Device:** ${device}
**Codename:** ${codename}
**Type:** ${type}
**Download Link(s):**
${links}

**Version:** ${version || "—"}
**Checksum:** ${hash || "—"}
**Notes:** ${notes || "—"}
`;

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy filled info", 2000);
  });
};

// IMPORTANT: replace YOUR_USERNAME with your real GitHub username
document.getElementById("issueLink").href = 
  "https://github.com/YOUR_USERNAME/android-host-file/issues/new?title=New%20Host%20Submission";