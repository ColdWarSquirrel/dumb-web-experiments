"use strict";
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const fpsDOM = document.querySelector('#fps');
const fpsDisplayDOM = document.querySelector('#fpsDisplay');
const radiusDOM = document.querySelector('#radius');
const radiusDisplayDOM = document.querySelector('#radiusDisplay');
const sinWaveRadiusDOM = document.querySelector('#sinWaveRadius');
const modeSelectDOM = document.querySelector('#mode');
const foregroundColourDOM = document.querySelector('#foregroundColour');
const foregroundColourDisplayDOM = document.querySelector('#foregroundColourDisplay');
const backgroundColourDOM = document.querySelector('#backgroundColour');
const backgroundColourDisplayDOM = document.querySelector('#backgroundColourDisplay');
document.body.append(canvas);
const size = 300;
canvas.width = size;
canvas.height = size;
// if anyone's snooping around the code, feel free to edit these values in the console and see what they look like :3
// the above comment is made redundant due to adding HTML elements that control said things
let angle = 0;
let rad = 0;
let spinRadius = 0.5, gradientRadius = 0.5, speed = 360;
let red = 255, green = 255, blue = 255;
let background = "black";
let state = "circle";
let fps = 25;
let lastTime = 0, delta = 0, counter = 0;
let X = 0.5, Y = 0.5, mouseX = 0.5, mouseY = 0.5;
let moveMouse = true;
let maxCheckThreshhold = 1;
let immersion = false;
const clamp = (value, min, max) => Math.max(Math.min(value, max), min);
const angleToRadians = (angle) => angle * Math.PI / 180;
const createGravityPointGradient = (centreX = 0.5, centreY = 0.5, gradrad = gradientRadius, red = 0, green = 0, blue = 0, background = "white", width = canvas.width, height = canvas.height) => {
    const offcanv = new OffscreenCanvas(width, height);
    const offctx = offcanv.getContext('2d', { willReadFrequently: true });
    const imgdata = offctx.getImageData(0, 0, width, height);
    const centreMassX = width * centreX;
    const centreMassY = width * centreY;
    const radius = ((width + height) / 2) * gradrad;
    let getCoords = (i) => {
        let index = i / 4;
        return {
            x: (index % height) | 0, // gets the remainder from being divided by the height
            y: (index / height) | 0
        };
    };
    const max = Math.max;
    const min = Math.min;
    // I dont even know if this helps, it's just so that the interpreter doesnt have to look as far back to find these
    // math operations during runtime, which I'm assuming improves performance somewhat
    for (let index = 0; index <= imgdata.data.length; index += 4) {
        let coords = getCoords(index);
        let dist = Math.sqrt(((max(coords.x, centreMassX) - min(coords.x, centreMassX)) ** 2) + ((max(coords.y, centreMassY) - min(coords.y, centreMassY)) ** 2));
        // I just barely love you, trigonometry
        let rand = Math.random() * radius;
        let addPixel = radius - dist > rand ? true : false;
        imgdata.data[index] = addPixel ? red : 255;
        imgdata.data[index + 1] = addPixel ? green : 255;
        imgdata.data[index + 2] = addPixel ? blue : 255;
        imgdata.data[index + 3] = addPixel ? 255 : 0;
    }
    offctx.putImageData(imgdata, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (background == "none") {
        ctx.clearRect(0, 0, width, height);
    }
    else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(offcanv, 0, 0);
};
const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
const updateBackgroundColour = function () {
    background = backgroundColourDOM.value;
    backgroundColourDisplayDOM.innerText = background;
    let bgColour = (hexToRgb(background)) ?? {
        r: 0,
        g: 0,
        b: 0
    };
    if (immersion) {
        document.body.style.backgroundColor = background;
        document.body.style.color = `rgb(${(255 - bgColour.r)}, ${(255 - bgColour.g)}, ${(255 - bgColour.b)})`;
    }
};
const updateForegroundColour = function () {
    let fgColour = (hexToRgb(foregroundColourDOM.value)) ?? {
        r: 255,
        g: 255,
        b: 255
    };
    red = fgColour.r;
    green = fgColour.g;
    blue = fgColour.b;
    foregroundColourDisplayDOM.innerText = foregroundColourDOM.value;
};
(() => {
    let sinWaveRadiusAngle = 0;
    let sinWaveRadiusRadian = 0;
    sinWaveRadiusDOM.addEventListener('input', function () {
        sinWaveRadiusAngle = sinWaveRadiusDOM.checked ? 0 : sinWaveRadiusAngle;
    });
    let max = 60;
    const loop = (now) => {
        delta = (now - lastTime) / 1000;
        lastTime = now;
        max = Math.round(1 / delta);
        let currentMax = parseInt(fpsDOM.max);
        if (max < currentMax - maxCheckThreshhold || max > currentMax + maxCheckThreshhold) {
            fpsDOM.max = `${max}`;
            fpsDOM.value = `${fps}`;
        }
        counter += delta;
        if (counter >= 1 / fps) {
            counter = 0;
            rad = angleToRadians(angle);
            let radiusToUse;
            if (sinWaveRadiusDOM.checked) {
                sinWaveRadiusRadian = angleToRadians(sinWaveRadiusAngle);
                radiusToUse = (((Math.sin(sinWaveRadiusRadian) / 2) + 0.35) / 2) + 0.1;
                // I'm sorry
            }
            else {
                radiusToUse = gradientRadius;
            }
            if (state == "circle") {
                let x = (0.5 + ((Math.sin(rad) * spinRadius) / 2));
                let y = (0.5 + ((Math.cos(rad) * spinRadius) / 2));
                createGravityPointGradient(x, y, radiusToUse, red, green, blue, background);
            }
            else if (state == "mouse") {
                createGravityPointGradient(mouseX, mouseY, radiusToUse, red, green, blue, background);
            }
            else {
                createGravityPointGradient(X, Y, radiusToUse, red, green, blue, background);
            }
            angle += speed * (1 / fps);
            sinWaveRadiusAngle += (speed * 0.5) * (1 / fps);
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
})();
document.addEventListener('mousemove', function (e) {
    if (!moveMouse)
        return;
    mouseX = (e.clientX - canvas.offsetLeft) / canvas.width;
    mouseY = (e.clientY - canvas.offsetTop) / canvas.height;
});
canvas.addEventListener('mousedown', function (e) {
    moveMouse = !moveMouse;
});
canvas.addEventListener('mouseup', function (e) {
    if (!moveMouse)
        return;
    mouseX = (e.clientX - canvas.offsetLeft) / canvas.width;
    mouseY = (e.clientY - canvas.offsetTop) / canvas.height;
});
fpsDOM.addEventListener('input', (e) => {
    fps = clamp(isNaN(parseFloat(fpsDOM.value)) ? 2 : parseFloat(fpsDOM.value), 0.01, 120);
    fpsDisplayDOM.innerText = `${fps}`;
});
fpsDisplayDOM.innerText = `${fps | 0}`;
fpsDOM.value = `${fps | 0}`;
radiusDOM.addEventListener('input', (e) => {
    gradientRadius = clamp(isNaN(parseFloat(radiusDOM.value)) ? 0.5 : parseFloat(radiusDOM.value), 0.01, 1);
    radiusDisplayDOM.innerText = `${gradientRadius}`;
});
radiusDisplayDOM.innerText = `${gradientRadius}`;
radiusDOM.value = `${gradientRadius}`;
modeSelectDOM.addEventListener('input', (e) => state = modeSelectDOM.options[modeSelectDOM.selectedIndex].value);
foregroundColourDOM.addEventListener('input', updateForegroundColour);
foregroundColourDOM.value = `#ffffff`;
updateForegroundColour();
backgroundColourDOM.addEventListener('input', updateBackgroundColour);
backgroundColourDOM.value = `#000000`;
updateBackgroundColour();
//# sourceMappingURL=main.js.map