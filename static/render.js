/*
 * CONSTANTS (all in pixels)
 */

SPACE = 6;     // distance from line to space in staff
BEAT = 40;      // width of div.note class
BORDER = 2;     // width of left and right borders of music div
TOP = {         // various height offsets for css 'top' attribute
  keySig :  -9,
  acci   :   8,
  ledger :  23,
  whole  :  18,
  half   : -10,
  quarter: -10,
  clef   : -24
};
WIDTH = {
  acci   :  10
};

/*
 * OTHER ACCESSIBLE VARIABLES (consider attaching this to musicNode??)
 */
IMAGE_DIR = 'images/';
var activeNode = null;

/*
 * HELPERS
 */

function yPos(n) {
  return n * SPACE * -1;
}

/*
 * MUSIC
 */

// create and connect music node to music object, draw staves
function drawMusic(divId, music) {
  var musicNode = music.node = document.getElementById(divId);
  musicNode.music = music;
  while (musicNode.firstChild) { //remove possible whitespace children
    musicNode.removeChild(musicNode.firstChild);
  }
  for (var i = 0, len = music.staves.length; i < len; i++) {
    drawStaff(music.staves[i], musicNode);
  }
}

// scroll music towards left
function scrollMusic(music, node, audio) {
  node.scrollLeft = 0;

  var duration = music.getDuration() * 1000;
  var distance = duration / (60 * 1000) * music.tempo * BEAT;
  var start = window.performance.now();

  function scroll(time) {
    var elapsed = time - start;
    var timeSig = node.firstChild.timeSig;
    var disappear = timeSig.offsetLeft + timeSig.offsetWidth + WIDTH.acci;
    forAllNotes(node, function(noteNode) {
      noteNode.style.right = elapsed / duration * distance + 'px';
      if (noteNode.offsetLeft < disappear) {
        noteNode.style.visibility = 'hidden';
      }
    });
    if (elapsed >= duration || audio.playing === false) {
      return stopScroll(node, requestId);
    }
    requestId = window.requestAnimationFrame(scroll);
  }
  var requestId = window.requestAnimationFrame(scroll);
}

function stopScroll(musicNode, requestId) {
  forAllNotes(musicNode, function(node) {
    node.style.right = '0px';
    node.style.visibility = '';
  });
  window.cancelAnimationFrame(requestId);
  return false;
}

function clearNotes(musicNode) {
  forAllNotes(musicNode, function(node) {
    node.parentNode.removeChild(node);
  });
  resetMusicWidth(musicNode);
}

// reset width for all staves, based on note overflow
function resetMusicWidth(musicNode) {
  var width = musicNode.offsetWidth - BORDER;
  for (var s = 0, len = musicNode.childNodes.length; s < len; s++) {
    var edge = getStaffWidth(musicNode.childNodes[s]);
    width = Math.max(width, edge);
  }
  for (var s = 0, len = musicNode.childNodes.length; s < len; s++) {
    var staffNode = musicNode.childNodes[s];
    staffNode.style.width = width + 'px';
  }
}

// center div to include active node
function centerDiv(node) {
  var div = node.parentNode.parentNode;                                       
  var center = div.offsetWidth / 2 + div.scrollLeft;                            
  var edge = node.offsetLeft + node.offsetWidth;                        
  if (edge - center > div.offsetWidth / 3) {                                    
    div.scrollLeft += edge - center - div.offsetWidth / 3;                      
  } else if (node.offsetLeft - center < div.offsetWidth / -3) {                            
    div.scrollLeft += node.offsetLeft - center - div.offsetWidth / -3;                     
  }                                                                             
}

function forAllNotes(editor, func) {
  var notes = [];
  for (var s = 0, len = editor.childNodes.length; s < len; s++) {
    var staffNode = editor.childNodes[s];
    for (var n = 3, sLen = staffNode.childNodes.length; n < sLen; n++) {
      notes.push(staffNode.childNodes[n]);
    }
  } 
  for (var i = 0, len = notes.length; i < len; i++) {
    func(notes[i]);
  }
  return true;
}

/*
 * STAVES
 */

// Create a new <a> tag for Staff rendering
function drawStaff(staff, musicNode) {
  var node = staff.node = document.createElement('a'); 
  node.staff = staff;
  node.setAttribute('class', 'staff');

  drawClef(staff, node);
  drawKeySig(staff, node);
  drawTimeSig(staff, node); 

  for (var i = 0, len = staff.notes.length; i < len; i++) {
    createNote(staff.notes[i], node);
  }
  musicNode.appendChild(node);
}

