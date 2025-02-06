import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat/chat.component';
import { CommonModule } from '@angular/common';
import { DrawingComponent } from './drawing/drawing.component';
import { VideoComponent } from './audio-call/video/video.component';
import { MyChatbotComponent } from './my-chatbot/my-chatbot.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    ChatComponent,
    DrawingComponent,
    VideoComponent,
    MyChatbotComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule, 
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
