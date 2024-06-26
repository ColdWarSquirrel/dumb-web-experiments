"use strict";

const output = <HTMLElement>document.querySelector('pre#output')!;
const additionalinfo = <HTMLElement>document.querySelector('#additionalInfo')!;
const cDepth = <HTMLInputElement>document.querySelector('input[name="colourdepth"]');
const errorMsg = <HTMLElement>document.querySelector('#errorMsg')!;
const fileInput = <HTMLInputElement>document.querySelector('input[type="file"]')!;

const rInput = <HTMLInputElement>document.querySelector('#r')!;
const gInput = <HTMLInputElement>document.querySelector('#g')!;
const bInput = <HTMLInputElement>document.querySelector('#b')!;
interface colourdepthrestrictParams {
    image: HTMLImageElement;
    name: string;
}
class RestrictColourDepth {
    public image: HTMLImageElement;
    public resizedImage: HTMLImageElement;
    public width: number;
    public height: number;
    public name: string;
    public src: string;
    public range: number;
    public depth: {
        r: number,
        g: number,
        b: number
    };
    public pixelImage: { value: HTMLImageElement; width: number; height: number; };

    constructor(options: colourdepthrestrictParams) {
        this.image = options.image;
        this.resizedImage = new Image();
        this.width = this.image.width;
        this.height = this.image.height;
        this.name = options.name;
        this.src = this.image.src;
        let eightBitRange = 256;
        let eightBitDiv = Math.cbrt(eightBitRange);
        this.range = eightBitRange;
        this.depth = {
            r: eightBitDiv,
            g: eightBitDiv,
            b: eightBitDiv
        };
        this.pixelImage = {
            value: new Image(),
            width: 0,
            height: 0
        }
    }
    getPercentOf = function (val: number, min: number = 0, max: number = 255) {
        return 1 - ((max - val) / (max - min));
    }
    setColourRange(range: number) {
        this.range = range;
        let cubeRoot = Math.cbrt(range);
        this.depth = {
            r: cubeRoot,
            g: cubeRoot,
            b: cubeRoot
        }
        rInput.value = `${this.depth.r}`;
        gInput.value = `${this.depth.g}`;
        bInput.value = `${this.depth.b}`;
        cDepth.value = `${this.range}`;

        this.process();
    }
    setColourDepth(depth: {
        r: number,
        g: number,
        b: number
    }) {
        this.depth = depth;
        this.range = ((this.depth.r + this.depth.g + this.depth.b) / 3) ** 3;
        rInput.value = `${this.depth.r}`;
        gInput.value = `${this.depth.g}`;
        bInput.value = `${this.depth.b}`;
        cDepth.value = `${this.range}`;
        this.process();
    }
    async convert(image: HTMLImageElement) {
        const width = this.image.width;
        const height = this.image.height;
        const offcanv = new OffscreenCanvas(width, height);
        const offctx = offcanv.getContext('2d', { willReadFrequently: true })!;

        console.log(this.image.width, this.image.height);

        offctx.drawImage(this.image, 0, 0, width, height);
        const imgdata = offctx.getImageData(0, 0, width, height);

        const getInPos = (y: number) => {
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

                let r_percent = this.getPercentOf(r, 0, 255);
                let g_percent = this.getPercentOf(g, 0, 255);
                let b_percent = this.getPercentOf(b, 0, 255);
                let a_percent = this.getPercentOf(a, 0, 255);

                const range = Math.cbrt(this.range);
                const divamt = Math.floor(255 / range);
                imgdata.data[pos.r] = Math.floor(r_percent * this.depth.r) * divamt;
                imgdata.data[pos.g] = Math.floor(g_percent * this.depth.g) * divamt;
                imgdata.data[pos.b] = Math.floor(b_percent * this.depth.b) * divamt;
                imgdata.data[pos.a] = a;
            }
        }
        console.log('converted image to pixelImage');
        let output = await this.imgDataToImage(imgdata, width, height);
        const vomit = {
            value: output,
            width: width,
            height: height
        }
        return vomit;
    }
    async process() {
        console.clear();
        console.log('initialised');
        additionalinfo.innerText = "processing";
        this.pixelImage = await this.convert(this.resizedImage);
        document.querySelector('img')!.src = this.pixelImage.value.src;
        additionalinfo.innerText = `${this.pixelImage.value.width}x${this.pixelImage.value.height}`;
        console.log(this.pixelImage);
    }
    imgDataToImage = async function (imgdata: ImageData, width: number, height: number) {
        const cnv = document.createElement('canvas');
        const c = cnv.getContext('2d')!;
        cnv.width = width;
        cnv.height = height;
        document.body.append(cnv);
        c.putImageData(imgdata, 0, 0);
        var returnImage = new Image();
        returnImage.src = cnv.toDataURL("image/png");
        document.body.removeChild(cnv);
        console.log('converted image data to image');
        return returnImage;
    }
    async handlePaste(event: ClipboardEvent) {
        var items = event.clipboardData?.items;
        if (!items) return;
        for (let index in items) {
            var item = items[index];
            if (item.kind === "file" && item.type.match("^image/")) {
                var blob = item.getAsFile();
                var reader = new FileReader();
                reader.onload = (e) => {
                    pixelImage.image = new Image();
                    pixelImage.image.onload = () => {
                        pixelImage.width = pixelImage.image.width;
                        pixelImage.height = pixelImage.image.height;
                        pixelImage.src = "pasted image";
                        errorMsg.style.display = 'none';
                        this.process();
                        return true;
                    }
                    pixelImage.image.src = <string>reader.result;
                }
                reader.readAsDataURL(<Blob>blob);
            } else {
                errorMsg.style.display = 'block';
                console.error(`isnt a supported image file!\nsize: ${item.getAsFile()?.size ?? "[unknown]"} bytes`);
                return false;
            }
        }
    }
    async handleFile(input: HTMLInputElement) {
        if (input.files && input.files[0]) {
            console.log(input.files[0]);
            if (input.files[0].type == "image/png" || input.files[0].type == "image/jpg" || input.files[0].type == "image/jpeg" || input.files[0].type == "image/webp" || input.files[0].type == "image/gif") {
                var reader = new FileReader();
                let filename = input.files[0].name;
                let type = input.files[0].type;
                reader.onload = (e) => {
                    pixelImage.image = new Image();
                    pixelImage.image.onload = () => {
                        pixelImage.width = pixelImage.image.width;
                        pixelImage.height = pixelImage.image.height;
                        pixelImage.name = filename;
                        pixelImage.src = <string>reader.result;
                        errorMsg.style.display = 'none';
                        this.process();
                        return true;
                    }
                    pixelImage.image.src = <string>reader.result;
                }
                reader.readAsDataURL(input.files[0]);
            } else {
                errorMsg.style.display = 'block';
                console.error(`isnt a supported image file!\nsize: ${input.files[0].size} bytes`);
                return false;
            }
        }
    }
}
const clamp = function (min: number, max: number, value: number) {
    return Math.max(Math.min(value, Math.max(min, max)), Math.min(min, max));
}
const handleRGBAInputs = function () {
    pixelImage.setColourDepth({
        r: Math.max(parseInt(rInput.value), 1),
        g: Math.max(parseInt(gInput.value), 1),
        b: Math.max(parseInt(bInput.value), 1)
    });
}
const pixelImage = new RestrictColourDepth({
    image: new Image(),
    name: "main"
})
fileInput.addEventListener('change', async () => {
    await pixelImage.handleFile(fileInput);
    pixelImage.process();
})
document.onpaste = function (e) {
    pixelImage.handlePaste(e);
};
cDepth.addEventListener('change', () => {
    pixelImage.setColourRange(Math.max(parseInt(cDepth.value), 1));
})
rInput.addEventListener('change', handleRGBAInputs);
gInput.addEventListener('change', handleRGBAInputs);
bInput.addEventListener('change', handleRGBAInputs);
document.querySelector('#reset')!.addEventListener('click', function () {
    pixelImage.setColourRange(256);
})
pixelImage.image.onload = async () => {
    pixelImage.process();
}
pixelImage.image.src = 'curiositycore.png';
