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
        isFlipped: { type: Boolean},
        isTapped: { type: Boolean },
        left: { type: String },
        top: { type: String },
        card: Object
    }],
});

roomSchema.methods.getDeck = function(playerNr){
    return {
        playerNr: playerNr,
        cards: this.cards.filter(c => c.playerNr == playerNr)
    }
}


roomSchema.statics.updateCard = function(data){
    console.log(data);
    return this.findOneAndUpdate({ 
        "_id": 'test', 
        "cards._id": data.cardId, 
    }, 
    { 
        "$set": {
            "cards.$.left": data.left,
            "cards.$.top": data.top,
            "cards.$.isFlipped": data.isFlipped,
            "cards.$.isTapped": data.isTapped,
        }
    });
}

let Room = mongoose.model('Room', roomSchema);
