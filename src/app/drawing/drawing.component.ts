import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-drawing',
  standalone: false,
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
})
export class DrawingComponent implements OnInit {
  @ViewChild('drawingCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentShape: any = null;  // Current shape being drawn
  private drawingData: any[] = [];  // Array to hold all shapes drawn
  selectedTool: string = 'pencil';  // Default tool is pencil


  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineWidth = 2; // Default stroke width
    this.ctx.strokeStyle = '#000000'; // Default color

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Load saved drawings from local storage
    this.loadDrawingFromLocalStorage();
  }

  selectTool(tool: string) {
    this.selectedTool = tool;
  }


  // Start drawing (mouse down event)
  startDrawing(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.isDrawing = true;

    if (this.selectedTool === 'pencil') {
      // Pencil tool: Start a new line
      this.currentShape = {
        id: uuidv4(),
        tool: 'pencil',
        action: 'create',
        properties: {
          color: this.ctx.strokeStyle,
          strokeWidth: this.ctx.lineWidth,
        },
        geometry: {
          type: 'line',
          points: [{ x, y }],
        },
      };
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    } else if (this.selectedTool === 'rectangle') {
      // Rectangle tool: Start a new rectangle
      this.currentShape = {
        id: uuidv4(),
        tool: 'rectangle',
        action: 'create',
        properties: {
          color: this.ctx.strokeStyle,
          strokeWidth: this.ctx.lineWidth,
          fillColor: 'rgba(0, 0, 0, 0.1)', // Temporary fill color
        },
        geometry: {
          type: 'rectangle',
          startX: x,
          startY: y,
          width: 0,
          height: 0,
        },
      };
    } else if (this.selectedTool === 'ellipse') {
      // Ellipse tool: Start a new ellipse
      this.currentShape = {
        id: uuidv4(),
        tool: 'ellipse',
        action: 'create',
        properties: {
          color: this.ctx.strokeStyle,
          strokeWidth: this.ctx.lineWidth,
          fillColor: 'rgba(0, 0, 0, 0.1)', // Temporary fill color
        },
        geometry: {
          type: 'ellipse',
          startX: x,
          startY: y,
          radiusX: 0,
          radiusY: 0,
        },
      };
    } else if (this.selectedTool === 'single_arrow_line') {
      // Line tool: Start a new line
      this.currentShape = {
        id: uuidv4(),
        tool: 'single_arrow_line',
        action: 'create',
        properties: {
          color: this.ctx.strokeStyle,
          strokeWidth: this.ctx.lineWidth,
        },
        geometry: {
          type: 'line',
          startX: x,
          startY: y,
          endX: x,
          endY: y,
        },
      };
    }

    else if (this.selectedTool === 'double_arrow_line') {
      // Line tool: Start a new line
      this.currentShape = {
        id: uuidv4(),
        tool: 'double_arrow_line',
        action: 'create',
        properties: {
          color: this.ctx.strokeStyle,
          strokeWidth: this.ctx.lineWidth,
        },
        geometry: {
          type: 'line',
          startX: x,
          startY: y,
          endX: x,
          endY: y,
        },
      };
    }

    
  }

