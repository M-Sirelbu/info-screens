import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

type NextSessionPayload = {
  sessionId: number;
  driverNames: string[];
  carNumbers: number[];
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
      this.socket.emit('selectRoom', { room: 'next-race' }, (response?: { status?: string }) => {
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
  
    this.socket.on('nextSessionUpdate', (data: any) => {
      if (data?.driverNames && data?.carNumbers) {
        this.nextSession = data;
      } else {
        this.nextSession = null;
        this.message = data?.message ?? 'No upcoming session available';
      }
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
    return this.nextSession.driverNames.map((driver, index) => ({
      driver,
      car: this.nextSession?.carNumbers[index] ?? null,
    }));
  }
  enterFullscreen(): void {
    document.documentElement.requestFullscreen();
  }
}