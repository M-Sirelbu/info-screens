module.exports = function onConnection (socket, repository, room) {
    const status = repository.currentRace.status;
    let session = null;
    if (repository.sessions.length >= 2 && repository.currentRace.sessionId === repository.sessions[0].sessionId) {
        const loadedSession = repository.getSession(repository.sessions[1].sessionId);
        if (loadedSession !== null) {
            session = loadedSession;
        }
    } 
    else if ((repository.sessions.length === 1 && repository.currentRace.sessionId !== repository.sessions[0].sessionId) || (repository.sessions.length > 0 && repository.currentRace.sessionId === null)) {
        const loadedSession = repository.getSession(repository.sessions[0].sessionId);
        if (loadedSession !== null) {
            session = loadedSession;
        }
    }
    switch (room) {
        case "leader-board":
            socket.emit("sessionUpdate", {
                    sessionId: repository.currentRace.sessionId,
                    driverNames: repository.currentRace.driverNames,
                    carNumbers: repository.currentRace.carNumbers
            });
            socket.emit("sessionStatus", { status: status });
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
            if (session !== null) {
                socket.emit("nextSessionUpdate", session);
            } else {
                socket.emit("nextSessionUpdate", { message: "No upcoming races" });
            }
            break;
        case "race-countdown":
            break;
        case "race-flags":
            socket.emit("flagChanged", { flag: repository.currentRace.flag });
            break;
        case "front-desk":
            socket.emit(
                "sessionsUpdated",
                repository.sessions.filter(
                    (s) => s.sessionId !== repository.currentRace.sessionId
                )
            );
            if (repository.currentRace.sessionId !== null) {
                socket.emit("sessionStarted", { sessionId: repository.currentRace.sessionId });
            }
            break;
        case "race-control":
            socket.emit("sessionStatus", { status: repository.currentRace.status });
            socket.emit("flagChanged", { flag: repository.currentRace.flag });
            if (session !== null) {
                socket.emit("nextSessionUpdate", session);
            } else {
                socket.emit("nextSessionUpdate", { message: "No upcoming races" });
            }
            break;
        case "lap-line-tracker":
            socket.emit("sessionStatus", { status: status });
            socket.emit("sessionUpdate", {
                sessionId: repository.currentRace.sessionId,
                driverNames: repository.currentRace.driverNames,
                carNumbers: repository.currentRace.carNumbers
            });
            break;
    }
}
