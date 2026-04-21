class Repository {
    sessions = [];
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
    lastSessionId = -1;
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

    loadEmptySession() {
        const oldSessionId = this.currentRace.sessionId;
        this.currentRace = {
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
           driverNames: null,
           completedLaps: null,
           bestLapTime: null,
           lastLapStartTimes: null,
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
        if (this.currentRace.sessionId === null) {
            return "No session loaded";
        }
        if (this.currentRace.status !== "active") {
            return "Race not Active";
        }        
        this.currentRace.status = "finished";
        this.currentRace.flag = "finish";
        this.countdownInProgress = false;
        return "Success";        
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
        const trimmedDriverName = String(driverName ?? "").trim();
        if (trimmedDriverName === "") {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                if (!(this.sessions[i].driverNames.length >= 8)) {
                    for (let j = 0; j < this.sessions[i].driverNames.length; j++) {
                        if (this.sessions[i].driverNames[j].toLowerCase() === trimmedDriverName.toLowerCase()) {
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
                            this.sessions[i].driverNames.push(trimmedDriverName);
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
        const trimmedNewName = String(newName ?? "").trim();
        if (trimmedNewName === "") {
            return;
        }
        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                const driverIndex = this.sessions[i].driverNames.indexOf(driverName);
                if (driverIndex === -1) {
                    return;
                }
                for (let j = 0; j < this.sessions[i].driverNames.length; j++) {
                    if (j !== driverIndex && this.sessions[i].driverNames[j].toLowerCase() === trimmedNewName.toLowerCase()) {
                        return;
                    }
                }
                this.sessions[i].driverNames[driverIndex] = trimmedNewName;
                return;
            }
        }
    }

    updateDriverCar(sessionId, driverName, newCarNumber) {
        if (sessionId === this.currentRace.sessionId) {
            return "Session locked";
        }

        const parsedCarNumber = Number(newCarNumber);
        if (!Number.isInteger(parsedCarNumber) || parsedCarNumber < 1 || parsedCarNumber > 8) {
            return "Invalid car number";
        }

        for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].sessionId === sessionId) {
                const driverIndex = this.sessions[i].driverNames.indexOf(driverName);
                if (driverIndex === -1) {
                    return "Driver not found";
                }

                for (let j = 0; j < this.sessions[i].carNumbers.length; j++) {
                    if (j !== driverIndex && this.sessions[i].carNumbers[j] === parsedCarNumber) {
                        return "Car already taken";
                    }
                }

                this.sessions[i].carNumbers[driverIndex] = parsedCarNumber;
                return "Success";
            }
        }

        return "Session not found";
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

        if (this.currentRace.status !== "active") {
            return "Race not Active";
        }

        if (!Array.isArray(this.currentRace.carNumbers) ||
            !Array.isArray(this.currentRace.completedLaps) ||
            !Array.isArray(this.currentRace.bestLapTime) ||
            !Array.isArray(this.currentRace.lastLapStartTimes)) {
            return "No session loaded";
        }        

        for (let i = 0; i < this.currentRace.carNumbers.length; i++) {
            if (this.currentRace.carNumbers[i] === carNumber) {
                if (this.currentRace.completedLaps[i] === 0) {
                    this.currentRace.completedLaps[i] = 1;
                    this.currentRace.lastLapStartTimes[i] = Date.now();
                    return "Success";
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
                return "Success";
            }
        } 
        return "Car not found";
    }

     // addSession, updateSession, addDriver, updateDriver, deleteDriver, etc have to be implemented
}

module.exports = Repository;