  // Draw event (mouse move event)
  draw(event: MouseEvent) {
    if (!this.isDrawing) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.selectedTool === 'pencil' && this.currentShape) {
      // Update pencil line
      this.currentShape.geometry.points.push({ x, y });
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.selectedTool === 'rectangle' && this.currentShape) {
      // Update rectangle dimensions
      const width = x - this.currentShape.geometry.startX;
      const height = y - this.currentShape.geometry.startY;

      this.currentShape.geometry.width = width;
      this.currentShape.geometry.height = height;

      // Clear the canvas and redraw everything including the temporary rectangle
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.redrawDrawings();

      // Draw temporary rectangle
      this.ctx.fillStyle = this.currentShape.properties.fillColor;
      this.ctx.strokeStyle = this.currentShape.properties.color;
      this.ctx.lineWidth = this.currentShape.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.rect(this.currentShape.geometry.startX, this.currentShape.geometry.startY, width, height);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (this.selectedTool === 'ellipse' && this.currentShape) {
      // Update ellipse dimensions
      const radiusX = x - this.currentShape.geometry.startX;
      const radiusY = y - this.currentShape.geometry.startY;

      this.currentShape.geometry.radiusX = radiusX;
      this.currentShape.geometry.radiusY = radiusY;

      // Clear the canvas and redraw everything including the temporary ellipse
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.redrawDrawings();

      // Draw temporary ellipse
      this.ctx.fillStyle = this.currentShape.properties.fillColor;
      this.ctx.strokeStyle = this.currentShape.properties.color;
      this.ctx.lineWidth = this.currentShape.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.ellipse(
        this.currentShape.geometry.startX,
        this.currentShape.geometry.startY,
        Math.abs(radiusX),
        Math.abs(radiusY),
        0,
        0,
        2 * Math.PI
      );
      this.ctx.fill();
      this.ctx.stroke();
    } else if (this.selectedTool === 'single_arrow_line' && this.currentShape) {
      // Update line end point
      this.currentShape.geometry.endX = x;
      this.currentShape.geometry.endY = y;

      // Clear the canvas and redraw everything including the temporary line
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.redrawDrawings();

      // Draw temporary line
      this.ctx.strokeStyle = this.currentShape.properties.color;
      this.ctx.lineWidth = this.currentShape.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentShape.geometry.startX, this.currentShape.geometry.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      // Draw the arrowhead
      this.drawArrowhead(this.currentShape.geometry.startX, this.currentShape.geometry.startY, x, y, "single_arrow_line");
    
    }

    else if (this.selectedTool === 'double_arrow_line' && this.currentShape) {
      // Update line end point
      this.currentShape.geometry.endX = x;
      this.currentShape.geometry.endY = y;

      // Clear the canvas and redraw everything including the temporary line
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.redrawDrawings();

      // Draw temporary line
      this.ctx.strokeStyle = this.currentShape.properties.color;
      this.ctx.lineWidth = this.currentShape.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentShape.geometry.startX, this.currentShape.geometry.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      // Draw the arrowhead
      this.drawArrowhead(this.currentShape.geometry.startX, this.currentShape.geometry.startY, x, y, "double_arrow_line");
    
    }
   
  }

  // Stop drawing and save the shape (mouse up event)
  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    if (this.selectedTool === 'pencil' && this.currentShape) {
      // Save pencil line data
      this.drawingData.push(this.currentShape);
    } else if (this.selectedTool === 'rectangle' && this.currentShape) {
      // Save rectangle data
      this.drawingData.push(this.currentShape);
    } else if (this.selectedTool === 'ellipse' && this.currentShape) {
      // Save ellipse data
      this.drawingData.push(this.currentShape);
    } else if (this.selectedTool === 'single_arrow_line' && this.currentShape) {
      // Save line data
      this.drawingData.push(this.currentShape);
    }
    else if (this.selectedTool === 'double_arrow_line' && this.currentShape) {
      // Save line data
      this.drawingData.push(this.currentShape);
    }
    

    // Save to local storage
    this.saveDrawingToLocalStorage();

