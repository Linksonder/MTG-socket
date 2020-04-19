let mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    _id: { type: String },
    players: [{
        nr: { type: Number },
        name: { type: String },    
        commander: { type: mongoose.ObjectId}
    }],
    cards: [{
        playerNr: { type: Number },
        isFlipped: { type: Boolean, default: true},
        isTapped: { type: Boolean, default: false },
        left: { type: Number, default: null },
        top: { type: Number, default: null },
        counters: { type: Number, default: 0},
        isCommander: { type: Boolean, default: false },
        card: Object,
        order: { type: Number }
    }],
});

roomSchema.methods.getDeck = function(playerNr){

    let myCards = this.cards.filter(c => c.playerNr == playerNr);
    return {
        playerNr: playerNr,
        cards: myCards,
    }
}


roomSchema.statics.updateCard = function(card){
    return this.findOneAndUpdate({ 
        "_id": 'test', 
        "cards._id": card._id, 
    }, 
    { 
        "$set": {
            "cards.$.left": card.left,
            "cards.$.top": card.top,
            "cards.$.isFlipped": card.isFlipped,
            "cards.$.isTapped": card.isTapped,
            "cards.$.counters": card.counters,

        }
    });
}

let Room = mongoose.model('Room', roomSchema);
