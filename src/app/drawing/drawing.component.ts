import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import * as fabric from 'fabric';

@Component({
  selector: 'app-drawing',
  standalone: false,
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css']
})
export class DrawingComponent implements AfterViewInit {
  
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  
  canvas!: fabric.Canvas;
  isDrawingMode: boolean = true;
  private storageKey = 'drawingData';

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.loadFromStorage();

    // Ensure the canvas resizes when window size changes
    window.addEventListener('resize', () => this.resizeCanvas());
}


  initializeCanvas() {
    const canvasElement = this.canvasRef.nativeElement;
    
    // Get the full screen size
    const width = window.innerWidth - 120;
    const height = window.innerHeight - 45;

    this.canvas = new fabric.Canvas(canvasElement, {
        isDrawingMode: false,
        backgroundColor: '#fff'
    });

    // Set the dimensions to full screen
    this.canvas.setDimensions({ width, height });

    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = 'black';
    this.canvas.freeDrawingBrush.width = 2;

    this.canvas.on('object:added', () => this.saveToStorage());
    this.canvas.on('object:modified', () => this.saveToStorage());

    // Resize canvas when the window resizes
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  // Resize function to keep canvas full screen on window resize
  resizeCanvas() {
      const width = window.innerWidth -  120;
      const height = window.innerHeight - 45;
      this.canvas.setDimensions({ width, height });
      this.canvas.renderAll();
  }

  toggleDrawingMode() {
    this.isDrawingMode = !this.isDrawingMode;
    this.canvas.isDrawingMode = this.isDrawingMode;
  }

  clearCanvas() {
    this.canvas.clear();
    this.canvas.backgroundColor = '#fff';
    this.saveToStorage();
  }

  saveToStorage() {
    const drawingData = JSON.stringify(this.canvas.toJSON());
    localStorage.setItem(this.storageKey, JSON.stringify({ id: uuidv4(), data: drawingData }));
  }

  loadFromStorage() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      this.canvas.loadFromJSON(parsed.data, this.canvas.renderAll.bind(this.canvas));
    }
  }
}
