var app = {};

(function() {
  var parseQueryString = function(queryString) {
    var result = {};
    _.each(queryString.slice(1).split('&'), function(kvString) {
      var key = kvString.split('=')[0];
      var value = kvString.split('=')[1];
      result[key] = value;
    });
    return result;
  };

  app.init = function() {
    app.fetch();
    setInterval(app.fetch, 1000);
    app.username = parseQueryString(window.location.search).username;
    app.roomname = undefined;
    app.friends = {};
    $('.currentRoom').text(app.roomname || 'all messages');


    $('.send').on('click', function(event) {
      event.preventDefault();
      app.handleSubmit();
    });
    $('#roomSelect').on('click', '.roomname', function(event) {
      event.preventDefault();
      if ($(this).hasClass('showAll')) {
        app.roomname = undefined;
      } else {
        app.roomname = $(this).text();
      }
      $('.currentRoom').text(app.roomname || 'all messages');
      app.fetch();
    });
    $('#chats').on('click', '.username', function(event) {
      event.preventDefault();
      var username = $(this).text();
      if (app.friends[username] === undefined) {
        app.friends[username] = true;
      } else {
        delete app.friends[username];
      }
      $('.message').filter(function() {
        return $(this).children('.username').text() === username;
      }).toggleClass('friend');
    });
  };

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


  app.fetch = function() {
    if (!app.fetch.inProgress) {
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

  app.clearMessages = function() {
    $('#chats').empty();
  };

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
