import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [NgFor, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  isNavOpen = false;

  toggleNav(): void {
    this.isNavOpen = !this.isNavOpen;
  }

  closeNavOnMobile(): void {
    if (window.innerWidth <= 1080) {
      this.isNavOpen = false;
    }
  }
  
  readonly authenticatedScreens = [
    { label: 'Front Desk', route: '/front-desk' },
    { label: 'Race Control', route: '/race-control' },
    { label: 'Lap-line Tracker', route: '/lap-line-tracker' },
  ];

  readonly publicScreens = [
    { label: 'Next Race', route: '/next-race' },
    { label: 'Race Countdown', route: '/race-countdown' },
    { label: 'Race Flags', route: '/race-flags' },
    { label: 'Leader Board', route: '/leader-board' },
  ];
}
