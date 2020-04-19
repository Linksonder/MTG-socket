$(document).ready(() => {        
            
    var socket = io();
    var cards = []; //dictionary
    var isDragging = false;
    var cardFocus = null;
    var deckFocus = null;

    document.querySelector('#reset-room').addEventListener('click', () => {
        socket.emit('reset-room');
    })
    
    document.querySelector('#add-cards').addEventListener('submit', function(e){
        e.preventDefault();

        let cards =  this.cardlist.value.split('\n')
        let commander = this.commander.value;

        socket.emit('set-deck', {
            playerNr: this.playernr.value,
            cards:  cards,
            commander: commander
        });
    })

    document.querySelector('#counter-plus').addEventListener('click', (e) =>{
        cards[cardFocus._id].counters++;
        socket.emit('update-card', cards[cardFocus._id]);
        updateCounter(cards[cardFocus._id]);

    })

    document.querySelector('#counter-minus').addEventListener('click', (e) =>{
        cards[cardFocus._id].counters--;
        socket.emit('update-card', cards[cardFocus._id]);
        updateCounter(cards[cardFocus._id]);
    })

    socket.on('set-deck', deck => {
        deck.cards.forEach(c => createCard(c))
    })


    socket.on('init', (room) => {
        
        if(!room)
            return socket.emit('reset-room');

        //clear board 
        resetBoard();

        room.cards.forEach(c => {
            createCard(c, c.playerNr)
        })
    })


    socket.on('update-card', (card) => updateCard(card));

    function updateCard(card){
        let container = $('#card-' + card._id);            
        card.isTapped ? container.addClass('tap') : container.removeClass('tap');    
        card.isFlipped ? container.addClass('flip') : container.removeClass('flip');    
        container.css({'z-index':  card.isCommander ? 1000: card.order });
        updatePosition(card, container);
        updateCounter(card);                
        cards[card._id] = card;         
    }

    function updatePosition(card, container){
        
        
        if(card.left == null) //No position? Put it on the deck
        {
           let deck = document.querySelector('#deck-' + card.playerNr);
           container.css({top: deck.offsetTop, left: deck.offsetLeft });       
        }
        else{
            container.css({top: card.top, left: card.left });       
        }
    }

    function updateCounter(card){
        let counter = document.querySelector('#card-' + card._id + " .counter");     
        let span = document.querySelector('#card-' + card._id + " .counter span");     
        span.innerText = card.counters;
        counter.style.visibility = card.counters != 0 ? 'visible' : 'hidden';
    }



    function resetBoard(){   
        let board = document.querySelector('#board');
        board.innerHTML = '';

        for(let nr = 1; nr <= 4; nr++){
            let deck = document.createElement('div');
            let shuffle = document.createElement('button');
            shuffle.innerText = "shuffle";
            shuffle.addEventListener('click', function() { socket.emit('shuffle-deck', nr )});
            shuffle.className = "btn btn-default"
            deck.appendChild(shuffle);
            deck.className = "deck";
            deck.setAttribute('id', 'deck-' + (nr));
            board.appendChild(deck);
        }

        board.addEventListener('mouseover', (e) => {
            
            if(e.target.id.includes("deck")) {
                deckFocus = e.target;
            }
            else {
                deckFocus = null;
            }
        })
    }

    function createCard(card){

        cards[card._id] = card;

        let container = document.createElement('div');
        container.setAttribute('draggable', 'true');
        container.className = "card";

        container.setAttribute('id', 'card-' + card._id); //Card
        container.className += card.isFlipped ? " flip" : "";
        container.className += card.isTapped ? " tap" : "";
        container.style.zIndex  = card.isCommander ? 1000 : card.order; //put the commander on top

        //ui events
        let cardOuter = document.createElement('div');
        cardOuter.className = "card-outer";

        let cardInner = document.createElement('div');
        cardInner.className = "card-inner";

        let front = document.createElement('img');
        front.className = "front";
        front.setAttribute('src', card.card.image_uris.normal); //card

        let back = document.createElement('img');
        back.setAttribute('src', "https://gamepedia.cursecdn.com/mtgsalvation_gamepedia/thumb/f/f8/Magic_card_back.jpg/250px-Magic_card_back.jpg?version=56c40a91c76ffdbe89867f0bc5172888");
        back.className = "back";

        cardInner.appendChild(front);
        cardInner.appendChild(back);
        cardOuter.appendChild(cardInner);
        container.appendChild(cardOuter);

        let counter = document.createElement('div');
        counter.className = "counter";
        let span = document.createElement('span')
        span.innerText = card.counters;
        counter.appendChild(span);
        counter.style.visibility = card.counters != 0 ? 'visible' : 'hidden';
        container.appendChild(counter);

        //menu
        let menu = document.createElement('div');
        menu.className = 'menu';

        let flip = document.createElement('button');
        let flipicon = document.createElement('span');
        flipicon.className = 'fa fa-play';
        flip.appendChild(flipicon);
        menu.appendChild(flip);

        let tap = document.createElement('button');
        let tapicon = document.createElement('span');
        tapicon.className = 'fa fa-repeat';
        tap.appendChild(tapicon);
        menu.appendChild(tap);

        let peek = document.createElement('button');
        let peekicon = document.createElement('span');
        peekicon.className = 'fa fa-eye';
        peek.appendChild(peekicon);
        menu.appendChild(peek);

        container.appendChild(menu);

        front.addEventListener('click', () => {
            if(isDragging) return;
            showDetailsModal(cards[card._id]);
        })

        flip.addEventListener('click', () => {
            $(container).toggleClass('flip');
            cards[card._id].isFlipped = !cards[card._id].isFlipped;
            socket.emit('update-card', cards[card._id])
        })

        tap.addEventListener('click', () => {
            $(container).toggleClass('tap');
            cards[card._id].isTapped = !cards[card._id].isTapped;
            socket.emit('update-card', cards[card._id])
        })

        peek.addEventListener('click', () => {
            $(container).toggleClass('peek');
        })

        //pass drag event to socket
        dragElement(container, card.playerNr, (left, top) => {
            
            cards[card._id].left = left;
            cards[card._id].top = top;

            if(!left || !top){
                cards[card._id].isFlipped = true;
                updateCard(cards[card._id]); //move to deck
            }
            
            socket.emit('update-card', cards[card._id])
        });

        document.querySelector('#board').appendChild(container);
        updatePosition(card, $(container));


    }

    function showDetailsModal(card){
        cardFocus = card;
        document.querySelector('#detail-model-image').setAttribute('src', card.card.image_uris.normal);
        $('#detail-modal').modal('show');
    }

    function dragElement(elmnt, playernr, onMove) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;

            //lift the decks so we can drop them
            $('#deck-' +  playernr).addClass('lift');
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

            //callback
            onMove(elmnt.offsetLeft, elmnt.offsetTop);

            isDragging = true;
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
            $('.deck').removeClass('lift');


            //snap to deck
            if(deckFocus){

                //move the card to the deck
                elmnt.style.top = deckFocus.offsetTop + "px";
                elmnt.style.left = deckFocus.offsetLeft + "px";
                
                //reset the position
                onMove(null, null);
                deckFocus = null;
            }

            setTimeout(() => isDragging = false, 0);//the hacks are real
        }
    }
}); //END OF DOCUMENT READY