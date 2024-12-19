import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
})
export class DrawingComponent implements OnInit {
  
  @ViewChild('drawingCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.setupCanvas(); // Set up the canvas for drawing
    this.subscribeAndListenForDrawingUpdates(); // Listen for drawing updates from WebSocket
    window.addEventListener('resize', () => this.setupCanvas()); // Adjust canvas on screen resize
  }

  setupCanvas() {
    const canvasEl = this.canvas.nativeElement;

    // Use the full screen size
    canvasEl.width = screen.width;
    canvasEl.height = screen.height;

    this.ctx = canvasEl.getContext('2d')!;
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, canvasEl.width, canvasEl.height); // Clear canvas

    // Add event listeners for drawing
    canvasEl.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvasEl.addEventListener('mousemove', (e) => this.draw(e));
    canvasEl.addEventListener('mouseup', () => this.stopDrawing());
    canvasEl.addEventListener('mouseleave', () => this.stopDrawing());
  }

  subscribeAndListenForDrawingUpdates() {
    this.webSocketService.connect().then(() => {
      // Subscribe to public topic
      this.webSocketService.subscribeToTopicForDrawing('/topic/drawingUpdates');
      // Listen for draw updates
      this.webSocketService.drawUpdates$.subscribe((data: any) => {
        if (data == null || data.drawing === false) {
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
    });
  }

  startDrawing(event: MouseEvent) {
    this.drawing = true;
    this.draw(event); // Immediately start drawing on mouse down
  }

  draw(event: MouseEvent) {
    if (!this.drawing) return;

    const canvasEl = this.canvas.nativeElement;
    const rect = canvasEl.getBoundingClientRect();

    // Calculate the scale factors
    const scaleX = canvasEl.width / rect.width; // Horizontal scale
    const scaleY = canvasEl.height / rect.height; // Vertical scale

    // Adjust the mouse position to canvas coordinates
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Draw locally
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    // Send drawing data via WebSocket
    this.webSocketService.sendDrawUpdate({ x, y, drawing: true });
  }

  stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath();

    // Notify WebSocket that drawing has stopped
    this.webSocketService.sendDrawUpdate({ drawing: false });
  }
}
