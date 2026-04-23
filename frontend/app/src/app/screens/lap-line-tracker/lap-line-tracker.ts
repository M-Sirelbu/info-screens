import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

type SessionStatus = 'notStarted' | 'active' | 'finished';

type SessionUpdatePayload = {
  sessionId: number;
  driverNames: string[];
  carNumbers: number[];
};

@Component({
  selector: 'app-lap-line-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lap-line-tracker.html',
  styleUrl: './lap-line-tracker.scss',
})
export class LapLineTracker implements OnInit, OnDestroy {
  currentFlag: string = 'red';
  private socket!: Socket;
  private pendingLogin = false;
  private loginTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private cdr = inject(ChangeDetectorRef);

  carNumbers: number[] = [];

  accessKey = '';
  isAuthenticated = false;
  isConnecting = false;
  isConnected = false;
  authError = '';
  statusMessage = 'Enter access key to connect.';
  sessionStatus: SessionStatus = 'notStarted';

  private hasRaceProgressed = false;

  ngOnInit(): void {
    this.socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    this.socket.on('flagChanged', (args: { flag: string }) => {
      this.currentFlag = args.flag;
      this.cdr.detectChanges();
    });

    this.socket.on('connect', () => {
      if (this.pendingLogin || this.isAuthenticated) {
        this.pendingLogin = false;
        this.isConnected = true;
        this.joinLapLineRoom();
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      if (this.isAuthenticated) {
        this.statusMessage = 'Connection lost. Reconnecting...';
      }
      this.cdr.detectChanges();
    });

    this.socket.on('connect_error', () => {
      this.clearLoginTimeout();
      if (this.isAuthenticated) {
        this.authError = '';
      } else {
        this.pendingLogin = false;
        this.isConnecting = false;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.authError = 'Unable to connect to server.';
        this.statusMessage = 'Authentication required.';
      }
      this.cdr.detectChanges();
    });

    this.socket.on('sessionStatus', (args: { status: SessionStatus }) => {
      const previousStatus = this.sessionStatus;
      this.sessionStatus = args.status;

      if (args.status === 'active' || args.status === 'finished') {
        this.hasRaceProgressed = true;
      }

      if (args.status === 'active') {
        this.statusMessage = 'Race active. Tap car buttons as cars cross the line.';
      } else if (args.status === 'finished') {
        this.statusMessage = 'Finish mode active. Final laps can still be recorded.';
      } else if (args.status === 'notStarted' && this.hasRaceProgressed && previousStatus !== 'notStarted') {
        this.statusMessage = 'Race session ended. Lap input is disabled between sessions.';
      } else {
        this.statusMessage = 'Waiting for race start.';
      }

      this.cdr.detectChanges();
    });

    this.socket.on('sessionUpdate', (args: SessionUpdatePayload) => {
      this.applyCarNumbers(args.carNumbers);
      this.cdr.detectChanges();
    });

    this.socket.on('lapTimes', (args: { carNumbers: number[] }) => {
      this.applyCarNumbers(args.carNumbers);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.clearLoginTimeout();
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  connect(): void {
    if (!this.accessKey.trim() || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.authError = '';
    this.statusMessage = 'Connecting...';
    this.startLoginTimeout();

    if (this.socket.connected) {
      this.joinLapLineRoom();
      return;
    }

    this.pendingLogin = true;
    this.socket.connect();
  }

  sendLap(carNumber: number): void {
    if (!this.canRecordLaps) {
      return;
    }

    this.socket.emit('lap', { carNumber });
  }

  get canRecordLaps(): boolean {
    return this.isAuthenticated && this.isConnected && this.sessionStatus !== 'notStarted' && this.currentFlag !== 'red';
  }

  trackByCarNumber(_index: number, carNumber: number): number {
    return carNumber;
  }

  private joinLapLineRoom(): void {
    this.socket.timeout(5000).emit(
      'selectRoom',
      { room: 'lap-line-tracker', key: this.accessKey },
      (err: Error | null, response: { status: string }) => {
        this.clearLoginTimeout();
        if (err) {
          this.isConnecting = false;
          this.isConnected = false;
          this.isAuthenticated = false;
          this.authError = 'Server did not respond in time. Please try again.';
          this.statusMessage = 'Authentication required.';
          this.cdr.detectChanges();
          return;
        }

        this.isConnecting = false;

        if (response?.status === 'Success') {
          this.isAuthenticated = true;
          this.authError = '';
          this.statusMessage = 'Connected. Waiting for race start.';
          this.cdr.detectChanges();
          return;
        }

        this.isAuthenticated = false;
        this.authError = response?.status === 'Invalid Access Key'
          ? 'Invalid access key. Please try again.'
          : (response?.status ?? 'Room connection failed.');
        this.statusMessage = 'Authentication required.';
        this.socket.disconnect();
        this.cdr.detectChanges();
      }
    );
  }

  private startLoginTimeout(): void {
    this.clearLoginTimeout();
    this.loginTimeoutId = setTimeout(() => {
      if (!this.isConnecting) {
        return;
      }
      this.pendingLogin = false;
      this.isAuthenticated = false;
      this.isConnected = false;
      this.isConnecting = false;
      this.authError = 'Connection timed out. Please try again.';
      this.statusMessage = 'Authentication required.';
      this.socket.disconnect();
      this.cdr.detectChanges();
    }, 8000);
  }

  private clearLoginTimeout(): void {
    if (this.loginTimeoutId !== null) {
      clearTimeout(this.loginTimeoutId);
      this.loginTimeoutId = null;
    }
  }

  private applyCarNumbers(carNumbers: number[]): void {
    if (!Array.isArray(carNumbers)) {
      return;
    }

    const normalized = carNumbers
      .filter((value, index, source) => Number.isInteger(value) && value > 0 && source.indexOf(value) === index);

    this.carNumbers = normalized;
  }
}
