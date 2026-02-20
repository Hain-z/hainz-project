
const generatorBtn = document.getElementById('generator-btn');
const numbersContainer = document.getElementById('numbers-container');

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
