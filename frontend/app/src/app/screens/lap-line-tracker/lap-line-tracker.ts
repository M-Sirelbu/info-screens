import { Component, OnDestroy, OnInit } from '@angular/core';
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
  private socket!: Socket;

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
    this.socket = io({ autoConnect: false, reconnection: true });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.joinLapLineRoom();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      if (this.isAuthenticated) {
        this.statusMessage = 'Connection lost. Reconnecting...';
      }
    });

    this.socket.on('connect_error', () => {
      this.isConnecting = false;
      this.isConnected = false;
      this.statusMessage = 'Unable to connect to server.';
    });

    this.socket.on('sessionStatus', (args: { status: SessionStatus }) => {
      const previousStatus = this.sessionStatus;
      this.sessionStatus = args.status;

      if (args.status === 'active' || args.status === 'finished') {
        this.hasRaceProgressed = true;
      }

      if (args.status === 'active') {
        this.statusMessage = 'Race active. Tap car buttons as cars cross the line.';
        return;
      }

      if (args.status === 'finished') {
        this.statusMessage = 'Finish mode active. Final laps can still be recorded.';
        return;
      }

      if (args.status === 'notStarted' && this.hasRaceProgressed && previousStatus !== 'notStarted') {
        this.statusMessage = 'Race session ended. Lap input is disabled between sessions.';
        return;
      }

      this.statusMessage = 'Waiting for race start.';
    });

    this.socket.on('sessionUpdate', (args: SessionUpdatePayload) => {
      this.applyCarNumbers(args.carNumbers);
    });

    this.socket.on('lapTimes', (args: { carNumbers: number[] }) => {
      this.applyCarNumbers(args.carNumbers);
    });
  }

  ngOnDestroy(): void {
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

    if (this.socket.connected) {
      this.joinLapLineRoom();
      return;
    }

    this.socket.connect();
  }

  sendLap(carNumber: number): void {
    if (!this.canRecordLaps) {
      return;
    }

    this.socket.emit('lap', { carNumber });
  }

  get canRecordLaps(): boolean {
    return this.isAuthenticated && this.isConnected && this.sessionStatus !== 'notStarted';
  }

  trackByCarNumber(_index: number, carNumber: number): number {
    return carNumber;
  }

  private joinLapLineRoom(): void {
    this.socket.emit(
      'selectRoom',
      { room: 'lap-line-tracker', key: this.accessKey },
      (response: { status: string }) => {
        this.isConnecting = false;

        if (response?.status === 'Success') {
          this.isAuthenticated = true;
          this.authError = '';
          this.statusMessage = 'Connected. Waiting for race start.';
          return;
        }

        this.isAuthenticated = false;
        this.authError = response?.status === 'Invalid Access Key'
          ? 'Invalid access key. Please try again.'
          : (response?.status ?? 'Room connection failed.');
        this.statusMessage = 'Authentication required.';
        this.socket.disconnect();
      }
    );
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
