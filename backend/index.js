const { Server } = require('socket.io');

const io = new Server(3000, {
    cors: {
        origin: '*',
    },
});

const publicRooms = ["leader-board", "next-race", "race-countdown", "race-flags"];
const privateRooms = ["front-desk", "race-control", "lap-line-tracker"];
// temporary hardcoded keys for private rooms
const privateRoomKeys = {
    "front-desk": "frontdesk123",
    "race-control": "racecontrol123",
    "lap-line-tracker": "laplinetracker123"
}

io.on('connection', (socket) => {
    socket.on("selectRoom", (args, callback) => {
        if (publicRooms.includes(args.room)) {
            socket.join(args.room);
            callback({status: "Success"});
        } else if (privateRooms.includes(args.room)) {
            if (args.key === privateRoomKeys[args.room]) {
                socket.join(args.room);
                callback({status: "Success"});
            } else {
                callback({status: "Invalid Access Key"});
            }
        } else {
            callback({status: "Invalid Room"});
        }
    });
});