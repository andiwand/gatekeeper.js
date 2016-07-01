navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

var audio = audio || {};

audio._source = null;
audio._target = null;

audio.open = function(bufferSize, inputChannels, outputChannels, onsource, ontarget) {
  var context = new window.AudioContext();
  var sampleRate = context.sampleRate;

  var output = context.destination;
  var outputScript = context.createScriptProcessor(bufferSize, outputChannels, outputChannels);
  outputScript.onaudioprocess = ontarget;

  outputScript.connect(output);
  audio._target = outputScript;

  if (onsource) {
    var success = function(mediaStream) {
      var input = context.createMediaStreamSource(mediaStream);
      var inputScript = context.createScriptProcessor(bufferSize, input.channelCount, inputChannels);
      inputScript.onaudioprocess = onsource;

      input.connect(inputScript);
      audio._source = input;
    };

    var error = function(error) {
      console.log("error capturing audio");
    };

    navigator.getUserMedia({audio: true}, success, error);
  }
}

audio.close = function() {
  audio._source.disconnect();
  audio._target.disconnect();
}
