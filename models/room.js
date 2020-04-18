let mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    _id: { type: String },
    players: [{
        name: { type: String},
        cards: { type: Object }
    }],
    cards: [
        { type: String }
    ]
});

mongoose.model('Room', roomSchema);