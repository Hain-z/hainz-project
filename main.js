const generatorBtn = document.getElementById('generator-btn');
const numbersContainer = document.getElementById('numbers-container');
const themeToggle = document.getElementById('theme-toggle');

const THEME_KEY = 'theme';

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
};

const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

let currentTheme = getInitialTheme();
applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, currentTheme);
  applyTheme(currentTheme);
});

generatorBtn.addEventListener('click', () => {
  numbersContainer.innerHTML = '';
  const lottoNumbers = new Set();
  while (lottoNumbers.size < 6) {
    lottoNumbers.add(Math.floor(Math.random() * 45) + 1);
  }
  
  const sortedNumbers = Array.from(lottoNumbers).sort((a, b) => a - b);

  for (const number of sortedNumbers) {
    const circle = document.createElement('div');
    circle.classList.add('number-circle');
    circle.textContent = number;
    numbersContainer.appendChild(circle);
  }
});
