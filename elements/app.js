
// TODO: use jQuery to copy objects

gatekeeper.app = {};

(function() {
  var app = gatekeeper.app;

  app.STORAGE_KEY = "settings";

  app.TEMPLATES = {
    gatekeeper: {
      host: null,
      port: null,
      reachable: null,
      name: null,
      doors: [],
      pinned: null
    },
    door: {
      gatekeeper: null,
      name: null,
      hasBell: null,
      hasUnlock: null,
      hasIntercom: null,
    },
    options: {

    },

    settings: {
      gatekeepers: [],
      options: {}
    },
    settings_gatekeeper: {
      host: null,
      port: null
    }
  };

  app.STATE = {
    gatekeepers: [],
    doors: [],
    options: {}
  };

  app._load = function() {
    var data = localStorage.getItem(app.STORAGE_KEY);
    data = JSON.parse(data);
    return data;
  };

  app._save = function(data) {
    data = JSON.stringify(data);
    localStorage.setItem(app.STORAGE_KEY, data);
  };

  app.addGatekeeper = function(host, port) {
    var array = app.STATE.gatekeepers;
    for (var i = 0; i < array.length; i++) {
      other = array[i];
      if ((other.host == host) && (other.port == port)) return null;
    }

    var gatekeeper = {
      host: host,
      port: port,
      reachable: null,
      name: null,
      doors: [],
      pinned: null
    }; // TODO: clone from template
    // TODO: request and fill data
    array.push(gatekeeper);
    // TODO: sort
    return gatekeeper;
  };

  app.removeGatekeeper = function(gatekeeper) {
    var array = app.STATE.gatekeepers;
    var index = array.indexOf(gatekeeper);
    if (index < 0) return false;
    array.splice(index, 1);
    if (gatekeeper.doors != null) {
      array = app.STATE.doors;
      for (index = 0; index < array.length; index++) {
        if (array[index].gatekeeper == gatekeeper) break;
      }
      if (index < array.length) {
        array.splice(index, gatekeeper.doors.length);
      }
    }
    return true;
  };

  app.load = function() {
    var data = app._load();
    data = {
      gatekeepers: [
        {host: "192.168.15.1", port: 12345},
        {host: "192.168.15.2", port: 12345}
      ],
      options: {}
    };
    data.gatekeepers.forEach(function(gatekeeper) {
      app.addGatekeeper(gatekeeper.host, gatekeeper.port);
    });
    app.STATE.options = data.options; // TODO: update instead of replace
  };

  app.save = function() {
    var data = {
      gatekeepers: [],
      options: app.STATE.options
    }; // TODO: clone from template
    app.STATE.gatekeepers.forEach(function(gatekeeper) {
      if (!gatekeeper.pinned) return;
      data.gatekeepers.push({
        host: gatekeeper.host,
        port: gatekeeper.port
      }); // TODO: clone from template
    });
    app._save(data);
  };
}());
