module.exports = function onConnection (socket, repository, room) {
    switch (room) {
        case "leader-board":
            socket.emit("sessionUpdate", {
                    sessionId: repository.currentRace.sessionId,
                    driverNames: repository.currentRace.driverNames,
                    carNumbers: repository.currentRace.carNumbers
            });
            socket.emit("sessionStatus", { status: repository.currentRace.status });
            socket.emit("flagChanged", { flag: repository.currentRace.flag });
            if (repository.currentRace.status !== "notStarted") {
                socket.emit("lapTimes", {
                    carNumbers: repository.currentRace.carNumbers,
                    completedLaps: repository.currentRace.completedLaps,
                    bestLapTime: repository.currentRace.bestLapTime
                });
            }
            break;
        case "next-race":
            if (this.repository.sessions.length >= 2) {
                socket.emit("nextSessionUpdate", repository.getSession(repository.sessions[1].sessionId));
            }
            break;
        case "race-countdown":
            break;
        case "race-flags":
            socket.emit("flagChanged", { flag: repository.currentRace.flag });
            break;
        case "front-desk":
            socket.emit("sessionsUpdated", repository.sessions);
            if (repository.currentRace.sessionId !== null) {
                socket.emit("sessionStarted", { sessionId: repository.currentRace.sessionId });
            }
            break;
        case "race-control":
            socket.emit("sessionStatus", { status: repository.currentRace.status });
            socket.emit("flagChanged", { flag: repository.currentRace.flag });
            break;
        case "lap-line-tracker":
            socket.emit("sessionStatus", { status: repository.currentRace.status });
            break;
    }
}