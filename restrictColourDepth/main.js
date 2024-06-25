"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const output = document.querySelector('pre#output');
const additionalinfo = document.querySelector('#additionalInfo');
const cDepth = document.querySelector('input[name="colourdepth"]');
const errorMsg = document.querySelector('#errorMsg');
const fileInput = document.querySelector('input[type="file"]');
const rInput = document.querySelector('#r');
const gInput = document.querySelector('#g');
const bInput = document.querySelector('#b');
class RestrictColourDepth {
    constructor(options) {
        this.getPercentOf = function (val, min = 0, max = 255) {
            return 1 - ((max - val) / (max - min));
        };
        this.imgDataToImage = function (imgdata, width, height) {
            return __awaiter(this, void 0, void 0, function* () {
                const cnv = document.createElement('canvas');
                const c = cnv.getContext('2d');
                cnv.width = width;
                cnv.height = height;
                document.body.append(cnv);
                c.putImageData(imgdata, 0, 0);
                var returnImage = new Image();
                returnImage.src = cnv.toDataURL("image/png");
                document.body.removeChild(cnv);
                console.log('converted image data to image');
                return returnImage;
            });
        };
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
        };
    }
    setColourRange(range) {
        this.range = range;
        let cubeRoot = Math.cbrt(range);
        this.depth = {
            r: cubeRoot,
            g: cubeRoot,
            b: cubeRoot
        };
        rInput.value = `${this.depth.r}`;
        gInput.value = `${this.depth.g}`;
        bInput.value = `${this.depth.b}`;
        cDepth.value = `${this.range}`;
        this.process();
    }
    setColourDepth(depth) {
        this.depth = depth;
        this.range = ((this.depth.r + this.depth.g + this.depth.b) / 3) ** 3;
        rInput.value = `${this.depth.r}`;
        gInput.value = `${this.depth.g}`;
        bInput.value = `${this.depth.b}`;
        cDepth.value = `${this.range}`;
        this.process();
    }
    convert(image) {
        return __awaiter(this, void 0, void 0, function* () {
            const width = this.image.width;
            const height = this.image.height;
            const offcanv = new OffscreenCanvas(width, height);
            const offctx = offcanv.getContext('2d', { willReadFrequently: true });
            console.log(this.image.width, this.image.height);
            offctx.drawImage(this.image, 0, 0, width, height);
            const imgdata = offctx.getImageData(0, 0, width, height);
            const getInPos = (y) => {
                return y * width * 4;
            };
            for (let y = 0; y < height; y++) {
                let inpos = getInPos(y);
                for (let x = 0; x < width; x++) {
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
            let output = yield this.imgDataToImage(imgdata, width, height);
            const vomit = {
                value: output,
                width: width,
                height: height
            };
            return vomit;
        });
    }
    process() {
        return __awaiter(this, void 0, void 0, function* () {
            console.clear();
            console.log('initialised');
            additionalinfo.innerText = "processing";
            this.pixelImage = yield this.convert(this.resizedImage);
            document.querySelector('img').src = this.pixelImage.value.src;
            additionalinfo.innerText = `${this.pixelImage.value.width}x${this.pixelImage.value.height}`;
            console.log(this.pixelImage);
        });
    }
    handlePaste(event) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            var items = (_a = event.clipboardData) === null || _a === void 0 ? void 0 : _a.items;
            if (!items)
                return;
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
                        };
                        pixelImage.image.src = reader.result;
                    };
                    reader.readAsDataURL(blob);
                }
                else {
                    errorMsg.style.display = 'block';
                    console.error(`isnt a supported image file!\nsize: ${(_c = (_b = item.getAsFile()) === null || _b === void 0 ? void 0 : _b.size) !== null && _c !== void 0 ? _c : "[unknown]"} bytes`);
                    return false;
                }
            }
        });
    }
    handleFile(input) {
        return __awaiter(this, void 0, void 0, function* () {
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
                            pixelImage.src = reader.result;
                            errorMsg.style.display = 'none';
                            this.process();
                            return true;
                        };
                        pixelImage.image.src = reader.result;
                    };
                    reader.readAsDataURL(input.files[0]);
                }
                else {
                    errorMsg.style.display = 'block';
                    console.error(`isnt a supported image file!\nsize: ${input.files[0].size} bytes`);
                    return false;
                }
            }
        });
    }
}
const clamp = function (min, max, value) {
    return Math.max(Math.min(value, Math.max(min, max)), Math.min(min, max));
};
const handleRGBAInputs = function () {
    pixelImage.setColourDepth({
        r: Math.max(parseInt(rInput.value), 1),
        g: Math.max(parseInt(gInput.value), 1),
        b: Math.max(parseInt(bInput.value), 1)
    });
};
const pixelImage = new RestrictColourDepth({
    image: new Image(),
    name: "main"
});
fileInput.addEventListener('change', () => __awaiter(void 0, void 0, void 0, function* () {
    yield pixelImage.handleFile(fileInput);
    pixelImage.process();
}));
document.onpaste = function (e) {
    pixelImage.handlePaste(e);
};
cDepth.addEventListener('change', () => {
    pixelImage.setColourRange(Math.max(parseInt(cDepth.value), 1));
});
rInput.addEventListener('change', handleRGBAInputs);
gInput.addEventListener('change', handleRGBAInputs);
bInput.addEventListener('change', handleRGBAInputs);
document.querySelector('#reset').addEventListener('click', function () {
    pixelImage.setColourRange(256);
});
pixelImage.image.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    pixelImage.process();
});
pixelImage.image.src = 'curiositycore.png';
