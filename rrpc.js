window.rrpc = function () {

  var web_socket = null;
  var callbacks = {};
  var infoCallbacks = {};
  var currentId = 1;
  const jsonrpc = "2.0";
  var initialErrorCallback = null;
  var currentHost = null;

  function nextId() {
    const id = currentId;
    currentId++;
    return id;
  }

  function tearDown() {
    if (web_socket) {
      web_socket.close();
      web_socket = null;
    }
    const oldCallbacks = callbacks;
    callbacks = {};
    infoCallbacks = {};
    for (var c in oldCallbacks) {
      oldCallbacks[c](null, new Error("WebSocket torn down"));
    }
  }

  function isEmpty(obj) {
    for (var i in obj) {
      return false;
    }
    return true;
  }

  function maybeTearDown() {
    if (isEmpty(callbacks) && isEmpty(infoCallbacks)) {
      tearDown();
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
        var error = null;
        var code = null;
        var ed = null;
        if ("error" in data) {
          var t = typeof(data.error);
          if (t == "object") {
            error = data.error.message;
            code = data.error.code;
            ed = data.error.data;
          } else if (t == "string") {
            ed = data.error;
          }
        }
        cb("result" in data? data.result : null, error, code, ed);
        maybeTearDown();
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
      currentHost = host;
      web_socket.onmessage = processMessage;
      if (openCallback) {
        openCallback();
      }
    };
  }

  function ensureInitialized(callback, fn) {
    if (web_socket) {
      fn();
    } else {
      initializeWebSocket(fn, function() {
        callback(null, "Could not reconnect to web socket", -1,  null);
      }, currentHost);
    }
  }

  function maybeTearDownAfter(fn) {
    if (typeof(fn) !== "function") {
      return maybeTearDown;
    } else {
      return function() {
        fn();
        maybeTearDown();
      };
    }
  }

  return {

    initialize: function (openCallback=null,
      errorCallback=null,
      host=window.location.host) {
      tearDown();
      initialErrorCallback = errorCallback;
      initializeWebSocket(maybeTearDownAfter(openCallback), errorCallback, host);
    },

    call: function (method, params, callback, infoCallbackMap) {
      const id = nextId();
      ensureInitialized(callback, function() {
        if (callback) {
          callbacks[id] = callback;
          infoCallbacks[id] = typeof(infoCallbackMap) === "object"?
            infoCallbackMap : {};
        }
        web_socket.send(JSON.stringify({ jsonrpc, method, params, id }));
      });
    },

    destroy: function () {
      tearDown();
    },

  }

}();
