import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

interface Driver {
  driverName: string;
  carNumber: number;
}

interface Session {
  sessionId: number;
  driverNames: string[];
  carNumbers: number[];
  locked?: boolean; 
}

@Component({
  selector: 'app-front-desk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './front-desk.html',
  styleUrls: ['./front-desk.scss']
})
export class FrontDeskComponent implements OnInit, OnDestroy {

  private socket!: Socket;
  private pendingLogin = false;
  private loginTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly lockedSessionIds = new Set<number>();
  private cdr = inject(ChangeDetectorRef);

  sessions: Session[] = [];
  accessKey: string = '';
  isAuthenticated: boolean = false;
  authError: string = '';
  isConnecting: boolean = false;
  expandedSessionId: number | null = null;
  newDriverName: string = '';
  editingDriver: { sessionId: number; driverName: string } | null = null;
  editingNewName: string = '';

  ngOnInit(): void {
    this.initSocket();
  }

  ngOnDestroy(): void {
    this.clearLoginTimeout();
    if (this.socket) {
      this.socket.disconnect();
    }
  }


  private initSocket(): void {
    this.socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    this.socket.on('connect', () => {
      if (this.pendingLogin || this.isAuthenticated) {
        this.pendingLogin = false;
        this.joinRoom();
      }
    });

    this.socket.on('connect_error', () => {
      this.clearLoginTimeout();
      this.isConnecting = false;
      this.pendingLogin = false;
      this.isAuthenticated = false;
      this.authError = 'Cannot connect to server. Please check backend and try again.';
      this.cdr.detectChanges();
    });

    this.socket.on('sessionsUpdated', (data: { sessions: Session[] }) => {
      this.sessions = data.sessions.map(session => ({
        ...session,
        locked: session.locked === true || this.lockedSessionIds.has(session.sessionId)
      }));
      this.cdr.detectChanges();
    });

    this.socket.on('sessionStarted', (data: { sessionId: number }) => {
      this.lockedSessionIds.add(data.sessionId);
      const session = this.sessions.find(s => s.sessionId === data.sessionId);
      if (session) {
        session.locked = true;
        this.cdr.detectChanges();
      }
    });
  }

  login(): void {
    if (!this.accessKey.trim() || this.isConnecting) return;

    this.isConnecting = true;
    this.authError = '';
    this.startLoginTimeout();

    if (this.socket.connected) {
      this.joinRoom();
      return;
    }

    this.pendingLogin = true;
    this.socket.connect();
  }

  private joinRoom(): void {
    this.socket.timeout(5000).emit(
      'selectRoom',
      { room: 'front-desk', key: this.accessKey },
      (err: Error | null, response: { status: string }) => {
        this.clearLoginTimeout();
        if (err) {
          this.isConnecting = false;
          this.isAuthenticated = false;
          this.authError = 'Server did not respond in time. Please try again.';
          this.cdr.detectChanges();
          return;
        }

        this.isConnecting = false;
        if (response.status === 'Success') {
          this.isAuthenticated = true;
          this.authError = '';
        } else {
          this.authError = 'Invalid code. Please try again.';
          this.isAuthenticated = false;
        }
        this.cdr.detectChanges();
      }
    );
  }

  private startLoginTimeout(): void {
    this.clearLoginTimeout();
    this.loginTimeoutId = setTimeout(() => {
      if (!this.isConnecting) {
        return;
      }
      this.pendingLogin = false;
      this.isAuthenticated = false;
      this.isConnecting = false;
      this.authError = 'Connection timed out. Please try again.';
      this.socket.disconnect();
      this.cdr.detectChanges();
    }, 8000);
  }

  private clearLoginTimeout(): void {
    if (this.loginTimeoutId !== null) {
      clearTimeout(this.loginTimeoutId);
      this.loginTimeoutId = null;
    }
  }

  createSession(): void {
    this.socket.emit('sessionCreated');
  }

  removeSession(sessionId: number): void {
    this.socket.emit('sessionRemoved', { sessionId });
  }

  toggleExpand(sessionId: number): void {
    this.expandedSessionId = this.expandedSessionId === sessionId ? null : sessionId;
    this.newDriverName = '';
  }



  addDriver(sessionId: number): void {
    const name = this.newDriverName.trim();
    if (!name) return;

    this.socket.emit('driverAdded', { sessionId, driverName: name });
    this.newDriverName = '';
  }

  startEdit(sessionId: number, driverName: string): void {
    this.editingDriver = { sessionId, driverName };
    this.editingNewName = driverName;
  }

  confirmEdit(): void {
    if (!this.editingDriver) return;
    const newName = this.editingNewName.trim();
    if (!newName || newName === this.editingDriver.driverName) {
      this.cancelEdit();
      return;
    }

    this.socket.emit('driverEdited', {
      sessionId: this.editingDriver.sessionId,
      driverName: this.editingDriver.driverName,
      newName
    });
    this.editingDriver = null;
  }

  cancelEdit(): void {
    this.editingDriver = null;
    this.editingNewName = '';
  }

  removeDriver(sessionId: number, driverName: string): void {
    this.socket.emit('driverRemoved', { sessionId, driverName });
  }

  isLocked(session: Session): boolean {
    return session.locked === true;
  }

  isEditing(sessionId: number, driverName: string): boolean {
    return (
      this.editingDriver?.sessionId === sessionId &&
      this.editingDriver?.driverName === driverName
    );
  }

  getDrivers(session: Session): Driver[] {
    return session.driverNames.map((name, i) => ({
      driverName: name,
      carNumber: session.carNumbers[i]
    }));
  }

  canAddDriver(session: Session): boolean {
    return session.driverNames.length < 8 && !this.isLocked(session);
  }

  onKeyDown(event: KeyboardEvent, action: 'addDriver' | 'confirmEdit', sessionId?: number): void {
    if (event.key === 'Enter') {
      if (action === 'addDriver' && sessionId !== undefined) {
        this.addDriver(sessionId);
      } else if (action === 'confirmEdit') {
        this.confirmEdit();
      }
    }
    if (event.key === 'Escape' && action === 'confirmEdit') {
      this.cancelEdit();
    }
  }
}

export { FrontDeskComponent as FrontDesk };