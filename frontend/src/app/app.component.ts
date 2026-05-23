import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  DestroyRef,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSettingsService } from './services/app-settings.service';
import { ToastComponent } from './components/toast/toast.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-toast></app-toast><router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  constructor(private appSettings: AppSettingsService) {}

  ngOnInit(): void {
    this.appSettings
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
