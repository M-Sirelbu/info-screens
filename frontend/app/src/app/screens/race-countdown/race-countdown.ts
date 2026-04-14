import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-race-countdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-countdown.html',
  styleUrls: ['./race-countdown.scss'],
})
export class RaceCountdown implements OnInit, OnDestroy {
  private socket!: Socket;

  connected = false;
  countdown: number | null = null;
  intervalId: any;

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;

      this.socket.emit('selectRoom', { room: 'race-countdown' });
    });

    this.socket.on('raceStartCountdown', () => {
      this.startCountdown();
    });
  }

  startCountdown(): void {
    this.countdown = 10;

    this.intervalId = setInterval(() => {
      if (this.countdown !== null) {
        this.countdown--;

        if (this.countdown <= 0) {
          clearInterval(this.intervalId);
          this.countdown = null;
        }
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.socket) this.socket.disconnect();
    if (this.intervalId) clearInterval(this.intervalId);
  }
}