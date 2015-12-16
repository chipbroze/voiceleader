//////////////////////////////////
// CONSTANTS & GLOBAL VARIABLES //
//////////////////////////////////

var IMAGE_DIR = '/images/'; // path for image sources
var activeNode = null; // attach this to musNode??
var SPACE = 6;             // distance from line to space in staff
var STAFF_MARGIN = 40      // css margin on left + right of staff
var BEAT = 40;             // width of div.note class
var TOP = {                // various height offsets for css 'top' attribute
  keySig :   9,
  acci   :   8,
  ledger :  23,
  whole  :  18,
  half   : -10,
  quarter: -10,
  clef   : -24
};


///////////
// MUSIC //
///////////

/**
 * Render music.
 * @param {string} divId: The id attribute of the target <div>.
 * @param {object} music: Instance of Music class, defined in data.js.
 * @return {node}: The node for the music <div>.
 */
function drawMusic(divId, music) {
  var musNode = document.getElementById(divId);
  musNode.music = music;
  
  // Remove whitespace children.
  while (musNode.firstChild) {
    musNode.removeChild(musNode.firstChild);
  }
  musNode.keySig = document.createElement('div');
  musNode.keySig.setAttribute('class', 'key-sig');
  musNode.timeSig = document.createElement('div');
  musNode.timeSig.setAttribute('class', 'time-sig');
  
  makeKeySig(music, musNode);
  makeTimeSig(music, musNode);

  for (var i = 0, len = music.staves.length; i < len; i++) {
    createStaff(music.staves[i], musNode);
  }
  return musNode;
}

/**
 * Make key signature <div> for cloning.
 */
function makeKeySig(music, musNode) {
  while (musNode.keySig.firstChild) {
    musNode.keySig.removeChild(musNode.keySig.firstChild);
  }
  var keys = {
    'C' : ['flat', 0],
    'F' : ['flat', 1],  'G' : ['sharp', 1],
    'Bb': ['flat', 2],  'D' : ['sharp', 2],
    'Eb': ['flat', 3],  'A' : ['sharp', 3],
    'Ab': ['flat', 4],  'E' : ['sharp', 4],
    'Db': ['flat', 5],  'B' : ['sharp', 5],
    'Gb': ['flat', 6],  'F#': ['sharp', 6],
    'Cb': ['flat', 7],  'C#': ['sharp', 7]
  };
  var staffPos = {
    flat:  [0,  3, -1,  2, -2,  1, -3],
    sharp: [4,  1,  5,  2, -1,  3,  0]
  };
  var type = keys[music.key][0];
  var image = 'accidental-' + type + '.png';

  for (var i = 0, len = keys[music.key][1]; i < len; i++) {
    var acciNode = document.createElement('img');
    acciNode.setAttribute('src', IMAGE_DIR + image);
    acciNode.style.top = yPos(staffPos[type][i]) + TOP.keySig + 'px';
    musNode.keySig.appendChild(acciNode);
  } 
  return musNode.keySig;
}

/**
 * Make time signature <div> for cloning.
 */
function makeTimeSig(music, musNode) {
  var tSig = music.timeSig.split('/');
  var innards = '<p>' + tSig[0] + '</p><p>' + tSig[1] + '</p>';
  musNode.timeSig.innerHTML = innards;
  return musNode.timeSig;
}

/**
 * Scroll music to the left on playback.
 * Notes disappear when they collide with time signature.
 * @param {object} music: Instance of Music class.
 * @param {node} musNode: <div> element where music is rendered.
 * @param {object} audio: Instance of AudioEnv class (playback).
 */
