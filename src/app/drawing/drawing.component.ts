import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as fabric from 'fabric';
import { interval } from 'rxjs';

interface DrawingChange {
  data: any;  // You can replace any with a more specific type if needed
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
  selectedTool: 'pencil' | 'rectangle' | 'square' | 'circle' | 'select' | 'line' | 'arrow' | 'double-arrow' | 'text' = 'pencil';

  lineColor: string = '#000000';
  lineThickness: number = 2;
  lineStyle: 'solid' | 'dashed' | string = 'solid';

  private isDrawingShape = false;
  private startX = 0;
  private startY = 0;
  private currentShape: fabric.Object | null = null;

  textSize: number = 20;  // Default text size


  private drawingId = 'drawingData123';



  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.loadFromStorage();

    // Set default drawing mode to true
    // this.isDrawingMode = true;
    this.canvas.isDrawingMode = true;

    this.canvas.on('path:created', () => this.saveToStorage());


    // Listen for delete key event
    document.addEventListener('keydown', (event) => this.handleKeyPress(event));

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault(); // Prevent browser default select-all behavior
        this.selectAllObjects();
      }
    });

    // Ensure the canvas resizes when window size changes
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  initializeCanvas() {
    const canvasElement = this.canvasRef.nativeElement;
    this.canvas = new fabric.Canvas(canvasElement, {
      backgroundColor: '#fff',
      selection: false // Prevent selection unless in "select" mode
    });

    this.canvas.setDimensions({
      width: window.innerWidth - 120,
      height: window.innerHeight - 45
    });

    this.setPencilMode();

    // Mouse Events for drawing shapes
    this.canvas.on('mouse:down', (event) => this.startDrawing(event.e as MouseEvent));
    this.canvas.on('mouse:move', (event) => this.drawShape(event.e as MouseEvent));
    this.canvas.on('mouse:up', () => this.endDrawing());

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  setPencilMode() {
    this.selectedTool = 'pencil';
    this.canvas.isDrawingMode = true;
    this.canvas.selection = false;
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = this.lineColor;
    this.canvas.freeDrawingBrush.width = this.lineThickness;
  }

  setTextMode() {
    this.selectedTool = 'text';
    this.canvas.isDrawingMode = false; // Disable drawing mode
    this.canvas.selection = false; // Disable selection of other elements
  }
  

  setShapeMode(shape: 'rectangle' | 'square' | 'circle' | 'line' | 'arrow' | 'double-arrow' | 'text') {
    this.selectedTool = shape;
    this.canvas.isDrawingMode = false;
    this.canvas.selection = false;
  }

  setSelectMode() {
    this.selectedTool = 'select';
    this.canvas.isDrawingMode = false;
    this.canvas.selection = true;
    this.canvas.forEachObject((obj) => {
      obj.set({ selectable: true });
    });
    this.canvas.renderAll();
  }

  startDrawing(event: MouseEvent) {
    if (this.selectedTool === 'pencil' || this.selectedTool === 'select') return;

    const pointer = this.canvas.getPointer(event);
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.isDrawingShape = true;

    if (this.selectedTool === 'rectangle' || this.selectedTool === 'square') {
      this.currentShape = new fabric.Rect({
        left: this.startX,
        top: this.startY,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: this.lineColor,
        strokeWidth: this.lineThickness,
        strokeDashArray: this.lineStyle === 'dashed' ? [10, 5] : undefined
      });
    } else if (this.selectedTool === 'circle') {
      this.currentShape = new fabric.Ellipse({
        left: this.startX,
        top: this.startY,
        rx: 0,
        ry: 0,
        fill: 'transparent',
        stroke: this.lineColor,
        strokeWidth: this.lineThickness,
        strokeDashArray: this.lineStyle === 'dashed' ? [10, 5] : undefined
      });
    }
    else if (this.selectedTool === 'line' || this.selectedTool === 'arrow' || this.selectedTool === 'double-arrow') {

      this.currentShape = new fabric.Line([this.startX, this.startY, this.startX, this.startY], {
        stroke: this.lineColor,
        strokeWidth: this.lineThickness,
        strokeDashArray: this.lineStyle === 'dashed' ? [10, 5] : undefined,
        selectable: true,  // Allow selection
        evented: true      // Allow interactions
      });
    }
    else if (this.selectedTool === 'text') {

      // Create a Textbox with placeholder text
      const text = new fabric.Textbox('', {
        left: this.startX,
        top: this.startY,
        fontSize: this.textSize, // Use selected size
        fill: this.lineColor, // Use selected color
        fontFamily: 'Arial',
        width: 100, // Fixed width to prevent word wrapping
        editable: true,
        selectable: true,
        evented: true,
        editingBorderColor: 'blue',
      });

      
      this.canvas.add(text);
      this.canvas.setActiveObject(text);
      text.enterEditing(); // Allow immediate text editing
      text.hiddenTextarea?.focus(); // Focus to type

      // Show placeholder when no text is present
      text.on('editing:entered', () => {
        if (text.text === 'Enter Text') {
          text.text = '';
        }
        this.canvas.renderAll();
      });

      // Remove text if empty when exiting editing mode
      text.on('editing:exited', () => {
        if (text.text.trim() === '') {
          this.canvas.remove(text); // Remove empty text
        }
        this.canvas.renderAll();
      });


      // const text = new fabric.Textbox('Enter text', {
      //   left: this.startX,
      //   top: this.startY,
      //   fontSize: this.textSize, // Use selected text size
      //   fill: this.lineColor, // Use selected color
      //   fontFamily: 'Arial',
      //   selectable: true,
      //   evented: true,
      //   editingBorderColor: 'blue',
      // });
  
      // this.canvas.add(text);
      // this.canvas.setActiveObject(text);
      // text.enterEditing(); // Allow immediate text editing
      // text.hiddenTextarea?.focus(); // Ensure focus for typing
    }

    if (this.currentShape) {
      this.canvas.add(this.currentShape);
    }
  }

  drawShape(event: MouseEvent) {
    if (!this.isDrawingShape || !this.currentShape) return;

    const pointer = this.canvas.getPointer(event);
    const width = pointer.x - this.startX;
    const height = pointer.y - this.startY;

    if (this.selectedTool === 'rectangle') {
      (this.currentShape as fabric.Rect).set({ width, height });
    } else if (this.selectedTool === 'square') {
      const size = Math.min(Math.abs(width), Math.abs(height));
      (this.currentShape as fabric.Rect).set({
        width: size,
        height: size
      });
    } else if (this.selectedTool === 'circle') {
      (this.currentShape as fabric.Ellipse).set({
        rx: Math.abs(width) / 2,
        ry: Math.abs(height) / 2
      });
    }
    else if (this.selectedTool === 'line' || this.selectedTool === 'arrow' || this.selectedTool === 'double-arrow') {
      const x2 = pointer.x;
      const y2 = pointer.y;
      (this.currentShape as fabric.Line).set({ x2, y2 });
      this.canvas.renderAll();
    }

    this.canvas.renderAll();
  }

  endDrawing() {
    if (this.isDrawingShape) {
      if (this.selectedTool === 'arrow' || this.selectedTool === 'double-arrow') {
        this.addArrowToLine();
      }
      this.isDrawingShape = false;
      this.currentShape = null;
    }

    this.saveToStorage();

  }

  addArrowToLine() {
    if (!this.currentShape || !(this.currentShape instanceof fabric.Line)) return;

    const line = this.currentShape as fabric.Line;
    const { x1, y1, x2, y2 } = line;

    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const arrowSize = 10;

    const arrow = new fabric.Triangle({
      left: x2,
      top: y2,
      originX: 'center',
      originY: 'center',
      width: arrowSize,
      height: arrowSize,
      angle: angle + 90,
      fill: this.lineColor
    });

    if (this.selectedTool === 'double-arrow') {
      const startArrow = new fabric.Triangle({
        left: x1,
        top: y1,
        originX: 'center',
        originY: 'center',
        width: arrowSize,
        height: arrowSize,
        angle: angle - 90,
        fill: this.lineColor
      });

      this.canvas.add(startArrow);
    }

    this.canvas.add(arrow);
    this.canvas.renderAll();
  }

  changeBrushColor() {
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = this.lineColor;
    }
  }

  changeBrushThickness() {
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.lineThickness;
    }
  }

  changeBrushStyle(event: Event) {
    this.lineStyle = (event.target as HTMLSelectElement).value; // Cast Event target to HTMLSelectElement
  }

  changeTextSize(event: Event) {
    this.textSize = +(event.target as HTMLSelectElement).value;
  
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      (activeObject as fabric.Textbox).set({ fontSize: this.textSize });
      this.canvas.renderAll();
    }
  }
  

  clearCanvas() {
    // Clear all objects from the canvas
    this.canvas.clear();
    this.canvas.backgroundColor = '#fff';
    this.canvas.renderAll();

    // Clear the storage by setting an empty state
    localStorage.removeItem(this.drawingId);
    localStorage.setItem(this.drawingId, JSON.stringify({ changes: [] }));
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const activeObject = this.canvas.getActiveObject();
  
      if (activeObject) {
        if (activeObject.type === 'activeSelection') {
          const objects = (activeObject as fabric.ActiveSelection).getObjects();
          objects.forEach((obj) => this.canvas.remove(obj)); // Remove all selected objects
        } else {
          this.canvas.remove(activeObject);
        }
  
        this.canvas.discardActiveObject(); // Deselect objects
        this.canvas.renderAll();
        this.saveToStorage(); // Save after deletion
      }
    }
  }

  selectAllObjects() {
    const objects = this.canvas.getObjects();
    if (objects.length > 0) {
      this.canvas.discardActiveObject(); // Clear current selection
      const selection = new fabric.ActiveSelection(objects, { canvas: this.canvas });
      this.canvas.setActiveObject(selection);
      this.canvas.requestRenderAll(); // Refresh canvas
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


  resizeCanvas() {
    const newWidth = window.innerWidth - 120;
    const newHeight = window.innerHeight - 45;
    this.canvas.setDimensions({ width: newWidth, height: newHeight });
  }
}