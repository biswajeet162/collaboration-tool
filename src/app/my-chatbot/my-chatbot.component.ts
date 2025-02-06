import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatService } from './chat-service.service';
import { ChatResponse } from './chat-response';

@Component({
  selector: 'app-my-chatbot',
  standalone: false,
  
  templateUrl: './my-chatbot.component.html',
  styleUrl: './my-chatbot.component.css'
})
export class MyChatbotComponent {
  userQuestion: string = '';
  messages: { text: string, sender: string }[] = [];
  botLoading: boolean = false; // Flag to control bot's loading state

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {}

  sendMessage(): void {
    if (this.userQuestion.trim()) {
      this.messages.push({ text: this.userQuestion, sender: 'user' });
      this.botLoading = true;  // Show bot typing indicator

      // Simulate a delay or perform the API request
      this.chatService.askQuestion(this.userQuestion).subscribe(
        (response: ChatResponse) => {
          this.messages.push({ text: response.answer, sender: 'bot' });
          this.botLoading = false; // Hide bot typing indicator when response is received
          this.userQuestion = ''; // Clear the input field
        },
        (error) => {
          this.messages.push({ text: 'Error fetching answer from server', sender: 'bot' });
          this.botLoading = false; // Hide bot typing indicator on error
        }
      );
    }
  }
}