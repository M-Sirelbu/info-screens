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
  private readonly storageKey = 'front-desk-access-key';

  sessions: Session[] = [];
  accessKey: string = '';
  isAuthenticated: boolean = false;
  authError: string = '';
  isConnecting: boolean = false;
  expandedSessionId: number | null = null;
  newDriverNames: Record<number, string> = {};
  editingDriver: { sessionId: number; driverName: string } | null = null;
  editingNewName: string = '';
  readonly carOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

  ngOnInit(): void {
    this.accessKey = localStorage.getItem(this.storageKey) ?? '';
    this.initSocket();

    if (this.accessKey) {
      this.login();
    }
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
      if (this.isAuthenticated) {
        this.authError = '';
      } else {
        this.isConnecting = false;
        this.pendingLogin = false;
        this.isAuthenticated = false;
        this.authError = 'Cannot connect to server. Please check backend and try again.';
      }
      this.cdr.detectChanges();
    });

    this.socket.on('sessionsUpdated', (sessions: Session[]) => {
      const activeSessionIds = new Set(sessions.map((session) => session.sessionId));
      this.pruneLockedSessionIds(activeSessionIds);
      this.pruneNewDriverNames(activeSessionIds);
      this.clearStaleUiState(activeSessionIds);
      this.sessions = sessions.map(session => ({
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

    const trimmedAccessKey = this.accessKey.trim();

    if (!this.accessKey.trim() || this.isConnecting) return;

    this.accessKey = trimmedAccessKey;
    localStorage.setItem(this.storageKey, this.accessKey);

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
          if (!this.isAuthenticated) {
            this.isAuthenticated = false;
            this.authError = 'Server did not respond in time. Please try again.';
          }
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
    if (this.expandedSessionId === sessionId) {
      delete this.newDriverNames[sessionId];
      this.expandedSessionId = null;
      return;
    }

    this.expandedSessionId = sessionId;
  }



  addDriver(sessionId: number): void {
    const name = this.getNewDriverName(sessionId).trim();
    if (!name) return;

    this.socket.emit('driverAdded', { sessionId, driverName: name });
    delete this.newDriverNames[sessionId];
  }

  changeDriverCar(sessionId: number, driverName: string, carNumber: number): void {
    if (!Number.isInteger(carNumber) || carNumber < 1 || carNumber > 8) {
      return;
    }

    const session = this.sessions.find((item) => item.sessionId === sessionId);
    if (!session) {
      return;
    }

    const currentIndex = session.driverNames.findIndex((name) => name === driverName);
    if (currentIndex === -1) {
      return;
    }

    const currentCar = session.carNumbers[currentIndex];
    if (currentCar === carNumber) {
      return;
    }

    const isTaken = session.carNumbers.some((assignedCar, index) => assignedCar === carNumber && index !== currentIndex);
    if (isTaken) {
      return;
    }

    session.carNumbers[currentIndex] = carNumber;

    this.socket.emit('driverCarEdited', {
      sessionId,
      driverName,
      carNumber
    });
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

  getNewDriverName(sessionId: number): string {
    return this.newDriverNames[sessionId] ?? '';
  }

  canAddDriver(session: Session): boolean {
    return session.driverNames.length < 8 && !this.isLocked(session);
  }

  trackBySessionId(_index: number, session: Session): number {
    return session.sessionId;
  }

  trackByDriverName(_index: number, driverName: string): string {
    return driverName;
  }

  getAvailableCars(session: Session, currentCar: number): number[] {
    const usedCars = new Set(session.carNumbers.filter((carNumber) => carNumber !== currentCar));
    const options: number[] = [];

    for (let car = 1; car <= 8; car++) {
      if (!usedCars.has(car)) {
        options.push(car);
      }
    }

    return options;
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

  private pruneLockedSessionIds(activeSessionIds: Set<number>): void {
    for (const sessionId of this.lockedSessionIds) {
      if (!activeSessionIds.has(sessionId)) {
        this.lockedSessionIds.delete(sessionId);
      }
    }
  }

  private pruneNewDriverNames(activeSessionIds: Set<number>): void {
    for (const sessionId of Object.keys(this.newDriverNames)) {
      const numericSessionId = Number(sessionId);
      if (!activeSessionIds.has(numericSessionId)) {
        delete this.newDriverNames[numericSessionId];
      }
    }
  }

  private clearStaleUiState(activeSessionIds: Set<number>): void {
    if (this.expandedSessionId !== null && !activeSessionIds.has(this.expandedSessionId)) {
      this.expandedSessionId = null;
    }

    if (this.editingDriver && !activeSessionIds.has(this.editingDriver.sessionId)) {
      this.cancelEdit();
    }
  }
}

export { FrontDeskComponent as FrontDesk };
