Vue.component('game-canvas', {
  data: function() {
    return {
      secondToLastHandPlayed: null
    }
  },
  props: ['handsPlayed'],
  template: `
  <div v-if="secondToLastHandPlayed" class="md-layout-item">
    <h5 class="md-layout-item" style="color:burlywood; font-size: 30px;"><b><u>{{secondToLastHandPlayed.username}}</u></b> played:</h5>
    <div class="my-hand-wrapper md-layout-item" style="display: flex; justify-content: row">
      <playing-card v-for="card of secondToLastHandPlayed.cards" v-bind:card="card"><playing-card>    
    </div>
  </div>
  `,
  watch: {
    handsPlayed: function(pipe) {
      this.secondToLastHandPlayed = {
        cards: pipe[pipe.length - 2].cards,
        username: pipe[pipe.length - 2].username
      }
    }
  },
  created: function() {
    console.log('game-canvas was initiated');
  },
  methods: {}
})
