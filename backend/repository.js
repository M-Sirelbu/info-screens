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
        completedLaps: null,
        bestLapTime: null,
        flag: "red",
        remainingSeconds: null
    };
    defaultRaceDuration = null;
    constructor(defaultRaceDuration) {
        this.defaultRaceDuration = defaultRaceDuration;
    }
    loadSession(sessionId) {
        const oldSessionId = this.currentRace.sessionId;
        for (const session of this.sessions) {
            if (session.sessionId === sessionId) {
                this.currentRace.sessionId = sessionId;
                this.currentRace.carNumbers = session.carNumbers;
                this.currentRace.completedLaps = [];
                this.currentRace.bestLapTime = [];
                this.currentRace.remainingSeconds = this.defaultRaceDuration;
                this.currentRace.status = "notStarted";
                this.currentRace.flag = "red";
                for (let i = 0; i < session.carNumbers.length; i++) {
                    this.currentRace.completedLaps.push(0);
                    this.currentRace.bestLapTime.push(0);
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

    beginStartCountdown() {
        if (this.currentRace.sessionId === null) {
            return "Invalid Session Status";
        }
        if (this.currentRace.status === "active") {
            return "Invalid Session Status";
        }
        this.currentRace.remainingSeconds = this.defaultRaceDuration;

        return "Success";
    }

     // addSession, updateSession, addDriver, updateDriver, deleteDriver, etc have to be implemented
 }

module.exports = Repository;

    // addSession, updateSession, addDriver, updateDriver, deleteDriver, etc have to be implemented
