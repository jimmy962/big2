const nextPlayer = {
  playerA: 'playerB',
  playerB: 'playerC',
  playerC: 'playerD',
  playerD: 'playerA'
}
Vue.component('game', {
  data: function() {
    return {
      hand: [],
      sorting: false,
      gameWS: null,
      handsPlayed: [],
      isGameMaster: false,
      playerX: null,
      gameMasterCommand: '',
      playerStatuses: { playerA: { username: '', cardsLeft: -1, myTurn: false }, playerB: { myTurn: false }, playerC: { myTurn: false }, playerD: { myTurn: false } }
    }
  },
  template: `
  <div class="game-wrapper">
    <div class="game-canvas">
      <player-statuses v-bind:players="playerStatuses" v-bind:user="user"></player-statuses>
      <game-canvas v-bind:handsPlayed="handsPlayed"></game-canvas>
    </div>
    <div class="game-hand">
      <div style="display: flex; flex-direction: row;">
        <button class="button-sort-rank" @click="sort('rank')">Rank</button>
        <button class="button-sort-suit" @click="sort('suit')">Suit</button>
        <input style="width: 400px; margin-left: 25px;" v-if="isGameMaster" v-on:keyup.enter="onEnter" v-model="gameMasterCommand"/>
      </div>
      <div class="my-hand-wrapper" style="display: flex; justify-content: row; min-height: 100px;">
        <playing-card v-for="card of hand" v-bind:card="card" v-bind:hand="hand"></playing-card>    
      </div>
    </div>
    <div class="game-play-button-wrapper">
      <button class="button-pass" v-if="canSubmit()" @click="pass()">Pass</button>
      <button class="button-submit" v-if="canSubmit()" @click="submit()">Submit</button>
    </div>
  </div
  `,
  props: ['user'],
  created: function() {
    // setTimeout(function(){ 
    //   $('.my-hand-wrapper').sortable({
    //     revert: 100,
    //   });
    // }, 2000);
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
          self.playerStatuses[receivedMessage.playerX].cardsLeft -= handObject.cards.length
          _.forEach(self.playerStatuses, o => {
            o.myTurn = false;
          })
          self.playerStatuses[nextPlayer[receivedMessage.playerX]].myTurn = true;
          if (receivedMessage.username === self.user.username) {
            handObject.username = 'I';
            cards.forEach((card) => {
              const i = self.hand.findIndex(o => o.rank === card.rank && o.suit === card.suit);
              self.hand.splice(i, 1);
            });
          }
          self.handsPlayed.push(handObject);
        } else if (receivedMessage.type === 'new_player') {
          if (receivedMessage.username === self.user.username) {
            self.isGameMaster = receivedMessage.gameMaster;
            self.playerX = receivedMessage.playerX;
          } else {
            Materialize.toast(`${receivedMessage.username} joined the game.`, 2000);
          }
          _.forEach(self.playerStatuses, (o) => o.username = undefined)
          receivedMessage.message.split(',').forEach((o) => {
            const key = o.split(':')[0];
            const username = o.split(':')[1];
            self.playerStatuses[`player${key}`].username = username;
          });
        } else if (receivedMessage.type === 'new_game') {
          if (receivedMessage.playerX === self.playerX) {
            self.hand = receivedMessage.message.split(',').map(card => ({
              suit: card.split('-')[0],
              rank: card.split('-')[1],
              clicked: false
            }));
            _.forEach(self.playerStatuses, (o) => {
              o.cardsLeft = 13;
              o.myTurn = false;
            });
          }
        } else if (receivedMessage.type === 'pass') {
          _.forEach(self.playerStatuses, o => o.myTurn = undefined)
          self.playerStatuses[nextPlayer[receivedMessage.playerX]].myTurn = true;
          Materialize.toast(`${receivedMessage.username} passed.`, 1500);
        }
      } catch(e) {
        console.log(e);
        console.log("Error parsing message")
      }
    });
  },
  methods: {
    submit: function() {
      const myTurn = this.myTurn();
      if (myTurn || myTurn === undefined) {
        const clickedCards = _.filter(this.hand, 'clicked');
        const selectedCards = _.map(clickedCards, card => card.suit+ '-' + card.rank).join(',');
        if (selectedCards.length) {
          this.gameWs.send(
            JSON.stringify({
              Message: selectedCards,
              Type: 'card(s)',
              PlayerX: this.playerX,
              Username: this.user.username,
              GameMaster: false
            }
          ));
        }
      } else {
        Materialize.toast(`Not your turn bro.`, 1000);
      }
    },
    sort: function(primarySortField) {
      const secondarySortField = primarySortField === 'suit' ? 'rank' : 'suit';
      const scoring = {
        suit: { 'spades': 4, 'hearts': 3, 'clubs': 2, 'diams': 1 },
        rank: { '3':3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15}
      }
      // const suitScore = { 'spades': 4, 'hearts': 3, 'clubs': 2, 'diams': 1 };
      // const rankScore = { '3':3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15};
      this.hand.sort((a, b) => {
        if (a[primarySortField] === b[primarySortField]) {
          return scoring[secondarySortField][a[secondarySortField]] - scoring[secondarySortField][b[secondarySortField]];
        } else {
          return scoring[primarySortField][a[primarySortField]] - scoring[primarySortField][b[primarySortField]];
        }
        // if (a.rank === b.rank) {
        //   return suitScore[a.suit] - suitScore[b.suit];
        // } else {
        //   return rankScore[a.rank] - rankScore[b.rank];
        // }
      })
    },
    newGame: function() {
      this.gameWs.send(
        JSON.stringify({
          Type: 'new_game',
          PlayerX: this.playerX,
          Username: this.user.username,
          GameMaster: this.isGameMaster
        }
      ));
    },
    pass: function() {
      const myTurn = this.myTurn();
      if (myTurn) {
        this.gameWs.send(
          JSON.stringify({
            Type: 'pass',
            PlayerX: this.playerX,
            Username: this.user.username,
          }
        ));
      } else if (myTurn === false) {
        Materialize.toast(`Not your turn bro.`, 1000);
      }
    },
    myTurn: function() {
      const whosTurn = _.find(this.playerStatuses, 'myTurn');
      if (whosTurn) {
        return whosTurn.username === this.user.username; // not safe...
      }
      return undefined
    },
    canSubmit: function() {
      var sumOfCards = 0;
      _.forEach(this.playerStatuses, (o) => sumOfCards += o.cardsLeft);
      return sumOfCards === 52 || this.myTurn();
    },
    onEnter: function() {
      if (this.gameMasterCommand === 'start new game') {
        this.newGame();
      }
      this.gameMasterCommand = '';
    }
  }
})
