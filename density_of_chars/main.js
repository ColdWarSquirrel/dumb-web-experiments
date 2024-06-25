"use strict";
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const charsInput = document.querySelector('input[name=characters]');
const output = document.querySelector('#output');
const seperatorRegex = /, */g;
const size = 20;
canvas.width = size;
canvas.height = size;
const getCharsFromString = function (c) {
    ctx.save();
    ctx.font = "16px monospaced";
    ctx.fillStyle = "black";
    let chars = [...new Set(c.split(seperatorRegex))];
    const getInPos = (y) => {
        return y * size * 4;
    };
    const area = size ** 2;
    let totals = [];
    let allValues = [];
    chars.forEach((char) => {
        char = char[0];
        let metrics = ctx.measureText(char);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "black";
        ctx.beginPath();
        // @ts-ignore
        ctx.fillText(char, (size / 2) - (metrics.width / 2), (size / 2) + ((metrics.hangingBaseline + 1) / 2));
        ctx.stroke();
        const imgdata = ctx.getImageData(0, 0, size, size);
        let total = 0;
        for (let y = 0; y < size; y++) {
            let inpos = getInPos(y);
            for (let x = 0; x < size; x++) {
                let pos = {
                    r: inpos++,
                    g: inpos++,
                    b: inpos++,
                    a: inpos++
                };
                let r = imgdata.data[pos.r];
                let g = imgdata.data[pos.g];
                let b = imgdata.data[pos.b];
                let a = imgdata.data[pos.a];
                total += (0.3 * r) + (0.59 * g) + (0.11 * b);
            }
        }
        total /= area;
        totals.push({
            density: 255 - total,
            character: char
        });
        allValues.push(255 - total);
    });
    ctx.restore();
    totals.sort((a, b) => { return b.density - a.density; });
    allValues.sort();
    return {
        t: totals,
        v: allValues,
        c: totals.map(({ character }) => (character))
    };
};
let totals;
charsInput.addEventListener('change', () => {
    totals = getCharsFromString(charsInput.value);
    output.innerText = JSON.stringify(totals.t, null, 2);
});
