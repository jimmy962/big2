Vue.component('game-canvas', {
  data: function() {
    return {
      lastHandPlayed: null,
      secondToLastHandPlayed: null
    }
  },
  props: ['handsPlayed'],
  template: `
  <div>
    <div>Last hand played!!!</div>
    <ul v-for="card in lastHandPlayed">
      {{card.suit + '-' + card.rank}}
    </ul>
    <div>Second to last hand played!!!</div>
    <ul v-for="card in secondToLastHandPlayed">
      {{card.suit + '-' + card.rank}}
    </ul>
  </div>
  `,
  watch: {
    handsPlayed: function(newHand) {
      this.lastHandPlayed = newHand[newHand.length - 1];
      this.secondToLastHandPlayed = newHand[newHand.length - 2];
    }
  },
  created: function() {
    console.log('game-canvas was initiated');
  },
  methods: {}
})
