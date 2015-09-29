// Constructor for Accidentals
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
  this.change = function(direction) {
    if (this.value + direction <= 2 && this.value + direction >= -2) {
      this.value += direction;
      this.node.src = "images/" + this.types[this.value + 2] + ".png";
    }
  };
}

// Constructor for Notes
function Note(staff) {
  this.node = document.createElement("img");
  this.node.setAttribute("src", "images/note.png");
  this.node.setAttribute("class", "note");
  this.staff = staff;
  this.staff.node.appendChild(this.node);
  this.position = 7;
  this.yPos = parseInt(window.getComputedStyle(this.node).top);
  this.accidental = new Accidental(this);
  this.move = function(direction) {
    if (this.position + direction >= 0 && this.position + direction <= 14) {
      var stepSize = 6 * direction;
      this.yPos -= stepSize;
      this.accidental.yPos -= stepSize;
      this.node.style.top = this.yPos + "%";
      this.accidental.node.style.top = this.accidental.yPos + "%";
      this.position += direction;
    }
  };
  // Note name is determined by accidental and position on staff
  this.getName = function() {
    // Array of note names by position on treble clef, from bottom to top
    var letters = ['B', 'C', 'D', 'E', 'F', 'G', 'A',
                   'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D'];
    // Array of octave numbers, one for each letter above
    var octaves = [3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6];
    var clefDef = {
      'soprano': {'octave': 0, 'clef': 0},
      'alto': {'octave': 0, 'clef': 0},
      'tenor': {'octave': 1, 'clef': 0},
      'bass': {'octave': 2, 'clef': 2}
    };
    var noteName = letters[this.position + clefDef[this.staff.voice]['clef']];
    noteName += this.accidental.symbols[this.accidental.value + 2];
    noteName += (octaves[this.position + clefDef[this.staff.voice]['clef']] -
                 clefDef[this.staff.voice]['octave']).toString();
    
    return noteName;
  };
}

// Constructor for Staves
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
  
  this.makeActive = function(note) {
    if (this.active !== null)
      this.notes[this.active].node.src = "images/note.png";
    this.active = this.notes.indexOf(note);
    note.node.src = "images/notecolor.png";
  };
  this.hideActive = function() {
    this.notes[this.active].node.src = "images/note.png";
  };
  this.showActive = function() {
    this.notes[this.active].node.src = "images/notecolor.png";
  };
  this.addNote = function() {
    if (this.notes.length >= 10) return false;
    var newNote = new Note(this);
    this.notes.push(newNote);
    this.makeActive(newNote);
  };
  this.deleteNote = function() {
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
  this.onFocus = function() {
    if (this.active === null) {
      this.addNote();
    } else {
      this.showActive();
    }
  };
  this.onBlur = function() {
    if (this.active !== null) this.hideActive();
  };
  this.keyInput = function(e) {
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
        var upperStaff = prevElement(this.node);
        upperStaff.focus();
      } else {
        this.notes[this.active].move(1);
      }
      break;
    case 40: // downarrow
      if (isShift) {
        var lowStaff = nextElement(this.node);
        lowStaff.focus();
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
      this.notes[this.active].accidental.change(1);
      break;
    case 173: // -_ key
      this.notes[this.active].accidental.change(-1);
      break;
    default:
      this.node.blur();
      break;
    }
    e.preventDefault();
    return false;
  };
  // convert note positions to note names
  this.getNoteNames = function() {
    noteNames = [];
    for (var i = 0, n = this.notes.length; i < n; i++) {
      noteNames[i] = this.notes[i].getName();
    }
    inputField = document.getElementById(this.input);
    inputField.value = noteNames.toString();
  };

  // set event handlers
  var self = this;
  this.node.addEventListener('focus', function(){self.onFocus();}, false);
  this.node.addEventListener('blur', function(){self.onBlur();}, false);
  this.node.addEventListener('keydown', function(e){self.keyInput(e);}, false);
}



// Main code for page

var soprano = new Staff("soprano");
var alto = new Staff("alto");
var tenor = new Staff("tenor");
var bass = new Staff("bass");
var music = [bass, tenor, alto, soprano];

var migrate = document.getElementById("migrate");
migrate.addEventListener('click', function(){fillPitches();}, false);

var form = document.getElementById("form");
form.addEventListener('submit', function(e){validate(e);}, false);

// Function for 'Fill Pitches' input button

function fillPitches() {
  soprano.getNoteNames();
  alto.getNoteNames();
  tenor.getNoteNames();
  bass.getNoteNames();
}

// Function for validation

function validate(e) {
  var fields = ['s_input', 'a_input', 't_input', 'b_input'];
  var numberNotes = document.forms["form"][fields[0]].value.split(',').length;
  for (var i = 0; i < 4; i++) {
    var notes = document.forms["form"][fields[i]].value;
    var reg = /^[A-Ga-g](#{1,2}|b{1,2})?\d+(,[A-Ga-g](#{1,2}|b{1,2})?\d+)*$/;
    if (notes.length > 100) {
      e.preventDefault();
      alert("Too many notes");
      return false;
    }
    if (!reg.test(notes)) {
      e.preventDefault();
      alert("Pitches must fit form");
      return false;
    }
    if (notes.split(',').length !== numberNotes) {
      e.preventDefault();
      alert("All voices must have same number of pitches");
      return false;
    }
  }
}


// Functions for next and previousElementSibling() in IE < 9

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
