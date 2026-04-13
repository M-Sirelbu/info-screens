import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

type NextSessionPayload = {
  sessionId: number;
  drivers: string[];
  cars: number[];
  status: string;
};

@Component({
  selector: 'app-next-race',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './next-race.html',
  styleUrls: ['./next-race.scss'],
})
export class NextRace implements OnInit, OnDestroy {
  private socket!: Socket;

  connected = false;
  message = '';
  nextSession: NextSessionPayload | null = null;

  ngOnInit(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      this.message = 'Connected';

      this.socket.emit('selectRoom', { room: 'next-race' }, (response?: { status?: string }) => {
        if (response?.status && response.status !== 'Success') {
          this.message = response.status;
        }
      });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.message = 'Connection lost';
    });

    this.socket.on('next_session', (data: NextSessionPayload) => {
      this.nextSession = data;
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  getDriverCarPairs(): Array<{ driver: string; car: number | null }> {
    if (!this.nextSession) {
      return [];
    }

    return this.nextSession.drivers.map((driver, index) => ({
      driver,
      car: this.nextSession?.cars[index] ?? null,
    }));
  }
}