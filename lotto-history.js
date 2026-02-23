const loadBtn = document.getElementById("load-history-btn");
const sortBtn = document.getElementById("sort-toggle-btn");
const statusNode = document.getElementById("history-status");
const bodyNode = document.getElementById("history-body");
const topNode = document.getElementById("top-numbers");
const searchInput = document.getElementById("draw-search");

const API_BASE = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";
const CACHE_KEY = "lotto-history-cache-v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let allDraws = [];
let latestFirst = true;

const setStatus = (text) => {
  if (statusNode) statusNode.textContent = text;
};

const getUrl = (drawNo) => `${API_BASE}${drawNo}`;

const fetchDrawByCors = async (drawNo) => {
  const response = await fetch(getUrl(drawNo));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const fetchDrawByJsonp = (drawNo) =>
  new Promise((resolve, reject) => {
    const callback = `lottoJsonpCb_${drawNo}_${Date.now()}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("JSONP timeout"));
    }, 8000);

    const cleanup = () => {
      clearTimeout(timer);
      delete window[callback];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    window[callback] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP load error"));
    };
    script.src = `${getUrl(drawNo)}&callback=${callback}`;
    document.body.appendChild(script);
  });

const fetchDraw = async (drawNo) => {
  try {
    return await fetchDrawByCors(drawNo);
  } catch {
    return fetchDrawByJsonp(drawNo);
  }
};

const isSuccess = (data) => data && data.returnValue === "success";

const findLatestDrawNo = async () => {
  let low = 1;
  let high = 1;

  while (high <= 4000) {
    const data = await fetchDraw(high);
    if (!isSuccess(data)) break;
    low = high;
    high *= 2;
  }

  let left = low;
  let right = high - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const data = await fetchDraw(mid);
    if (isSuccess(data)) {
      low = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return low;
};

const normalizeDraw = (raw) => ({
  drawNo: raw.drwNo,
  date: raw.drwNoDate,
  numbers: [raw.drwtNo1, raw.drwtNo2, raw.drwtNo3, raw.drwtNo4, raw.drwtNo5, raw.drwtNo6],
  bonus: raw.bnusNo,
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

const applyFilterAndSort = () => {
  const keyword = Number(searchInput?.value || 0);
  let data = [...allDraws];
  data.sort((a, b) => (latestFirst ? b.drawNo - a.drawNo : a.drawNo - b.drawNo));

  if (keyword > 0) data = data.filter((item) => item.drawNo === keyword);
  renderRows(data);
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
    renderTopNumbers(allDraws);
    applyFilterAndSort();
    setStatus(`캐시 데이터 사용: 총 ${allDraws.length}개 회차`);
    loadBtn.disabled = false;
    return;
  }

  setStatus("최신 회차를 확인하는 중...");
  const latest = await findLatestDrawNo();
  setStatus(`총 ${latest}개 회차 데이터 수집 중...`);

  const result = [];
  let nextNo = 1;
  const workerCount = 8;

  const worker = async () => {
    while (nextNo <= latest) {
      const current = nextNo;
      nextNo += 1;
      const data = await fetchDraw(current);
      if (isSuccess(data)) result.push(normalizeDraw(data));
      if (current % 40 === 0 || current === latest) {
        setStatus(`수집 진행: ${Math.min(current, latest)} / ${latest}`);
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, worker));

  result.sort((a, b) => a.drawNo - b.drawNo);
  allDraws = result;
  saveCache(result);
  renderTopNumbers(allDraws);
  applyFilterAndSort();
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
    applyFilterAndSort();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    applyFilterAndSort();
  });
}
