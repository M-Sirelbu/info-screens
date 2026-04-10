import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

type SessionStatus = 'notStarted' | 'active' | 'finished';
type RaceFlag = 'green' | 'yellow' | 'red' | 'finish';

@Component({
  selector: 'app-race-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-control.html',
  styleUrls: ['./race-control.scss'],
})
export class RaceControl implements OnInit, OnDestroy {
  private socket!: Socket;

  connected = false;
  sessionStatus: SessionStatus = 'notStarted';
  currentFlag: RaceFlag | '' = '';
  message = '';

   // Temporary until proper UI for entering the key is added
  accessKey = 'test-key';

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.socket.emit('selectRoom', { room: 'race-control', key: this.accessKey },
      (response: { status: string }) => {
        if (response.status === 'Success') {
          this.connected = true;
          this.message = 'Connected';
        } else if (response.status === 'Invalid Access Key') {
          this.connected = false;
          this.message = 'Invalid Access Key';
        } else {
          this.connected = false;
          this.message = response?.status ?? 'Connection failed';
      }
     }
    );
  });
    this.socket.on('disconnect', () => {
      this.connected = false;
      this.message = 'Connection lost';
    });

    this.socket.on('sessionStatus', (args: { status: SessionStatus }) => {
      this.sessionStatus = args.status;
    });

    this.socket.on('flagChanged', (args: { flag: RaceFlag }) => {
      this.currentFlag = args.flag;
    });
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

ngOnDestroy(): void {
  if (this.socket) {
    this.socket.disconnect();
    }
  }
}