import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

type SessionStatus = 'notStarted' | 'active' | 'finished';
type RaceFlag = 'green' | 'yellow' | 'red' | 'finish';

interface LeaderboardEntry {
  carNumber: number;
  driverName: string;
  completedLaps: number;
  bestLapTime: number; // milliseconds, 0 = no lap yet
}

@Component({
  selector: 'app-leader-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leader-board.html',
  styleUrl: './leader-board.scss',
})
export class LeaderBoard implements OnInit, OnDestroy {
  private socket!: Socket;

  sessionStatus: SessionStatus = 'notStarted';
  currentFlag: RaceFlag | null = null;
  remainingSeconds = 0;
  entries: LeaderboardEntry[] = [];

  get sortedEntries(): LeaderboardEntry[] {
    return [...this.entries].sort((a, b) => {
      if (a.bestLapTime === 0 && b.bestLapTime === 0) return 0;
      if (a.bestLapTime === 0) return 1;
      if (b.bestLapTime === 0) return -1;
      return a.bestLapTime - b.bestLapTime;
    });
  }

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.socket.emit('selectRoom', { room: 'leader-board' }, (response: { status: string }) => {
        console.log('Leader board room:', response?.status);
      });
    });

    this.socket.on('sessionUpdate', (args: { sessionId: number; driverNames: string[]; carNumbers: number[] }) => {
      this.entries = args.carNumbers.map((carNumber, i) => ({
        carNumber,
        driverName: args.driverNames[i],
        completedLaps: 0,
        bestLapTime: 0,
      }));
    });

    this.socket.on('sessionStatus', (args: { status: SessionStatus }) => {
      this.sessionStatus = args.status;
    });

    this.socket.on('flagChanged', (args: { flag: RaceFlag }) => {
      this.currentFlag = args.flag;
    });

    this.socket.on('lapTimes', (args: { carNumbers: number[]; completedLaps: number[]; bestLapTime: number[] }) => {
      args.carNumbers.forEach((carNumber, i) => {
        const entry = this.entries.find(e => e.carNumber === carNumber);
        if (entry) {
          entry.completedLaps = args.completedLaps[i];
          entry.bestLapTime = args.bestLapTime[i];
        }
      });
    });

    this.socket.on('timerTick', (args: { remainingSeconds: number }) => {
      this.remainingSeconds = args.remainingSeconds;
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  formatLapTime(ms: number): string {
    if (ms === 0) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  enterFullscreen(): void {
    document.documentElement.requestFullscreen();
  }
}
