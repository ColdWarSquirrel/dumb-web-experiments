"use strict";
/*  canvas initialisation stuff  */
const canvas = document.createElement('canvas');
document.body.append(canvas);
const ctx = canvas.getContext('2d');
/*  defaults / mins and maxes  */
class Input {
  element;
  listener;
  constructor(element, event, listener) {
    this.element = element;
    this.listener = listener;
    this.element.addEventListener(event, (e) => { listener(this.element, e); });
  }
}
const CANVAS_WIDTH = Math.min(window.innerWidth, 600);
const CANVAS_HEIGHT = 300;
const DEFAULT_FPS = 30;
const MAX_FPS = 120;
const MIN_FPS = 0.1;
const DEFAULT_ALGORITHM = "bubble";
const POSSIBLE_ALGORITHMS = ["bubble", "insert"];
const DEFAULT_BAR_COUNT = 100;
const MIN_BAR_COUNT = 3;
const MAX_BAR_COUNT = 750;
/* simulation stuff / misc */
const bars = [];
let fps = DEFAULT_FPS;
let lowToHigh = true;
let stickToBottom = true;
let pong = false;
let algorithm = DEFAULT_ALGORITHM;
let useSteps = false;
/*  general utility functions  */
const ping = () => {
  pong = true;
};
const clamp = (min, max, value) => Math.min(Math.max(min, value), max);
/*  bar functions  */
const swapBars = (one, two) => {
  [bars[one], bars[two]] = [bars[two], bars[one]];
};
const createBars = function (amount, maxHeight = canvas.height, shuffle = true) {
  currentIndex = 0;
  bars.splice(0, bars.length);
  for (let index = 0; index < amount; index++) {
    bars.push((index / amount) * maxHeight);
  }
  ;
  if (shuffle)
    reset();
};
const shuffleBars = function () {
  for (let index = 0; index < bars.length; index++) {
    swapBars(index, Math.round(Math.random() * bars.length));
  }
  ;
};
const drawBars = function (highlight) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let width = canvas.width / bars.length;
  let colour = "green";
  ctx.fillStyle = colour;
  for (let index = 0; index < bars.length; index++) {
    ctx.fillStyle = colour;
    let height = bars[index];
    let x = lowToHigh ? index * width : canvas.width - (index * width);
    let y = stickToBottom ? canvas.height : 0;
    let w = lowToHigh ? width : -width;
    let h = stickToBottom ? -height : height;
    ctx.fillRect(x, y, w, h);
  }
  ;
  if (highlight) {
    let x = lowToHigh ? highlight * width : canvas.width - (highlight * width);
    let y = stickToBottom ? canvas.height : 0;
    let w = lowToHigh ? width : -width;
    let h = stickToBottom ? -bars[highlight] : bars[highlight];
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
  }
  ;
};
const reset = () => {
  maxIndex = 1;
  currentIndex = 0;
  stepIndex = 0;
  shuffleBars();
  finished = false;
};
const switchAlgorithm = (algo) => {
  if (POSSIBLE_ALGORITHMS.includes(algo)) {
    algorithm = algo;
    reset();
    if (algo == "step")
      stepIndex = 1;
    return true;
  }
  ;
  return false;
};
class Sort {
}
const bubbleSort = function (index) {
  if (bars[index + 1] !== undefined && bars[index] > bars[index + 1]) {
    swapBars(index, index + 1);
    return 1;
  }
  ;
  return 0;
};
const insertSort = function (index) {
  if (bars[index - 1] !== undefined && bars[index] < bars[index - 1]) {
    swapBars(index, index - 1);
    return 1;
  }
  ;
  return 0;
};
/*  render stuff  */
let maxIndex = 1;
let lastTime = 0;
let frameCounter = 0;
let currentIndex = 0;
let stepIndex = 0;
let finished = false;
const loop = function (now) {
  frameCounter += (now - lastTime) / 1000;
  lastTime = now;
  if (pong) {
    console.log(`Pong!\nCurrent Index: ${currentIndex};\nframeCounter: ${frameCounter};`);
    pong = false;
  }
  ;
  if (frameCounter > 1 / fps) {
    if (!finished) {
      if (!useSteps) {
        let total = 0;
        let highlightIndex = bars.length;
        let totalAboveZero = false;
        if (algorithm == "bubble") {
          currentIndex = 0;
          for (let index = 0; index < bars.length; index++) {
            if (bars[currentIndex] == undefined) {
              bars.splice(currentIndex, 1);
            }
            ;
            total += bubbleSort(currentIndex);
            if (!totalAboveZero) {
              if (total > 0) {
                highlightIndex = index - 1;
                totalAboveZero = true;
              }
              ;
            }
            currentIndex += 1;
            if (currentIndex >= bars.length)
              currentIndex = 0;
          }
          ;
          if (total == 0) {
            finished = true;
          }
        }
        else if (algorithm == "insert") {
          currentIndex = 0;
          for (currentIndex = maxIndex; currentIndex >= 0; currentIndex--) {
            if (bars[currentIndex] == undefined) {
              bars.splice(currentIndex, 1);
            }
            ;
            total += insertSort(currentIndex);
          }
          ;
          highlightIndex = maxIndex;
          maxIndex += 1;
          if (maxIndex >= bars.length) {
            finished = true;
          }
        }
        ;
        drawBars(highlightIndex);
      }
      else {
        if (algorithm == "bubble") {
          if (bars[currentIndex] == undefined) {
            bars.splice(currentIndex, 1);
          }
          ;
          insertSort(currentIndex);
          drawBars(currentIndex);
          currentIndex += 1;
          if (currentIndex >= bars.length)
            currentIndex = 0;
        }
        else if (algorithm == "insert") {
          if (stepIndex <= 0) {
            maxIndex += 1;
            stepIndex = maxIndex;
          }
          ;
          if (bars[stepIndex] == undefined) {
            bars.splice(stepIndex, 1);
          }
          ;
          insertSort(stepIndex);
          drawBars(stepIndex);
          stepIndex -= 1;
          if (maxIndex >= bars.length) {
            maxIndex = 1;
            stepIndex = 1;
          }
        }
        ;
      }
    }
    frameCounter = 0;
  }
  ;
  requestAnimationFrame(loop);
};
/*  DOM interaction / DOM setup  */
const algorithmInput = new Input(document.querySelector('#algorithm'), 'change', (element) => {
  switchAlgorithm(element.options[element.selectedIndex].value);
});
const amountInput = new Input(document.querySelector('#amount_of_bars'), 'change', (element) => {
  createBars(isNaN(parseInt(element.value)) ?
    DEFAULT_BAR_COUNT :
    clamp(MIN_BAR_COUNT, MAX_BAR_COUNT, parseInt(element.value)));
});
const fpsInput = new Input(document.querySelector('#fps'), 'change', (element) => {
  fps = (isNaN(parseInt(element.value)) ?
    DEFAULT_FPS :
    clamp(MIN_FPS, MAX_FPS, parseFloat(element.value)));
});
const useStepsInput = new Input(document.querySelector('#useSteps'), 'change', (element) => {
  useSteps = element.checked;
});
window.onload = () => {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  amountInput.element.min = String(MIN_BAR_COUNT);
  amountInput.element.max = String(MAX_BAR_COUNT);
  amountInput.element.value = String(DEFAULT_BAR_COUNT);
  fpsInput.element.min = String(MIN_FPS);
  fpsInput.element.max = String(MAX_FPS);
  fpsInput.element.value = String(DEFAULT_FPS);
  let options = algorithmInput.element.options;
  for (let index = 0; index < options.length; index++) {
    if (options[index].value == DEFAULT_ALGORITHM) {
      algorithmInput.element.selectedIndex = index;
      break;
    }
    ;
  }
  ;
  useStepsInput.element.checked = useSteps;
  createBars(DEFAULT_BAR_COUNT);
  drawBars();
  requestAnimationFrame(loop);
};
canvas.onclick = e => reset();
//# sourceMappingURL=main.js.map