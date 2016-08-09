
$(function() {
  function disableConnect(state) {
    $("#host").prop("disabled", state);
    $("#connect").prop("disabled", state);
    $("#disconnect").prop("disabled", !state);
  }
  function clear() {
    $("#name").empty();
    $("#doors").empty();
  }
  function resetUI() {
    disableConnect(false);
    clear();
  }

  var targetArray = null;
  var targetArrayOffset = 0;

  gatekeeper.onopened = function() {
    console.log("opened");
  };
  gatekeeper.onerror = function(event) {
    console.log(event);
    resetUI();
  };
  gatekeeper.onclosed = function() {
    console.log("closed");
  };
  gatekeeper.oninfo = function() {
    $("#name").text(gatekeeper.getName());

    var doors = gatekeeper.getDoors();
    Object.keys(doors).forEach(function(k) {
      var door = doors[k];
      var row = $('<tr></tr>');
      row.append('<td class="door">' + k + '</td>');
      row.append('<td class="bell">' + door.hasBell + '</td>');
      row.append('<td><button class="unlock">unlock</button></td>');
      row.append('<td><button class="intercom">take off</button></td>');
      $("#doors").append(row);
    });
  };
  gatekeeper.onaudio = function(data) {
    targetArray = new Int8Array(data);
    targetArrayOffset = 0;
  };

  var onsource = function(event) {
    var input = event.inputBuffer.getChannelData(0);
    var output = new Int8Array(input.length);

    for (var sample = 0; sample < input.length; sample++) {
      var value = input[sample];
      if (value < 0) value *= 128.0;
      else value *= 127.0;
      value = Math.round(value);
      output[sample] = value;
    }

    gatekeeper.intercomAudio(output);
  };
  var ontarget = function(event) {
    if (!targetArray) return;

    var output = event.outputBuffer.getChannelData(0);
    var length = Math.min(targetArray.length - targetArrayOffset, output.length);
    if (length <= 0) return;

    for (var sample = 0; sample < length; sample++) {
      var value = targetArray[targetArrayOffset + sample];
      if (value < 0) value /= 128.0;
      else value /= 127.0;
      output[sample] = value;
    }

    targetArrayOffset += length;
  };

  $("#connect").click(function() {
    host = $("#host").val();
    disableConnect(true);
    gatekeeper.connect(host);
  });
  $("#disconnect").click(function() {
    gatekeeper.close();
    resetUI();
  });
  $("#doors").click(function(event) {
    var element = $(event.target);
    if (!element.is("button")) return;
    var door = element.parent().siblings(".door").text();
    if (element.hasClass("unlock")) {
      gatekeeper.unlock(door);
    } else if (element.hasClass("intercom")) {
      if (element.text() === "take off") {
        gatekeeper.intercomOpen(door);
        audio.openSpeaker(4096, 1, ontarget);
        audio.openMicrophone(4096, 1, onsource);
        element.text("hung up");
      } else {
        audio.closeSpeaker();
        audio.closeMicrophone();
        gatekeeper.intercomClose();
        element.text("take off");
      }
    }
  });

  gatekeeper.init();
});
