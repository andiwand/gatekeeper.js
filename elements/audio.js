
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

window.AudioContext = window.AudioContext ||
                      window.webkitAudioContext;

var audio = audio || {};

audio._source = null;
audio._target = null;

audio.openSpeaker = function(bufferSize, channels, ontarget) {
  var context = new window.AudioContext();
  var sampleRate = context.sampleRate;

  var output = context.destination;
  var script = context.createScriptProcessor(bufferSize, channels, channels);
  script.onaudioprocess = ontarget;

  script.connect(output);
  audio._target = context;
};

audio.openMicrophone = function(bufferSize, channels, onsource) {
  var success = function(stream) {
    var context = new window.AudioContext();
    var sampleRate = context.sampleRate;

    var input = context.createMediaStreamSource(stream);
    var script = context.createScriptProcessor(bufferSize, input.channelCount, channels);
    script.onaudioprocess = onsource;

    input.connect(script);
    script.connect(context.destination);
    audio._source = context;
  };

  var error = function(error) {
    console.log("error capturing audio");
  };

  navigator.getUserMedia({audio: true}, success, error);
};

audio.closeSpeaker = function() {
  audio._source.close();
};

audio.closeMicrophone = function() {
  audio._target.close();
};