// Render clef at beginning of staff
function drawClef(staff, node) {
  var clefNode = document.createElement('img');
  var image = 'clef-' + staff.clef + '.png';
  clefNode.setAttribute('class', 'clef');
  clefNode.setAttribute('src', 'images/' + image);
  clefNode.style.top = TOP.clef + 'px';
  node.appendChild(clefNode);
}

// move initial div creation to MUSIC area, then cloneNode into staves. 
function drawKeySig(staff, node) {
  var clefAdjust = {
    treble: 0,
    tenor:  0,
    bass:   SPACE * 2
  };
  var keySigDiv = node.keySig = document.createElement('div');
  keySigDiv.setAttribute('class', 'key-sig');
  keySigDiv.style.top = clefAdjust[staff.clef] + 'px';
  fillKey(keySigDiv, staff.music.key);
  node.appendChild(keySigDiv);
}

// update key signature with new value
function updateKeySig(keySigNode, key) {
  while (keySigNode.firstChild) {
    keySigNode.removeChild(keySigNode.firstChild);
  }
  fillKey(keySigNode, key);
}

// fill key signature with images
function fillKey(keySigDiv, key) {
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
  var acciPositions = {
    flat:  [yPos(0), yPos(3), yPos(-1), yPos(2), yPos(-2), yPos(1), yPos(-3)],
    sharp: [yPos(4), yPos(1), yPos(5), yPos(2), yPos(-1), yPos(3), yPos(0)]
  };

  var type = keys[key][0];
  var number = keys[key][1];
  var image = 'accidental-' + type + '.png';

  for (var i = 0; i < number; i++) {
    var acciNode = document.createElement('img');
    acciNode.setAttribute('src', 'images/' + image);
    acciNode.style.top = (acciPositions[type][i] - TOP.keySig) + 'px';
    keySigDiv.appendChild(acciNode);
  } 
  return keySigDiv;
}

// create alternative for common and cut time display
function drawTimeSig(staff, node) {
  var timeSig = staff.music.timeSig;
  var timeSigDiv = node.timeSig = document.createElement('div');
  timeSigDiv.setAttribute('class', 'time-sig');
  timeSigDiv.innerHTML = '<p>' + timeSig[0] + '</p><p>' + timeSig[1] + '</p>';
  node.appendChild(timeSigDiv);
}

// get staff width up to and including last note or rest
function getStaffWidth(staffNode) {
  var last = staffNode.lastChild;
  var margin = parseInt(last.style.marginRight) || 0;
  return last.offsetLeft + margin + BEAT * 2;
}

/**
 * NOTES
 */

// Create a new note DIV and fill it with contents
function createNote(note, staffNode) {
  var node = note.node = document.createElement('div');
  node.note = note;
  node.setAttribute('class', 'note');
  node.style.width = BEAT + 'px';
   
  node.noteImg = document.createElement('img');
  node.ledgers = document.createElement('div');
  node.accidental = document.createElement('img');
  node.accidental.setAttribute('class', 'accidental');
  node.accidental.style.top = TOP.acci + 'px';
 
  node.appendChild(node.accidental);
  node.appendChild(node.ledgers);
  node.appendChild(node.noteImg);
  
  var where = note.staff.notes.indexOf(note);
  var neighborNode = staffNode.childNodes[where + 3];
  staffNode.insertBefore(node, neighborNode);

  return drawNote(note, node);
}

// Fill a note node with (updated) contents
function drawNote(note, node, changes) {
  changes = changes || ['pitch', 'type'];

  if (changes.indexOf('type') > -1) {
    drawNoteImg(note, node);
    node.style.marginRight = getNoteMargin(note) + 'px';
    resetMusicWidth(node.parentNode.parentNode);
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
    ledger.setAttribute('src', 'images/ledger-line.png');
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
  if (activeNode)
    deactivate(activeNode);
  if (element.className !== 'note') {
    return activeNode = null;
  }
  var src = element.lastChild.src;
  element.lastChild.setAttribute('src', src.slice(0, -4) + '-red.png');
  centerDiv(element);
  return activeNode = element;
}

function deactivate(element) {
  if (element !== activeNode) return false;
  var src = element.lastChild.src;
  element.lastChild.setAttribute('src', src.slice(0, -8) + '.png');
}
