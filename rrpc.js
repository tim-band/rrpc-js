window.rrpc = function () {

  var web_socket = null;
  var callbacks = {};
  var infoCallbacks = {};
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
    infoCallbacks = {};
    for (var c in oldCallbacks) {
      oldCallbacks[c](null, new Error("WebSocket torn down"));
    }
  }

  function processMessage(event) {
    const data = JSON.parse(event.data);
    const id = data.id[0];
    if ("jsonrpc" in data) {
      if (id in callbacks) {
        const cb = callbacks[id];
        delete callbacks[id];
        delete infoCallbacks[id];
        cb(data.result, data.error);
      }
    } else if ("type" in data) {
      const call = data.type[0];
      const callbackMap = infoCallbacks[id];
      if (call in callbackMap) {
        if (call === "progress") {
          callbackMap.progress(data.numerator[0], data.denominator[0]);
        } else if (call === "info") {
          callbackMap.info(data.text[0]);
        }
      }
    }
  }

  function initializeWebSocket(openCallback, errorCallback, host) {
    var protocol = window.location.protocol === "https:"? "wss://" : "ws://";
    // any path ending in /websocket/ seems to be OK
    web_socket = new WebSocket(protocol + host + window.location.pathname + "x/websocket/");
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

    call: function (method, params, callback, infoCallbackMap) {
      const id = nextId();
      if (callback) {
        callbacks[id] = callback;
        infoCallbacks[id] = typeof(infoCallbackMap) === "object"?
          infoCallbackMap : {};
      }
      web_socket.send(JSON.stringify({ jsonrpc, method, params, id }));
    },

    destroy: function () {
      tearDown();
    },

  }

}();
