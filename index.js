require('dotenv').config()

let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let mongoose = require('mongoose');

let scryfall = require('./scryfall.js');

mongoose.connect(process.env.DB_HOST)
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
        console.log('room created');
      });
    })

  })

  socket.on('set-deck', (request) => {
    console.log("Setting decklist");
    Room.findOne({ _id: 'test'}).then((room) => {

      let playerName = request.playerName;
      scryfall.getCardsByName(request.cards).then(cards => {
        
        let player = room.players.find(p => p.name === playerName);
        
        if(!player){
          room.players.push({
            name: playerName,
            cards: cards
          })
        }
        else{
          player.cards = cards;
        }
       
        room.save(() => { 
          io.emit('set-deck', {
            playerName: playerName,
            cards: cards
          });
        });
  
      })
     
    })
  })

  socket.on('move-card', (data) => {
    io.emit('move-card', data);
  })

});




http.listen(process.env.PORT, () => {
  console.log('listening on *:3000');
});
