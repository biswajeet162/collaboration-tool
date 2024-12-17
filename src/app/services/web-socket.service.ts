import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client;
  private messageSubject = new BehaviorSubject<string>('');

  constructor() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws', // Replace with backend WebSocket URL
      connectHeaders: {},
      debug: (msg: string) => console.log(msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'), // Use SockJS
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket');
      this.stompClient.subscribe('/topic/updates', (message) => {
        this.messageSubject.next(message.body);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ', frame.headers['message']);
      console.error('Additional details: ', frame.body);
    };
  }

  connect(): void {
    this.stompClient.activate(); // Use activate() instead of connect()
  }

  sendMessage(message: string): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/edit',
        body: message,
      });
    }
  }

  onMessage() {
    return this.messageSubject.asObservable();
  }
}
