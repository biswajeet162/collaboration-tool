import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DrawingComponent } from './drawing/drawing.component';
import { EditorComponent } from './editor/editor.component';

const routes: Routes = [
  { path: 'editor', component: EditorComponent },
  { path: 'drawing', component: DrawingComponent },
  { path: '**', redirectTo: '/drawing', pathMatch: 'full' } // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
