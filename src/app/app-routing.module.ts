import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DrawingComponent } from './drawing/drawing.component';
import { EditorComponent } from './editor/editor.component';
import { ChatComponent } from './chat/chat.component';

const routes: Routes = [
  // Define dynamic route for editor with userId and optional connectedTo query parameters
  { path: 'editor/user/:userId', component: EditorComponent },
  { path: 'drawing', component: DrawingComponent },
  { path: '**', redirectTo: '/drawing', pathMatch: 'full' } // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
