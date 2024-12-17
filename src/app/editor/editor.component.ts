import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-editor',
  standalone: false,
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit {
  documentContent: string = '';
  updates: string[] = [];

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    this.wsService.connect();
    this.wsService.onMessage().subscribe((message) => {
      this.documentContent = message;
      this.updates.push(`Update: ${message}`);
    });
  }

  onContentChange() {
    this.wsService.sendMessage(this.documentContent);
  }
}
