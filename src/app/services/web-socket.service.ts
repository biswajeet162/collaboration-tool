import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs';
import { MessageModel } from '../model/message-model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: any | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<string> | null = null;

  private textSubject = new BehaviorSubject<MessageModel>(new MessageModel()); // For text updates
  textUpdates$: Observable<MessageModel> = this.textSubject.asObservable();

  private drawSubject = new BehaviorSubject<any>(null);  // For drawing updates
  drawUpdates$: Observable<any> = this.drawSubject.asObservable();

  
  connect(): Promise<string> {
    if (this.isConnected) {
      console.log('WebSocket already connected');
      return Promise.resolve('connected');
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const socket = new SockJS('http://localhost:8081/ws'); // Backend WebSocket endpoint
      this.stompClient = Stomp.over(socket);

      this.stompClient.connect(
        {},
        (frame: any) => {
          console.log('Connected to WebSocket:', frame);
          this.isConnected = true;
          this.connectionPromise = null;
          resolve('connected');
        },
        (error: any) => {
          console.error('WebSocket connection error:', error);
          this.connectionPromise = null;
          reject('not connected');
        }
      );
    });

    return this.connectionPromise;
  }

  // This is for Text Messaging
  subscribeToTopicForTextMessage(topic: string): void {
    if (this.stompClient) {
      this.stompClient.subscribe(topic, (message: any) => {
        console.log('Received message from text:', message.body);

        const decodedMessage = new TextDecoder().decode(message._binaryBody);
        const parsedMessage = JSON.parse(decodedMessage);

        this.textSubject.next(parsedMessage); // Push new messages to the subject
      });
    } else {
      console.error('Cannot subscribe: WebSocket not connected.');
    }
  }

  // This is for Drawing
  subscribeToTopicForDrawing(topic: string): void{
    if (this.stompClient) {
      this.stompClient.subscribe(topic, (message: any) => {
        console.log('Received message from drawing:', message.body);

        const decodedMessage = new TextDecoder().decode(message._binaryBody);
        const parsedMessage = JSON.parse(decodedMessage);

        this.drawSubject.next(parsedMessage); // Push new messages to the subject
      });
    } else {
      console.error('Cannot subscribe: WebSocket not connected.');
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


  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
      });
    }
  }


  





}



  


  // sendMessages(destination: string, body: any): void {
  //   if (this.stompClient && this.isConnected) {
  //     this.stompClient.send(destination, {}, JSON.stringify(body));
  //     console.log('Message sent:', body);
  //   } else {
  //     console.error('Cannot send message: WebSocket not connected.');
  //   }
  // }
