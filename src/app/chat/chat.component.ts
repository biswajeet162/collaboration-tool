import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';
import { ActivatedRoute } from '@angular/router';
import { MessageModel } from '../model/message-model';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {

  colorListForUser: Map<string, string> | undefined;

  userId: string | undefined;

  messages : MessageModel[] = [];

  messageContent: string = '';
  recipientId: string = ''; // To specify recipient(s), leave empty for broadcasting

  constructor(private webSocketService: WebSocketService, private route: ActivatedRoute) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userId')!;
    });

    // Connect to WebSocket
    this.webSocketService.connect().then(() => {
      // Subscribe to public topic
      this.webSocketService.subscribeToTopicForTextMessage('/topic/public');

      // Subscribe to user-specific messages
      this.webSocketService.subscribeToTopicForTextMessage(`/topic/messages/${this.userId}`);

      // Listen for incoming messages
      this.webSocketService.textUpdates$.subscribe((messageContent:  MessageModel) => {
        if (messageContent.message !== undefined) {

          console.log("messageContent.recipientMap")
          console.log(messageContent.recipientMap)

          const isOwnMessage = messageContent.userId === this.userId
          this.messages.push({
            userId: messageContent.userId,
            userName: messageContent.userName,
            message: messageContent.message.replaceAll("\"", ""),
            recipients: messageContent.recipients,
            recipientMap: messageContent.recipientMap,
            timestamp: messageContent.timestamp,
            senderType: isOwnMessage ? 'self' : 'other',
          });
        }
      });
    });
  }

 
  sendMessage(): void {
    if (this.messageContent.trim()) {

      // when recipient is presnt a=then send the message to ownself as well
      this.recipientId =  this.recipientId !== "" ? this.recipientId + "," +this.userId : ""

      const body = {
        message: this.messageContent,
        recipients: this.recipientId
          ? this.recipientId.split(',').map((id) => id.trim())
          : [],
      };

      // Send message via REST API
      fetch(
        `http://localhost:8081/editor/user/${this.userId}${
          body.recipients.length > 0
            ? `?connectTo=${body.recipients.join('&connectTo=')}`
            : ''
        }`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body.message),
        }
      )
        .then((response) => response.text())
        .then((status) => console.log(status))
        .catch((error) => console.error(error));

      this.messageContent = '';
      this.recipientId = '';
    }
  }

  getOwnName(userId?: string){
    const userMap = new Map<string, string>([
      ["1", "Aarav"],
      ["2", "Ananya"],
      ["3", "Vihaan"],
      ["4", "Ishita"],
      ["5", "Arjun"],
    ]);

    return userMap.get(userId ?? "");
  }

  getUserColor(userId?: string): string | undefined {
    this.colorListForUser = new Map<string, string>([
      ["1", "red"],
      ["2", "blue"],
      ["3", "green"],
      ["4", "black"],
      ["5", "pink"],
    ]);
    return this.colorListForUser.get(userId ?? "");
  }
  

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }
}




















// import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
// import { WebSocketService } from '../services/web-socket.service';
// import { ActivatedRoute } from '@angular/router';

// @Component({
//   selector: 'app-drawing',
//   standalone: false,
//   templateUrl: './drawing.component.html',
//   styleUrls: ['./drawing.component.css'],
// })
// export class DrawingComponent implements OnInit {
//   @ViewChild('drawingCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

//   private ctx!: CanvasRenderingContext2D;
//   private drawing = false;
//   drawingId!: string;
//   currentTool: string = 'pencil'; // Default tool is pencil
//   startX: number = 0;
//   startY: number = 0;

//   constructor(
//     private webSocketService: WebSocketService,
//     private route: ActivatedRoute
//   ) {}

//   ngOnInit(): void {
//     this.initializeDrawingId();
//     this.setupCanvas();
//     this.subscribeAndListenForDrawingUpdates();
//     this.handleWindowResize();
//   }

//   // Initialization Methods

