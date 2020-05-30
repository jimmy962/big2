Vue.use(VueMaterial.default)
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
    updateUser: function(email, username) {
      this.user.email = email;
      this.user.username = username;
      this.joined = true;
    }
  }
});
