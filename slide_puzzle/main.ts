"use strict";
const canvas = <HTMLCanvasElement>document.querySelector('canvas#main');
const ctx = canvas!.getContext('2d')!;
class Tile {
    public image: HTMLImageElement;
    public imgdata: ImageData;
    public name: string;
    public width: number;
    public height: number;
    public blank: boolean = false;
    public index: number;
    constructor(n: string, i: ImageData, index: number) {
        this.image = new Image();
        this.name = n;
        this.index = index;
        this.imgdata = i;
        this.width = i.width;
        this.height = i.height;
    }
}
class Table {
    public tiles: Array<Array<Tile>>;
    public width: number;
    public height: number;
    public tileWidth: number = 0;
    public tileHeight: number = 0;
    public image: HTMLImageElement;
    private unshuffledArray: Array<Array<Tile>>;
    constructor(w: number, h: number) {
        this.image = new Image();
        this.width = w;
        this.height = h;
        this.tiles = new Array(h);
        for (let i = 0; i < h; i++) {
            this.tiles[i] = new Array(w);
        }
        this.unshuffledArray = this.tiles;
    }
    setImage(i: HTMLImageElement) {
        this.image = i;
        let w = this.width;
        let h = this.height;
        console.log(w, h)
        let pieces = this.splitImageToPieces(i, w, h);
        this.tiles = []
        for (let y = 0; y < h; y++) {
            let to_push = [];
            for (let x = 0; x < w; x++) {
                //let t = new Tile(`Tile${((y*w)+x)}`, pieces[(x*w)+y], (x*w)+y);
                let t = new Tile(`Tile${((y * w) + x)}`, pieces[(x * w) + y], (x * w) + y);
                to_push.push(t);
            }
            this.tiles[y] = to_push;
        }
        this.unshuffledArray = this.tiles.map(function (arr) {
            return arr.slice();
        });
        let randX = Math.floor(w * Math.random());
        let randY = Math.floor(h * Math.random());
        this.tiles[randY][randX].blank = true;
        this.tileWidth = this.tiles[0][0].width;
        this.tileHeight = this.tiles[0][0].height;
        this.render();
    }
    swapTiles(t1: { x: number, y: number }, t2: { x: number, y: number }) {
        let tile1 = this.tiles[t1.y][t1.x];
        let tile2 = this.tiles[t2.y][t2.x];
        this.tiles[t1.y][t1.x] = tile2;
        this.tiles[t2.y][t2.x] = tile1;
        return;
    }
    unshuffleTiles() {
        this.tiles = this.unshuffledArray;
        this.render();
    }
    shuffleTiles() {
        let y = this.tiles.length - 1;
        while (y != 0) {
            let x = this.tiles[y].length - 1;
            while (x != 0) {
                let rand = {
                    x: Math.floor(Math.random() * x),
                    y: Math.floor(Math.random() * y)
                };
                let curr = {
                    x: x,
                    y: y
                }
                x--;
                this.swapTiles(curr, rand);
            }
            y--;
        }
        this.render();
    }
    splitImageToPieces(img: HTMLImageElement, w: number, h: number) {
        const snipWidth = Math.floor(img.width / w);
        const snipHeight = Math.floor(img.height / h);
        const offcanv = new OffscreenCanvas(snipWidth, snipHeight);
        const offctx = offcanv.getContext('2d', { willReadFrequently: true })!;
        let newSnippets = [];
        for (let y = 0; y < w; y++) {
            for (let x = 0; x < h; x++) {
                offctx.clearRect(0, 0, snipWidth, snipHeight);
                offctx.drawImage(img, 0, 0, img.width, img.height, 0 - (y * snipWidth), 0 - (x * snipHeight), img.width, img.height);
                let data = offctx.getImageData(0, 0, snipWidth, snipHeight);
                newSnippets.push(data);
            }
        }
        return newSnippets;
    }
    canTileMove(x: number, y: number) {
        let aboveCoords = {
            x: x,
            y: y - 1 < 0 ? 0 : y - 1
        };
        let belowCoords = {
            x: x,
            y: y + 1 >= this.height ? this.height - 1 : y + 1
        };
        let leftCoords = {
            x: x - 1 < 0 ? 0 : x - 1,
            y: y
        };
        let rightCoords = {
            x: x + 1 >= this.width ? this.width - 1 : x + 1,
            y: y
        };
        if (this.tiles[aboveCoords.y][aboveCoords.x]) {
            if (this.tiles[aboveCoords.y][aboveCoords.x].blank) { return aboveCoords; };
        }
        if (this.tiles[belowCoords.y][belowCoords.x]) {
            if (this.tiles[belowCoords.y][belowCoords.x].blank) { return belowCoords; };
        }
        if (this.tiles[leftCoords.y][leftCoords.x]) {
            if (this.tiles[leftCoords.y][leftCoords.x].blank) { return leftCoords; };
        }
        if (this.tiles[rightCoords.y][rightCoords.x]) {
            if (this.tiles[rightCoords.y][rightCoords.x].blank) { return rightCoords; };
        }
        return false;
    }
    resize(s: number) {
        this.width = s ?? this.width;
        this.height = s ?? this.height;
        this.setImage(this.image);
    }
    render() {
        const snipWidth = Math.floor(this.image.width / this.width);
        const snipHeight = Math.floor(this.image.height / this.height);
        canvas.width = snipWidth * this.width;
        canvas.height = snipHeight * this.height;
        ctx.save();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let curtile = this.tiles[y][x];
                if (!curtile) continue;
                if (curtile.blank) continue;
                ctx.putImageData(curtile.imgdata, this.tileWidth * x, this.tileHeight * y);
            }
        }
    }
}