//   private initializeDrawingId(): void {
//     this.drawingId = this.route.snapshot.paramMap.get('drawingId')!;
//   }

//   private setupCanvas(): void {
//     const canvasEl = this.canvas.nativeElement;

//     // Configure canvas dimensions
//     canvasEl.width = screen.width;
//     canvasEl.height = screen.height;

//     this.ctx = canvasEl.getContext('2d')!;
//     this.clearCanvas();
//     this.addCanvasEventListeners();
//   }

//   private handleWindowResize(): void {
//     window.addEventListener('resize', () => this.setupCanvas());
//   }

//   private clearCanvas(): void {
//     this.ctx.fillStyle = 'white';
//     this.ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
//   }

//   addCanvasEventListeners(): void {
//     const canvasEl = this.canvas.nativeElement;
//     canvasEl.addEventListener('mousedown', (e) => this.startDrawing(e));
//     canvasEl.addEventListener('mousemove', (e) => this.draw(e));
//     canvasEl.addEventListener('mouseup', (e) => this.stopDrawing(e));
//     canvasEl.addEventListener('mouseleave', (e) => this.stopDrawing(e));
//   }

//   // WebSocket Methods

//   private subscribeAndListenForDrawingUpdates(): void {
//     this.webSocketService.connect().then(() => {
//       this.webSocketService.subscribeToTopicForDrawing(`/topic/drawingUpdates/${this.drawingId}`);
//       this.loadInitialDrawingData();
//       this.listenForDrawingUpdates();
//     });
//   }

//   private loadInitialDrawingData(): void {
//     this.webSocketService.getInitialDrawingData(this.drawingId).subscribe(
//       (data: any) => this.renderDrawing(data),
//       (error) => console.error('Error fetching drawing data:', error)
//     );
//   }

//   private listenForDrawingUpdates(): void {
//     this.webSocketService.drawUpdates$.subscribe((data: any) => {
//       if (!data || data.drawing === false) {
//         this.ctx.beginPath();
//         return;
//       }

//       this.drawPencil(data.x, data.y);
//     });
//   }

//   // Drawing Methods

//   startDrawing(event: MouseEvent): void {
//     this.drawing = true;

//     const { x, y } = this.getCanvasCoordinates(event);
//     this.startX = x;
//     this.startY = y;

//     if (this.currentTool === 'pencil') {
//       this.drawPencil(x, y);
//     }
//   }

//   draw(event: MouseEvent): void {
//     if (!this.drawing) return;

//     const { x, y } = this.getCanvasCoordinates(event);

//     if (this.currentTool === 'pencil') {
//       this.drawPencil(x, y);
//       this.webSocketService.sendDrawUpdate({ x, y, drawing: true }, this.drawingId);
//     }
//     else if(this.currentTool === 'rectangle') {

//     }
//     else if(this.currentTool === 'circle') {

//     }
//   }

//   stopDrawing(event: any): void {
//     if (!this.drawing) return;

//     this.drawing = false;

//     const { x, y } = this.getCanvasCoordinates(event!);

//     if (this.currentTool === 'rectangle') {
//       this.drawRectangle(this.startX, this.startY, x, y);
//     } else if (this.currentTool === 'circle') {
//       this.drawCircle(this.startX, this.startY, x, y);
//     }

//     this.webSocketService.sendDrawUpdate({ drawing: false }, this.drawingId);
//   }

//   private getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
//     const canvasEl = this.canvas.nativeElement;
//     const rect = canvasEl.getBoundingClientRect();

//     const scaleX = canvasEl.width / rect.width;
//     const scaleY = canvasEl.height / rect.height;

//     return {
//       x: (event.clientX - rect.left) * scaleX,
//       y: (event.clientY - rect.top) * scaleY,
//     };
//   }

//   // for initail drawing OR clearing the board
//   renderDrawing(drawingData: any[]): void {
//     this.clearCanvas();

//     if (!drawingData || drawingData.length === 0) return;