function scrollMusic(music, musNode, audio) {
  // Reset <div> scroll to beginning
  musNode.scrollLeft = 0;

  var duration = music.getDuration() * 1000;
  var distance = duration / (60 * 1000) * music.tempo * BEAT;
  var notes = getAllNotes(musNode);
  var start = window.performance.now();

  // Callback function for requestAnimationFrame
  function scroll(time) {
    var disappear = musNode.firstChild.timeSig.getBoundingClientRect().right;
    var elapsed = time - start;
    for (var i = 0, len = musNode.childNodes.length; i < len; i++) {
      var noteDiv = musNode.childNodes[i].noteDiv;
      noteDiv.style.right = elapsed / duration * distance + 'px';
    }    
    for (var n = notes.length - 1; n >= 0; n--) {
      var coords = notes[n].getBoundingClientRect();
      if (coords.left < disappear) {
        notes[n].style.visibility = 'hidden';
        notes.splice(n, 1);
      }
    }
    if (elapsed >= duration || audio.playing === false) {
      return stopScroll(musNode, requestId);
    }
    requestId = window.requestAnimationFrame(scroll);
  }
  var requestId = window.requestAnimationFrame(scroll);
}

/**
 * Stop scrolling and reset noteDiv positions and note visibility.
 * @param {node} musNode: Music editor element.
 * @param {number} requestId: Scheduling ID for next animation frame.
 */
function stopScroll(musNode, requestId) {
  for (var i = 0, len = musNode.childNodes.length; i < len; i++) {
    var noteDiv = musNode.childNodes[i].noteDiv;
    noteDiv.style.right = '0px';
    for (var n = 0, sLen = noteDiv.childNodes.length; n < sLen; n++) {
      noteDiv.childNodes[n].style.visibility = '';
    }
  }
  window.cancelAnimationFrame(requestId);
}

/**
 * Remove all notes from music editor.
 * @param {node} musNode: Music editor element.
 */
function clearNotes(musNode) {
  var notes = getAllNotes(musNode);
  for (var i = 0, len = notes.length; i < len; i++) {
    notes[i].parentNode.removeChild(notes[i]);
  }
  resetMusicWidth(musNode);
}

/**
 * Update all staves with current note data.
 * @param {node} musNode: Music editor element.
 */
function fillNotes(musNode, music) {
  for (var s = 0, len = musNode.childNodes.length; s < len; s++) {
    var noteDiv = musNode.childNodes[s].noteDiv;
    var staff = music.staves[s];
    for (var i = 0, lem = staff.notes.length; i < lem; i++) {
      createNote(staff.notes[i], noteDiv);
    }
  }
}

/**
 * Reset width for all Staff elements, based on widest noteDiv.
 * @param {node} musNode: Music editor element.
 */
function resetMusicWidth(musNode) {
  var width = musNode.clientWidth - STAFF_MARGIN;
  for (var s = 0, len = musNode.childNodes.length; s < len; s++) {
    var noteDiv = musNode.childNodes[s].noteDiv;
    width = Math.max(width, noteDiv.offsetLeft + noteDiv.offsetWidth);
  }
  for (var s = 0, len = musNode.childNodes.length; s < len; s++) {
    var staffNode = musNode.childNodes[s];
    staffNode.style.width = width + 'px';
  }
}

/**
 * Adjust scroll to keep given node within viewable area.
 * @param {node} node: Individual note element, usually the activeNode.
 */
function adjustScroll(node) {
  var div = node.parentNode.parentNode.parentNode;
  var center = div.offsetWidth / 2 + div.scrollLeft;
  var edge = node.parentNode.offsetLeft + node.offsetLeft + node.offsetWidth;
  if (node.nextSibling === null) {
    div.scrollLeft += div.scrollWidth - div.clientWidth;
  } else if (edge - center > div.offsetWidth / 3) {
    div.scrollLeft += edge - center - div.offsetWidth / 3;
  } else if (edge - node.offsetWidth - center < div.offsetWidth / -3) {
    div.scrollLeft += edge - node.offsetWidth - center - div.offsetWidth / -3;
  } 
}

/**
 * Get array of all note nodes.
 * @param {node} musNode: Music editor element.
 * @return {array}: Note nodes for all staves.
 */
function getAllNotes(musNode) {
  var notes = [];
  for (var s = 0, len = musNode.childNodes.length; s < len; s++) {
    var noteDiv = musNode.childNodes[s].noteDiv;
    for (var n = 0, sLen = noteDiv.childNodes.length; n < sLen; n++) {
      notes.push(noteDiv.childNodes[n]);
    }
  }
  return notes;
}


