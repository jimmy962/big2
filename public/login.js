Vue.component('user-login', {
  data: function() {
    return {
      username: null,
      email: null
      // testing
      // username: 'jimboslice', 
      // email: 'testmavrck@gmail.com'
    }
  },
  template: `
  <div class="row"> 
    <div class="input-field col s8">
      <input type="email" v-model.trim="email" placeholder="Email">
    </div>
    <div class="input-field col s8">
      <input type="text" v-model.trim="username" placeholder="Username">
    </div>
    <div class="input-field col s4">
      <button class="waves-effect waves-light btn" @click="join()">
        Join
      </button>
    </div>
  </div>`,
  methods: {
    join: function () {
      if (!this.email) {
          Materialize.toast('You must enter an email', 2000);
          return
      }
      if (!this.username) {
          Materialize.toast('You must choose a username', 2000);
          return
      }
      this.email = $('<p>').html(this.email).text();
      this.username = $('<p>').html(this.username).text();
      this.$emit('update-user', this.email, this.username);
    }
  }
})