//     drawingData.forEach((point) => {
//       if (!point.drawing) {
//         this.ctx.beginPath();
//       } else {
//         this.drawPencil(point.x, point.y);
//       }
//     });
//   }

  

//   clearDrawingData(): void {
//     this.webSocketService.clearDrawingData(this.drawingId).subscribe(
//       (data: any) => this.renderDrawing(data),
//       (error) => console.error('Error clearing drawing data:', error)
//     );
//   }

//   private drawPencil(x: number, y: number): void {
//     this.ctx.lineWidth = 2;
//     this.ctx.lineCap = 'round';
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineTo(x, y);
//     this.ctx.stroke();
//     this.ctx.beginPath();
//     this.ctx.moveTo(x, y);
//   }


//   private drawRectangle(startX: number, startY: number, endX: number, endY: number): void {
//     const width = endX - startX;
//     const height = endY - startY;
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineWidth = 2;
//     this.ctx.strokeRect(startX, startY, width, height);

//     console.log('Selected tool X Start:', startX);
//     console.log('Selected tool Y Start:', startY);
//     console.log('Selected tool X End:', endX);
//     console.log('Selected tool Y End:', endY);
//   }

//   private drawCircle(startX: number, startY: number, endX: number, endY: number): void {
//     const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
//     const centerX = (startX + endX) / 2;
//     const centerY = (startY + endY) / 2;

//     this.ctx.beginPath();
//     this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineWidth = 2;
//     this.ctx.stroke();
//   }

//   setTool(tool: string): void {
//     this.currentTool = tool;
//     console.log('Selected tool:', tool);
//   }
// }



























// import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
// import { WebSocketService } from '../services/web-socket.service';
// import { ActivatedRoute } from '@angular/router';

// @Component({
//   selector: 'app-drawing',
//   templateUrl: './drawing.component.html',
//   styleUrls: ['./drawing.component.css'],
// })
// export class DrawingComponent implements OnInit {
  
//   @ViewChild('drawingCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
//   private ctx!: CanvasRenderingContext2D;
//   private drawing = false;

//   drawingId!: string;

//     currentTool: string = 'pencil'; // Default tool is pencil

//   constructor(private webSocketService: WebSocketService, private route: ActivatedRoute) {}

//   ngOnInit(): void {

//     this.drawingId = this.route.snapshot.paramMap.get('drawingId')!;

    


//     this.setupCanvas(); // Set up the canvas for drawing
//     this.subscribeAndListenForDrawingUpdates(); // Listen for drawing updates from WebSocket
//     window.addEventListener('resize', () => this.setupCanvas()); // Adjust canvas on screen resize


//   }

//   onNewUserLoadDrawingData(drawingId: string){

//     this.webSocketService.getInitialDrawingData(drawingId).subscribe(
//       (data : any) => {
//         // console.log('Drawing data:', data);
//         this.renderDrawing(data);
//       },
//       (error) => {
//         console.error('Error fetching drawing data:', error);
//       }
//     );
//   }

//   renderDrawing(drawingData: any[]) {
//     this.setupCanvas()

//     if (!drawingData || drawingData.length === 0) return;
  
//     drawingData.forEach((point) => {
//       if (point.drawing === false) {
//         this.ctx.beginPath();
//       } else {
//         const { x, y } = point;
//         this.ctx.lineWidth = 2;
//         this.ctx.lineCap = 'round';
//         this.ctx.strokeStyle = 'black';
//         this.ctx.lineTo(x, y);
//         this.ctx.stroke();
//         this.ctx.beginPath();
//         this.ctx.moveTo(x, y);
//       }
//     });

//   }

//   setupCanvas() {
//     const canvasEl = this.canvas.nativeElement;

//     // Use the full screen size
//     canvasEl.width = screen.width;
//     canvasEl.height = screen.height;

//     this.ctx = canvasEl.getContext('2d')!;
//     this.ctx.fillStyle = 'white';
//     this.ctx.fillRect(0, 0, canvasEl.width, canvasEl.height); // Clear canvas

