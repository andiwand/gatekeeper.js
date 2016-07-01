
function disableConnect(state) {
  $("#host").prop("disabled", state);
  $("#connect").prop("disabled", state);
  $("#disconnect").prop("disabled", !state);
}

$(function() {
  var targetArray = null;
  var targetArrayOffset = 0;

  gatekeeper.onopened = function() {
    console.log("opened");
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

  var ontarget = function(event) {
    if (!targetArray) return;

    var outputBuffer = event.outputBuffer;
    var length = Math.min(targetArray.length - targetArrayOffset, outputBuffer.length);
    if (length <= 0) return;

    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      var outputData = outputBuffer.getChannelData(channel);
      for (var sample = 0; sample < length; sample++) {
        var value = targetArray[targetArrayOffset + sample];
        if (value < 0) value /= 128.0;
        else value /= 127.0;
        outputData[sample] = value;
      }
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
    disableConnect(false);
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
        audio.open(4096, 1, 1, null, ontarget);
        element.text("hung up");
      } else {
        gatekeeper.intercomClose();
        element.text("take off");
      }
    }
  });
});