    // Reset current shape
    this.currentShape = null;
  }

  // Save all drawings to local storage
  saveDrawingToLocalStorage() {
    localStorage.setItem('drawingData', JSON.stringify(this.drawingData));
  }

  // Load saved drawings from local storage and redraw them
  loadDrawingFromLocalStorage() {
    const savedData = localStorage.getItem('drawingData');
    if (savedData) {
      const drawingData = JSON.parse(savedData);
      this.drawingData = drawingData;

      // Redraw the saved drawings
      drawingData.forEach((drawing: any) => {
        if (drawing.tool === 'pencil' && drawing.geometry.type === 'line') {
          this.ctx.beginPath();
          const points = drawing.geometry.points;
          this.ctx.lineWidth = drawing.properties.strokeWidth;
          this.ctx.strokeStyle = drawing.properties.color;
          this.ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
          }
          this.ctx.stroke();
          this.ctx.closePath();
        } else if (drawing.tool === 'rectangle' && drawing.geometry.type === 'rectangle') {
          this.ctx.fillStyle = drawing.properties.fillColor;
          this.ctx.strokeStyle = drawing.properties.color;
          this.ctx.lineWidth = drawing.properties.strokeWidth;
          this.ctx.beginPath();
          this.ctx.rect(
            drawing.geometry.startX,
            drawing.geometry.startY,
            drawing.geometry.width,
            drawing.geometry.height
          );
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.closePath();
        } else if (drawing.tool === 'ellipse' && drawing.geometry.type === 'ellipse') {
          this.ctx.fillStyle = drawing.properties.fillColor;
          this.ctx.strokeStyle = drawing.properties.color;
          this.ctx.lineWidth = drawing.properties.strokeWidth;
          this.ctx.beginPath();
          this.ctx.ellipse(
            drawing.geometry.startX,
            drawing.geometry.startY,
            Math.abs(drawing.geometry.radiusX),
            Math.abs(drawing.geometry.radiusY),
            0,
            0,
            2 * Math.PI
          );
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.closePath();
        } else if (drawing.tool === 'single_arrow_line' && drawing.geometry.type === 'line') {
          this.ctx.strokeStyle = drawing.properties.color;
          this.ctx.lineWidth = drawing.properties.strokeWidth;
          this.ctx.beginPath();
          this.ctx.moveTo(drawing.geometry.startX, drawing.geometry.startY);
          this.ctx.lineTo(drawing.geometry.endX, drawing.geometry.endY);
          this.ctx.stroke();
          this.ctx.closePath();

          // Draw the arrowhead for the saved line
          this.drawArrowhead(
            drawing.geometry.startX,
            drawing.geometry.startY,
            drawing.geometry.endX,
            drawing.geometry.endY,
            "single_arrow_line"
          );
        }
        else if (drawing.tool === 'double_arrow_line' && drawing.geometry.type === 'line') {
          this.ctx.strokeStyle = drawing.properties.color;
          this.ctx.lineWidth = drawing.properties.strokeWidth;
          this.ctx.beginPath();
          this.ctx.moveTo(drawing.geometry.startX, drawing.geometry.startY);
          this.ctx.lineTo(drawing.geometry.endX, drawing.geometry.endY);
          this.ctx.stroke();
          this.ctx.closePath();

          // Draw the arrowhead for the saved line
          this.drawArrowhead(
            drawing.geometry.startX,
            drawing.geometry.startY,
            drawing.geometry.endX,
            drawing.geometry.endY,
            "double_arrow_line"
          );
        }
       
      });
    }
  }

  // Redraw all saved drawings

  // Redraw all saved drawings