//     // Add event listeners for drawing
//     canvasEl.addEventListener('mousedown', (e) => this.startDrawing(e));
//     canvasEl.addEventListener('mousemove', (e) => this.draw(e));
//     canvasEl.addEventListener('mouseup', (e) => this.stopDrawing(e));
//     canvasEl.addEventListener('mouseleave', (e) => this.stopDrawing(e));
//   }

//   subscribeAndListenForDrawingUpdates() {
//     this.webSocketService.connect().then(() => {
//       // Subscribe to public topic
//       this.webSocketService.subscribeToTopicForDrawing('/topic/drawingUpdates/' + this.drawingId);

//     this.onNewUserLoadDrawingData(this.drawingId);

//       // Listen for draw updates
//       this.webSocketService.drawUpdates$.subscribe((data: any) => {
//         if (data == null || data.drawing === false) {
//           this.ctx.beginPath();
//           return;
//         }

//         const { x, y } = data;

//         // Render received drawing data
//         this.ctx.lineWidth = 2;
//         this.ctx.lineCap = 'round';
//         this.ctx.strokeStyle = 'black';
//         this.ctx.lineTo(x, y);
//         this.ctx.stroke();
//         this.ctx.beginPath();
//         this.ctx.moveTo(x, y);
//       });
//     });
//   }

//   startDrawing(event: MouseEvent) {
//     this.drawing = true;
//     this.draw(event); // Immediately start drawing on mouse down
//   }

//   draw(event: MouseEvent) {
//     if (!this.drawing) return;

//     const canvasEl = this.canvas.nativeElement;
//     const rect = canvasEl.getBoundingClientRect();

//     // Calculate the scale factors
//     const scaleX = canvasEl.width / rect.width; // Horizontal scale
//     const scaleY = canvasEl.height / rect.height; // Vertical scale

//     // Adjust the mouse position to canvas coordinates
//     const x = (event.clientX - rect.left) * scaleX;
//     const y = (event.clientY - rect.top) * scaleY;

//     // Draw locally
//     this.ctx.lineWidth = 2;
//     this.ctx.lineCap = 'round';
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineTo(x, y);
//     this.ctx.stroke();
//     this.ctx.beginPath();
//     this.ctx.moveTo(x, y);

//     // Send drawing data via WebSocket
//     this.webSocketService.sendDrawUpdate({ x, y, drawing: true }, this.drawingId);
//   }

//   stopDrawing(event: any) {
//     this.drawing = false;
//     this.ctx.beginPath();

//     // Notify WebSocket that drawing has stopped
//     this.webSocketService.sendDrawUpdate({ drawing: false }, this.drawingId);
//   }

//   clearDrawingData(){

//     this.webSocketService.clearDrawingData(this.drawingId).subscribe(
//       (data : any) => {
//         // console.log('Drawing data:', data);
//         this.renderDrawing(data);
//       },
//       (error) => {
//         console.error('Error clearing drawing data:', error);
//       }
//     );
//   }





//   private drawRectangle(startX: number, startY: number, endX: number, endY: number): void {
//     const width = endX - startX;
//     const height = endY - startY;
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineWidth = 2;
//     this.ctx.strokeRect(startX, startY, width, height);

//     console.log('Selected tool X Start:', startX);
//     console.log('Selected tool Y Start:', startY);
//     console.log('Selected tool X End:', endX);
//     console.log('Selected tool Y End:', endY);
//   }

//   private drawCircle(startX: number, startY: number, endX: number, endY: number): void {
//     const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
//     const centerX = (startX + endX) / 2;
//     const centerY = (startY + endY) / 2;

//     this.ctx.beginPath();
//     this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineWidth = 2;
//     this.ctx.stroke();
//   }

//   setTool(tool: string): void {
//     this.currentTool = tool;
//     console.log('Selected tool:', tool);
//   }





// }
