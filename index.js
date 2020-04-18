require('dotenv').config()

let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let mongoose = require('mongoose');

let scryfall = require('./scryfall.js');

mongoose.connect(process.env.DB_HOST);
require('./models/room.js');

let Room = mongoose.model('Room');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
  
  Room.findOne({ _id: 'test'}).then((room) => {
    socket.emit('init', room);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('reset-room', () => {
    Room.deleteMany({}).then(() => {
      let room = new Room({ _id: 'test'});
      room.save(() => {
        io.emit('init', room);
      });
    })

  })

  socket.on('set-deck', (request) => {
    Room.findOne({ _id: 'test'}).then((room) => {
      scryfall.getCardsByName(request.cards).then(cards => {
        
        let playerNr = request.playerNr;
        room.cards.pull({playerNr: playerNr});

        cards.forEach(c => { 
          room.cards.push({ 
            playerNr: playerNr,
            card: c
          })
        })
              
        room.save(() => { 
          io.emit('set-deck', room.getDeck(playerNr));
        });
          
      })
     
    })
  })

  socket.on('update-card', (data) => {
    Room.updateCard(data).then(() => {
      socket.broadcast.emit('update-card', data);
    })
  })
});




http.listen(process.env.PORT, () => {
  console.log('listening on *:3000');
});
