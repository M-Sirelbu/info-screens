import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

type SessionStatus = 'notStarted' | 'active' | 'finished';
type RaceFlag = 'green' | 'yellow' | 'red' | 'finish';

type NextSessionPayload = {
  sessionId: number;
  driverNames: string[];
  carNumbers: number[];
  message?: string;
};

@Component({
  selector: 'app-race-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './race-control.html',
  styleUrls: ['./race-control.scss'],
})
export class RaceControl implements OnInit, OnDestroy {
  private socket!: Socket;
  private pendingLogin = false;
  private loginTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private cdr = inject(ChangeDetectorRef);

  connected = false;
  sessionStatus: SessionStatus = 'notStarted';
  currentFlag: RaceFlag | '' = '';
  message = '';
  authError = '';
  isConnecting = false;
  nextSessionMessage = '';

  accessKey = '';

  ngOnInit(): void {
    this.socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    this.socket.on('connect', () => {
      if (this.pendingLogin || this.connected) {
        this.pendingLogin = false;
        this.joinRaceControlRoom();
      }
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      if (this.accessKey.trim()) {
        this.message = 'Connection lost';
      }
      this.cdr.detectChanges();
    });

    this.socket.on('connect_error', () => {
      this.clearLoginTimeout();
      if (this.connected) {
        this.authError = '';
      } else {
        this.connected = false;
        this.pendingLogin = false;
        this.isConnecting = false;
        this.authError = 'Unable to connect to server.';
        this.message = 'Authentication required.';
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

    this.socket.on('nextSessionUpdate', (data: unknown) => {
      if (this.isNextSessionPayload(data)) {
        this.nextSessionMessage = '';
        this.cdr.detectChanges();
        return;
      }

      if (data && typeof data === 'object' && 'message' in data) {
        this.nextSessionMessage = String((data as { message?: string }).message ?? 'No upcoming races');
        this.cdr.detectChanges();
      }
    });
  }

  connect(): void {
    if (!this.accessKey.trim() || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.authError = '';
    this.message = 'Connecting...';
    this.startLoginTimeout();

    if (this.socket.connected) {
      this.joinRaceControlRoom();
      return;
    }

    this.pendingLogin = true;
    this.socket.connect();
  }

  startRaceCountdown(): void {
    if (!this.socket || !this.connected) {
    this.message = 'Not connected';
    return;
  }
    this.socket.emit('raceStartCountdown', {}, (response: { status: string }) => {
      this.message = response?.status ?? 'Command sent';
    });
  }

  changeFlag(flag: RaceFlag): void {
    if (!this.socket || !this.connected) {
    this.message = 'Not connected';
    return;
  }
    this.socket.emit('raceFlag', { flag }, (response: { status: string }) => {
      this.message = response?.status ?? 'Flag updated';
    });
  }

  endSession(): void {
    if (!this.socket || !this.connected) {
    this.message = 'Not connected';
    return;
  }
    this.socket.emit('sessionEnd', {});
    this.message = 'Session end command sent';
  }

  canStartRace(): boolean {
    return this.connected && this.sessionStatus === 'notStarted';
  }

  canUseFlags(): boolean {
    return this.connected && this.sessionStatus === 'active';
  }

  canEndSession(): boolean {
    return this.connected && this.sessionStatus === 'finished';
  }

  showRaceControls(): boolean {
    return this.connected && this.sessionStatus !== 'finished';
  }

  showEndSessionButton(): boolean {
    return this.connected && this.sessionStatus === 'finished';
  }

  private isNextSessionPayload(data: unknown): data is NextSessionPayload {
    return !!data
      && typeof data === 'object'
      && 'sessionId' in data
      && 'driverNames' in data
      && 'carNumbers' in data
      && Array.isArray((data as NextSessionPayload).driverNames)
      && Array.isArray((data as NextSessionPayload).carNumbers);
  }

  private joinRaceControlRoom(): void {
    this.socket.timeout(5000).emit(
      'selectRoom',
      { room: 'race-control', key: this.accessKey },
      (err: Error | null, response: { status: string }) => {
        this.clearLoginTimeout();
        if (err) {
          this.isConnecting = false;
          this.connected = false;
          this.authError = 'Server did not respond in time. Please try again.';
          this.message = 'Authentication required.';
          this.cdr.detectChanges();
          return;
        }

        this.isConnecting = false;

        if (response?.status === 'Success') {
          this.connected = true;
          this.authError = '';
          this.message = 'Connected';
          this.cdr.detectChanges();
          return;
        }

        this.connected = false;
        this.authError = response?.status === 'Invalid Access Key'
          ? 'Invalid access key. Please try again.'
          : (response?.status ?? 'Authentication failed.');
        this.message = 'Authentication required.';
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
      this.connected = false;
      this.isConnecting = false;
      this.authError = 'Connection timed out. Please try again.';
      this.message = 'Authentication required.';
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

  ngOnDestroy(): void {
    this.clearLoginTimeout();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}