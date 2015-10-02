/*
 * Accidental Class
 */

// constructor for Accidental
function Accidental(note) {
  this.node = document.createElement("img");
  this.node.setAttribute("src", "images/accidental.png");
  this.node.setAttribute("class", "accidental");
  this.note = note;
  this.staff = note.staff;
  this.staff.node.insertBefore(this.node, note.node);
  this.types = ["doubleflat", "flat", "accidental", "sharp", "doublesharp"];
  this.symbols = ["bb", "b", "", "#", "##"];
  this.value = 0;
  this.yPos = parseInt(window.getComputedStyle(this.node).top);
}

// change accidental type
Accidental.prototype.change = function(direction) {
  if (this.value + direction <= 2 && this.value + direction >= -2) {
    this.value += direction;
    this.node.src = "images/" + this.types[this.value + 2] + ".png";
  }
};

/*
 * Note Class
 */

// constructor for Note
function Note(staff) {
  this.node = document.createElement("img");
  this.node.setAttribute("src", "images/note.png");
  this.node.setAttribute("class", "note");
  this.staff = staff;
  this.staff.node.appendChild(this.node);
  this.position = 7;
  this.yPos = parseInt(window.getComputedStyle(this.node).top);
  this.accidental = new Accidental(this);
}

// move note up or down on staff
Note.prototype.move = function(direction) {
  if (this.position + direction >= 0 && this.position + direction <= 14) {
    var stepSize = 6 * direction;
    this.yPos -= stepSize;
    this.accidental.yPos -= stepSize;
    this.node.style.top = this.yPos + "%";
    this.accidental.node.style.top = this.accidental.yPos + "%";
    this.position += direction;
  }
};

