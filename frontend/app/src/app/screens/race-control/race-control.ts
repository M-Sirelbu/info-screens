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

  ngOnInit() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      this.message = 'Ühendus loodud';

      this.socket.emit('selectRoom', { room: 'race-control' }, (response: { status: string }) => {
        this.message = response?.status ?? 'Room valitud';
      });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.message = 'Ühendus katkes';
    });

    this.socket.on('sessionStatus', (args: { status: SessionStatus }) => {
      this.sessionStatus = args.status;
    });

    this.socket.on('flagChanged', (args: { flag: RaceFlag }) => {
      this.currentFlag = args.flag;
    });
  }

  startRaceCountdown(): void {
    this.socket.emit('raceStartCountdown', {}, (response: { status: string }) => {
      this.message = response?.status ?? 'Käsk saadetud';
    });
  }

  changeFlag(flag: RaceFlag): void {
    this.socket.emit('raceFlag', { flag }, (response: { status: string }) => {
      this.message = response?.status ?? 'Lipp muudetud';
    });
  }

  endSession(): void {
    this.socket.emit('sessionEnd', {});
    this.message = 'Sessiooni lõpetamise käsk saadetud';
  }

  canStartRace(): boolean {
    return this.connected && this.sessionStatus === 'notStarted';
  }

  canUseFlags(): boolean {
    return this.connected && this.sessionStatus === 'active';
  }

  canEndSession(): boolean {
    return this.connected && this.sessionStatus !== 'notStarted';
  }

ngOnDestroy(): void {
  if (this.socket) {
    this.socket.disconnect();
    }
  }
}
