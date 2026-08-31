const SUPABASE_URL = "https://ikiiamibzznlvxokogpq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlraWlhbWlienpubHZ4b2tvZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTE5OTksImV4cCI6MjEwMzc2Nzk5OX0.XnlTaP71R0r3iKu9cvjp52HHUacX_s982JN_vgv_4F4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allDevices = [];

const grid = document.getElementById("devices");
const searchInput = document.getElementById("search");
const filterButtons = document.querySelectorAll(".filter");

async function loadDevices() {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#f87171">Error loading data</p>`;
    return;
  }

  allDevices = data || [];
  applyFilters();
}

function render(devicesToShow) {
  if (devicesToShow.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#9ca3af">No devices yet. Be the first to upload!</p>`;
    return;
  }

  grid.innerHTML = devicesToShow.map(d => {
    const tags = Array.isArray(d.tags) ? d.tags : (d.tags ? [d.tags] : []);
    const links = Array.isArray(d.links) ? d.links : (d.links ? [d.links] : []);

    return `
      <div class="card">
        <h3>${d.name}</h3>
        <div class="codename">${d.codename || ""}</div>
        <div class="tags">
          ${tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <div class="links">
          ${links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label || "Download"}</a>`).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  const activeFilter = document.querySelector(".filter.active").dataset.filter;

  const filtered = allDevices.filter(d => {
    const matchesSearch =
      (d.name || "").toLowerCase().includes(query) ||
      (d.codename || "").toLowerCase().includes(query);

    const tags = Array.isArray(d.tags) ? d.tags : [];
    const matchesFilter =
      activeFilter === "all" ||
      d.brand === activeFilter ||
      tags.includes(activeFilter);

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

// Modal
const modal = document.getElementById("uploadModal");
const uploadBtn = document.getElementById("uploadBtn");
const closeBtn = document.querySelector(".close");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");

uploadBtn.onclick = () => {
  modal.style.display = "block";
  statusEl.textContent = "";
};
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

submitBtn.onclick = async () => {
  const name     = document.getElementById("req-device").value.trim();
  const codename = document.getElementById("req-codename").value.trim();
  const brand    = document.getElementById("req-brand").value;
  const type     = document.getElementById("req-type").value;
  const link     = document.getElementById("req-link").value.trim();
  const label    = document.getElementById("req-label").value.trim() || "Download";
  const version  = document.getElementById("req-version").value.trim();
  const hash     = document.getElementById("req-hash").value.trim();
  const notes    = document.getElementById("req-notes").value.trim();

  if (!name || !codename || !link) {
    statusEl.textContent = "Please fill Device Name, Codename and Download Link";
    statusEl.style.color = "#f87171";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  statusEl.textContent = "";

  const { error } = await supabase.from("devices").insert({
    name,
    codename,
    brand,
    tags: [type],
    links: [{ label, url: link }],
    version: version || null,
    hash: hash || null,
    notes: notes || null
  });

  if (error) {
    console.error(error);
    statusEl.textContent = "Error: " + error.message;
    statusEl.style.color = "#f87171";
    submitBtn.disabled = false;
    submitBtn.textContent = "Save to Site";
    return;
  }

  statusEl.textContent = "Saved successfully! Refreshing...";
  statusEl.style.color = "#34d399";

  // Clear form
  document.getElementById("req-device").value = "";
  document.getElementById("req-codename").value = "";
  document.getElementById("req-link").value = "";
  document.getElementById("req-version").value = "";
  document.getElementById("req-hash").value = "";
  document.getElementById("req-notes").value = "";

  await loadDevices();
  setTimeout(() => {
    modal.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.textContent = "Save to Site";
  }, 1200);
};

// Start
loadDevices();
