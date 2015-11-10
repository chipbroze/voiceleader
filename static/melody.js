// Melody constructor
function Melody() {
  this.start = randEl([1, 3, 5, 8]);
  this.end = 1;
  var dist = Math.abs(this.end - this.start);
  this.length = Math.max(random(5, 13), dist + 1);
  this.lastInt = 0;
  this.leaps = 1;
  this.justLeapt = false;
  this.unLeap = 0;
  this.peak = Math.max(this.start, this.end);
  this.valley = Math.min(this.start, this.end);
  this.singlePeak = this.end !== this.start;
  this.singleValley = this.end !== this.start;
  this.notes = [this.start];
  this.states = [];
}

// Generate the melody's notes
Melody.prototype.generate = function() {
  while (this.notes.length < this.length) {
    console.log(this.notes);
    var state = this.saveState();
    var next = state.possibles.shift();
    this.addNote(next);

    // Backtrack if melody can't be completed within guidelines
    while (this.invalid()) {
      console.log('INVALID');
      this.deleteNote();
      this.loadState(state);
      next = state.possibles.shift();

      // Backtrack if no more 'possible' notes from current state
      while (next === undefined) {
        if (this.states.length <= 1) {
          return null;
        }
        this.states.pop();
        this.deleteNote();
        state = this.states.last();
        this.loadState(state);
        next = state.possibles.shift();
      }
      this.addNote(next);
    }
  }
  if (this.notes.last() === this.notes[this.length - 2]) {
    if (this.notes[this.length - 3] > this.notes.last()) {
      this.notes[this.length - 2] -= 1;
    }
    if (this.notes[this.length - 3] < this.notes.last()) {
      this.notes[this.length - 2] += 1;
    }
  }

  return this.notes;
}

// Functions for melody movement possibilities
Melody.prototype.getPossibles = function() {
  var note = this.notes.last();
  if (this.lastInt > 1) {
    return [note - 1];
  }
  if (this.lastInt < -1) {
    return [note + 1];
  }
  var steps = [];
  steps.push(stepwise(note));
  steps.push(stepwise(note));
  if (this.leaps > 0) {
    steps.push(leapwise(note));
  }
  steps.shuffle();
  steps = [].concat.apply([], steps); 
  if (this.stepsLeft() < 2) {
    steps.unshift(note);
  }
  return steps;
}
function stepwise(note) {
  return [note + 1, note - 1].shuffle();
}
function leapwise(note) {
  switch((note + 700) % 7) {
  case 1:
    return [note + 2, note - 3].shuffle();
    break;
  case 3:
    return [note + 2, note - 2].shuffle();
    break;
  case 5:
    return [note + 3, note - 2].shuffle();
    break;
  default:
    return [];
  }
}

// Functions to test validity of melody
Melody.prototype.invalid = function() {
    if ( this.leaps < 0        ||
        !this.canHaveContour() ||
        !this.canHavePeak()    ||
        !this.canHaveValley()  ||
        !this.canReachEnd()       ) {
    return true;
  } else {
    return false;
  }
}
Melody.prototype.canReachEnd = function() {
  var distance = Math.abs(this.notes.last() - this.end);
  return distance <= this.stepsLeft();
}
Melody.prototype.canHavePeak = function() {
  if (this.singlePeak) {
    return true;
  } else {
    var note = this.notes.last();
    var newPeak = this.peak + 1;
    var distance = (newPeak - note) + (newPeak - this.end);
    return distance <= this.stepsLeft();
  }
}
Melody.prototype.canHaveValley = function() {
  if (this.singleValley) {
    return true;
  } else {
    var note = this.notes.last();
    var newValley = this.valley - 1;
    var distance = (note - newValley) + (this.end - newValley);
    return distance <= this.stepsLeft();
  }
}
Melody.prototype.canHaveContour = function() {
  if (this.singlePeak || this.singleValley) {
    return true;
  } else {
    var note = this.notes.last();
    var newPeak = this.peak + 1;
    var newValley = this.valley - 1;
    var distance = (newPeak - newValley) * 2 - Math.abs(note - this.end);
    return distance <= this.stepsLeft();
  }
}

// Save and Load states of the melody
Melody.prototype.saveState = function() {
  var state = {};
  state['possibles'] = this.getPossibles();
  copyProps(this, state);
  this.states.push(state);
  return state;
}
Melody.prototype.loadState = function(state) {
  copyProps(state, this);
}

// Functions to update state and melody data
Melody.prototype.addNote = function(note) {
  this.singlePeak = this.checkSinglePeak(note);
  this.singleValley = this.checkSingleValley(note);
  this.peak = Math.max(this.peak, note);
  this.valley = Math.min(this.valley, note);
  this.lastInt = note - this.notes.last();
  if (Math.abs(this.lastInt) > 1) {
    this.leaps -= 1;
    this.justLeapt = true;
  } else {
    this.justLeapt = false;
  }
  this.notes.push(note);
}
Melody.prototype.deleteNote = function() {
  this.notes.pop();
}
Melody.prototype.stepsLeft = function() {
  return this.length - this.notes.length;
}
Melody.prototype.checkSinglePeak = function(note) {
  if (this.singlePeak && note === this.peak && this.stepsLeft() > 1) {
    return false;
  }
  if (!this.singlePeak && note <= this.peak) {
    return false;
  }
  return true;
}
Melody.prototype.checkSingleValley = function(note) {
  if (this.singleValley && note === this.valley && this.stepsLeft() > 1) {
    return false;
  }
  if (!this.singleValley && note >= this.valley) {
    return false;
  }
  return true;
}

// Harmony contructor
function Harmony(melody) {
  this.melody = melody;
  this.start = randEl([1, 3, 5]);
  this.notes = [this.start];
  this.possibles = [];
  this.unison = true;
}

