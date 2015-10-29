/**
 * BUTTONS AND INPUT
 */ 

function makePlayButton(buttonId, editorId, music, audio) {
  var button = document.getElementById(buttonId);
  var musicNode = document.getElementById(editorId);
  button.addEventListener('click', function() {
    if (button.innerHTML === "Stop Music") {
      button.innerHTML = "Play Music";
      clearTimeout(audio.playing);
      audio.stop();
    } else if (music.getDuration() > 0) {
      button.innerHTML = "Stop Music";
      var endTime = audio.play(music.getData(), music.tempo);
      audio.playing = setTimeout(function() {
        audio.stop();
        button.innerHTML = "Play Music";
      }, (endTime * 1000));
      scrollMusic(music, musicNode, audio);
    }
  });
}

function makeClearButton(buttonId, editorId, music) {
  var button = document.getElementById(buttonId);
  var musicNode = document.getElementById(editorId);
  button.addEventListener('click', function() {
    clearNotes(musicNode);
    music.clear();
  });
}

function makeKeySelector(elemId, musicObj) {
  var elem = document.getElementById(elemId);
  elem.addEventListener('change', function() {
    musicObj.key = elem.value;
    for (var i = 0; i < musicObj.staves.length; i++) {
      var keySig = musicObj.staves[i].node.childNodes[1];
      updateKeySig(keySig, musicObj.key);
      for (var n = 0; n < musicObj.staves[i].notes.length; n++) {
        var note = musicObj.staves[i].notes[n];
        note.updateKey(musicObj.key);
        drawNote(note, note.node, ['accidental']);
      }
    }
  });
}

function makeTempoInput(elemId, musicObj) {
  var elem = document.getElementById(elemId);
  elem.addEventListener('change', function() {
    elem.value = parseInt(elem.value) || 120;
    if (elem.value > 300) {
      elem.value = 300;
    } else if (elem.value < 30) {
      elem.value = 30;
    }
    musicObj.tempo = elem.value;
  });
}

/*
 * MUSIC EDITOR
 */

function moveNote(node, direction) {
  var note = node.note;
  var letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var i = letters.indexOf(note.letter) + direction;
  var octave = +note.octave + Math.floor(i / 7);
  if (octave < 0 || octave > 9) {
    return false;
  }
  var letter = letters[(i + 7) % 7];
  if (note.chromatic) {
    var lettAcci = letter + note.accidental;
  } else {
    var lettAcci = inheritAccidental(letter, note.staff.music.key);
  }
  note.updateName(lettAcci + octave);
  drawNote(note, node, ['pitch']);
}

function inheritAccidental(letter, key) {
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
  var sets = {
    'b': ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
    '#': ['F', 'C', 'G', 'D', 'A', 'E', 'B']
  };
  var myKey = keys[key];
  var mySet = sets[myKey[0]].slice(0, myKey[1]);

  if (mySet.indexOf(letter) > -1) {
    return letter + myKey[0];
  } else {
    return letter;
  }  
}

function switchNote(node, direction) {
  var active = direction === 1 ? node.nextSibling : node.previousSibling;
  if (active === null) {
    return addNewNote(node.parentNode);
  } else if (active.className === 'time-sig') {
    return false;
  } else {
    return makeActive(active);
  }
  var div = active.parentNode.parentNode;
  var center = div.offsetWidth / 2 + div.scrollLeft;
  var edge = active.offsetLeft + active.offsetWidth / 2;
  if (edge - center > div.offsetWidth / 3) {
    div.scrollLeft += edge - center - div.offsetWidth / 3;
  } else if (edge - center < div.offsetWidth / -3) {
    div.scrollLeft += edge - center - div.offsetWidth / -3; 
  }
}

function toggleRest(node) {
  var noteObj = node.note;
  noteObj.rest = noteObj.rest ? false : true;
  drawNote(noteObj, node, ['type']);
}

function changeNoteType(node, direction) {
  var noteObj = node.note;
  var types = ['quarter', 'half', 'whole'];
  var i = types.indexOf(noteObj.type);
  if (types[i + direction] === undefined) return false;
  noteObj.type = types[i + direction];
  centerDiv(node);
  drawNote(noteObj, node, ['type']);
}

function addNewNote(staffNode, where) {
  where = where || null;
  if (activeNode && activeNode.parentNode === staffNode) {
    var a = activeNode.note;
  } else {
    var a = {};
  }
  var staff = staffNode.staff;
  var note = staff.addNote(a.name, a.type, a.rest, where, a.exp);
  var node = createNote(note, staffNode);
  return makeActive(node);
}

function deleteNote(noteNode) {
  if (noteNode.previousSibling.className === 'note') {
    makeActive(noteNode.previousSibling);
  } else if (noteNode.nextSibling) {
    makeActive(noteNode.nextSibling);
  } else {
    makeActive(noteNode.previousSibling); 
  }
  var index = noteNode.note.staff.notes.indexOf(noteNode.note);
  if (index > -1) {
    noteNode.note.staff.notes.splice(index, 1);
  }
  resetMusicWidth(noteNode.parentNode.parentNode);
  noteNode.parentNode.removeChild(noteNode);
}

function changeAccidental(node, direction) {
  var note = node.note;
  var symbols = ['b', '', '#'];
  var i = symbols.indexOf(note.accidental);
  var newAcci = symbols[i + direction];
  if (newAcci === undefined) {
    return false;
  }
  note.updateName(note.letter + newAcci + note.octave);
  note.chromatic = note.isDiatonic() ? false : true;
  drawNote(note, node, ['accidental']);
  return true;
}

function makeMusicEditor(elemId, musicObj) {
  var editor = document.getElementById(elemId);
  editor.setAttribute('tabindex', '1');

  editor.addEventListener('keydown', function(e) {
    var keyCode = e.which || window.event.keyCode;
    var shiftKey = e.shiftKey || window.event.shiftKey;
    if (!activeNode) {
      return false;
    }
    switch(keyCode) {
    case 16: // ignore shift key
      break;
    case 17: // ignore ctrl key
      break;
    case 8:  // delete key
      deleteNote(activeNode);
      break;
    case 38: // uparrow
      moveNote(activeNode, 1);
      break;
    case 40: // downarrow
      moveNote(activeNode, -1);
      break;
    case 37: // leftarrow
      switchNote(activeNode, -1);
      break;
    case 39: // rightarrow
      switchNote(activeNode, 1);
      break;
    case 82: // 'r' key
      toggleRest(activeNode);
      break;
    case 187: // +/=
      changeAccidental(activeNode, 1);
      break;
    case 189: // -/_
      changeAccidental(activeNode, -1);
      break;
    case 188: // comma
      changeNoteType(activeNode, -1);
      break;
    case 190: // period
      changeNoteType(activeNode, 1);
      break;
    default:
      break;
    }
    e.preventDefault();
    return false;
  }, false);
  
  editor.addEventListener('click', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    if (!target) {
      return false;
    }
    else if (target.className !== 'note') {
      if (target.parentNode.className === 'note')
        target = target.parentNode;
      else if (target.className === 'staff')
        addNewNote(target);
      else
        target = null;
    }
    if (target && target.className === 'note') {
      makeActive(target);
    }
  }, false);  
}
