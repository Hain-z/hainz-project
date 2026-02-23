const THEME_KEY = "theme";
const themeToggle = document.getElementById("theme-toggle");
const yearNode = document.getElementById("year");

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  if (themeToggle) themeToggle.textContent = isDark ? "라이트 모드" : "다크 모드";
};

const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

let currentTheme = getInitialTheme();
applyTheme(currentTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme(currentTheme);
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}
