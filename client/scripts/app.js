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
    $('.send').on('click', function(event) {
      event.preventDefault();
      app.handleSubmit();
    });
    $('#roomSelect').on('click', '.roomname', function(event) {
      event.preventDefault();
      app.roomname = $(this).text();
      app.fetch();
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
      roomname: 'best_room_ever'
    };
    app.send(message);
    $input.val('');
    $input.focus();
  };

  app.clearMessages = function() {
    $('#chats').empty();
  };

  app.addMessage = function(message) {
    var $message = $('<div></div>');
    $message.text(message.username + ': ' + message.text);
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
