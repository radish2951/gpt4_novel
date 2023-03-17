const textBox = document.getElementById("text-box");
const choices = document.getElementById("choices");
const gameContainer = document.querySelector(".game-container");
let skipAnimation = false;
let waitingForClick = false;
let currentChoices = [];

gameContainer.addEventListener("click", () => {
  if (waitingForClick) {
    waitingForClick = false;
  } else {
    skipAnimation = true;
  }
});

async function animateText(element, text) {
  element.innerHTML = "";
  const lines = text.split("\n");

  for (const line of lines) {
    const lineElement = createLineElement(line);

    element.appendChild(lineElement);
    await revealLine(lineElement);

    if (skipAnimation) {
      showRemainingLines(lines, line);
      break;
    }

    if (lines.indexOf(line) < lines.length - 1) {
      await waitForClick();
    }
  }
}

function createLineElement(line) {
  const lineElement = document.createElement("div");

  for (const char of line) {
    const charSpan = document.createElement("span");
    charSpan.className = "char";
    charSpan.textContent = char;
    charSpan.style.opacity = "0";
    lineElement.appendChild(charSpan);
  }

  return lineElement;
}

async function revealLine(lineElement) {
  for (const charSpan of lineElement.children) {
    charSpan.style.opacity = "1";
    if (!skipAnimation) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    } else {
      break;
    }
  }
}

function showRemainingLines(lines, currentLine) {
  textBox.innerHTML = "";
  for (const remainingLine of lines.slice(lines.indexOf(currentLine))) {
    const remainingLineElement = document.createElement("div");
    remainingLineElement.textContent = remainingLine;
    textBox.appendChild(remainingLineElement);
  }
  skipAnimation = false;
}

async function waitForClick() {
  waitingForClick = true;
  await new Promise((resolve) => {
    const clickHandler = () => {
      waitingForClick = false;
      gameContainer.removeEventListener("click", clickHandler);
      resolve();
    };
    gameContainer.addEventListener("click", clickHandler);
  });
}

function parseChoices(text) {
  const regex = /choice:\s*(.+)\s*->\s*(.+)/g;
  let match;
  const choices = [];

  while ((match = regex.exec(text)) !== null) {
    choices.push({ text: match[1].trim(), target: match[2].trim() });
  }

  return choices;
}

function showChoices(choiceList) {
  choices.innerHTML = "";
  choiceList.forEach((choice, index) => {
    const button = document.createElement("button");
    button.textContent = choice.text;
    button.className = "choice";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handleChoice(index);
    });
    choices.appendChild(button);
  });
}

async function loadGame(file) {
  const response = await fetch(file);
  const text = await response.text();
  currentChoices = parseChoices(text);
  const content = text.replace(/choice:.+/g, "").replace(/->\s*(.+)/g, "").replace(/::[^:]+::/g, "").trim();
  textBox.innerHTML = "";
  skipAnimation = false;
  await animateText(textBox, content);
  showChoices(currentChoices);
}

function handleChoice(index) {
  const chosen = currentChoices[index];
  if (chosen.target) {
    choices.innerHTML = "";
    loadGame(chosen.target + ".txt");
  }
}

// 最初のシーンを読み込む
loadGame("scene1.txt");
