Vue.component('group-chat', {
  data: function() {
    return {
      chatWs: null,
      newMsg: null,
      chatContent: ''
    }
  },
  props: ['user'],
  template: `
  <div id="chat-wrapper" style="width: 40%">
      <div id="chat-content" class="row">
          <div class="col s12">
              <div class="card horizontal">
                  <div id="chat-messages" class="card-content" v-html="chatContent"></div>
              </div>
          </div>
      </div>
      <div id="chat-input" class="row">
          <div class="input-field col s9">
              <input type="text" v-model="newMsg" @keyup.enter="send" placeholder="Press enter to submit">
          </div>
      </div>
  </div>
  `,
  created: function() {
    var self = this;
    // this.chatWs = new WebSocket('ws://' + window.location.host + '/ws');
    // this.chatWs.addEventListener('message', function(e) {
    //     var msg = JSON.parse(e.data);
    //     self.chatContent += '<div class="chip">'
    //             + '<img src="' + self.gravatarURL(msg.email) + '">' // Avatar
    //             + msg.username
    //         + '</div>'
    //         + emojione.toImage(msg.message) + '<br/>'; // Parse emojis
    //     var element = document.getElementById('chat-messages');
    //     element.scrollTop = element.scrollHeight; // Auto scroll to the bottom
    // });
  },
  methods: {
    gravatarURL: function(email) {
      return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
    },
    send: function () {
      if (this.newMsg != '') {
          this.chatWs.send(
              JSON.stringify({
                  email: this.user.email,
                  username: this.user.username,
                  message: $('<p>').html(this.newMsg).text() // Strip out html
              }
          ));
          this.newMsg = ''; // Reset newMsg
      }
    }
  }
})