// get note name as string, based on accidental and position on staff
Note.prototype.getName = function() {
  var letters = ['B', 'C', 'D', 'E', 'F', 'G', 'A',
                 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D'];
  var octaves = [3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6];
  var clefDefs = {
    soprano: {octave: 0, clef: 0},
    alto: {octave: 0, clef: 0},
    tenor: {octave: 1, clef: 0},
    bass: {octave: 2, clef: 2}
  };
  var clefDef = clefDefs[this.staff.voice];
  var letter = letters[this.position + clefDef.clef];
  var accidental = this.accidental.symbols[this.accidental.value + 2];
  var octave = (octaves[this.position + clefDef.clef] - clefDef.octave);
  return letter + accidental + octave.toString();
};

/*
 * Staff Class
 */

// create a new staff
function Staff(voice) {
  this.voice = voice;
  this.node = document.getElementById(voice);
  this.clef = document.createElement("img");
  this.clef.setAttribute("src", "images/" + voice + "clef.png");
  this.clef.setAttribute("class", "clef");
  this.node.appendChild(this.clef);
  this.notes = [];
  this.active = null;
  this.input = voice[0] + "_input";
  this.setEvents();
}

// functions to set, hide, and un-hide the staff's active note
Staff.prototype.makeActive = function(note) {
  if (this.active !== null) {
    this.notes[this.active].node.src = "images/note.png";
  }
  this.active = this.notes.indexOf(note);
  note.node.src = "images/notecolor.png";
};
Staff.prototype.hideActive = function() {
  this.notes[this.active].node.src = "images/note.png";
};
Staff.prototype.showActive = function() {
  this.notes[this.active].node.src = "images/notecolor.png";
};

// add a new note to the staff
Staff.prototype.addNote = function() {
  if (this.notes.length >= 10) {
    return false;
  }
  var newNote = new Note(this);
  this.notes.push(newNote);
  this.makeActive(newNote);
};

// delete a note (default: active note)
Staff.prototype.deleteNote = function() {
  if (this.active > 0) {
    this.makeActive(this.notes[this.active - 1]);
    this.node.removeChild(this.notes[this.active + 1].accidental.node);
    this.node.removeChild(this.notes[this.active + 1].node);
    this.notes.splice(this.active + 1, 1);
  } else if (this.active === 0) {
    this.node.removeChild(this.notes[this.active].accidental.node);
    this.node.removeChild(this.notes[this.active].node);
    this.active = null;
    this.notes = [];
  }
};

// functions for staff focus/blur
Staff.prototype.onFocus = function() {
  if (this.active === null) {
    this.addNote();
  } else {
    this.showActive();
  }
};
Staff.prototype.onBlur = function() {
  if (this.active !== null) {
    this.hideActive();
  }
};

// keyboard functionality
Staff.prototype.keyInput = function(e) {
  var keycode, isShift;
  // check/adjust for browser versions
  if (window.event) {
    keycode = window.event.keyCode;
    isShift = window.event.shiftKey;
  } else if (e) {
    keycode = e.which;
    isShift = e.shiftKey;
  }
  // assign keyboard actions
  switch(keycode) {
  case 16: // ignore shift key
    break;
  case 38: // uparrow
    if (isShift) {
      prevElement(this.node).focus();
    } else {
      this.notes[this.active].move(1);
    }
    break;
  case 40: // downarrow
    if (isShift) {
      nextElement(this.node).focus();
    } else {
      this.notes[this.active].move(-1);
    }
    break;
  case 39: // rightarrow
    if (this.active === this.notes.length - 1 || this.active === null) {
      this.addNote();
    } else {
      this.makeActive(this.notes[this.active + 1]);
    }
    break;
  case 37:  // leftarrow
    if (this.active > 0) {
      this.makeActive(this.notes[this.active - 1]);
    }
    break;
  case 8:  // delete
    this.deleteNote();
    break;
  case 61: // += key
  case 187:
    this.notes[this.active].accidental.change(1);
    break;
  case 173: // -_ key
  case 189:
    this.notes[this.active].accidental.change(-1);
    break;
  default:
    this.node.blur();
    break;
  }
  e.preventDefault();
  return false;
};

// fill input field with staff's note names
Staff.prototype.getNoteNames = function() {
  var noteNames = [];
  for (var i = 0; i < this.notes.length; i++) {
    noteNames[i] = this.notes[i].getName();
  }
  inputField = document.getElementById(this.input);
  inputField.value = noteNames.toString();
};

// set event handlers
Staff.prototype.setEvents = function() {
  var self = this;
  this.node.addEventListener('focus', function(){self.onFocus();}, false);
  this.node.addEventListener('blur', function(){self.onBlur();}, false);
  this.node.addEventListener('keydown', function(e){self.keyInput(e);}, false);
};


/*
 * Audio Environment Class
 */

// create a new Audio Environment
function AudioEnv(tempo) {
  this.context = new (window.AudioContext || window.webkitAudioContext)();
  this.tempo = tempo || 60;
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

// play music
AudioEnv.prototype.play = function(when) {
  when = when || this.context.currentTime + 0.1;
  var music = getMusic();

  for (var voice in music) {
    var seq = new Sequence(this, this.values[voice], music[voice]);
    seq.play(when);
  }
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
  this.gainNode.gain.value = this.values['gain'];
  this.createEQ();
  this.pitches = pitches;
}

// create Fx EQ nodes
Sequence.prototype.createEQ = function() {
  var eq = [100, 1000, 2500];
  var activeNode = this.gainNode;
  for (var freq in eq) {
    var filter = this.context.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = eq[freq];
    activeNode.connect(filter);
    activeNode = filter;
  }
  activeNode.connect(this.context.destination);
};

// disconnect Sequence and stop playing
Sequence.prototype.destroy = function() {
  this.osc.disconnect;
  this.gainNode.disconnect;
  this.osc.stop();
};

// schedule a note to play
Sequence.prototype.scheduleNote = function(pitch, when) {
  var freq = 440 * Math.pow(2, (pitch - 45) / 12);
  var duration = 60 / this.tempo;
  this.osc.frequency.setValueAtTime(freq, when);
  this.osc.frequency.setValueAtTime(0, when + duration);
  return when + duration;
};

// schedule the Sequence to play
Sequence.prototype.play = function(when) {
  this.osc.start(when);
  this.osc.connect(this.gainNode);
  for (var i in this.pitches)
    when = this.scheduleNote(this.pitches[i], when);
  this.osc.stop(when);
};

// return a periodic wave
Sequence.prototype.getWave = function() {
  var real = new Float32Array(this.values['real']);
  var imag = new Float32Array(real.length);
  return this.context.createPeriodicWave(real, imag);
};

/*
 * Validation
 */

// validate individual voice inputs
function inputErrors(input) {
  var errors = [];
  var reg = /^[A-Ga-g](#{1,2}|b{1,2})?\d+(,[A-Ga-g](#{1,2}|b{1,2})?\d+)*$/;

  if (input.length > 200)
    errors.push('Input too long');
  if (!reg.test(input))
    errors.push('Input format error (ex. C#4,D4,Eb5)');

  return errors.length < 1 ? false : errors;
}

// validate all voice inputs
function validate(e) {
  var voices = ['soprano', 'alto', 'tenor', 'bass'];
  var numberNotes = null;
  var errors = [];

  for (var i in voices) {
    var input = getInput(voices[i]);
    var number = input.split(',').length;
    var err = inputErrors(input);

    if (err)
      errors.push(err);
    if (numberNotes !== number && numberNotes !== null)
      errors.push(['All voices must be same length']);
    numberNotes = number;
  }

  if (errors.length > 0) {
      e.preventDefault();
      alert('Input error(s)', errors);
      return false;
  }
  return true;
}

/*
 * Functions to get pitches from input_fields
 */

// get the string value of an input field
function getInput(voice) {
  return document.getElementById(voice[0] + "_input").value;
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
  for (var i in voices) {
    music[voices[i]] = convertPitches(voices[i]);
  }
  return music;
}

/*
 * Other miscellaneous page functions
 */

// function for 'Fill Pitches' input button

function fillPitches() {
  soprano.getNoteNames();
  alto.getNoteNames();
  tenor.getNoteNames();
  bass.getNoteNames();
}

// functions for next/previousElementSibling() in IE < 9
function nextElement(node) {
  nextSib = node.nextSibling;
  if (nextSib === null) return node;
  while (nextSib.nodeType !== 1) nextSib = nextSib.nextSibling;
  return nextSib;
}
function prevElement(node) {
  prevSib = node.previousSibling;
  if (prevSib === null) return node;
  while (prevSib.nodeType !== 1) prevSib = prevSib.previousSibling;
  return prevSib;
}

/*
 * Main code for page
 */

var soprano = new Staff("soprano");
var alto = new Staff("alto");
var tenor = new Staff("tenor");
var bass = new Staff("bass");
var music = [bass, tenor, alto, soprano];
var audio = new AudioEnv();

var migrate = document.getElementById("migrate");
migrate.addEventListener('click', function(){fillPitches();}, false);

var play = document.getElementById("play");
play.addEventListener('click', function(){audio.play();}, false);

var form = document.getElementById("form");
form.addEventListener('submit', function(e){validate(e);}, false);
