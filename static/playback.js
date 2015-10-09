/*
 * Audio Environment Class
 */

// create a new Audio Environment
function AudioEnv(tempo) {
  this.context = new (window.AudioContext || window.webkitAudioContext)();
  this.tempo = tempo || 60;
  this.sequences = [];
  this.timeOut = false;
  this.values = {
    'soprano': {'gain': 0.2, 'real': [0,  0.40,  0.40,  0.91,  0.91,  0.91,
                                         0.30,  0.70,  0.00,  0.00,  0.00]},
       'alto': {'gain': 0.2, 'real': [0, -0.10, -0.50,  0.40,  0.00, -0.91,
                                         0.00,  0.00,  0.00,  0.00,  0.00]},
      'tenor': {'gain': 0.3, 'real': [0,  0.64, -0.00,  0.21, -0.00,  0.13,
                                        -0.00,  0.09, -0.00,  0.07, -0.00]},
       'bass': {'gain': 0.3, 'real': [0, -0.00, -0.20,  0.50, -0.40,  0.14,
                                        -0.11,  0.12, -0.01,  0.07, -0.01]}
  };
}

// toggle play/stop on button click
AudioEnv.prototype.toggle = function(button) {
  if (button.value === "Stop Music") {
    button.value = "Play Music";
    this.stop();
  } else {
    button.value = "Stop Music";
    this.play(button);
  }
};

// play music
AudioEnv.prototype.play = function(button) {
  var when = this.context.currentTime + 0.1;
  var duration = 0;
  var music = getMusic();

  for (var voice in music) {
    var seq = new Sequence(this, this.values[voice], music[voice]);
    this.sequences.push(seq);
    var voiceDuration = seq.play(when) - when;
    duration = Math.max(voiceDuration, duration);
  }
  var self = this;
  this.timeOut = setTimeout(function(){self.toggle(button);}, (duration * 1000));
};

// stop music playback
AudioEnv.prototype.stop = function() {
  for (var i = this.sequences.length - 1; i >= 0; i--) 
    this.sequences[i].destroy();
  this.sequences = [];
  clearTimeout(this.timeOut);
};

/*
 * Sequence Class
 */

// create a new Sequence
function Sequence(audioEnv, values, pitches) {
  this.context = audioEnv.context;
  this.values = values;
  this.tempo = audioEnv.tempo;
  this.osc = this.context.createOscillator();
  this.osc.setPeriodicWave(this.getWave());
  this.gainNode = this.context.createGain();
  this.equalizers = this.createEQ();
  this.pitches = pitches;
}

// create Fx EQ nodes
Sequence.prototype.createEQ = function() {
  var eq = [100, 1000, 2500];
  var activeNode = this.gainNode;
  for (var freq = 0; freq < eq.length; freq++) {
    var filter = this.context.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = eq[freq];
    activeNode.connect(filter);
    activeNode = eq[freq] = filter;
  }
  activeNode.connect(this.context.destination);
  return eq;
};

// disconnect Sequence and stop playing
Sequence.prototype.destroy = function() {
  var when = this.context.currentTime;
  this.gainNode.gain.linearRampToValueAtTime(0, when + 0.1);
  var that = this;
  setTimeout(function() {
    that.gainNode.disconnect();
    that.osc.disconnect();
  }, 100);
  //for (var eq in this.equalizers) {
    //this.equalizers[eq].disconnect();
  //}
};

// schedule the Sequence to play
Sequence.prototype.play = function(when) {
  this.osc.start(when);
  this.gainNode.gain.setValueAtTime(0, when);
  this.osc.connect(this.gainNode);
  for (var i = 0, len = this.pitches.length; i < len; i++)
    when = this.scheduleNote(this.pitches[i], when);
  this.gainNode.gain.linearRampToValueAtTime(0, when += 0.1);
  this.osc.stop(when += 0.2);
  return when;
};

// schedule a note to play
Sequence.prototype.scheduleNote = function(pitch, when) {
  var freq = 440 * Math.pow(2, (pitch - 45) / 12);
  var duration = 60 / this.tempo;
  this.osc.frequency.setValueAtTime(freq, when);
  this.gainNode.gain.linearRampToValueAtTime(
    this.values['gain'], when + duration * 0.01);
  when = this.noteDecay(when, duration);
  this.osc.frequency.setValueAtTime(0, when);
  return when;
};

// schedule fadeout of gainNode
Sequence.prototype.noteDecay = function(start, duration) {
  var value = this.values['gain'];
  this.gainNode.gain.setValueAtTime(
    value,       start + duration * 0.7);
  this.gainNode.gain.linearRampToValueAtTime(
    value * 0.9, start + duration * 0.9);
  this.gainNode.gain.linearRampToValueAtTime(
    value * 0.5, start + duration);
  return start + duration;
};

// return a periodic wave
Sequence.prototype.getWave = function() {
  var real = new Float32Array(this.values['real']);
  var imag = new Float32Array(real.length);
  return this.context.createPeriodicWave(real, imag);
};

/*
 * Functions to get pitches from input_fields
 */

// get the string value of an input field
function getInput(voice) {
  var elem = document.getElementById(voice[0] + "_input");
  return elem.value || elem.innerHTML;
}

// calculate pitch from letter, accidental, octave
function calcPitch(l, a, o) {
  var letters = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11};
  var accidentals = {'bb': -2, 'b': -1, '': 0, '#': 1, '##': 2};
  return letters[l] + accidentals[a] + (parseInt(o) - 1) * 12;
}

// get array of pitches from voice input
function convertPitches(voice) {
  var string = getInput(voice);
  var array = string.split(',');
  var pitches = [];

  if (string == "")
    return pitches;

  for (var i = 0; i < array.length; i++) {
    var letter = array[i][0];
    array[i] = array[i].slice(1);
    var number = /\d+/.exec(array[i])[0];
    var accidental = array[i].replace(number, '');
    pitches.push(calcPitch(letter, accidental, number));
  }
  return pitches;
}

// get hash of voiceparts: array of pitches
function getMusic() {
  var voices = ['soprano', 'alto', 'tenor', 'bass'];
  var music = {};
  for (var i = 0; i < voices.length; i++) {
    music[voices[i]] = convertPitches(voices[i]);
  }
  return music;
}

/*
 * Main code for page
 */

var audio = new AudioEnv();

var play = document.getElementById("play");
play.addEventListener('click', function(){audio.toggle(this);}, false);
