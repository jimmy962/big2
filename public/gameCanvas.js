Vue.component('game-canvas', {
  data: function() {
    return {
      lastHandPlayed: null,
      secondToLastHandPlayed: null
    }
  },
  props: ['handsPlayed'],
  template: `
  <div v-if="lastHandPlayed">
    <h4 style="color:burlywood; font-size: 30px;"><b><u>{{lastHandPlayed.username}}</u></b> played:</h4>
    <div class="my-hand-wrapper" style="display: flex; justify-content: row">
      <playing-card v-for="card of lastHandPlayed.cards" v-bind:card="card"><playing-card>    
    </div>
  </div>
  `,
  watch: {
    handsPlayed: function(pipe) {
      this.lastHandPlayed = {
        cards: pipe[pipe.length - 1].cards,
        username: pipe[pipe.length - 1].username
      }
    }
  },
  created: function() {
    console.log('game-canvas was initiated');
  },
  methods: {}
})
