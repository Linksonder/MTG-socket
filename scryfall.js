var axios = require('axios');
const querystring = require('querystring');

function getCardByName(name) {
    return axios.get("https://api.scryfall.com/cards/named?exact=" + querystring.escape(name))
        .then(res => res.data)
}

function getCardsByName(names){

    let cards = names.map(n => split(n));

    let requests = cards.map(card => {
        return new Promise((resolve, reject) => {
            axios.get("https://api.scryfall.com/cards/named?exact=" + querystring.escape(card.name))
                .then(response => {
                    let result = [];
                    for(let i = 0; i < card.ammount; i++){
                        result.push(response.data);
                    }
                    resolve(result);
                });
        }) 
    })
 
    return Promise.all(requests).then(res => {
        let deck = [];
        res.forEach(cards => {
            cards.forEach(c => deck.push(c));
        })
        return deck;
    })
}


module.exports = {
    getCardsByName: getCardsByName,
    getCardByName: getCardByName
}

function split(str){
    return { 
        ammount: str.substr(0,str.indexOf(' ')),
        name: str.substr(str.indexOf(' ')+1),
    }
  
}