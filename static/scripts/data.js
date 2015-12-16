/*
 * MUSIC
 */

// create a new Music object
function Music(tempo, key, timeSig) {
  this.tempo = tempo || 120;
  this.key = key || 'C';
  this.timeSig = timeSig || '4/4';
  this.staves = [];
}

// create and add a Staff object with params
Music.prototype.addStaff = function(voice, clef) {
  var staff = new Staff(voice, clef, this);
  this.staves.push(staff);
  return staff;
};

// get object of all staves and note data, for audio processessing 
Music.prototype.getData = function() {
  var data = {}
  for (var i = 0, len = this.staves.length; i < len; i++) {
    data[this.staves[i].voice] = this.staves[i].getData();
  }
  return data;
}

// get length of music, in seconds 
Music.prototype.getDuration = function() {
  var maxBeats = 0;
  for (var i = 0, len = this.staves.length; i < len; i++) {
    var beats = this.staves[i].getBeats();
    maxBeats = Math.max(maxBeats, beats);
  }
  return 60 * maxBeats / this.tempo;
}

// empty music object of notes (preserving staves)
Music.prototype.clear = function() {
  this.staves.forEach(function(staff) {
    staff.notes = [];
  });
  return this;
}

/*
 * STAFF
 */

// create a new Staff object
function Staff(voice, clef, music) {
  this.voice = voice || '';
  this.clef = clef || 'treble';
  this.notes = [];
  this.music = music;
}

// create and add a Note object to this staff
// establish default note values based on clef
// if no name given, align accidental with key
Staff.prototype.addNote = function(name, type, rest, exps, chromatic, where) {
  where = where === undefined ? this.notes.length: where;
  var defaultNote = {
    treble: ['B', '4'],
    tenor: ['B', '3'],
    bass: ['D', '3']
  };
  var def = defaultNote[this.clef];
  name = name || inheritAccidental(def[0], this.music.key) + def[1];
  var note = new Note(name, type, rest, this, exps, chromatic);
  this.notes.splice(where, 0, note);
  return note;
};

// get 2d array of note data, in form '[pitch, beats]'
Staff.prototype.getData = function() {
  var data = [];
  for (var i = 0, len = this.notes.length; i < len; i++)
    data.push(this.notes[i].getData());
  return data;
}

// get length of notes array, in total beats
// used for timing music-scroll event
Staff.prototype.getBeats = function() {
  var data = this.getData();
  return data.reduce(function(sum, e) {
    return sum + e[1];
  }, 0);
}

/*
 * NOTE
 */

// create a new Note object
// 'rest' is a bool indicating if note is actually a rest
// 'exps' contains expression values (staccato, tenuto, etc)
function Note(name, type, rest, staff, exps, chromatic) {
  this.name = name || 'C4';
  this.type = type || 'quarter';
  this.rest = rest || false;
  this.staff = staff;
  this.exp = exps || [];
  this.chromatic = chromatic || 0;
  this.parseName();
}

// get array of note's pitch value and beat length
Note.prototype.getData = function() {
  var letterValues = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  var accidentalValues = {'bb': -2, 'b': -1, '': 0, '#': 1, 'x': 2};
  var pitch = letterValues[this.letter] + accidentalValues[this.accidental] +
    (this.octave - 1) * 12;
  if (this.rest) pitch = null;
  var rhythmValues = {whole: 4, half: 2, quarter: 1, eighth: 0.5};
  var beats = rhythmValues[this.type];
  return [pitch, beats];
}

// parse name into 'letter', 'accidental', 'octave'
Note.prototype.parseName = function() {
  var name = this.name;
  var letr = this.letter = name[0];
  name = name.slice(1);
  var octv = this.octave = /\d+/.exec(name)[0];
  var accd = this.accidental = name.replace(octv, '');
  return {letter: letr, accidental: accd, octave: octv};
}

// update note name and parse it
Note.prototype.updateName = function(newName) {
  this.name = newName || 'C4';
  this.parseName();
}

// update note name to match key signature
Note.prototype.updateKey = function() {
  var key = this.staff.music.key;
  if (!this.chromatic) {
    this.updateName(inheritAccidental(this.letter, key) + this.octave);
  }
}

// check if note fits in key signature
Note.prototype.isDiatonic = function() { 
  var keys = {
    'C' : ['b', 0],
    'F' : ['b', 1],  'G' : ['#', 1],
    'Bb': ['b', 2],  'D' : ['#', 2],
    'Eb': ['b', 3],  'A' : ['#', 3],
    'Ab': ['b', 4],  'E' : ['#', 4],
    'Db': ['b', 5],  'B' : ['#', 5],
    'Gb': ['b', 6],  'F#': ['#', 6],
    'Cb': ['b', 7],  'C#': ['#', 7]
  };
  var myKey = keys[this.staff.music.key];
  if (this.accidental && myKey[0] !== this.accidental) {
    return false;
  }
  var sets = {
    'b': ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
    '#': ['F', 'C', 'G', 'D', 'A', 'E', 'B']
  };
  var mySet = sets[myKey[0]].slice(0, myKey[1]);
  var bool = mySet.indexOf(this.letter) > -1 ? true : false;
  return this.accidental ? bool : !bool;
}

/**
 * JSON-ify
 */

Music.prototype.JSONify = function() {
  var musicObj = {
    tempo: this.tempo,
    key: this.key,
    timeSig: this.timeSig,
  };
  musicObj.staves = this.staves.map(function(staff) {
    return staff.JSONify();
  });
  return JSON.stringify(musicObj);
};

Staff.prototype.JSONify = function() {
  var obj = {
    voice: this.voice,
    clef: this.clef,
    notes: this.notes.map(function(note) {
      return note.JSONify();
    })
  };
  return obj;
};

Note.prototype.JSONify = function() {
  var obj = {
    name: this.name,
    type: this.type,
    rest: this.rest,
    exp: this.exp.join(','),
    chromatic: this.chromatic
  };
  return obj;
};

/**
 * MUSIC GENERATION
 */

Music.prototype.genMelody = function() {
  var lines = generateMusic();
  var octaves = {C: 5, D: 5, E: 4, F: 4, G: 4, A: 4, B: 4};
  for (var i = 0, len = lines.length; i < len; i++) {
    if (lines[i].length === 0) {
      continue;
    }
    var staff = this.staves[i];
    var octave = octaves[this.key.charAt(0)];
    if (staff.clef !== 'treble') {
      octave = parseInt(octave) - 1;
    }
    var tonic = this.key + octave;
    for (var n = 0, lem = lines[i].length; n < lem; n++) {
      noteName = this.intervalNote(tonic, lines[i][n] - 1);
      this.staves[i].addNote(noteName);
    }
  }
}

Music.prototype.intervalNote = function(startName, interval) {  
  var letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var key = this.key;
  var index = letters.indexOf(startName.charAt(0));
  var letter = letters[(index + interval + 70) % 7];
  var lettAcci = inheritAccidental(letter, key);
  var oldOct = /\d+/.exec(startName)[0];
  var newIndex = letters.indexOf(letter);
  var octave = parseInt(oldOct) + Math.ceil((interval - (6 - index)) / 7);
  return lettAcci + octave;
}
