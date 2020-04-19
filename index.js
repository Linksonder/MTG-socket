require('dotenv').config()

const shuffle = require('./shuffle.js');
const express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let mongoose = require('mongoose');

let scryfall = require('./scryfall.js');

mongoose.connect(process.env.DB_HOST);
require('./models/room.js');

app.use(express.static('public'))


let Room = mongoose.model('Room');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
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

  socket.on('shuffle-deck', (playerNr) => {
    console.log('shuffling deck');
    Room.findOne({ _id: 'test'}).then((room) => {
      room.cards = shuffle(room.cards, playerNr);  
      room.save(() => {
        room.cards.forEach(c => {
          if(c.playerNr == playerNr)
            io.emit('update-card', c);
        })
      });
    })
  })

  socket.on('set-deck', (request) => {
    
    Room.findOne({ _id: 'test'}).then((room) => {
      scryfall.getCardsByName(request.cards).then(cards => {
        scryfall.getCardByName(request.commander).then(commander => {

          let playerNr = request.playerNr;
          room.cards.pull({playerNr: playerNr});
  
          cards.forEach(c => { 
            room.cards.push({ 
              playerNr: playerNr,
              card: c
            })
          })

          //yay
          shuffle(room.cards);
          
          //set order
          for(let i = 0; i < room.cards.length; i++){
            room.cards[i].order = i;
          }
          

          let commanderId =  mongoose.Types.ObjectId();

          room.cards.push({
            _id: commanderId,
            isFlipped: false, //default is show it!
            playerNr: playerNr,
            isCommander: true,
            card: commander
          })

          room.players[playerNr] = {
            commander: commanderId
          }
                
          room.save(() => { 
            let deck = room.getDeck(playerNr);
            io.emit('set-deck', deck);
          });
        })

        
          
      })
     
    })
  })

  socket.on('update-card', (card) => {
    Room.updateCard(card).then(() => {
      socket.broadcast.emit('update-card', card);
    })
  })
});

http.listen(process.env.PORT, () => {
  console.log('listening on *:3000');
});
