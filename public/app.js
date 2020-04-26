new Vue({
  el: '#app',

  data: {
      joined: false, // True if email and username have been filled in
      user: {
        email: null,
        username: null
      }
  },
  methods: {
    updateUser: function(username, email) {
      this.user.email = email;
      this.user.username = username;
      this.joined = true;
    }
  }
});
