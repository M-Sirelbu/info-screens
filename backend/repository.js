class Repository {
    sessions = [
        {
            sessionId: 0,
            driverNames: [],
            carNumbers: []
        }
    ];
    currentRace = {
        status: "notStarted",
        sessionId: null,
        carNumbers: null,
        driverNames: null,
        completedLaps: null,
        bestLapTime: null,
        lastLapStartTimes: null,
        flag: "red",
        remainingSeconds: null
    };
    defaultRaceDuration = null;
    defaultCountdownDuration = null;
    countdownInProgress = false;
    lastSessionId = 0;
    constructor(defaultRaceDuration, defaultCountdownDuration) {
        this.defaultRaceDuration = defaultRaceDuration;
        this.defaultCountdownDuration = defaultCountdownDuration;
    }
    loadSession(sessionId) {
        const oldSessionId = this.currentRace.sessionId;
        for (const session of this.sessions) {
            if (session.sessionId === sessionId) {
                this.currentRace.sessionId = sessionId;
                this.currentRace.carNumbers = JSON.parse(JSON.stringify(session.carNumbers));
                this.currentRace.driverNames = JSON.parse(JSON.stringify(session.driverNames));
                this.currentRace.completedLaps = [];
                this.currentRace.bestLapTime = [];
                this.currentRace.lastLapStartTimes = [];
                this.currentRace.remainingSeconds = this.defaultRaceDuration;
                this.currentRace.status = "notStarted";
                this.currentRace.flag = "red";
                this.countdownInProgress = false;
                for (let i = 0; i < session.carNumbers.length; i++) {
                    this.currentRace.completedLaps.push(0);
                    this.currentRace.bestLapTime.push(0);
                    this.currentRace.lastLapStartTimes.push(0);
                }
                if (oldSessionId !== null) {
                    for (let i = 0; i < this.sessions.length; i++) {
                        if (this.sessions[i].sessionId === oldSessionId) {
                            this.sessions.splice(i, 1);
                        break;
                        }
                    }
                }
                return "Success";
            }
        }
        return "Session not found";
    }

    getSession(sessionId) {
        for (const session of this.sessions) {
            if (session.sessionId === sessionId) {
                return session;
            }
        }
    }

    startRace() {
        if (this.currentRace.sessionId === null) {
            return {
                status: "Error",
                message: "No session loaded"
            };
        }
        this.currentRace.status = "active";
        this.currentRace.flag = "green";
        this.currentRace.remainingSeconds = this.defaultRaceDuration;
        const raceStartTimestamp = 0;
        for (let i = 0; i < this.currentRace.lastLapStartTimes.length; i++) {
            this.currentRace.lastLapStartTimes[i] = raceStartTimestamp;
        }
        return {
            status: "Success",
            race: this.currentRace
        };
    }

    finishRace() {
        if (this.currentRace.sessionId === null) {
            return {
                status: "Error",
                message: "No session loaded"
            };
        }

        if (this.currentRace.status !== "active") {
            return {
                status: "Error",
                message: "Race not running"
            };
        }

        this.currentRace.status = "finished";
        this.currentRace.flag = "finish";
        this.countdownInProgress = false;

        return {
            status: "Success",
            race: this.currentRace
        };
    }

    endSession() {
        if (this.currentRace.sessionId === null) {
            return;
        }

        if (this.currentRace.status !== "finished") {
            return;
        }

        this.currentRace = {
           status: "notStarted",
           sessionId: null,
           carNumbers: null,
           completedLaps: null,
           bestLapTime: null,
           flag: "red",
           remainingSeconds: null
       };
       this.countdownInProgress = false;

       return {
           status: "Success",
           race: this.currentRace
       };
    }

    getNextSession() {
        if (this.sessions.length === 0) {
            return {
                status: "Error",
                message: "No upcoming sessions"
            };
        }

        const nextSession = this.sessions[0];

        return {
            status: "Success",
            session: {
                sessionId: nextSession.sessionId,
                driverNames: nextSession.driverNames,
                carNumbers: nextSession.carNumbers
            }
        };
    }

    setFlag(flag) {
        const allowedFlags = ["green", "yellow", "red", "finish"];

        if (!allowedFlags.includes(flag)) {
            return "Invalid flag";
        }
        if (this.currentRace.status !== "active") {
            return "Race not Active";
        }
        if (this.currentRace.flag === flag) {
            return "Flag Not Changed";
        }

        this.currentRace.flag = flag;

        return "Success";
    }
    endRace() {
        this.currentRace.status = "finished";
    }
    beginStartCountdown() {
        if (this.currentRace.sessionId === null) {
            return "No session loaded";
        }
        if (this.currentRace.status !== "notStarted") {
            return "Invalid Session Status";
        }
        if (this.countdownInProgress) {
            return "Countdown in Progress"
        }
        this.countdownInProgress = true;

        return "Success";
    }

    addSession(driverNames, carNumbers) {
        this.sessions.push({
            sessionId: this.lastSessionId + 1,
            driverNames: driverNames,
            carNumbers: carNumbers
        });
        this.lastSessionId++;
    }

    updateSession(sessionId, driverNames, carNumbers) {
        if (sessionId === this.currentRace.sessionId) {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                this.sessions[i].driverNames = driverNames;
                this.sessions[i].carNumbers = carNumbers;
            }
        }
    }

    deleteSession(sessionId) {
        if (sessionId === this.currentRace.sessionId) {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                this.sessions.splice(i, 1);
            }
        }
    }

    addDriver(sessionId, driverName) {
        if (sessionId === this.currentRace.sessionId) {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                if (!(this.sessions[i].driverNames.length >= 8)) {
                    for (let j = 0; j < this.sessions[i].driverNames.length; j++) {
                        if (this.sessions[i].driverNames[j] === driverName) {
                            return;
                        }
                    }
                    for (let carNumber = 1; carNumber <= 8; carNumber++) {
                        let numberTaken = false;
                        for (const existingCarNumber of this.sessions[i].carNumbers) {
                            if (existingCarNumber === carNumber) {
                                numberTaken = true;
                                break;
                            }
                        }
                        if (!numberTaken) {
                            this.sessions[i].driverNames.push(driverName);
                            this.sessions[i].carNumbers.push(carNumber);
                            return;
                        }
                    }
                }
            }
        }
    }

    updateDriver(sessionId, driverName, newName) {
        if (sessionId === this.currentRace.sessionId) {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                for (let j = 0; j < this.sessions[i].driverNames.length; j++) {
                    if (this.sessions[i].driverNames[j] === driverName) {
                        this.sessions[i].driverNames[j] = newName;
                        return;
                    }
                }
            }
        }
    }

    deleteDriver(sessionId, driverName) {
        if (sessionId === this.currentRace.sessionId) {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                for (let j = 0; j < this.sessions[i].driverNames.length; j++) {
                    if (this.sessions[i].driverNames[j] === driverName) {
                        this.sessions[i].driverNames.splice(j, 1);
                        this.sessions[i].carNumbers.splice(j, 1);
                    }
                }
            }
        }

    }

    addLap(carNumber) {
        for (let i = 0; i < this.currentRace.carNumbers.length; i++) {
            if (this.currentRace.carNumbers[i] === carNumber) {
                if (this.currentRace.lastLapStartTimes[i] === 0) {
                    this.currentRace.lastLapStartTimes[i] = Date.now();
                    return;
                }
                this.currentRace.completedLaps[i]++;
                const lapTimeStamp = Date.now();
                const lapTime = (lapTimeStamp - this.currentRace.lastLapStartTimes[i]);
                this.currentRace.lastLapStartTimes[i] = lapTimeStamp;
                if (this.currentRace.bestLapTime[i] === 0) {
                    this.currentRace.bestLapTime[i] = lapTime;
                }
                else if (this.currentRace.bestLapTime[i] > lapTime) {
                    this.currentRace.bestLapTime[i] = lapTime;
                }
            }
        } 
    }

     // addSession, updateSession, addDriver, updateDriver, deleteDriver, etc have to be implemented
}

module.exports = Repository;

