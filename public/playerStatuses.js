Vue.component('player-statuses', {
  data: function() {
    return {}
  },
  props: ['players', 'user'],
  template: `
  <div>
    <div v-for="(player, key) of players" style="display: flex; flex-direction: row">
      <span v-if="key === 'playerA'"><b>Player 1</b> -&nbsp;</span>
      <span v-if="key === 'playerB'"><b>Player 2</b> -&nbsp;</span>
      <span v-if="key === 'playerC'"><b>Player 3</b> -&nbsp;</span>
      <span v-if="key === 'playerD'"><b>Player 4</b> -&nbsp;</span>
      <div v-if="player.username">
        <span v-bind:class="[{ 'emphasize-username': user.username === player.username }]">{{ player.username | username }}</span>
      </div>
      <div v-if="!player.username" style="color: green">Seat available</div>
      <div v-if="player.cardsLeft > -1">&nbsp;-&nbsp;<b style="color: blue">{{player.cardsLeft}}</b></div>
      <span v-if="player.myTurn" class="my-turn">&nbsp;<== </span>
    </div>
  </div>`,
  created: function() {
    console.log('hello im here')
  },
  computed: {
  },
  methods: {
  },
  filters: {
    username: (username) => {
      if (username.includes('bless')) {
        return 'wilson';
      } else {
        return username;
      }
    }
  }
})
