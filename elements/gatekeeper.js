
var gatekeeper = gatekeeper || {};

gatekeeper.PORT = 12345;

gatekeeper.onopened = null;
gatekeeper.onerror = null;
gatekeeper.onclosed = null;
gatekeeper.oninfo = null;
gatekeeper.onaudio = null;

gatekeeper._socket = null;
gatekeeper._name = null;
gatekeeper._doors = null;

gatekeeper.init = function() {
  audio.init();
}

gatekeeper.connect = function(host) {
  if (gatekeeper.socket) return;

  var socket = new WebSocket("ws://" + host + ":" + gatekeeper.PORT);
  socket.onopen = function(event) {
    gatekeeper._socket = socket;
    socket.binaryType = "arraybuffer";
    if (gatekeeper.onopened) gatekeeper.onopened();

    infoRequest = {"type": "REQUEST_INFO"};
    socket.send(JSON.stringify(infoRequest));
  };
  socket.onerror = function(event) {
    if (gatekeeper.onerror) gatekeeper.onerror(event);
  };
  socket.onclose = function() {
    if (!gatekeeper.socket) return;
    gatekeeper.socket = null;
    if (gatekeeper.onclosed) gatekeeper.onclosed();
  };
  socket.onmessage = function(message) {
    if (typeof message.data === "string") {
      packet = JSON.parse(message.data);

      if (packet.type === "RESPONSE_INFO") {
        gatekeeper._name = packet.data.name;
        gatekeeper._doors = packet.data.doors;
        console.log(message.data);
        if (gatekeeper.oninfo) gatekeeper.oninfo();
      }
    } else {
      if (gatekeeper.onaudio) gatekeeper.onaudio(message.data);
    }
  };
};

gatekeeper.getName = function() {
  return gatekeeper._name;
};

gatekeeper.getDoors = function() {
  return gatekeeper._doors;
};

gatekeeper.unlock = function(door) {
  if (!(door in gatekeeper._doors)) return;
  unlockRequest = {"type": "REQUEST_UNLOCK", "data": {"door": door}};
  gatekeeper._socket.send(JSON.stringify(unlockRequest));
};

gatekeeper.intercomOpen = function(door) {
  if (!(door in gatekeeper._doors)) return;
  intercomRequest = {"type": "REQUEST_INTERCOM", "data": {"door": door}};
  gatekeeper._socket.send(JSON.stringify(intercomRequest));
};

gatekeeper.intercomAudio = function(data) {
  // TODO: check intercom open
  gatekeeper._socket.send(data);
};

gatekeeper.intercomClose = function() {
  closeIntercom = {"type": "CLOSE_INTERCOM"};
  gatekeeper._socket.send(JSON.stringify(closeIntercom));
};

gatekeeper.close = function() {
  if (!gatekeeper.socket) return;
  gatekeeper.socket.close();
};