redrawDrawings() {
  this.drawingData.forEach((drawing: any) => {
    if (drawing.tool === 'pencil' && drawing.geometry.type === 'line') {
      this.ctx.beginPath();
      const points = drawing.geometry.points;
      this.ctx.lineWidth = drawing.properties.strokeWidth;
      this.ctx.strokeStyle = drawing.properties.color;
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.stroke();
      this.ctx.closePath();
    } else if (drawing.tool === 'rectangle' && drawing.geometry.type === 'rectangle') {
      this.ctx.fillStyle = drawing.properties.fillColor;
      this.ctx.strokeStyle = drawing.properties.color;
      this.ctx.lineWidth = drawing.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.rect(
        drawing.geometry.startX,
        drawing.geometry.startY,
        drawing.geometry.width,
        drawing.geometry.height
      );
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.closePath();
    } else if (drawing.tool === 'ellipse' && drawing.geometry.type === 'ellipse') {
      this.ctx.fillStyle = drawing.properties.fillColor;
      this.ctx.strokeStyle = drawing.properties.color;
      this.ctx.lineWidth = drawing.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.ellipse(
        drawing.geometry.startX,
        drawing.geometry.startY,
        Math.abs(drawing.geometry.radiusX),
        Math.abs(drawing.geometry.radiusY),
        0,
        0,
        2 * Math.PI
      );
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.closePath();
    } else if (drawing.tool === 'single_arrow_line' && drawing.geometry.type === 'line') {
      this.ctx.strokeStyle = drawing.properties.color;
      this.ctx.lineWidth = drawing.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(drawing.geometry.startX, drawing.geometry.startY);
      this.ctx.lineTo(drawing.geometry.endX, drawing.geometry.endY);
      this.ctx.stroke();
      this.ctx.closePath();

      // Draw the arrowhead for the saved line
      this.drawArrowhead(
        drawing.geometry.startX,
        drawing.geometry.startY,
        drawing.geometry.endX,
        drawing.geometry.endY,
        "single_arrow_line"
      );
    } else if (drawing.tool === 'double_arrow_line' && drawing.geometry.type === 'line') {
      this.ctx.strokeStyle = drawing.properties.color;
      this.ctx.lineWidth = drawing.properties.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(drawing.geometry.startX, drawing.geometry.startY);
      this.ctx.lineTo(drawing.geometry.endX, drawing.geometry.endY);
      this.ctx.stroke();
      this.ctx.closePath();

      // Draw the arrowhead for the saved line
      this.drawArrowhead(
        drawing.geometry.startX,
        drawing.geometry.startY,
        drawing.geometry.endX,
        drawing.geometry.endY,
        "double_arrow_line"
      );
    }
   
  });
}


  // Function to draw double arrowheads (one at the start and one at the end)
  drawArrowhead(startX: number, startY: number, endX: number, endY: number, arrowType: string) {
    const arrowSize = 10; // Size of the arrowhead
    const angle = Math.atan2(endY - startY, endX - startX); // Angle of the line

    // Calculate the arrowhead points for the end of the line
    const arrowAngle1 = angle + Math.PI / 6;
    const arrowAngle2 = angle - Math.PI / 6;

    const arrowX1 = endX - arrowSize * Math.cos(arrowAngle1);
    const arrowY1 = endY - arrowSize * Math.sin(arrowAngle1);

    const arrowX2 = endX - arrowSize * Math.cos(arrowAngle2);
    const arrowY2 = endY - arrowSize * Math.sin(arrowAngle2);

    // Draw the arrowhead at the end (a triangle)
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(arrowX1, arrowY1);
    this.ctx.lineTo(arrowX2, arrowY2);
    this.ctx.closePath();
    this.ctx.fillStyle = this.ctx.strokeStyle; // Use the line color for the arrowhead
    this.ctx.fill();

    // Calculate the arrowhead points for the start of the line
    if(arrowType === "double_arrow_line"){
      const startArrowAngle1 = angle + Math.PI / 6;
      const startArrowAngle2 = angle - Math.PI / 6;

      const startArrowX1 = startX + arrowSize * Math.cos(startArrowAngle1);
      const startArrowY1 = startY + arrowSize * Math.sin(startArrowAngle1);

      const startArrowX2 = startX + arrowSize * Math.cos(startArrowAngle2);
      const startArrowY2 = startY + arrowSize * Math.sin(startArrowAngle2);

      // Draw the arrowhead at the start (a triangle)
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(startArrowX1, startArrowY1);
      this.ctx.lineTo(startArrowX2, startArrowY2);
      this.ctx.closePath();
      this.ctx.fillStyle = this.ctx.strokeStyle; // Use the line color for the arrowhead
      this.ctx.fill();
    }
  }

}
