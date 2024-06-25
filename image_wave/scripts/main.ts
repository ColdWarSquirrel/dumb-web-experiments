"use strict";
const fileInput = <HTMLInputElement>document.querySelector('#loadfile')!;
const pauseButton = <HTMLInputElement>document.querySelector('#pause')!;
const amplitudeInput = <HTMLInputElement>document.querySelector('#amplitude')!;
const speedInput = <HTMLInputElement>document.querySelector('#speed')!;
const frequencyInput = <HTMLInputElement>document.querySelector('#frequency')!;
const slicewidthInput = <HTMLInputElement>document.querySelector('#slicewidth')!;
const canvas = document.createElement('canvas');
document.body.append(canvas);
const ctx = canvas.getContext('2d', {willReadFrequently:true})!;

let totalWidth = 0, totalHeight = 0;
let slices:Array<ImageData> = [];
let useImage = new Image();

const resize = async function (img: HTMLImageElement, new_width: unknown) {
    const ratio = img.height / img.width;
    new_width = isNaN(<number>new_width)
        ? parseInt(<string>new_width)
        : <number>new_width;
    const new_height = (<number>new_width * ratio) | 0;
    const cnv = document.createElement("canvas")!;
    document.body.append(cnv);
    const c = cnv.getContext("2d")!;
    cnv.width = <number>new_width;
    cnv.height = new_height;
    c.drawImage(img, 0, 0, <number>new_width, new_height);
    var returnImage = new Image();
    returnImage.src = cnv.toDataURL("image/png");
    document.body.removeChild(cnv);
    return returnImage;
};

const createSlices = async function(
    img :        HTMLImageElement = useImage, 
    sliceWidth : number           = 1, 
    draw :       boolean          = true
) : Promise<ImageData> {
    const tempCanvas = new OffscreenCanvas(img.width, img.height);
    const tempCtx = tempCanvas.getContext('2d', {willReadFrequently:true})!;
    if(sliceWidth > img.width){
        tempCtx.drawImage(img, 0, 0);
        return tempCtx.getImageData(0,0, img.width,img.height);
    }
    let width = Math.floor(img.width/sliceWidth) * sliceWidth;
    let height = setAdjustedHeight();
    let sliceAmount = Math.floor(width/sliceWidth);
    let sliceHeight = img.height;

    tempCanvas.width = width;

    tempCtx.drawImage(img, 0, 0, width, sliceHeight);
    const imgdata = tempCtx.getImageData(0,0, width,sliceHeight);

    slices = new Array();

    for(let x = 0; x < sliceAmount; x++){
        slices.push(tempCtx.getImageData(x*sliceWidth, 0, sliceWidth, sliceHeight));
    }

    tempCtx.clearRect(0,0,width,height);
    tempCtx.putImageData(slices[0], 0, 0);

    canvas.width = width;
    canvas.height = height;
    if (draw) drawSlicesNormal();
    return imgdata;
}
const drawSlicesNormal = function(context:CanvasRenderingContext2D=ctx){
    const tempCanvas = new OffscreenCanvas(slices[0].width, slices[0].height);
    let w = tempCanvas.width;
    let h = tempCanvas.height;
    const tempCtx = tempCanvas.getContext('2d', {willReadFrequently:true})!;
    context.canvas.width = w*slices.length;
    slices.forEach((slice, index)=>{
        tempCtx.clearRect(0,0,w,h);
        tempCtx.putImageData(slice, 0, 0);
        context.drawImage(tempCanvas, index*w,0, w,h);
    });
}
const clamp = function(value:number, min:number, max:number){
    return Math.max(Math.min(value, max), min);
}

