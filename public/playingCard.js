Vue.component('playingCard', {
  data: function() {
    return {
    }
  },
  props: ['card'],
  template: `
    <div class="playingCards playing-card-wrapper" v-on:click="card.clicked = !card.clicked">
      <div class="card" v-bind:class="[rank, suit, { 'clicked-card': card.clicked }]">
        <span class="rank">{{card.rank}}</span>
        <div v-if="['K', 'Q', 'J'].indexOf(card.rank) > -1" class="suit">
          <span v-if="card.suit === 'spades'">&spades;</span>
          <span v-if="card.suit === 'hearts'">&hearts;</span>
          <span v-if="card.suit === 'diams'">&diams;</span>
          <span v-if="card.suit === 'clubs'">&clubs;</span>
        </div>
        <span v-else class="suit">&nbsp;</span>
      </div>
    </div>
  `,
  computed: {
    rank: function() {
      return {
        'rank-10': this.card.rank === '10',
        'rank-9': this.card.rank === '9',
        'rank-8': this.card.rank === '8',
        'rank-7': this.card.rank === '7',
        'rank-6': this.card.rank === '6',
        'rank-5': this.card.rank === '5',
        'rank-4': this.card.rank === '4',
        'rank-3': this.card.rank === '3',
        'rank-2': this.card.rank === '2',
        'rank-a': this.card.rank === 'A'
      };
    },
    suit: function() {
      return {
        'hearts': this.card.suit === 'hearts',
        'spades': this.card.suit === 'spades',
        'diams': this.card.suit === 'diams',
        'clubs': this.card.suit === 'clubs'
      }
    }
  },
  methods: {
    // clickCard: function() {
    //   this.card.clicked = !this.card.clicked;
    //   console.log(this.card.clicked);
    // }
  }
})
