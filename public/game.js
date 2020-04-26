Vue.component('game', {
  data: function() {
    return {
      hand: [],
      sorting: false
    }
  },
  template: `
  <div class="game-wrapper">
    <div class="game-canvas"></div>
    <div class="game-hand">
      <button @click="shuffleHand()">change card</button>
      <button @click="sort()">Sort</button>
      <button @click="submit()">Submit</button>
      <div class="my-hand-wrapper" style="display: flex; justify-content: row">
        <playing-card v-for="card of hand" v-bind:card="card" class="elevated-status"><playing-card>    
      </div>
    </div>
  </div
  `,
  created: function() {
    this.shuffleHand();
    setTimeout(function(){ 
      $('.my-hand-wrapper').sortable({
        revert: true,
      });
    }, 2000);
  },
  methods: {
    submit: function() {
      const clickedCards = _.filter(this.hand, 'clicked');
      console.log(_.map(clickedCards, card => `${card.rank} - ${card.suit}`));
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
      this.hand.splice(0, this.hand.length);
      for (var i = 0; i < 13; i++) {
        this.hand.push({
          rank: ranks[Math.floor(Math.random() * ranks.length)],
          suit: suits[Math.floor(Math.random() * suits.length)],
          clicked: false
        })
      }
    }
  }
})
