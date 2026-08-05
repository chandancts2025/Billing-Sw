import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './core/auth/idle-timeout.service';

@Component({
  selector: 'be-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent {
  constructor(idleTimeout: IdleTimeoutService) {
    idleTimeout.start();
  }
}
