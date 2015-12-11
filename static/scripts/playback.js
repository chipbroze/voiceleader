// AUDIO ENVIRONMENT CLASS //

/**
 * Create a new Audio Environment.
 * @property {object} context: Holds WebAudio API context.
 * @property {array} sequences: Sequence objects holding line data.
 * @property {bool/number} playing: Either 'false' or setTimeout value.
 * @property {number} tempo: Stores playback speed in beats per minute (bpm).
 * @property {object} music: Stores note data for playback.
 * @property {object} values: Data produces sine wave variants.
 */
function AudioEnv() {
  this.context = new (window.AudioContext || window.webkitAudioContext)();
  this.sequences = [];
  this.playing = false;
  this.tempo;
  this.music;
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

/**
 * Schedule music data for playback, and schedule stop() function.
 * @param {object} music: Contains note data in the following form--
 *   {lineName: [[notePitch1, noteBeats1], ...], ...}
 * @param {number} tempo: Speed for playback (in bpm).
 * @var {number} when: Store starting time and update throughout scheduling.
 * @return {number} duration: Store time length of longest sequence.
 */
AudioEnv.prototype.play = function(music, tempo) {
  this.tempo = tempo || 60;
  this.music = music;
  
  var when = this.context.currentTime + 0.1;
  var duration = 0;

  for (var voice in music) {
    var seq = new Sequence(this, this.values[voice], music[voice]);
    this.sequences.push(seq);
    var seqDuration = seq.play(when) - when;
    duration = Math.max(seqDuration, duration);
  }
  return duration;
};

/**
 * Stop music playback by calling destroy() on each sequence.
 * @return {bool} playing: Overwrite setTimeout value with 'false'.
 */
AudioEnv.prototype.stop = function() {
  for (var i = this.sequences.length - 1; i >= 0; i--) 
    this.sequences[i].destroy();
  this.sequences = [];
  return this.playing = false;
};

// SEQUENCE CLASS //

/**
 * Create a new sequence.
 * @param {object} audioEnv: Pointer to parent object.
 * @param {object} values: Line-specific values for sine-wave variant.
 * @param {array} pitches: 2-D array of notes [pitch, beats].
 * @prop {object} context: Inherit audio context from AudioEnv.
 * @prop {number} tempo: Inherit tempo (bpm) from AudioEnv.
 * @prop {object} osc: Create new oscillator for playback.
 * @prop {object} gainNode: Create new node for volume control.
 * @prop {array} equalizers: Connected series of Biquad filters.
 */
function Sequence(audioEnv, values, pitches) {
  this.values = values;
  this.pitches = pitches;
  this.context = audioEnv.context;
  this.tempo = audioEnv.tempo;
  this.osc = this.context.createOscillator();
  this.osc.setPeriodicWave(this.getWave());
  this.gainNode = this.context.createGain();
  this.equalizers = this.createEQ();
}

/**
 * Create EQ nodes.
 * -->gainNode-->biquad1-->biquad2-->biquad3-->speakers
 * @return {array} eq: List of biquad filters.
 */
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

/**
 * Disconnect sequence to stop playback.
 * Fade out volume quickly, then disconnect oscillator.
 * @return {number} when: Time at which disconnect happens.
 */
Sequence.prototype.destroy = function() {
  var when = this.context.currentTime;
  this.gainNode.gain.linearRampToValueAtTime(0, when += 0.1);
  setTimeout(function() {
    this.gainNode.disconnect();
    this.osc.disconnect();
  }.bind(this), 100);
  return when;
};

// schedule the Sequence to play
Sequence.prototype.play = function(when) {
  this.osc.start(when);
  this.gainNode.gain.setValueAtTime(0, when);
  this.osc.connect(this.gainNode);
  for (var i = 0, len = this.pitches.length; i < len; i++)
    when = this.scheduleNote(this.pitches[i], when);
  this.gainNode.gain.linearRampToValueAtTime(0, when += 0.1);
  this.osc.stop(when + 0.2);
  return when;
};

// schedule a note to play
Sequence.prototype.scheduleNote = function(note, when) {
  var pitch = note[0];
  var beats = note[1];
  var freq = pitch !== null ? 440 * Math.pow(2, (pitch - 45) / 12) : 0;
  var duration = beats * 60 / this.tempo;
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
    value * 1.0, start + duration * 0.7);
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
