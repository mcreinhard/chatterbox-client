var app = {};

(function() {
  // parses window.location.search to extract username
  // returns an object {username: "actual_name"}
  var parseQueryString = function(queryString) {
    var result = {};
    _.each(queryString.slice(1).split('&'), function(kvString) {
      var key = kvString.split('=')[0];
      var value = kvString.split('=')[1];
      result[key] = value;
    });
    return result;
  };

  // initializes this app in index.html
  app.init = function() {
    app.fetch();
    setInterval(app.fetch, 1000);
    app.username = parseQueryString(window.location.search).username;
    app.roomname = undefined; // start off in a nameless room
    app.friends = {}; // {"friend name": true}
    $('.currentRoom').text(app.roomname || 'all messages');

    // listener on send message button - sends message in input
    $('.send').on('click', function(event) {
      event.preventDefault();
      app.handleSubmit();
    });

    // listener on create room button - creates room in input
    $('.createRoom').on('click', function(event) {
      event.preventDefault();
      var $roomSelect = $('#roomSelect');
      var $input = $('#newRoom');
      var newRoomName = $input.val();
      $input.val('');
      $('#message').focus(); // shifts focus back to chat input
      $('.currentRoom').text(newRoomName);
      app.roomname = newRoomName;
      if (!_.some($roomSelect.children(), function(item) {
        return $(item).text() === (newRoomName);
      })) {
        console.log('new room!');
        var $roomname = $('<a href="#" class="roomname"></a>');
        $roomname.text(newRoomName);
        $roomSelect.append($roomname);
        $roomSelect.append($('<br>'));
      }
    });

    // listener on room selection anchors - changes rooms
    $('#roomSelect').on('click', '.roomname', function(event) {
      event.preventDefault();
      if ($(this).hasClass('showAll')) {
        app.roomname = undefined; // nameless room shows all messages
      } else {
        app.roomname = $(this).text();
      }
      $('.currentRoom').text(app.roomname || 'all messages');
      app.fetch();
    });

    // listener on username anchors - toggles friend (bold font)
    $('#chats').on('click', '.username', function(event) {
      event.preventDefault();
      var username = $(this).text();
      if (app.friends[username] === undefined) {
        app.friends[username] = true;
      } else {
        delete app.friends[username];
      }

      // filters current messages to add class friend to friends
      // (bold font)
      $('.message').filter(function() {
        return $(this).children('.username').text() === username;
      }).toggleClass('friend');
    });
  };

  // posts provided message ({username, text, roomname})
  app.send = function(message) {
    $.ajax({
      url: app.server,
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Message sent');
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message');
      }
    });
  };

  // retrieves and displays 100 latest messages
  // transits message to app.addRoom to add new rooms to room list
  app.fetch = function() {
    if (!app.fetch.inProgress) { // guard in case last fetch unresolved
      app.fetch.inProgress = true;
      $.ajax(app.server, {
        type: 'GET',
        data: {
          order: "-createdAt",
          where: {
            roomname: app.roomname
          }
        },
        contentType: 'application/json',
        success: function (data) {
          app.fetch.inProgress = false;
          $('#chats').empty();
          $('#chats').append('<br>');
          _.each(data.results, function(result) {
            app.addMessage(result);
            app.addRoom(result);
          });
        },
        error: function (data) {
          app.fetch.inProgress = false;
          console.error('chatterbox: Failed to retrieve message');
        }
      });
    }
  };
  app.fetch.inProgress = false;

  // takes text from input and transmits message {} to app.send
  app.handleSubmit = function() {
    var $input = $('#message');
    var message = {
      username: app.username,
      text: $input.val(),
      roomname: app.roomname
    };
    app.send(message);
    $input.val('');
    $input.focus();
  };

  // clears chat for repopulation
  app.clearMessages = function() {
    $('#chats').empty();
  };

  // appends usernames and messages to chat window
  // any usernames in friends list gain friend class (bold font)
  app.addMessage = function(message) {
    var $message = $('<div class="message"></div>');
    var $username = $('<a href="#" class="username"></a>');
    $username.text(message.username);
    if (app.friends[message.username]) {
      $message.addClass('friend');
    }
    $message.text(' ' + message.text);
    $message.prepend($username);
    $('#chats').append($message);
  };

  // adds new rooms to room list
  app.addRoom = function(message) {
    var $roomSelect = $('#roomSelect');
    if (!_.some($roomSelect.children(), function(item) {
      return $(item).text() === (message.roomname || '');
    })) {
      var $roomname = $('<a href="#" class="roomname"></a>');
      $roomname.text(message.roomname);
      $roomSelect.append($roomname);
      $roomSelect.append($('<br>'));
    }
  };

  app.server = 'https://api.parse.com/1/classes/chatterbox';
}).call(this);
