import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnDestroy, AfterViewInit {
  constructor(private router: Router) {}

  async ngAfterViewInit() {
    await this.delay(2000);
    this.router.navigate(['/menu']);
  }

  ngOnDestroy() { }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
