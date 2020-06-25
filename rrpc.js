window.rrpc = function () {

  var web_socket = null;
  var callbacks = {};
  var currentId = 1;
  const jsonrpc = "2.0";
  var initialErrorCallback = null;

  function nextId() {
    const id = currentId;
    currentId++;
    return id;
  }

  function tearDown() {
    if (web_socket) {
      web_socket.close();
    }
    const oldCallbacks = callbacks;
    callbacks = {};
    for (var c in oldCallbacks) {
      oldCallbacks[c](null, new Error('WebSocket torn down'));
    }
  }

  function processMessage(event) {
    const data = JSON.parse(event.data);
    if (data.id in callbacks) {
      const cb = callbacks[data.id];
      delete callbacks[data.id];
      cb(data.result, data.error);
    }
  }

  function initializeWebSocket(openCallback, errorCallback, host) {
    web_socket = new WebSocket("ws://" + host + "/websocket");
    if (initialErrorCallback) {
      web_socket.onerror = errorCallback;
    }
    web_socket.onopen = function () {
      web_socket.onmessage = processMessage;
      web_socket.onclose = function (event) {
        tearDown();
        // try to re-connect
        initializeWebSocket(openCallback,
          function (event) {
            // If we are trying to re-connect because the other end has gone down,
            // we just have to die silently.
            if (event.error.code !== "ECONNREFUSED") {
              initialErrorCallback(event.error);
            }
          },
          host);
      }
      if (openCallback) {
        openCallback();
      }
    }
  }

  return {

    initialize: function (openCallback=null,
      errorCallback=null,
      host=window.location.host) {
      tearDown();
      initialErrorCallback = errorCallback;
      initializeWebSocket(openCallback, errorCallback, host);
    },

    call: function (method, params, callback) {
      const id = nextId();
      if (callback) {
        callbacks[id] = callback;
      }
      web_socket.send(JSON.stringify({ jsonrpc, method, params, id }));
    },

    destroy: function (callback) {
      tearDown();
    },

  }

}();
