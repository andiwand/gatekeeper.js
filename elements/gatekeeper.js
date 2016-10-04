
var gatekeeper = function(host, port) {
  this.onopened = function() {};
  this.onerror = function(event) {};
  this.onclosed = function() {};
  this.oninfo = function() {};
  this.onaudio = function() {};

  this._host = host;
  this._port = port || gatekeeper.PORT;
  this._socket = null;
  this._name = null;
  this._doors = null;
};

gatekeeper.PORT = 12345;

gatekeeper._STATE = {
  discovery: {
    started: false,
    listeners: []
  }
};

gatekeeper.startDiscovery = function() {
  gatekeeper._STATE.discovery.started = true;
};

gatekeeper.stopDiscovery = function() {
  gatekeeper._STATE.discovery.started = false;
};

gatekeeper._discovered = function(data) {
  if (!gatekeeper._STATE.discovery.started) return;
  gatekeeper._STATE.discovery.listeners.forEach(function(listener) {
    listener(data);
  });
};

gatekeeper.addDiscoveryListener = function(listener) {
  gatekeeper._STATE.discovery.listeners.push(listener);
};

gatekeeper.prototype.connect = function() {
  var socket = new WebSocket("ws://" + this._host + ":" + this._port);
  socket.onopen = function(event) {
    this._socket = socket;
    socket.binaryType = "arraybuffer";
    this.onopened();

    infoRequest = {"type": "REQUEST_INFO"};
    socket.send(JSON.stringify(infoRequest));
  }.bind(this);
  socket.onerror = function(event) {
    this.onerror(event);
  }.bind(this);
  socket.onclose = function() {
    if (!this.socket) return;
    this.socket = null;
    this.onclosed();
  }.bind(this);
  socket.onmessage = function(message) {
    if (typeof message.data === "string") {
      packet = JSON.parse(message.data);

      if (packet.type === "RESPONSE_INFO") {
        this._name = packet.data.name;
        this._doors = packet.data.doors;
        this.oninfo();
      }
    } else {
      this.onaudio(message.data);
    }
  }.bind(this);
};

gatekeeper.prototype.getName = function() {
  return this._name;
};

gatekeeper.prototype.getDoors = function() {
  return this._doors;
};

gatekeeper.prototype.unlock = function(door) {
  if (!(door in this._doors)) return;
  unlockRequest = {"type": "REQUEST_UNLOCK", "data": {"door": door}};
  this._socket.send(JSON.stringify(unlockRequest));
};

gatekeeper.prototype.intercomOpen = function(door) {
  if (!(door in this._doors)) return;
  intercomRequest = {"type": "REQUEST_INTERCOM", "data": {"door": door}};
  this._socket.send(JSON.stringify(intercomRequest));
};

gatekeeper.prototype.intercomAudio = function(data) {
  // TODO: check intercom open
  this._socket.send(data);
};

gatekeeper.prototype.intercomClose = function() {
  closeIntercom = {"type": "CLOSE_INTERCOM"};
  this._socket.send(JSON.stringify(closeIntercom));
};

gatekeeper.prototype.close = function() {
  if (!this._socket) return;
  this._socket.close();
};
