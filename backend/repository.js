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
        if (this.currentRace.status !== "running") {
            return "Race not Active";
        }

        if (this.currentRace.flag === flag) {
            return "Flag Not Changed";
        }

        this.currentRace.flag = flag;

        if (flag === "finish") {
            this.currentRace.status = "finished";
        }
    beginStartCountdown() {
        if (this.currentRace.sessionId === null) {
            return "Invalid Session Status";
        }
        if (this.currentRace.status !== "notStarted") {
            return "Invalid Session Status";
        }
        this.currentRace.remainingSeconds = this.defaultRaceDuration;

        return "Success";
    }

     // addSession, updateSession, addDriver, updateDriver, deleteDriver, etc have to be implemented
 }

module.exports = Repository;

    // addSession, updateSession, addDriver, updateDriver, deleteDriver, etc have to be implemented
