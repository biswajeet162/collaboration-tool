import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-drawing',
  standalone: false,
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
})
export class DrawingComponent implements OnInit {
  @ViewChild('drawingCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    this.wsService.connect(); // Initialize the WebSocket connection
    this.setupCanvas(); // Set up the canvas for drawing
    this.listenForDrawingUpdates(); // Listen for drawing updates from WebSocket
  }

  setupCanvas() {
    const canvasEl = this.canvas.nativeElement;
    this.ctx = canvasEl.getContext('2d')!;
    canvasEl.width = window.innerWidth - 50;
    canvasEl.height = window.innerHeight - 100;

    // Event Listeners for mouse actions
    canvasEl.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvasEl.addEventListener('mousemove', (e) => this.draw(e));
    canvasEl.addEventListener('mouseup', () => this.stopDrawing());
    canvasEl.addEventListener('mouseleave', () => this.stopDrawing());
  }

  startDrawing(event: MouseEvent) {
    this.drawing = true;
    this.draw(event);  // Immediately start drawing on mouse down
  }

  draw(event: MouseEvent) {
    if (!this.drawing) return;

    const x = event.offsetX;
    const y = event.offsetY;

    // Draw locally
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    // Send drawing data via WebSocket using the sendDrawUpdate method
    this.wsService.sendDrawUpdate({ x, y, drawing: true });
  }

  stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath();

    // Notify WebSocket that drawing has stopped
    this.wsService.sendDrawUpdate({ drawing: false });
  }

  listenForDrawingUpdates() {
    this.wsService.onDrawUpdate().subscribe((data: any) => {
      if (data.drawing === false) {
        this.ctx.beginPath();
        return;
      }

      const { x, y } = data;

      // Render received drawing data
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    });
  }
}