const handlePaste = function (event: ClipboardEvent) {
    var items = event.clipboardData?.items;
    if (!items) return;
    var item = items[0];
    if (item.kind === "file" && item.type.match("^image/")) {
        var blob = item.getAsFile();
        var reader = new FileReader();
        reader.onload = (e) => {
            let tempimage = new Image();
            tempimage.onload = () => {
                //errorMsg.style.display = 'none';
                slide_puzzle.setImage(tempimage);
                slide_puzzle.shuffleTiles();
                return true;
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
const handleFile = function () {
    const input = <HTMLInputElement>document.querySelector('input#fileinput');
    if (input.files && input.files[0]) {
        console.log(input.files[0]);
        if (input.files[0].type == "image/png" || input.files[0].type == "image/jpg" || input.files[0].type == "image/jpeg" || input.files[0].type == "image/webp" || input.files[0].type == "image/gif") {
            var reader = new FileReader();
            let filename = input.files[0].name;
            let type = input.files[0].type;
            reader.onload = (e) => {
                let tempimage = new Image();
                tempimage.onload = () => {
                    //errorMsg.style.display = 'none';
                    slide_puzzle.setImage(tempimage);
                    slide_puzzle.shuffleTiles();
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

const size = 5;
const puzzleWidth = size;
const puzzleHeight = size;

let sampleImagePieces = [];
let slide_puzzle = new Table(puzzleWidth, puzzleHeight);

const sampleImage = new Image();
sampleImage.onload = function () {
    slide_puzzle.setImage(sampleImage);
    slide_puzzle.shuffleTiles();
}
canvas.addEventListener("click", function (e) {
    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;
    const tileX = Math.floor(x / slide_puzzle.tileWidth);
    const tileY = Math.floor(y / slide_puzzle.tileHeight);
    let canmove = slide_puzzle.canTileMove(tileX, tileY); // returns x+y coords for blank space if it exists, otherwise false
    if (canmove) {
        slide_puzzle.swapTiles({ x: tileX, y: tileY }, canmove);
        slide_puzzle.render();
    }
})
sampleImage.src = "./cat.png";