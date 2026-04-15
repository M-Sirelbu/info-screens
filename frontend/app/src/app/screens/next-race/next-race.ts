import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

type NextSessionPayload = {
  sessionId: number;
  driverNames: string[];
  carNumbers: number[];
  status?: string;
  message?: string;
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
  
    this.socket.on('nextSessionUpdate', (data: unknown) => {
      if (this.isNextSessionPayload(data)) {
        this.nextSession = data;
        this.message = '';
        return;
      }

      if (data && typeof data === 'object' && 'message' in data) {
        this.nextSession = null;
        this.message = String((data as { message?: string }).message ?? 'No upcoming session available');
        return;
      }

      this.message = 'Unexpected update received';
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
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