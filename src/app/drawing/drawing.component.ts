import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as fabric from 'fabric';
import { interval } from 'rxjs';

interface DrawingChange {
  data: any;  // You can replace `any` with a more specific type if needed
}

@Component({
  selector: 'app-drawing',
  standalone: false,
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css']
})
export class DrawingComponent implements AfterViewInit {
  
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  
  canvas!: fabric.Canvas;
  isDrawingMode: boolean = false;
  private drawingId = 'drawingData123';

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.loadFromStorage();

    // Set default drawing mode to true
    this.isDrawingMode = true;
    this.canvas.isDrawingMode = true;

    // Listen for delete key event
    document.addEventListener('keydown', (event) => this.handleKeyPress(event));

    // Ensure the canvas resizes when window size changes
    window.addEventListener('resize', () => this.resizeCanvas());
}

initializeCanvas() {
    const canvasElement = this.canvasRef.nativeElement;
    
    const width = window.innerWidth - 120;
    const height = window.innerHeight - 45;

    this.canvas = new fabric.Canvas(canvasElement, {
        isDrawingMode: true,  // Enable drawing mode by default
        backgroundColor: '#fff'
    });

    this.canvas.setDimensions({ width, height });

    // Set up the pencil brush
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = 'black';
    this.canvas.freeDrawingBrush.width = 2;

    this.canvas.on('object:added', () => this.saveToStorage());
    this.canvas.on('object:modified', () => this.saveToStorage());

    window.addEventListener('resize', () => this.resizeCanvas());
}




  // Resize function to keep canvas full screen on window resize
  resizeCanvas() {
    this.toggleDrawingMode()
    const prevWidth = this.canvas.width || window.innerWidth - 120;
    const prevHeight = this.canvas.height || window.innerHeight - 45;
    
    const newWidth = window.innerWidth - 120;
    const newHeight = window.innerHeight - 45;
    
    // Calculate scale factors
    const scaleX = newWidth / prevWidth;
    const scaleY = newHeight / prevHeight;
    
    // Scale all objects proportionally
    this.canvas.getObjects().forEach((obj) => {
        obj.scaleX = (obj.scaleX || 1) * scaleX;
        obj.scaleY = (obj.scaleY || 1) * scaleY;
        obj.left = (obj.left || 0) * scaleX;
        obj.top = (obj.top || 0) * scaleY;
        obj.setCoords(); // Update object's coordinates
    });

    // Resize the canvas
    this.canvas.setDimensions({ width: newWidth, height: newHeight });

    // Refresh the canvas
    this.canvas.renderAll();
}

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.remove(activeObject);
            this.canvas.discardActiveObject(); // Clear selection
            this.canvas.renderAll();
            this.saveToStorage(); // Update storage after deletion
        }
    }
  }

  saveToStorage() {
    const drawingData = this.canvas.toJSON();

    // Retrieve existing storage data
    let savedData = localStorage.getItem(this.drawingId);
    let storageObject: { changes: { data: any }[] } = savedData ? JSON.parse(savedData) : { changes: [] };

    // Append new change (or replace existing state)
    storageObject.changes = [{ data: drawingData }]; // Always keep the latest state

    // Store updated data
    localStorage.setItem(this.drawingId, JSON.stringify(storageObject));
}

loadFromStorage() {
    const savedData = localStorage.getItem(this.drawingId);
    if (savedData) {
        const parsed: { changes: { data: any }[] } = JSON.parse(savedData);

        if (parsed.changes.length > 0) {
            const lastChange = parsed.changes[parsed.changes.length - 1]; // Load the latest change

            if (lastChange && lastChange.data) {
                this.canvas.loadFromJSON(lastChange.data, () => {
                    this.canvas.renderAll(); // Ensure the canvas is properly rendered after loading
                });

                setTimeout(() => {
                    this.canvas.renderAll(); // Small delay to ensure rendering
                }, 100);
            }
        }
    }
  }



  toggleDrawingMode() {
    this.isDrawingMode = !this.isDrawingMode;
    this.canvas.isDrawingMode = this.isDrawingMode;

    // Change cursor type based on mode
    this.canvas.defaultCursor = this.isDrawingMode ? 'crosshair' : 'default';
    this.canvas.renderAll();
  }


  clearCanvas() {
    this.canvas.clear();
    this.canvas.backgroundColor = '#fff';
    this.saveToStorage();
  }


}
