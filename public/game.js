Vue.component('game', {
  data: function() {
    return {
      hand: [],
      sorting: false,
      gameWS: null,
      handsPlayed: [],
      isGameMaster: false
    }
  },
  template: `
  <div class="game-wrapper">
    <div class="game-canvas">
      <game-canvas v-bind:handsPlayed="handsPlayed"></game-canvas>
    </div>
    <div class="game-hand">
      <button v-if="isGameMaster" @click="newGame()">New Game</button>
      <button @click="shuffleHand()">Change card</button>
      <button @click="sort()">Sort</button>
      <button @click="submit()">Submit</button>
      <div class="my-hand-wrapper" style="display: flex; justify-content: row">
        <playing-card v-for="card of hand" v-bind:card="card"><playing-card>    
      </div>
    </div>
  </div
  `,
  props: ['user'],
  created: function() {
    this.shuffleHand();
    setTimeout(function(){ 
      $('.my-hand-wrapper').sortable({
        revert: true,
      });
    }, 2000);
    this.gameWs = new WebSocket('ws://' + window.location.host + '/ws-2');
    this.gameWs.onopen = () => {
      this.gameWs.send(
        JSON.stringify({
          Type: 'new_player',
          Username: this.user.username,
        }
      ));
    };
    var self = this;
    this.gameWs.addEventListener('message', function(e) {
      try {
        const receivedMessage = JSON.parse(e.data);
        if (receivedMessage.type === 'card(s)') {
          const cards = receivedMessage.message.split(',').map(card => ({
            suit: card.split('-')[0],
            rank: card.split('-')[1]
          }))
          const handObject = {
            cards, 
            username: receivedMessage.username
          };
          if (receivedMessage.username === self.user.username) {
            handObject.username = 'I';
            cards.forEach((card) => {
              const i = self.hand.findIndex(o => o.rank === card.rank && o.suit === card.suit);
              self.hand.splice(i, 1);
            });
          }
          self.handsPlayed.push(handObject);
        } else if (receivedMessage.type === 'new_player') {
          console.log('New player joined!!!');
          if (receivedMessage.username === self.user.username) {
            self.isGameMaster = receivedMessage.gameMaster;
          } else {
            Materialize.toast(`${receivedMessage.username} joined the game.`, 2000);
          }
        }
      } catch(e) {
        console.log(e);
        console.log("Error parsing message")
      }
    });
  },
  methods: {
    submit: function() {
      const clickedCards = _.filter(this.hand, 'clicked');
      const selectedCards = _.map(clickedCards, card => card.suit+ '-' + card.rank).join(',');
      this.gameWs.send(
        JSON.stringify({
          Message: selectedCards,
          Type: 'card(s)',
          PlayerX: 'playerA',
          Username: this.user.username,
          GameMaster: false
        }
      ));
    },
    sort: function() {
      const suitScore = { 'spades': 4, 'hearts': 3, 'clubs': 2, 'diams': 1 };
      const rankScore = { '3':3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15};
      this.hand.sort((a, b) => {
        if (a.rank === b.rank) {
          return suitScore[a.suit] - suitScore[b.suit];
        } else {
          return rankScore[a.rank] - rankScore[b.rank];
        }
      })
    },
    changeCard: function() {
      const ranks = ['K','Q','J','10','9','8','7','6','5','4','3','2','A'];
      const suits = ['hearts','spades','diams','clubs'];
      this.testCard.rank =  ranks[Math.floor(Math.random() * ranks.length)];
      this.testCard.suit =  suits[Math.floor(Math.random() * suits.length)];
    },
    shuffleHand: function() {
      const ranks = ['K','Q','J','10','9','8','7','6','5','4','3','2','A'];
      const suits = ['hearts','spades','diams','clubs'];
      const deck = [];
      ranks.forEach(rank => {
        suits.forEach(suit => {
          deck.push({ rank, suit, clicked: false});
        })
      });
      this.hand.splice(0, this.hand.length);
      for (var i = 0; i < 13; i++) {
        this.hand.push(deck[Math.floor(Math.random() * deck.length)]);
      }
    },
    newGame: function() {
      console.log('Starting new game!');
    }
  }
})
