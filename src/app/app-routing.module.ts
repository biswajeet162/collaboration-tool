import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DrawingComponent } from './drawing/drawing.component';

const routes: Routes = [
  // Define dynamic route for editor with userId and optional connectedTo query parameters
  { path: 'drawing/drawingId/:drawingId', component: DrawingComponent },
  { path: '**', redirectTo: '/drawing/drawingId/123', pathMatch: 'full' } // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
