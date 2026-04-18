import { Routes } from '@angular/router';
import { FrontDesk } from './screens/front-desk/front-desk';
import { RaceControl  } from './screens/race-control/race-control';
import { LapLineTracker } from './screens/lap-line-tracker/lap-line-tracker';
import { LeaderBoard } from './screens/leader-board/leader-board';
import { NextRace } from './screens/next-race/next-race';
import { RaceCountdown } from './screens/race-countdown/race-countdown';
import { RaceFlags } from './screens/race-flags/race-flags';
import { Home } from './screens/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, title: 'Home' },
  { path: 'front-desk', component: FrontDesk, title: 'Front Desk' },
  { path: 'race-control', component: RaceControl, title: 'Race Control' },
  { path: 'lap-line-tracker', component: LapLineTracker, title: 'Lap Line Tracker' },
  { path: 'leader-board', component: LeaderBoard, title: 'Leader Board' },
  { path: 'next-race', component: NextRace, title: 'Next Race' },
  { path: 'race-countdown', component: RaceCountdown, title: 'Race Countdown' },
  { path: 'race-flags', component: RaceFlags, title: 'Race Flags' },
  { path: '**', redirectTo: 'home' }
];