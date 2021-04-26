import './style/reset.scss';
import { stamp } from './decroate';
const WINDOW_HEIGHT = document.body.offsetHeight;
const WINDOW_WIDTH = document.body.offsetWidth;
class Container {
}
@stamp
class Chip {
  private imageData: ImageData;
  private drag: boolean = false;
  private xIndex: number;
  private yIndex: number;
  private x: number;
  private y: number;
  private dragCoords: { x: number, y: number };
  private width: number;
  private height: number;
  private path: Path2D;
  private zIndex: number = 0;
  private operateStamp: number;
  constructor(data: number[], width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(new Uint8ClampedArray(data), width, height);
    this.operateStamp = Date.now();
  }
  getCenter() {
    return {
      x: this.width / 2,
      y: this.height / 2,
    }
  }
  @stamp
  setDragCoords(x: number, y: number) {
    this.dragCoords = { x, y };
  }
  getDragCoords() {
    return this.dragCoords;
  }
  @stamp
  setZIndex(z: number) {
    this.zIndex = z;
  }
  getZIndex() {
    return this.zIndex;
  }
  @stamp
  setDrag(drag: boolean) {
    this.drag = drag;
  }
  getDrag() {
    return this.drag;
  }
  getStamp() {
    return this.operateStamp;
  }
  setStamp(stamp: number) {
    this.operateStamp = stamp;
  }
  @stamp
  setCoordsIndex(x: number, y: number) {
    this.xIndex = x;
    this.yIndex = y;
  }
  @stamp
  setCoords(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  getCoords() {
    return {
      x: this.x,
      y: this.y,
    }
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
  private scale: number = 1;
  constructor(img: HTMLImageElement, chipNum: number) {
    const width = WINDOW_WIDTH;
    const height = WINDOW_HEIGHT;
    this.canvas = document.querySelector('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.CHIP_NUM = chipNum;
    this.img = img;
    this.scale = this.fitImage(img);
    this.canvas.addEventListener('mousedown', (event: MouseEvent) => this.handleMousedown(event))
    this.canvas.addEventListener('mouseup', (event: MouseEvent) => this.handleMouseup(event))
    this.canvas.addEventListener('mousemove', (event: MouseEvent) => this.handleDrag(event))
    // this.fillBackground(width, height);
    this.ctx.scale(this.scale, this.scale);
    this.init(img);
  }
  fillBackground(width: number, height: number) {
    this.ctx.rect(0, 0, width, height);
    this.ctx.fillStyle = 'green';
    this.ctx.fill();
  }
  handleMouseup(event: MouseEvent) {
    const selectList = this.chips.filter(item => {
      return this.ctx.isPointInPath(item.getPath(), event.clientX, event.clientY);
    })
    const select = this.selectTop(selectList);
    if (!select) {
      return;
    }
    select.setZIndex(0);
    select.setDrag(false);
  }
  selectTop(selectList: Chip[]): Chip {
    let max = -1;
    let select;
    selectList.forEach(item => {
      if (item.getStamp() > max) {
        select = item;
        max = item.getStamp();
      }
    })
    return select
  }
  handleMousedown(event: MouseEvent) {
    const selectList = this.chips.filter(item => {
      return this.ctx.isPointInPath(item.getPath(), event.clientX, event.clientY);
    })
    const select = this.selectTop(selectList);
    if (!select) {
      return;
    }
    select.setZIndex(381);
    const { x, y } = select.getCoords();
    select.setDragCoords(event.clientX - x, event.clientY - y);
    select.setDrag(true);
  }
  handleDrag(event: MouseEvent) {
    const select = this.chips.find(item => item.getDrag());
    if (select) {
      select.setCoords(event.clientX - select.getDragCoords().x, event.clientY - select.getDragCoords().y);
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
  setScale(scale: number) {
    this.scale = scale;
  }
  getScale() {
    return this.scale;
  }
  init(img: HTMLImageElement) {
    this.ctx.drawImage(img, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    const xOffset = Math.floor(img.width / this.CHIP_NUM);
    const yOffset = Math.floor(img.height / this.CHIP_NUM)
    this.x = (this.canvas.width - img.width - this.CHIP_NUM * 10) / 2;
    this.y = (this.canvas.height - img.height - this.CHIP_NUM * 10) / 2;
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
    // this.fillBackground(this.canvas.width, this.canvas.height);
  }
  fitImage(img: HTMLImageElement) {
    const OFFSET = 100;
    let scale = 1;
    const offset = {
      width: (WINDOW_WIDTH - OFFSET) / img.width,
      height: (WINDOW_HEIGHT - OFFSET) / img.height,
    };
    scale = Math.min(offset.width, offset.height)
    img.width = img.width * scale;
    img.height = img.height * scale;
    return scale;
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

loadImg('/static/9.jpg').then(img => {
  const board = new Game(img, 4);
  board.renderChip();
})
