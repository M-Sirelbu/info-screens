import { Routes } from '@angular/router';
import { FrontDesk } from './screens/front-desk/front-desk';
import { RaceControl } from './screens/race-control/race-control';
import { LapLineTracker } from './screens/lap-line-tracker/lap-line-tracker';
import { LeaderBoard } from './screens/leader-board/leader-board';
import { NextRace } from './screens/next-race/next-race';
import { RaceCountdown } from './screens/race-countdown/race-countdown';
import { RaceFlags } from './screens/race-flags/race-flags';

export const routes: Routes = [
  { path: '', redirectTo: 'next-race', pathMatch: 'full' },
  { path: 'front-desk', component: FrontDesk },
  { path: 'race-control', component: RaceControl },
  { path: 'lap-line-tracker', component: LapLineTracker },
  { path: 'leader-board', component: LeaderBoard },
  { path: 'next-race', component: NextRace },
  { path: 'race-countdown', component: RaceCountdown },
  { path: 'race-flags', component: RaceFlags },
  { path: '**', redirectTo: 'next-race' }
];