Harmony.prototype.generate = function() {
  while (this.notes.length < this.melody.notes.length) {
    var next = this.getNextNote().shift();
    this.notes.push(next);
    while (this.invalid()) {
      this.notes.pop();
      next = this.possibles.shift();
      if (next === undefined) {
        this.notes.pop();
        if (this.notes.length < 1) {
          return null;
        }
        this.unison = false;
        next = this.getNextNote().shift();
      }
      this.notes.push(next);
    }
  }
  return this.notes;
};

Harmony.prototype.getNextNote = function() {
  var currNote = this.notes.last();
  return this.possibles = [currNote + 1, currNote - 1, currNote].shuffle();
};

Harmony.prototype.invalid = function() {
  var note = this.notes.last();
  var index = this.notes.length - 1;
  var interval = this.melody.notes[index] - note;
  interval = (Math.abs(interval) + 70) % 7;
  console.log('Interval at index ' + index + ': ' + (interval + 1));
  if (((note + 70) % 7 === 4 && (this.melody.notes[index] + 70) % 7 === 0) ||
      ((note + 70) % 7 === 0 && (this.melody.notes[index] + 70) % 7 === 4)) {
    return true;
  }
  if (interval === 4 &&
      Math.abs(this.notes[index - 1] - this.melody.notes[index - 1]) === 4) {
    return true;
  }
  if ([1, -1, 6, -6, 3].indexOf(interval) > -1) { 
    return true;
  } else if (interval === 0) {
    if (this.unison) {
      return true;
    } else {
      this.unison = true;
      return false;
    }
  } else {
    this.unison = false;
    if (this.notes.length === this.melody.notes.length && 
        [1, 3, 5].indexOf((note + 70) % 7) === -1) {
      return true;
    } else {
      return false;
    }
  }
}

// Third Voice
function Filler(melody, harmony) {
  console.log('mel test: ' + melody.notes);
  console.log('har test: ' + harmony.notes);
  this.melody = melody;
  this.harmony = harmony;
  this.starts = [1, 3, 5];
  var melStart = this.starts.indexOf(melody.start);
  if (melStart > -1) {
    this.starts.splice(melStart, 1);
  }
  var harStart = this.starts.indexOf(harmony.start);
  if (harStart > -1) {
    this.starts.splice(harStart, 1);
  }
  this.start = randEl(this.starts);
  this.notes = [this.start];
}
Filler.prototype.generate = function() {
  while (this.notes.length < this.melody.length) {
    this.possibles = this.getPossibles();
    console.log('Index: ' + this.notes.length);
    console.log('Poss: ' + this.possibles);
    var next = this.possibles.shift();
    while (this.invalid(next)) {
      var next = this.possibles.shift();
      if (next === undefined) {
        return null;
      }
    }
    this.notes.push(next);
  }
  return this.notes;
}

Filler.prototype.getPossibles = function() {
  var mel = this.melody.notes[this.notes.length];
  var har = this.harmony.notes[this.notes.length];
  var low = mel > har ? har : mel;
  var hi  = mel < har ? har : mel;
  var interval = (Math.abs(mel - har) + 70) % 7;
  var poss = [];
  if (interval === 0) {
    poss.push(mel + 2, mel - 2, mel + 4, mel - 4, mel);
  }
  if (interval === 4) {
    poss.push(low + 2, low, hi);
  }
  if (interval === 5) {
    poss.push(low + 2, low + 3, low, hi);
  }
  if (interval === 2) {
    poss.push(low - 2, hi + 2, low, hi);
  }
  poss = poss.map(function(el) {
    return (el + 70) % 7;
  });
  var currNote = this.notes.last();
  var moves = [currNote, currNote + 1, currNote - 1];
  var results = moves.filter(function(el) {
    var modded = (el + 70) % 7;
    for (var i = 0, len = poss.length; i < len; i++) {
      if (modded === poss[i]) {
        return true;
      }
    }
    return false;
  });
  return results;
}

Filler.prototype.invalid = function(next) {
  if (this.notes.length === this.melody.length - 1) {
    var scale = (next + 70) % 7;
    if ([1, 3, 5].indexOf(scale) < 0) {
      return true;
    }
  }
  if (this.notes.length === this.melody.length - 2) {
    var scale = (next + 70) % 7;
    if ([-2, 0, 2, 4, 5, 7, 9, 11, 12, 14].indexOf(scale) < 0) {
      return true;
    }
  }
  return false;
}

// utility
function test() {
  var mel = new Melody();
  var melNotes = mel.generate();
  var har = new Harmony(mel);
  var harNotes = har.generate();
  console.log(melNotes);
  console.log(harNotes);
  return true;
}
function generateMusic() {
  var mel = new Melody();
  var melNotes = mel.generate();
  var har = new Harmony(mel);
  var harNotes = har.generate();
  harNotes.pop();
  harNotes.pop();
  harNotes.push(5);
  harNotes.push(1);
  var phil = new Filler(mel, har);
  var philNotes = phil.generate();
  return [melNotes, melNotes, harNotes];
}

function arrRange(x, y) {
  arr = [];
  for (var i = x; i <= y; i++) {
    arr.push(i);
  }
  return arr;
}

function randEl(array) {
	return array[Math.floor(array.length * Math.random())];
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function copyProps(from, to) {
  for (var key in from) {
    switch (typeof from[key]) {
    case 'object':
      break;
    case 'function':
      break;
    default:
      to[key] = from[key];
    }
  }
}

Array.prototype.last = function() {
  return this[this.length - 1];
};
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
    j = Math.floor( Math.random() * ( i + 1 ) );
    temp = this[i];
    this[i] = this[j];
    this[j] = temp;
  }
  return this;
}
