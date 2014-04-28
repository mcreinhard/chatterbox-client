// YOUR CODE HERE:

var app = {};

(function() {
  app.init = function() {
    setInterval(app.fetch, 100);
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
        //data: JSON.stringify(message),
        contentType: 'application/json',
        success: function (data) {
          app.fetch.inProgress = false;
          $('#chats').empty();
          _.each(data.results, function(result) {
            app.addMessage(result);
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

  app.clearMessages = function() {
    $('#chats').empty();
  };

  app.addMessage = function(message) {
    var $message = $('<div></div>');
    $message.text(message.username + ': ' + message.text);
    $('#chats').append($message);

  };

  app.addRoom = function(roomName) {
    $('#roomSelect').append('<a href="#">' + roomName + '</a>');
  } ;

  app.server = 'https://api.parse.com/1/classes/chatterbox';
}).call(this);
