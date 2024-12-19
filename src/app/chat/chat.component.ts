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
