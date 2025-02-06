import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatResponse } from './chat-response';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl = 'http://localhost:8080/ask';

  constructor(private http: HttpClient) { }

 

  askQuestion(question: string): Observable<ChatResponse> {
    const params = new HttpParams().set('question', question);
    return this.http.get<ChatResponse>(this.apiUrl, { params });
  }
}