///////////
// STAFF //
///////////

/**
 * Create, fill and append staff node.
 * @param {object} staff: Instance of Staff class.
 * @param {node} musNode: Music editor <div> element.
 * @return {node}: New staff node <a>.
 */
function createStaff(staff, musNode) {
  var staffNode = document.createElement('a'); 
  staffNode.staff = staff;
  staffNode.setAttribute('class', 'staff');

  staffNode.clef = document.createElement('img');
  staffNode.clef.setAttribute('class', 'clef');
  staffNode.clef.style.top = TOP.clef + 'px';
  staffNode.keySig = document.createElement('div');
  staffNode.keySig.setAttribute('class', 'key-sig');
  staffNode.timeSig = document.createElement('div');
  staffNode.timeSig.setAttribute('class', 'time-sig');

  staffNode.appendChild(staffNode.clef);
  staffNode.appendChild(staffNode.keySig);
  staffNode.appendChild(staffNode.timeSig);

  musNode.appendChild(staffNode);
  return drawStaff(staff, staffNode);
}

function drawStaff(staff, staffNode) {
  drawClef(staff, staffNode);
  drawKeySig(staff, staffNode);
  drawTimeSig(staff, staffNode);
  drawNoteDiv(staff, staffNode);
  return staffNode;
}

/**
 * Draw clef.
 */
function drawClef(staff, staffNode) {
  var image = 'clef-' + staff.clef + '.png';
  staffNode.clef.setAttribute('src', IMAGE_DIR + image);
  return staffNode.clef;
}

/**
 * Draw key signature by cloning from music node.
 */
function drawKeySig(staff, staffNode) {
  var oldKeySig = staffNode.keySig;
  staffNode.keySig = staffNode.parentNode.keySig.cloneNode(true);
  staffNode.replaceChild(staffNode.keySig, oldKeySig);
  
  // Lower accidentals for bass clef.
  var clefAdjust = {
    treble: 0,
    tenor:  0,
    bass:   SPACE * 2
  };
  staffNode.keySig.style.top = clefAdjust[staff.clef] + 'px';
}

/**
 * Draw time signature by cloning from music node.
 */
function drawTimeSig(staff, staffNode) {
  var oldTimeSig = staffNode.timeSig;
  staffNode.timeSig = staffNode.parentNode.timeSig.cloneNode(true);
  staffNode.replaceChild(staffNode.timeSig, oldTimeSig);
}

/**
 * Draw <div> that contains all notes and rests.
 */
function drawNoteDiv(staff, staffNode) {
  staffNode.noteDiv = document.createElement('div');
  staffNode.noteDiv.setAttribute('class', 'note-div');
  staffNode.appendChild(staffNode.noteDiv);
  for (var i = 0, len = staff.notes.length; i < len; i++) {
    createNote(staff.notes[i], staffNode.noteDiv);
  }
}

/**
 * Get staff width up to and including it's final note.
 */
function getStaffWidth(staffNode) {
  var last = staffNode.noteDiv.lastChild || staffNode.noteDiv;
  var margin = parseInt(last.style.marginRight) || 0;
  return staffNode.noteDiv.offsetLeft + last.offsetLeft + margin + BEAT * 2;
}

/**
 * Return relative y-coord for a position on the staff.
 */
function yPos(n) {
  return n * SPACE * -1;
}


///////////
// NOTES //
///////////

// Create a new note and fill it with contents
function createNote(note, noteDiv) {
  var node = note.node = document.createElement('div');
  node.note = note;
  node.setAttribute('class', 'note');
  node.style.width = BEAT + 'px';
   
  node.noteImg = document.createElement('img');
  node.noteImg.setAttribute('class', 'note-img');
  node.ledgers = document.createElement('div');
  node.accidental = document.createElement('img');
  node.accidental.setAttribute('class', 'accidental');
  node.accidental.style.top = TOP.acci + 'px';
 
  node.appendChild(node.accidental);
  node.appendChild(node.ledgers);
  node.appendChild(node.noteImg);
  
  var where = note.staff.notes.indexOf(note);
  noteDiv.insertBefore(node, noteDiv.childNodes[where]);

  return drawNote(note, node);
}

