var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/cliente/index.html');
});
app.use('/cliente', express.static(__dirname + '/cliente'));

serv.listen(2000);
console.log("server started");

var socket_list = {};
var player_list = {};

var Player = function (id) {
    var self = {
        x: 250,
        y: 250,
        id: id,
        number: "" + Math.floor(10 * Math.random()),
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSped: 10
    }

    self.updatePosition = function () {
        if (self.pressingRight)
            self.x += self.maxSped;
        if (self.pressingLeft)
            self.x -= self.maxSped;
        if (self.pressingUp)
            self.y -= self.maxSped;
        if (self.pressingDown)
            self.y += self.maxSped;
    }
    return self;
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    socket_list[socket.id] = socket;

    var player = Player(socket.id);
    player_list[socket.id] = player;

    socket.on('disconnect', function () {
        delete socket_list[socket.id];
        delete player_list[socket.id];
    });

    socket.on('keyPress', function (data) {
        if(data.inputId == 'left')
            player.pressingLeft = data.state;
        else if(data.inputId == 'right')
            player.pressingRight = data.state;
        else if(data.inputId == 'up')
            player.pressingUp = data.state;
        else if(data.inputId == 'down')
            player.pressingDown = data.state;
    });
});

setInterval(function () {
    var pack = [];
    for (var i in player_list) {
        var player = player_list[i];
        player.updatePosition();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }

    for (var i in socket_list) {
        var socket = socket_list[i];
        socket.emit('newPositions', pack);
    }


}, 1000 / 25);
