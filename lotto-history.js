const loadBtn = document.getElementById("load-history-btn");
const sortBtn = document.getElementById("sort-toggle-btn");
const statusNode = document.getElementById("history-status");
const bodyNode = document.getElementById("history-body");
const topNode = document.getElementById("top-numbers");
const searchInput = document.getElementById("draw-search");
const latestNode = document.getElementById("latest-draw");
const prevBtn = document.getElementById("page-prev-btn");
const nextBtn = document.getElementById("page-next-btn");
const pageIndicator = document.getElementById("page-indicator");

const DATA_URL = "https://smok95.github.io/lotto/results/all.json";
const CACHE_KEY = "lotto-history-cache-v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 10;

let allDraws = [];
let latestFirst = true;
let currentPage = 1;
let filteredDraws = [];

const setStatus = (text) => {
  if (statusNode) statusNode.textContent = text;
};

const fetchDataset = async () => {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
const normalizeDate = (value) => {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toISOString().slice(0, 10);
};

const normalizeDraw = (raw) => ({
  drawNo: Number(raw.draw_no),
  date: normalizeDate(raw.date),
  numbers: Array.isArray(raw.numbers) ? raw.numbers.map(Number).slice(0, 6) : [],
  bonus: Number(raw.bonus_no),
});

const renderTopNumbers = (draws) => {
  if (!topNode) return;
  const counts = Array(46).fill(0);
  for (const draw of draws) {
    for (const no of draw.numbers) counts[no] += 1;
  }

  const ranked = [];
  for (let no = 1; no <= 45; no += 1) ranked.push({ no, count: counts[no] });
  ranked.sort((a, b) => b.count - a.count || a.no - b.no);

  topNode.innerHTML = "";
  for (const item of ranked.slice(0, 10)) {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<strong>${item.no}번</strong><span>${item.count}회</span>`;
    topNode.appendChild(chip);
  }
};

const renderRows = (draws) => {
  if (!bodyNode) return;
  if (draws.length === 0) {
    bodyNode.innerHTML = "<tr><td colspan=\"4\">표시할 데이터가 없습니다.</td></tr>";
    return;
  }

  bodyNode.innerHTML = "";
  for (const draw of draws) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${draw.drawNo}</td>
      <td>${draw.date}</td>
      <td>${draw.numbers.join(", ")}</td>
      <td>${draw.bonus}</td>
    `;
    bodyNode.appendChild(row);
  }
};

const renderLatestDraw = () => {
  if (!latestNode) return;
  if (allDraws.length === 0) {
    latestNode.textContent = "데이터를 불러오면 최신 회차 정보가 표시됩니다.";
    return;
  }

  const latest = allDraws.reduce((acc, cur) => (cur.drawNo > acc.drawNo ? cur : acc), allDraws[0]);
  latestNode.innerHTML = `
    <p><strong>${latest.drawNo}회</strong> (${latest.date})</p>
    <p>당첨번호: ${latest.numbers.join(", ")} + 보너스 ${latest.bonus}</p>
  `;
};

const updatePaginationUi = (totalPages) => {
  if (pageIndicator) pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
};

const renderCurrentPage = () => {
  const totalPages = Math.max(1, Math.ceil(filteredDraws.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = filteredDraws.slice(start, start + PAGE_SIZE);
  renderRows(rows);
  updatePaginationUi(totalPages);
};

const applyFilterAndSort = ({ resetPage = false } = {}) => {
  const keyword = Number(searchInput?.value || 0);
  let data = [...allDraws];
  data.sort((a, b) => (latestFirst ? b.drawNo - a.drawNo : a.drawNo - b.drawNo));

  if (keyword > 0) data = data.filter((item) => item.drawNo === keyword);
  filteredDraws = data;
  if (resetPage) currentPage = 1;
  renderCurrentPage();
};

const saveCache = (draws) => {
  const payload = { updatedAt: Date.now(), draws };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.updatedAt || !Array.isArray(parsed.draws)) return null;
    if (Date.now() - parsed.updatedAt > ONE_DAY_MS) return null;
    return parsed.draws;
  } catch {
    return null;
  }
};

const loadAllDraws = async () => {
  if (!loadBtn) return;
  loadBtn.disabled = true;

  const cached = loadCache();
  if (cached && cached.length > 0) {
    allDraws = cached;
    renderLatestDraw();
    renderTopNumbers(allDraws);
    applyFilterAndSort({ resetPage: true });
    setStatus(`캐시 데이터 사용: 총 ${allDraws.length}개 회차`);
    loadBtn.disabled = false;
    return;
  }

  setStatus("전체 회차 데이터를 불러오는 중...");
  const raw = await fetchDataset();
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("유효한 회차 데이터가 없습니다.");
  }

  const unique = new Map();
  for (const item of raw) {
    const normalized = normalizeDraw(item);
    if (!normalized.drawNo || normalized.numbers.length !== 6) continue;
    unique.set(normalized.drawNo, normalized);
  }

  const result = Array.from(unique.values()).sort((a, b) => a.drawNo - b.drawNo);
  allDraws = result;
  saveCache(allDraws);
  renderLatestDraw();
  renderTopNumbers(allDraws);
  applyFilterAndSort({ resetPage: true });
  setStatus(`완료: 총 ${allDraws.length}개 회차 데이터`);
  loadBtn.disabled = false;
};

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    try {
      await loadAllDraws();
    } catch (error) {
      setStatus(`데이터 로드 실패: ${error.message}`);
      loadBtn.disabled = false;
    }
  });
}

if (sortBtn) {
  sortBtn.addEventListener("click", () => {
    latestFirst = !latestFirst;
    sortBtn.textContent = latestFirst ? "정렬: 최신순" : "정렬: 과거순";
    applyFilterAndSort({ resetPage: true });
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    applyFilterAndSort({ resetPage: true });
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    currentPage -= 1;
    renderCurrentPage();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    currentPage += 1;
    renderCurrentPage();
  });
}
