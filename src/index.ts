import './style/reset.scss';
class Container {
}
class Chip {
  private imageData: ImageData;
  private drag: boolean = false;
  private xIndex: number;
  private yIndex: number;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private path: Path2D;
  private zIndex: number = 0;
  constructor(data: number[], width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(new Uint8ClampedArray(data), width, height);
  }
  getCenter() {
    return {
      x: this.width / 2,
      y: this.height / 2,
    }
  }
  setZIndex(z: number) {
    this.zIndex = z;
  }
  getZIndex() {
    return this.zIndex;
  }
  setDrag(drag: boolean) {
    this.drag = drag;
  }
  getDrag() {
    return this.drag;
  }
  setCoordsIndex(x: number, y: number) {
    this.xIndex = x;
    this.yIndex = y;
  }
  setCoords(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  getPath() {
    return this.path;
  }
  render(ctx: CanvasRenderingContext2D) {
    const x = this.x;
    const y = this.y;
    const path = new Path2D();
    path.moveTo(x, y);
    path.lineTo(x + this.width, y);
    path.lineTo(x + this.width, y + this.height);
    path.lineTo(x, y + this.height);
    path.closePath();
    this.path = path;
    ctx.putImageData(this.imageData, x, y)
  }
}

class Game {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private img: HTMLImageElement;
  private CHIP_NUM: number;
  private chips: Chip[] = [];
  private x: number = 0;
  private y: number = 0;
  constructor(img: HTMLImageElement, chipNum: number) {
    const width = document.body.offsetWidth;
    const height = document.body.offsetHeight;
    this.canvas = document.querySelector('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.CHIP_NUM = chipNum;
    this.img = img;
    this.canvas.addEventListener('mousedown', (event: MouseEvent) => this.handleMousedown(event))
    this.canvas.addEventListener('mouseup', (event: MouseEvent) => this.handleMouseup(event))
    this.canvas.addEventListener('mousemove', (event: MouseEvent) => this.handleDrag(event))
    this.init(img);
  }
  handleMouseup(event: MouseEvent) {
    const select = this.chips.find(item => {
      return this.ctx.isPointInPath(item.getPath(), event.clientX, event.clientY);
    })
    if (!select) {
      return;
    }
    select.setZIndex(0);
    select.setDrag(false);
  }
  handleMousedown(event: MouseEvent) {
    const select = this.chips.find(item => {
      return this.ctx.isPointInPath(item.getPath(), event.clientX, event.clientY);
    })
    if (!select) {
      return;
    }
    select.setZIndex(1);
    select.setDrag(true);
  }
  handleDrag(event: MouseEvent) {
    const select = this.chips.find(item => item.getDrag());
    if (select) {
      select.setCoords(event.clientX - select.getCenter().x, event.clientY - select.getCenter().y);
      this.renderChip(false);
    }
  }
  drawGrid() {
    this.ctx.fillStyle = 'blue';
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.lineTo(this.x + this.img.width + this.CHIP_NUM * 10 + 10, this.y);
    this.ctx.lineTo(this.x + this.img.width + this.CHIP_NUM * 10 + 10, this.y + this.img.height + this.CHIP_NUM * 10 + 10);
    this.ctx.lineTo(this.x, this.y + this.img.height + this.CHIP_NUM * 10 + 10);
    this.ctx.lineTo(this.x, this.y)
    this.ctx.closePath();
    this.ctx.stroke();
  }
  init(img: HTMLImageElement) {
    this.ctx.drawImage(img, 0, 0);
    this.x = 300;
    this.y = 100;
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    const xOffset = Math.floor(img.width / this.CHIP_NUM);
    const yOffset = Math.floor(img.height / this.CHIP_NUM)
    for (let index = 0; index < this.CHIP_NUM * this.CHIP_NUM; ++index) {
      const chipData = this.sliceImage(imageData.data, index, xOffset, yOffset);
      this.chips.push(new Chip(chipData, xOffset, yOffset));
    }
  }
  sliceImage(image: Uint8ClampedArray, index: number, xOffset: number, yOffset: number) {
    let rowIndex = 0;
    let colIndex = 0;
    let rowChip = Math.floor(index / this.CHIP_NUM);
    let colChip = index % this.CHIP_NUM;
    const img = this.img;
    const picData = [];
    for (let i = 0; i < image.length; i += 4) {
      if (i % (img.width * 4) === 0 && i !== 0) {
        ++rowIndex;
        colIndex = 0;
      }
      if (
        colIndex >= Math.floor(xOffset * colChip) &&
        colIndex < Math.floor(xOffset + xOffset * colChip) &&
        rowIndex >= Math.floor(yOffset * rowChip) &&
        rowIndex < Math.floor(yOffset + yOffset * rowChip)
      ) {
        picData.push(image[i], image[i + 1], image[i + 2], image[i + 3]);
      }
      ++colIndex;
    }
    return picData;
  }
  clearCanvas() {
    this.canvas.height = document.body.offsetHeight;
  }
  renderChip(init = true) {
    const ctx = this.ctx;
    // ctx.clearRect(0, 0, this.img.width, this.img.height);
    this.clearCanvas();
    this.drawGrid();
    this.chips.sort((a, b) => a.getZIndex() - b.getZIndex()).forEach((item, index) => {
      if (init) {
        const x = index % this.CHIP_NUM;
        const y = Math.floor(index / this.CHIP_NUM);
        const xOffset = Math.floor(this.img.width / this.CHIP_NUM);
        const yOffset = Math.floor(this.img.height / this.CHIP_NUM)
        item.setCoords(this.x + x * xOffset + (x + 1) * 10, this.y + y * yOffset + (y + 1) * 10);
        item.setCoordsIndex(x, y);
        item.render(ctx);
      } else {
        item.render(ctx);
      }
    })
  }
}


function loadImg(imgSrc: string) {
  const img = new Image();
  img.src = imgSrc;
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err) => {
      reject(err)
    }
  })
}

loadImg('/static/3.jpg').then(img => {
  const board = new Game(img, 4);
  board.renderChip();
})
