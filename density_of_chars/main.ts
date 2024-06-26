"use strict";
const canvas = <HTMLCanvasElement>document.querySelector('canvas')!;
const ctx = <CanvasRenderingContext2D>canvas.getContext('2d', { willReadFrequently: true });
const charsInput = <HTMLInputElement>document.querySelector('input[name=characters]')!;
const output = <HTMLElement>document.querySelector('#output')!;
const seperatorRegex = /, */g;

const size = 20;

canvas.width = size;
canvas.height = size;

interface totalObjectInterface {
    density: number,
    character: string
}
interface totalsInterface {
    t: totalObjectInterface[];
    v: number[];
    c: string[];
}

const getCharsFromString = function (c: string) {
    ctx.save();
    ctx.font = "16px monospaced";
    ctx.fillStyle = "black";
    let chars = [...new Set(c.split(seperatorRegex))];
    const getInPos = (y: number) => {
        return y * size * 4;
    }
    const area = size ** 2;
    let totals: totalObjectInterface[] = [];
    let allValues: number[] = [];

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
                }
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
    totals.sort((a: totalObjectInterface, b: totalObjectInterface) => { return b.density - a.density });
    allValues.sort();
    return {
        t: totals,
        v: allValues,
        c: totals.map(({ character }) => (character))
    };
}
let totals: totalsInterface;
charsInput.addEventListener('change', () => {
    totals = getCharsFromString(charsInput.value);
    output.innerText = JSON.stringify(totals.t, null, 2);
})

//let totals = getCharsFromString("a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,1,2,3,4,5,6,7,8,9,!,@,#,$,%,^,&,*,(,),[,],{,},\\,|,;,:,',\",.,/,?~,`");