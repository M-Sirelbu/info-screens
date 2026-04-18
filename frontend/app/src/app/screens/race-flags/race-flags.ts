import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  connected = false;
  currentFlag: RaceFlag | '' = '';
  message = '';

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      this.message = 'Connected';
      this.cdr.detectChanges();

      this.socket.emit('selectRoom', { room: 'race-flags' }, (response: { status: string }) => {
        this.message = response?.status ?? 'Room selected';
        this.cdr.detectChanges();
      });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.message = 'Connection lost';
      this.cdr.detectChanges();
    });

    this.socket.on('flagChanged', (args: { flag: RaceFlag }) => {
      this.currentFlag = args.flag;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  enterFullscreen(): void {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn('Fullscreen failed:', err);
    });
  }
}