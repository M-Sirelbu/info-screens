import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

type RaceFlag = 'green' | 'yellow' | 'red' | 'finish';

@Component({
  selector: 'app-race-flags',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-flags.html',
  styleUrls: ['./race-flags.scss'],
})
export class RaceFlags implements OnInit, OnDestroy {
  private socket!: Socket;

  connected = false;
  currentFlag: RaceFlag | '' = '';
  message = '';

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      this.message = 'Connected';

      this.socket.emit('selectRoom', { room: 'race-flags' }, (response: { status: string }) => {
        this.message = response?.status ?? 'Room selected';
      });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.message = 'Connection lost';
    });

    this.socket.on('flagChanged', (args: { flag: RaceFlag }) => {
      this.currentFlag = args.flag;
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}