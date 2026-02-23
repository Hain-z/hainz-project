const generatorBtn = document.getElementById("generator-btn");
const numbersContainer = document.getElementById("numbers-container");

if (generatorBtn && numbersContainer) {
  generatorBtn.addEventListener("click", () => {
    numbersContainer.innerHTML = "";
    const lottoNumbers = new Set();

    while (lottoNumbers.size < 6) {
      lottoNumbers.add(Math.floor(Math.random() * 45) + 1);
    }

    const sortedNumbers = Array.from(lottoNumbers).sort((a, b) => a - b);
    for (const number of sortedNumbers) {
      const circle = document.createElement("div");
      circle.className = "number-circle";
      circle.textContent = String(number);
      numbersContainer.appendChild(circle);
    }
  });
}
