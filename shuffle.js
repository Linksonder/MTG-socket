module.exports = function (cards, playerNr) {
    let counter = cards.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = cards[counter];
        cards[counter] = cards[index];
        cards[index] = temp;
    }

    //order all the cards still in the deck for that player
    let order = 1;
    cards.forEach((card) => {
        if(card.playerNr == playerNr && card.left == null)
        {
            card.order = order;
            order++;
        }
    })

    return cards;
}