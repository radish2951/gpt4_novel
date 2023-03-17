const textBox = document.getElementById("text-box");
const choices = document.getElementById("choices");
const gameContainer = document.querySelector(".game-container");
let skipAnimation = false;
let waitingForClick = false;

gameContainer.addEventListener("click", () => {
  if (waitingForClick) {
    waitingForClick = false;
  } else {
    skipAnimation = true;
  }
});

function scrollToBottom() {
  const textWindow = document.getElementById("text-window");
  textWindow.scrollTop = textWindow.scrollHeight;
}

async function animateText(element, text) {
  element.innerHTML = "";
  const lines = text.split("\n");

  for (const line of lines) {
    const lineElement = document.createElement("div");

    for (const char of line) {
      const charSpan = document.createElement("span");
      charSpan.className = "char";
      charSpan.textContent = char;
      charSpan.style.opacity = "0";
      lineElement.appendChild(charSpan);
    }

    element.appendChild(lineElement);

    let charIndex = 0;
    while (charIndex < lineElement.children.length) {
      lineElement.children[charIndex].style.opacity = "1";
      if (!skipAnimation) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (skipAnimation) {
        for (let i = charIndex + 1; i < lineElement.children.length; i++) {
          lineElement.children[i].style.opacity = "1";
        }
        skipAnimation = false;
        break;
      } else {
        charIndex++;
      }
    }

    if (lines.indexOf(line) < lines.length - 1) {
      if (line.trim() !== "") {
        scrollToBottom(); // 追加: スクロールを一番下に移動させる
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
    }
  }
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

let currentChoices = [];

async function loadGame(file) {
  const response = await fetch(file);
  const text = await response.text();
  const choiceList = parseChoices(text);
  const content = text.replace(/choice:.+/g, "").replace(/->\s*(.+)/g, "").replace(/::[^:]+::/g, "").trim();
  textBox.innerHTML = "";
  skipAnimation = false;
  await animateText(textBox, content);
  currentChoices = choiceList;
  showChoices(choiceList);
}

function handleChoice(index) {
  const targetScene = currentChoices[index].target;
  const targetSceneWithExtension = targetScene.endsWith(".txt") ? targetScene : targetScene + ".txt";
  
  // 選択肢をクリアする
  choices.innerHTML = "";

  loadGame(targetSceneWithExtension);
}


// 最初のシーンを読み込む
loadGame("scene1.txt");
