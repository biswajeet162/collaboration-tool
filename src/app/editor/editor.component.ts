import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-editor',
  standalone: false,
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  textContent: string = '';

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    // Subscribe to text updates from WebSocket
    this.webSocketService.onTextUpdate().subscribe((message: string) => {
      this.textContent = message;
    });
    this.webSocketService.connect();
  }

  // Send text update to the backend via WebSocket
  updateText(): void {
    this.webSocketService.sendTextUpdate(this.textContent);
  }
}
