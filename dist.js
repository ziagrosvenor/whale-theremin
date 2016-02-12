"use strict";

var ctx = new window.AudioContext();
var DEFAULT_PITCH = 240;
var DEFAULT_FREQ = 2000;
var DEFAULT_GAIN = 0.1;

function createOsc(pitch, wave) {
  var osc = ctx.createOscillator();
  osc.frequency.value = pitch;
  osc.type = wave;
  return osc;
}

function createFilter(freq, type) {
  var filter = ctx.createBiquadFilter();
  filter.frequency.value = freq;
  filter.type = type;
  return filter;
}

var compressor = ctx.createDynamicsCompressor();
compressor.threshold.value = -50;
compressor.knee.value = 40;
compressor.ratio.value = 12;
compressor.reduction.value = -50;
compressor.attack.value = 0;
compressor.release.value = 0.25;

var osc = createOsc(DEFAULT_PITCH, "sawtooth");
var filter = createFilter(DEFAULT_FREQ, "lowpass");
var gain = ctx.createGain();
var verbGain = ctx.createGain();
var convolver = ctx.createConvolver();
var output = ctx.createGain();

var req = new XMLHttpRequest();
req.open("GET", "ir.wav", true);
req.responseType = "arraybuffer";

req.onload = function () {
  var data = req.response;
  ctx.decodeAudioData(data, function (buf) {
    convolver.buffer = buf;
    init();
  }, function (err) {
    return console.log(err);
  });
};

req.send();

function init() {
  var mixInput = ctx.createGain();
  var cam = CamMotion.Engine();
  var canvas = document.getElementById("view");
  var canvasCtx = canvas.getContext("2d");
  var img = document.getElementById("whale");

  osc.connect(filter);
  filter.connect(compressor);
  compressor.connect(mixInput);
  mixInput.connect(convolver);
  mixInput.connect(gain);
  convolver.connect(verbGain);
  verbGain.connect(output);
  gain.connect(output);
  output.gain.value = 0.8;
  output.connect(ctx.destination);
  osc.start(0);

  cam.on("frame", function () {
    canvasCtx.clearRect(0, 0, 1000, 1500);
    var p = cam.getMovementPoint(true);
    canvasCtx.drawImage(img, p.x, p.y);
    osc.frequency.value = p.y;
    var x = p.y / (p.y / 0.5) / 1.0;
    var gain1 = Math.cos(x * 0.5 * Math.PI);
    var gain2 = Math.cos((1.0 - x) * 0.5 * Math.PI);
    verbGain.gain.value = gain1;
    gain.gain.value = gain2;
  });

  cam.start();
}
