const form = document.getElementById("jobForm");
const list = document.getElementById("list");
const statsBox = document.getElementById("stats");
const searchBox = document.getElementById("search");
const filterBox = document.getElementById("filter");
const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];

// Data is saved in the browser (localStorage), so it stays after refresh
let jobs = JSON.parse(localStorage.getItem("careerpilot_jobs") || "[]");

function save() {
  localStorage.setItem("careerpilot_jobs", JSON.stringify(jobs));
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function renderStats() {
  let html = `<div class="stat s-Total"><b data-n="${jobs.length}">0</b><span>Total</span></div>`;
  STATUSES.forEach(s => {
    const count = jobs.filter(j => j.status === s).length;
    html += `<div class="stat s-${s}"><b data-n="${count}">0</b><span>${s}</span></div>`;
  });
  statsBox.innerHTML = html;
  // count-up animation for the numbers
  statsBox.querySelectorAll("b").forEach(el => {
    const target = +el.dataset.n;
    let n = 0;
    const timer = setInterval(() => {
      el.textContent = n;
      if (n >= target) clearInterval(timer);
      n++;
    }, 60);
  });
}

function renderList() {
  const q = searchBox.value.toLowerCase();
  const f = filterBox.value;
  const shown = jobs.filter(j =>
    (!f || j.status === f) &&
    (j.company + " " + j.role).toLowerCase().includes(q)
  );

  if (shown.length === 0) {
    list.innerHTML = `<p class="empty">No applications yet. Add your first one above.</p>`;
    return;
  }

  list.innerHTML = shown.map(j => {
    const overdue = j.followUp && j.followUp <= today() && j.status === "Applied";
    return `
      <div class="job ${j.status}">
        <h3>${escapeHtml(j.company)} <small>- ${escapeHtml(j.role)}</small><span class="badge ${j.status}">${j.status}</span></h3>
        <p>Applied on: ${j.appliedDate}
          ${j.followUp ? ` | Follow-up: <span class="${overdue ? "due" : ""}">${j.followUp}${overdue ? " (due!)" : ""}</span>` : ""}</p>
        ${j.link ? `<a href="${escapeHtml(j.link)}" target="_blank" rel="noopener">Open job link</a>` : ""}
        ${j.notes ? `<p>${escapeHtml(j.notes)}</p>` : ""}
        <div class="actions">
          <select onchange="changeStatus(${j.id}, this.value)">
            ${STATUSES.map(s => `<option ${s === j.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <button class="del" onclick="removeJob(${j.id})">Delete</button>
        </div>
      </div>`;
  }).join("");
}

function render() {
  renderStats();
  renderList();
}

form.addEventListener("submit", e => {
  e.preventDefault();
  jobs.unshift({
    id: Date.now(),
    company: document.getElementById("company").value.trim(),
    role: document.getElementById("role").value.trim(),
    link: document.getElementById("link").value.trim(),
    appliedDate: document.getElementById("appliedDate").value,
    followUp: document.getElementById("followUp").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim()
  });
  save();
  form.reset();
  document.getElementById("appliedDate").value = today();
  render();
});

function changeStatus(id, status) {
  jobs.find(j => j.id === id).status = status;
  save();
  render();
}

function removeJob(id) {
  if (confirm("Delete this application?")) {
    jobs = jobs.filter(j => j.id !== id);
    save();
    render();
  }
}

searchBox.addEventListener("input", renderList);
filterBox.addEventListener("change", renderList);
document.getElementById("appliedDate").value = today();
render();
