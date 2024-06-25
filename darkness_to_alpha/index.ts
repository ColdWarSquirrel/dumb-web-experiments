"use strict";
const fileInputDOM = <HTMLInputElement>document.querySelector('input[type=file]')!;
const invertDOM = <HTMLInputElement>document.querySelector('input[name=invert]')!;
const greyscaleDOM = <HTMLInputElement>document.querySelector('input[name=greyscale]')!;
const errorMsg = <HTMLElement>document.querySelector('#errorMsg')!;
const mainCanvas = document.querySelector('canvas')!;
const sample_img = new Image();
sample_img.onload = async ()=>{
    to_use.image = sample_img;
    await init();
}
sample_img.src = "/darkness_to_alpha/seal.jpg";
interface to_use_interface{
    image:HTMLImageElement,
    width:number,
    height:number,
    base64:string | ArrayBuffer,
    src:string,
    type:string
}
const to_use:to_use_interface = {
    image:new Image(),
    width:0,
    height:0,
    base64:"",
    src:"",
    type:""
}
const init = async function(){
    to_use.width = to_use.image.width;
    to_use.height = to_use.image.height;
    await darkness_to_alpha(to_use.image, mainCanvas, invertDOM.checked, greyscaleDOM.checked);
}
invertDOM.onchange = init;
greyscaleDOM.onchange = init;
const darkness_to_alpha = async function(img:HTMLImageElement, output:HTMLCanvasElement, invert:boolean, greyscale:boolean){
    const width = img.width;
    const height = img.height;
    const offcanv = output;
    offcanv.width = width;
    offcanv.height = height;
    const offctx = offcanv.getContext('2d', {willReadFrequently:true})!;

    offctx.drawImage(img, 0, 0, width, height);
    const imgdata = offctx.getImageData(0, 0, width, height);

    const getInPos = (y:number) => {
        return y * width * 4;
    }

    for (let y = 0; y < height; y++) {
        let inpos = getInPos(y);
        for (let x = 0; x < width; x++) {
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

            let av = (0.3 * r) + (0.59 * g) + (0.11 * b);
            if(greyscale){
                imgdata.data[pos.r] = av;
                imgdata.data[pos.g] = av;
                imgdata.data[pos.b] = av;
            }else{
                imgdata.data[pos.r] = r;
                imgdata.data[pos.g] = g;
                imgdata.data[pos.b] = b;
            }
            if(imgdata.data[pos.a] != 0){
                if(invert){
                    imgdata.data[pos.a] = 255-av;
                }else{
                    imgdata.data[pos.a] = av;
                }
            }
        }
        offctx.putImageData(imgdata,0,0);
    }
    console.log('converted darkness to alpha');
    return {
        value: imgdata.data,
        width: width,
        height: height
    };
}

const readURL = async function (input:HTMLInputElement) {
    if (input.files && input.files[0]) {
        console.log(input.files[0]);
        if (input.files[0].type == "image/png" || input.files[0].type == "image/jpg" || input.files[0].type == "image/jpeg" || input.files[0].type == "image/webp" || input.files[0].type == "image/gif") {
            var reader = new FileReader();
            let filename = input.files[0].name;
            let type = input.files[0].type;
            reader.onload = (e) => {
                to_use.image = new Image();
                to_use.image.onload = () => {
                    to_use.width = to_use.image.width;
                    to_use.height = to_use.image.height;
                    to_use.base64 = reader.result!;
                    to_use.src = filename;
                    to_use.type = input.files![0].type;
                    errorMsg.style.display = 'none';
                    init();
                    return true;
                }
                to_use.image.src = <string>reader.result;
            }
            reader.readAsDataURL(input.files[0]);
        } else {
            errorMsg.style.display = 'block';
            console.error(`isnt a supported image file!\nsize: ${input.files[0].size} bytes`);
            return false;
        }
    }
}
document.onpaste = async function (event) {
    var items = event.clipboardData!.items;
    for (let index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            var reader = new FileReader();
            reader.onload = (e) => {
                to_use.image = new Image();
                to_use.image.onload = () => {
                    to_use.width = to_use.image.width;
                    to_use.height = to_use.image.height;
                    to_use.base64 = reader.result!;
                    to_use.src = "pasted image";
                    to_use.type = "img";
                    errorMsg.style.display = 'none';
                    init();
                    return true;
                }
                to_use.image.src = <string>reader.result;
            }
            reader.readAsDataURL(blob!);
        }
    }
}