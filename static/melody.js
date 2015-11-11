// Melody constructor
function Melody() {
  this.start = randEl([1, 3, 5, 8]);
  this.end = 1;
  var dist = Math.abs(this.end - this.start);
  this.length = Math.max(random(5, 8), dist + 1);
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
    console.log('Saved State: ' + this.notes);
    var state = this.saveState();
    var next = state.possibles.shift();
    this.addNote(next);

    // Backtrack if melody can't be completed within guidelines
    while (this.invalid()) {
      console.log('--invalid--: ' + this.notes);
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
  //if (this.notes.last() === this.notes[this.length - 2]) {
  //  if (this.notes[this.length - 3] > this.notes.last()) {
  //    this.notes[this.length - 2] -= 1;
  //  }
  //  if (this.notes[this.length - 3] < this.notes.last()) {
  //    this.notes[this.length - 2] += 1;
  //  }
  //}
  console.log('Final State: ' + this.notes);
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
  if (this.leaps > 0 || this.stepsLeft < 3) {
    steps.push(leapwise(note));
  }
  if (this.leaps > 0 && this.notes.length > 2) {
    steps.push(leapwise(note));
  }
  steps.shuffle();
  steps = [].concat.apply([], steps); 
  //if (this.stepsLeft() < 2) {
  //  steps.unshift(note);
  //}
  return steps;
}
function stepwise(note) {
  return [note + 1, note - 1].shuffle();
}
function leapwise(note) {
  switch((note + 700) % 7) {
  case 1:
    return [note + 2, note - 3, note -2, note + 4, note + 5].shuffle();
    break;
  case 3:
    return [note + 2, note - 2].shuffle();
    break;
  case 5:
    return [note + 3, note - 2].shuffle();
    break;
  case 2:
    return [note + 2, note - 2].shuffle();
    break;
  case 4:
    return [note + 2, note - 2].shuffle();
    break;
  case 0:
    return [note + 2];
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

// Harmony constructor
function Harmony(melody) {
  this.type = 'harmony';
  this.melody = melody;
  this.start = 1;
  this.notes = [this.start];
  this.states = [];
}

// Filler harmony constructor
Harmony.prototype.makeFiller = function(harmony) {
  this.type = 'filler';
  this.harmony = harmony;
  this.start = this.getFillerStart();
  this.notes = [this.start];
}
Harmony.prototype.getFillerStart = function() {
  var starts = [];
  switch(this.melody.start) {
  case 1:
    starts.push(-2, -4);
    break;
  case 3:
    starts.push(1, -2);
    break;
  case 5:
    starts.push(3, 1);
    break;
  case 8:
    starts.push(5, 3);
    break;
  default:
    starts.push(1, 3);
  }
  return randEl(starts);
}

// Generate the harmony's notes
Harmony.prototype.generate = function() {
  while (this.notes.length < this.melody.length) {
    var state = this.saveState();
    var next = state.possibles.shift();
    // Get new next note if current choice won't work
    while (this.invalid(next)) {
      next = state.possibles.shift();

      // Backtrack if no more 'possible' notes from current state
      while (next === undefined) {
        if (this.states.length <= 1) {
          return [];
        }
        this.states.pop();
        this.notes.pop();
        state = this.states.last();
        this.loadState(state);
        next = state.possibles.shift();
      }
    }
    this.notes.push(next);
  }
  return this.notes;
}


// Save and Load states of the harmony
Harmony.prototype.saveState = function() {
  var state = {};
  state['possibles'] = this.getPossibles();
  copyProps(this, state);
  this.states.push(state);
  return state;
}
Harmony.prototype.loadState = function(state) {
  copyProps(state, this);
}

// Get possible notes
Harmony.prototype.getPossibles = function() {
  if (this.type === 'filler') {
    return this.fillerGetPossibles();
  }
  var currNote = this.notes.last();
  var repeat = currNote;
  var stepwise = [currNote + 1, currNote - 1].shuffle();
  var circleOfFifths = [currNote + 3, currNote - 4].shuffle();
  var mediants = [currNote + 2, currNote - 2].shuffle();
  var possibles = [repeat, repeat, stepwise, stepwise, stepwise, circleOfFifths, mediants].shuffle();
  possibles = [].concat.apply([], possibles); 

  if ((currNote + 70) % 7 === 0) {
    possibles.unshift(currNote + 1, currNote - 1);
  }

  return possibles;
};

Harmony.prototype.invalid = function(note) {
  if (this.type === 'filler') {
    return this.fillerInvalid(note);
  }
  var scale = (note + 70) % 7;
  var lastScale = (this.notes.last() + 70) % 7;
  var melScale = (this.melody.notes[index] + 70) % 7;
  var index = this.notes.length;
  var interval = this.melody.notes[index] + 70 - note;
  interval = (Math.abs(interval) + 700) % 7;
  var prevInt = this.melody.notes[index - 1] + 70 - this.notes.last();
  prevInt = (Math.abs(prevInt) + 700) % 7;
  var ultimate = this.notes.length === this.melody.notes.length - 1;
  var penultimate = this.notes.length === this.melody.notes.length - 2;
  var antiPenultimate = this.notes.length === this.melody.notes.length - 3;
  if ((scale === 0 && lastScale === 4) || (scale === 4 && lastScale === 0)) {
    return true;
  }
  if (ultimate && scale !== 1) {
    return true;
  } else if (penultimate && [5, 0, 2].indexOf(scale) === -1) {
      return true;
  } else {
    if ((scale === 4 && melScale === 0) ||
        (scale === 0 && melScale === 4)) {
      return true;
    } else if (interval === 4 && prevInt === 4) {
      return true;
    } else if (interval === 0 && prevInt === 0) {
      return true;
    } else if ([1, -1, 6, -6, 3].indexOf(interval) > -1) { 
      return true;
    } else {
      return false;
    }
  }
}

Harmony.prototype.fillerGetPossibles = function() {
  var currNote = this.notes.last();
  var repeat = [currNote];
  var stepwise = [currNote + 1, currNote - 1].shuffle();
  var thirds = [currNote + 2, currNote - 2].shuffle();
  var fourths = [currNote + 3, currNote - 3].shuffle();
  var possibles = [repeat, repeat, repeat, repeat, stepwise, stepwise, stepwise, thirds, thirds, fourths].shuffle();
  return [].concat.apply([], possibles);
}
Harmony.prototype.fillerInvalid = function(next) {
  var scale = (next + 70) % 7;
  var last = this.notes.last();
  var lastScale = (last + 70) % 7;
  var mel = this.melody.notes[this.notes.length];
  var melLast = this.melody.notes[this.notes.length - 1];
  var melLastScale = (melLast + 70) % 7;
  var melInt = (mel - next + 70) % 7;
  var lastMelInt = (melLast - last + 70) % 7;
  var har = this.harmony.notes[this.notes.length] - 7;
  var harLast = this.harmony.notes[this.notes.length - 1] - 7;
  var harLastScale = (harLast + 70) % 7;
  var harInt = (next - har + 70) % 7;
  var lastHarInt = (last - harLast + 70) % 7;
  var melScale = (mel + 70) % 7;
  var harScale = (har + 70) % 7;
  var low = mel < har ? melScale : harScale;
  var hi = mel < har ? harScale : melScale;
  var interval = (mel - har + 70) % 7;

  if (next > mel) {
    return true;
  }
  if (next < har) {
    return true;
  }
  if (this.notes.length === this.melody.length - 1) {
    if ([1, 3, 5].indexOf(scale) < 0) {
      return true;
    }
  } else {
    if (scale === melScale && lastScale === melLastScale) {
      return true;
    }
    if (scale === harScale && lastScale === harLastScale) {
      return true;
    }
    if (scale === 0 && (melScale === 4 || harScale === 4)) {
      return true;
    }
    if (scale === 4 && (melScale === 0 || harScale === 0)) {
      return true;
    }
    if (melInt === 4 && lastMelInt === 4) {
      return true;
    }
    if (harInt === 4 && lastHarInt === 4) {
      return true;
    }
    if (next < harLast) {
      return true;
    }
    if (next > melLast) {
      return true;
    }
  }
  if (this.notes.length === this.melody.length - 2) {
    if ([0, 2, 4, 5].indexOf(scale) < 0) {
      return true;
    }
  }
  var poss = [];
  switch(interval) {
  case 0:
    poss.push(mel + 2, mel - 2, mel + 4, mel - 4, mel);
    break;
  case 4:
    poss.push(low + 2, low, hi);
    break;
  case 5:
    poss.push(low + 2, low, hi);
    break;
  case 2:
    poss.push(low - 2, hi + 2, low, hi);
    break;
  default:
    poss.push(0, 1, 2, 3, 4, 5, 6);
  }
  poss = poss.map(function(el) {
    return (el + 70) % 7;
  });
  if (poss.indexOf(scale) < 0) {
    return true;
  } else {
    return false;
  }
}

// utility
function test() {
  var mel = new Melody();
  var melNotes = mel.generate();
  var har = new Harmony(mel);
  var harNotes = har.generate();
  return true;
}
function generateMusic() {
  var mel = new Melody();
  var melNotes = mel.generate();
  var har = new Harmony(mel);
  var harNotes = har.generate();
  var phil = new Harmony(mel);
  phil.makeFiller(har);
  var philNotes = phil.generate();
  return [melNotes, philNotes, harNotes];
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