let running = true;
let lastTime = 0;
let delta = 0;
let angle = 0;
let amplitude = 20;
let speed = 25;
let frequency = 0.05;
const setAdjustedHeight = function(img:HTMLImageElement=useImage){
    canvas.height = useImage.height + (amplitude*2);
    return canvas.height;
}
const loop = function(now : number){
    delta = (now-lastTime)/1000;
    lastTime = now;
    if(running){
        const tempCanvas = new OffscreenCanvas(slices[0].width, slices[0].height);
        let w = tempCanvas.width;
        let h = canvas.height;
        let imgw = useImage.width;
        let imgh = useImage.height;
        const tempCtx = tempCanvas.getContext('2d', {willReadFrequently:true})!;
        ctx.clearRect(0,0,w*slices.length,h);

        slices.forEach((slice, index)=>{
            tempCtx.clearRect(0,0,w,h);
            tempCtx.putImageData(slice, 0, 0);
            let s = Math.sin(angle+index*frequency);
            let y = (amplitude+(s*amplitude));
            ctx.drawImage(tempCanvas, index*w,y, w,imgh);
        });
        angle += speed * delta;
    }
    requestAnimationFrame(loop);
}
pauseButton.addEventListener('click', function(){
    running = !running;
})
speedInput.addEventListener('change', function(){
    speed = clamp(parseFloat(speedInput.value), 1, 100);
})
amplitudeInput.addEventListener('change', function(){
    amplitude = clamp(parseFloat(amplitudeInput.value), 0, 100);
    setAdjustedHeight();
})
frequencyInput.addEventListener('change', function(){
    console.log(parseFloat(frequencyInput.value))
    frequency = clamp(parseFloat(frequencyInput.value), 0, 1);
})
slicewidthInput.addEventListener('change', function(){
    createSlices(useImage, clamp(parseFloat(slicewidthInput.value), 1, 50));
})

const handlePaste = async function(event: ClipboardEvent) {
    var items = event.clipboardData?.items;
    if (!items) return;
    var item = items[0];
    if (item.kind === "file" && item.type.match("^image/")) {
        var blob = item.getAsFile();
        var reader = new FileReader();
        reader.onload = (e) => {
            let tempimage = new Image();
            tempimage.onload = async () => {
                //errorMsg.style.display = 'none';
                if(tempimage.width > 500){
                    useImage = await resize(tempimage, 500);
                    await createSlices();
                    return true;
                }else{
                    useImage = tempimage;
                    await createSlices();
                    return true;
                }
            }
            tempimage.src = <string>reader.result;
        }
        reader.readAsDataURL(<Blob>blob);
    } else {
        //errorMsg.style.display = 'block';
        console.error(`isnt a supported image file!\n${item}`);
        return false;
    }
}
const handleFile = function() {
    const input = fileInput;
    if (input.files && input.files[0]) {
        console.log(input.files[0]);
        if (input.files[0].type == "image/png" || input.files[0].type == "image/jpg" || input.files[0].type == "image/jpeg" || input.files[0].type == "image/webp" || input.files[0].type == "image/gif") {
            var reader = new FileReader();
            let filename = input.files[0].name;
            let type = input.files[0].type;
            reader.onload = (e) => {
                let tempimage = new Image();
                tempimage.onload = async () => {
                    if(tempimage.width > 500){
                        useImage = await resize(tempimage, 500);
                    }else{
                        useImage = tempimage;
                    }
                    await createSlices();
                    return true;
                }
                tempimage.src = <string>reader.result;
            }
            reader.readAsDataURL(input.files[0]);
        } else {
            //errorMsg.style.display = 'block';
            console.error(`isnt a supported image file!\nsize: ${input.files[0].size} bytes`);
            return false;
        }
    }
}

document.addEventListener("paste", handlePaste);
fileInput.addEventListener("change", handleFile);

const sampleImage = new Image();
sampleImage.onload = function(){
    useImage = sampleImage;
    totalWidth = sampleImage.width;
    totalHeight = setAdjustedHeight();
    createSlices(sampleImage).then(()=>{
        requestAnimationFrame(loop);
    });
};
sampleImage.src = "/image_wave/curiositycore.png";