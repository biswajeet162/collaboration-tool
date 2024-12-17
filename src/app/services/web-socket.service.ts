import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client;
  private textSubject = new BehaviorSubject<string>(''); // For text updates
  private drawSubject = new BehaviorSubject<any>(null);  // For drawing updates

  constructor() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws', // WebSocket endpoint
      connectHeaders: {},
      debug: (msg: string) => console.log(msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'), // SockJS URL
    });

    // On successful connection, subscribe to text and drawing topics
    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket');

      // Subscribe to text topic
      this.stompClient.subscribe('/topic/textUpdates', (message) => {
        this.textSubject.next(message.body);
      });

      // Subscribe to drawing topic
      this.stompClient.subscribe('/topic/drawingUpdates', (message) => {
        const data = JSON.parse(message.body);
        this.drawSubject.next(data);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ', frame.headers['message']);
      console.error('Additional details: ', frame.body);
    };
  }

  // Activate WebSocket connection
  connect(): void {
    this.stompClient.activate();
  }

  // Send text updates to the server
  sendTextUpdate(message: string): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/text', // Sending to the backend for text updates
        body: message,
      });
    }
  }

  // Send drawing updates to the server
  sendDrawUpdate(data: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/draw', // Sending to the backend for drawing updates
        body: JSON.stringify(data),
      });
    }
  }

  // Receive text updates as Observable
  onTextUpdate() {
    return this.textSubject.asObservable();
  }

  // Receive drawing updates as Observable
  onDrawUpdate() {
    return this.drawSubject.asObservable();
  }
}
