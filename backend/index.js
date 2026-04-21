const express = require('express')
const http = require('http')
const path = require('path')
const ngrok = require('@ngrok/ngrok');
const { Server } = require('socket.io');
const { env } = require('node:process');
const Repository = require('./repository');
const onConnection = require('./on_connection');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../frontend/app/dist/app/browser")));

app.get(["/home", "/leader-board", "/next-race", "/race-countdown", "/race-flags", "/front-desk", "/race-control", "/lap-line-tracker"], (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app/dist/app/browser/index.html'));
});

const publicRooms = ["leader-board", "next-race", "race-countdown", "race-flags"];
const privateRooms = ["front-desk", "race-control", "lap-line-tracker"];

const clientEvents = {
    SELECT_ROOM: "selectRoom",
    RACE_FLAG: "raceFlag",
    RACE_START_COUNTDOWN: "raceStartCountdown",
    SESSION_END: "sessionEnd"
};

if (!("receptionist_key" in env) || !("observer_key" in env) || !("safety_key" in env)) {
    console.error("Missing environment variables for private room keys. Please set receptionist_key, observer_key, and safety_key.");
    process.exit(1);
}

const privateRoomKeys = {
    "front-desk": env.receptionist_key,
    "race-control": env.safety_key,
    "lap-line-tracker": env.observer_key
};

let raceDuration = 60;
if (!("NODE_ENV" in env)) {
    console.warn("NODE_ENV not set. Defaulting to development mode with a race duration of 60 seconds.");
} else {
    if (env.NODE_ENV === "production") {
        raceDuration = 600;
    } else if (env.NODE_ENV === "development") {
        raceDuration = 60;
    } else {
        raceDuration = 60;
        console.warn(`Unknown NODE_ENV value: ${env.NODE_ENV}. Defaulting to development mode with a race duration of 60 seconds.`);
    }
}

const repository = new Repository(raceDuration, 10);

let timer = undefined;

const timerTick = function() {
    if (repository.currentRace.remainingSeconds <= 0) {
        repository.currentRace.remainingSeconds = 0;
        io.to("leader-board").emit("timerTick", { remainingSeconds: repository.currentRace.remainingSeconds });
        repository.endRace();
        broadcastSessionStatus();
        broadcastFlagChanged();
        clearInterval(timer);
        timer = undefined;
    }
    else {
        io.to("leader-board").emit("timerTick", { remainingSeconds: repository.currentRace.remainingSeconds });
        repository.currentRace.remainingSeconds--;
    }
}

if (!("NGROK_AUTHTOKEN" in env)) {
    console.error("NGROK_AUTHTOKEN environment variable not set. Please set it to your ngrok authtoken or to \"none\" to run locally.");
    console.error("Sign up for an account: https://dashboard.ngrok.com/signup");
    console.error("Install your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken");
    process.exit(1);
}
if (env.NGROK_AUTHTOKEN !== "none") {
    ngrok.connect({ addr: 8000, authtoken_from_env: true })
    	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
}
function sessionsUpdated() {
    io.to("front-desk").emit("sessionsUpdated", repository.sessions);
}

function broadcastSessionStatus() {
    const sessionStatus = repository.currentRace.status;
    io.to("race-control").emit("sessionStatus", { status: sessionStatus });
    io.to("lap-line-tracker").emit("sessionStatus", { status: sessionStatus });
    io.to("leader-board").emit("sessionStatus", { status: sessionStatus });
    io.to("next-race").emit("sessionStatus", { status: sessionStatus });
}

function broadcastFlagChanged() {
    const flag = repository.currentRace.flag;

    io.to("race-control").emit("flagChanged", { flag: flag });
    io.to("leader-board").emit("flagChanged", { flag: flag });
    io.to("race-flags").emit("flagChanged", { flag: flag });
}

function broadcastNextSession(skipNextRace = false) {

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
    if (session !== null) {
        if (!skipNextRace) {
            io.to("next-race").emit("nextSessionUpdate", session);
        }
        io.to("race-control").emit("nextSessionUpdate", session);
    } else {
        if (!skipNextRace) {
            io.to("next-race").emit("nextSessionUpdate", { message: "No upcoming races" });
        }
        io.to("race-control").emit("nextSessionUpdate", { message: "No upcoming races" });
    }
}

