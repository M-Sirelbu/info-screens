import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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

type SessionUpdatePayload = {
  sessionId: number;
  driverNames: string[];
  carNumbers: number[];
};

@Component({
  selector: 'app-leader-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leader-board.html',
  styleUrl: './leader-board.scss',
})
export class LeaderBoard implements OnInit, OnDestroy {
  private socket!: Socket;
  private cdr = inject(ChangeDetectorRef);

  sessionStatus: SessionStatus = 'notStarted';
  currentFlag: RaceFlag | null = null;
  remainingSeconds = 0;
  entries: LeaderboardEntry[] = [];
  connectionError: string | null = null;

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
        if (response?.status !== 'Success') {
          this.connectionError = 'Connection failed: ' + (response?.status ?? 'Unknown error');
        } else {
          this.connectionError = null;
        }
        this.cdr.detectChanges();
      });
    });

    this.socket.on('sessionUpdate', (args: { sessionId: number; driverNames: string[]; carNumbers: number[] }) => {
      this.syncSessionEntries(args);
      this.cdr.detectChanges();
    });

    this.socket.on('nextSessionUpdate', (args: unknown) => {
      if (!this.isSessionUpdatePayload(args)) {
        return;
      }

      if (this.sessionStatus === 'notStarted') {
        this.syncSessionEntries(args);
      }
      this.cdr.detectChanges();
    });

    this.socket.on('sessionStatus', (args: { status: SessionStatus }) => {
      this.sessionStatus = args.status;
      this.cdr.detectChanges();
    });

    this.socket.on('flagChanged', (args: { flag: RaceFlag }) => {
      this.currentFlag = args.flag;
      this.cdr.detectChanges();
    });

    this.socket.on('lapTimes', (args: { carNumbers: number[]; completedLaps: number[]; bestLapTime: number[] }) => {
      args.carNumbers.forEach((carNumber, i) => {
        let entry = this.entries.find(e => e.carNumber === carNumber);

        if (!entry) {
          entry = {
            carNumber,
            driverName: `Car ${carNumber}`,
            completedLaps: 0,
            bestLapTime: 0,
          };
          this.entries.push(entry);
        }

        entry.completedLaps = args.completedLaps[i] ?? entry.completedLaps;
        entry.bestLapTime = args.bestLapTime[i] ?? entry.bestLapTime;
      });
      this.cdr.detectChanges();
    });

    this.socket.on('timerTick', (args: { remainingSeconds: number }) => {
      this.remainingSeconds = args.remainingSeconds;
      this.cdr.detectChanges();
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

  private syncSessionEntries(args: SessionUpdatePayload): void {
    this.entries = args.carNumbers.map((carNumber, i) => {
      const previous = this.entries.find((entry) => entry.carNumber === carNumber);
      return {
        carNumber,
        driverName: args.driverNames[i] ?? `Car ${carNumber}`,
        completedLaps: previous?.completedLaps ?? 0,
        bestLapTime: previous?.bestLapTime ?? 0,
      };
    });
  }

  private isSessionUpdatePayload(data: unknown): data is SessionUpdatePayload {
    return !!data
      && typeof data === 'object'
      && 'sessionId' in data
      && 'driverNames' in data
      && 'carNumbers' in data
      && Array.isArray((data as SessionUpdatePayload).driverNames)
      && Array.isArray((data as SessionUpdatePayload).carNumbers);
  }

  enterFullscreen(): void {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn('Fullscreen failed:', err);
    });
  }
}
