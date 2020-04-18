$(document).ready(() => {        
            
    var socket = io();
    var cards = []; //dictionary
    var isDragging = false;
    var cardFocus = null;

    document.querySelector('#reset-room').addEventListener('click', () => {
        socket.emit('reset-room');
    })
    
    document.querySelector('#add-cards').addEventListener('submit', function(e){
        e.preventDefault();

        socket.emit('set-deck', {
            playerNr: this.playernr.value,
            cards:  this.cardlist.value.split('\n')
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
        deck.cards.forEach(c => {
            let card = createCard(c, deck.playerNr)
        })
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


    socket.on('update-card', (card) => {
        let container = $('#card-' + card._id);            
        card.isTapped ? container.addClass('tap') : container.removeClass('tap');    
        card.isFlipped ? container.addClass('flip') : container.removeClass('flip');   
        container.css({top: card.top, left: card.left });       
        updateCounter(cards[cardFocus._id]);
        cards[card._id] = card;                      
    });

    function updateCounter(card){
        let counter = document.querySelector('#card-' + card._id + " .counter");     
        let span = document.querySelector('#card-' + card._id + " .counter span");     
        span.innerText = card.counters;
        counter.style.visibility = card.counters != 0 ? 'visible' : 'hidden';
    }



    function resetBoard(){   
        let board = document.querySelector('#board');
        board.innerHTML = '';
        for(let i = 0; i < 4; i++){
            let deck = document.createElement('div');
            deck.className = "deck";
            deck.setAttribute('id', 'deck-' + (i+1));
            board.appendChild(deck);
        }
    }

    function createCard(card, playerNr){

        cards[card._id] = card;

        let container = document.createElement('div');
        container.setAttribute('draggable', 'true');
        container.className = "card";

        container.setAttribute('id', 'card-' + card._id); //Card
        container.className += card.isFlipped ? " flip" : "";
        container.className += card.isTapped ? " tap" : "";

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
        flipicon.className = 'fa fa-eye';
        flip.appendChild(flipicon);
        let tap = document.createElement('button');
        let tapicon = document.createElement('span');
        tapicon.className = 'fa fa-repeat';
        tap.appendChild(tapicon);

        menu.appendChild(flip);
        menu.appendChild(tap);

        container.appendChild(menu);

        cardOuter.addEventListener('click', () => {
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

        //pass drag event to socket
        dragElement(container, (left, top) => {
            cards[card._id].left = left;
            cards[card._id].top = top;
            socket.emit('update-card', cards[card._id])
        });

        if(card.left == null)
        {
           let deck = document.querySelector('#deck-' + playerNr);
           container.style.left = deck.offsetLeft + "px";
           container.style.top = deck.offsetTop + "px";
           $(container).addClass('flip'); //start face down on deck
        }
        else{
            container.style.left = card.left + "px";
            container.style.top = card.top + "px";
        }

        document.querySelector('#board').appendChild(container);

    }

    function showDetailsModal(card){
        cardFocus = card;
        document.querySelector('#detail-model-image').setAttribute('src', card.card.image_uris.normal);
        $('#detail-modal').modal('show');
    }

    function dragElement(elmnt, onMove) {
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
            setTimeout(() => isDragging = false, 0);//the hacks are real
        }
    }
}); //END OF DOCUMENT READY