// Fill a note node with (updated) contents
function drawNote(note, node, changes) {
  changes = changes || ['pitch', 'type'];

  if (changes.indexOf('type') > -1) {
    drawNoteImg(note, node);
    node.style.marginRight = getNoteMargin(note) + 'px';
    resetMusicWidth(node.parentNode.parentNode.parentNode);
    adjustScroll(node);
  }
  if (changes.indexOf('accidental') > -1) {
    drawAccidental(note, node);
  }
  if (changes.indexOf('pitch') > -1) {
    node.position = getNotePosition(note);
    node.style.top = yPos(node.position) + 'px';
    drawAccidental(note, node);
    drawLedgers(note, node);
    drawNoteImg(note, node);
  }
  return node;
}

function getNoteMargin(note) {
  var beats = note.getData()[1];
  return (beats - 1) * BEAT;
};

function getNotePosition(note) {
  var clef = note.staff.clef;
  var positions = {
    C: -6, D: -5, E: -4, F: -3, G: -2, A: -1, B: 0
  };
  var clefAdj = {treble: 0, tenor: 7, bass: 12};
  return positions[note.letter] + 7 * (note.octave - 4) + clefAdj[clef];
}

// Draw or update note image
function drawNoteImg(note, node) {
  node.noteImg.setAttribute('src', getNoteSrc(note, node));
  node.noteImg.style.top = TOP[note.type] + 'px';
  return node.noteImg;
}

function getNoteSrc(note, node) {
  var which = note.rest ? 'rest-' : 'note-';
  var stem = '';
  if (note.type !== 'whole' && !note.rest) {
    stem += node.position >= 0 ? '-down' : '-up';
  }
  var red = node === activeNode ? '-red' : '';
  return IMAGE_DIR + which + note.type + stem + red + '.png';
}

// Draw or update ledger lines
function drawLedgers(note, node) {
  var howMany = Math.floor((Math.abs(node.position) - 4) / 2);
  howMany = howMany < 0 ? 0 : howMany;
  var currLedgers = node.ledgers.childNodes.length || 0;
  var increment = node.position > 0 ? SPACE : SPACE * -1;

  while (currLedgers < howMany) {
    var ledger = document.createElement('img');
    var height = (currLedgers * 2 * increment);
    ledger.setAttribute('src', IMAGE_DIR + 'ledger-line.png');
    ledger.setAttribute('class', 'ledger');
    ledger.style.top = TOP.ledger + height + 'px';
    node.ledgers.appendChild(ledger);
    currLedgers++;
  }
  while (currLedgers > howMany) {
    currLedgers--;
    node.ledgers.removeChild(node.ledgers.lastChild);
  }
  node.ledgers.style.top = node.position % 2 === 0 ? '0px' : increment + 'px';
  return node.ledgers;
}

// Draw or update accidental
function drawAccidental(note, node) {
  node.accidental.style.visibility = note.isDiatonic() ? 'hidden' : '';
  node.accidental.setAttribute('src', getAccidentalSrc(note)); 
  return node.accidental;
}

function getAccidentalSrc(note) {
  var symbols = {
    'x' : 'doublesharp',
    '#' : 'sharp',
    ''  : 'natural',
    'b' : 'flat',
    'bb': 'doubleflat'
  };
  var accidental = symbols[note.accidental];
  return IMAGE_DIR + 'accidental-' + accidental + '.png';
}

// toggle 'active' status by adding/subtracting '-red.png'
function makeActive(element) {
  if (activeNode) {
    deactivate(activeNode);
  }
  if (element.className !== 'note') {
    return activeNode = null;
  }
  var src = element.noteImg.src;
  element.noteImg.setAttribute('src', src.slice(0, -4) + '-red.png');
  adjustScroll(element);
  return activeNode = element;
}

function deactivate(element) {
  if (element !== activeNode) {
    return false;
  }
  var src = element.noteImg.src;
  element.noteImg.setAttribute('src', src.slice(0, -8) + '.png');
}
