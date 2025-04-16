import { Injectable } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as fabric from 'fabric';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private canvas: fabric.Canvas | null = null;
  private drawingId: string = '';

  constructor(
    private webSocketService: WebSocketService,
    private http: HttpClient
  ) {}

  initializeCanvas(canvasElement: HTMLCanvasElement): fabric.Canvas {
    this.canvas = new fabric.Canvas(canvasElement, {
      backgroundColor: '#fff',
      selection: false
    });

    this.canvas.setDimensions({
      width: window.innerWidth - 120,
      height: window.innerHeight - 45
    });

    return this.canvas;
  }

  setDrawingId(id: string) {
    this.drawingId = id;
  }

  getDrawingId(): string {
    return this.drawingId;
  }

  initializeWebSocket(canvas: fabric.Canvas): Promise<void> {
    return this.webSocketService.connect().then(() => {
      // Subscribe to drawing updates for this specific drawing
      this.webSocketService.subscribeToTopicForDrawing(`/topic/drawing/${this.drawingId}`);

      // Listen for incoming drawing updates
      this.webSocketService.drawUpdates$.subscribe((drawingData: any) => {
        if (drawingData) {
          canvas.loadFromJSON(drawingData, () => {
            canvas.renderAll();
          });
        }
      });

      // Load initial drawing data
      this.getInitialDrawingData().subscribe(
        (data: any) => {
          if (data) {
            canvas.loadFromJSON(data, () => {
              canvas.renderAll();
            });
          }
        },
        error => console.error('Error loading initial drawing data:', error)
      );
    });
  }

  saveDrawing(canvas: fabric.Canvas) {
    try {
      const drawingData = canvas.toJSON();
      
      // Stringify the data before sending
      const jsonString = JSON.stringify(drawingData);
      
      // Send drawing update to WebSocket
      this.webSocketService.sendDrawUpdate(jsonString, this.drawingId);

      // Also save to local storage as backup
      let savedData = localStorage.getItem(this.drawingId);
      let storageObject: { changes: { data: any }[] } = savedData ? JSON.parse(savedData) : { changes: [] };
      storageObject.changes = [{ data: drawingData }];
      localStorage.setItem(this.drawingId, JSON.stringify(storageObject));
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  }

  clearDrawing(canvas: fabric.Canvas) {
    canvas.clear();
    canvas.backgroundColor = '#fff';
    canvas.renderAll();

    // Clear both WebSocket and local storage
    this.webSocketService.clearDrawingData(this.drawingId).subscribe(
      () => console.log('Drawing cleared on server'),
      error => console.error('Error clearing drawing on server:', error)
    );
    localStorage.removeItem(this.drawingId);
    localStorage.setItem(this.drawingId, JSON.stringify({ changes: [] }));
  }

  loadFromStorage(canvas: fabric.Canvas) {
    const savedData = localStorage.getItem(this.drawingId);
    if (savedData) {
      const parsed: { changes: { data: any }[] } = JSON.parse(savedData);

      if (parsed.changes.length > 0) {
        const lastChange = parsed.changes[parsed.changes.length - 1];

        if (lastChange && lastChange.data) {
          canvas.loadFromJSON(lastChange.data, () => {
            canvas.renderAll();
          });

          setTimeout(() => {
            canvas.renderAll();
          }, 100);
        }
      }
    }
  }

  resizeCanvas(canvas: fabric.Canvas) {
    const newWidth = window.innerWidth - 120;
    const newHeight = window.innerHeight - 45;
    canvas.setDimensions({ width: newWidth, height: newHeight });
  }

  private getInitialDrawingData(): Observable<any> {
    return this.webSocketService.getInitialDrawingData(this.drawingId);
  }
} 