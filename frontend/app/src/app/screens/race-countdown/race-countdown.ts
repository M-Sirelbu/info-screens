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
  message = '';

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.socket.emit('selectRoom', { room: 'race-countdown' },
        (response?: { status?: string }) => {
          if (response?.status === 'Success') {
            this.connected = true;
            this.message = 'Connected';
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

    this.socket.on('startCountdown', (args: { duration: number }, 
      callback?: (response: { status: string}) => void
    ) => {
      this.startCountdown(args?.duration ?? 10);

      if (callback) {
      callback({ status: 'Success' });
      }
     }
    );
  }

  startCountdown(duration: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.countdown = duration;

    this.intervalId = setInterval(() => {
      if (this.countdown !== null) {
        this.countdown--;

        if (this.countdown <= 0) {
          clearInterval(this.intervalId);
          this.intervalId = null;
          this.countdown = null;
        }
      }
    }, 1000);
  }

  enterFullscreen(): void {
  document.documentElement.requestFullscreen();
}

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}