io.on("connection", (socket) => {
    socket.on(clientEvents.SELECT_ROOM, (args, callback) => {
        if (publicRooms.includes(args.room)) {
            socket.join(args.room);
            callback({ status: "Success" });
            onConnection(socket, repository, args.room);
            return;
        }

        if (privateRooms.includes(args.room)) {
            if (args.key === privateRoomKeys[args.room]) {
                socket.join(args.room);
                callback({ status: "Success" });
                onConnection(socket, repository, args.room);
            } else {
                setTimeout(() => {
                    callback({ status: "Invalid Access Key" });
                }, 500);
            }
            return;
        }

        callback({ status: "Invalid Room" });
    });

    socket.on(clientEvents.RACE_FLAG, (args, callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({ status: "Race not Active" });
            return;
        }
        let status = repository.setFlag(args.flag);
        if (status === "Success") {
            broadcastFlagChanged();
        }
        callback({ status: status });
        if (args.flag === "finish") {
            if (timer !== undefined) {
                clearInterval(timer);
                timer = undefined;
            }            
            repository.endRace();
            broadcastSessionStatus();
            repository.currentRace.remainingSeconds = 0;
            io.to("leader-board").emit("timerTick", { remainingSeconds: repository.currentRace.remainingSeconds });
        }
    });
    socket.on("raceStartCountdown", (args, callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({ status: "Invalid Session Status" });
            console.log("Invalid role for starting countdown");
            return;
        }

        let result = repository.beginStartCountdown();

        if (result === "No session loaded") {
            if (repository.sessions.length === 0) {
                callback({ status: "No session loaded" });
                return;
            }
            repository.loadSession(repository.sessions[0].sessionId);
            broadcastFlagChanged();
            broadcastSessionStatus();
            broadcastNextSession();
            sessionsUpdated();
            io.to("front-desk").emit("sessionStarted", { sessionId: repository.currentRace.sessionId });
            result = repository.beginStartCountdown();
        }

        if (result !== "Success") {
            callback({ status: result });
            console.log(result);
            return;
        }
        console.log("Starting countdown");
        io.timeout(5000).to("race-countdown").emit("startCountdown", {
            duration: repository.defaultCountdownDuration
        }, (err, response) => {
            if (err) {
                repository.countdownInProgress = false;
                callback({ status: "Invalid Session Status" });
                console.log("No clients responded to startCountdown event, aborting countdown");
                return;
            }            
            callback({ status: "Success" })
            setTimeout(() => {
                repository.countdownInProgress = false;
                repository.startRace()

                broadcastFlagChanged();
                broadcastSessionStatus();
                broadcastNextSession();

                io.to("leader-board").to("lap-line-tracker").emit("sessionUpdate", {
                    sessionId: repository.currentRace.sessionId,
                    driverNames: repository.currentRace.driverNames,
                    carNumbers: repository.currentRace.carNumbers
                });

                clearInterval(timer);
                timer = setInterval(timerTick, 1000);
            }, repository.defaultCountdownDuration * 1000)
        });
    });
    socket.on("sessionEnd", () => {
        if (!socket.rooms.has("race-control")) {
            return;
        }
        if (repository.currentRace.status !== "finished") {
            return;
        }        

        if (repository.sessions.length < 2) {
            // Reset current race into empty no-active-session state
            repository.loadEmptySession();
            if (repository.sessions.length === 0) {
                // In loading session, old stale session will be deleted, so everything needs to be updated.
                broadcastFlagChanged();
                broadcastSessionStatus();
                broadcastNextSession();
                return;
            }
        }
        if (repository.sessions.length === 1) {
            repository.loadSession(repository.sessions[0].sessionId);
        }
        else {
            repository.loadSession(repository.sessions[1].sessionId);
        }
        

        broadcastFlagChanged();
        broadcastSessionStatus();
        // Next Race screen does not need to be updated yet, so skip it by passing skipNextRace as true
        broadcastNextSession(true);
        sessionsUpdated();

        io.to("leader-board").to("lap-line-tracker").emit("sessionUpdate", {
            sessionId: repository.currentRace.sessionId,
            driverNames: repository.currentRace.driverNames,
            carNumbers: repository.currentRace.carNumbers
        });

        sessionsUpdated();

        io.to("front-desk").emit("sessionStarted", { sessionId: repository.currentRace.sessionId });
    });

    socket.on("sessionCreated", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.addSession([], []);
        sessionsUpdated();
        broadcastNextSession();
    });
    socket.on("sessionRemoved", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.deleteSession(args.sessionId);
        sessionsUpdated();
        broadcastNextSession();
    });
    socket.on("driverAdded", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.addDriver(args.sessionId, args.driverName);
        sessionsUpdated();
        broadcastNextSession();
    });
    socket.on("driverEdited", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.updateDriver(args.sessionId, args.driverName, args.newName);
        sessionsUpdated();
        broadcastNextSession();
    });
    socket.on("driverRemoved", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.deleteDriver(args.sessionId, args.driverName);
        sessionsUpdated();
        broadcastNextSession();
    });

    socket.on("lap", (args) => {
        if (!socket.rooms.has("lap-line-tracker")) {
            return;
        }
        const status = repository.addLap(args.carNumber);
        if (status !== "Success") {
            return;
        }
        io.to("leader-board").emit("lapTimes", {
            carNumbers: repository.currentRace.carNumbers,
            completedLaps: repository.currentRace.completedLaps,
            bestLapTime: repository.currentRace.bestLapTime
        });
    });
});

server.listen(8000, () => {
    console.log("Server running on port 8000")
});

process.on('SIGINT', () => {
    console.log("Shutting down server...");
    ngrok.kill();
    process.exit(0);
});
