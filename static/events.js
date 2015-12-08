/**
 * BUTTONS AND INPUT
 */ 

function makePlayButton(buttonId, editorId, music, audio) {
  var button = document.getElementById(buttonId);
  var musNode = document.getElementById(editorId);
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
      scrollMusic(music, musNode, audio);
    }
  });
}

function makeClearButton(buttonId, editorId, music) {
  var button = document.getElementById(buttonId);
  var musNode = document.getElementById(editorId);
  button.addEventListener('click', function() {
    clearNotes(musNode);
    music.clear();
  });
}

function makeKeySelector(selectorId, editorId, music) {
  var selector = document.getElementById(selectorId);
  var musNode = document.getElementById(editorId);
  selector.addEventListener('change', function() {
    music.key = selector.value;
    makeKeySig(music, musNode);
    for (var i = 0, len = musNode.childNodes.length; i < len; i++) {
      var staffNode = musNode.childNodes[i];
      var noteNodes = staffNode.noteDiv.childNodes;
      drawKeySig(staffNode.staff, staffNode);
      for (var n = 0, lem = noteNodes.length; n < lem; n++) {
        var node = noteNodes[n];
        node.note.updateKey();
        drawNote(node.note, node, ['accidental']);
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


// New plan: Submit all fields independantly, except JSONify individual staves.  Also, add key to stave data??
function makeFormSubmit(formId, musicObj) {
  var form = document.getElementById(formId);
  var input = document.createElement('input');
  input.setAttribute('type', 'hidden');
  input.setAttribute('name', 'staves-json');
  form.appendChild(input);
  form.addEventListener('submit', function() {
    input.value = musicObj.JSONify();
    return true;
  });
}

function importMusic(obj) {
  if (obj === undefined) {
    var music = new Music('Untitled', 120, 'C', '4/4');
    music.addStaff('soprano', 'treble');
    music.addStaff('alto', 'treble');
    music.addStaff('tenor', 'tenor');
    music.addStaff('bass', 'bass');
    return music;
  } else {
    var music = new Music(obj['title'], obj['tempo'], obj['key'], obj['time']);
    for (var s = 0, len = obj['staves'].length; s < len; s++) {
      var json = obj['staves'][s];
      var staff = music.addStaff(json['voice'], json['clef']);
      for (var n = 0, lem = json['notes'].length; n < lem; n++) {
        var nObj = json['notes'][n];
        staff.addNote(nObj['name'], nObj['type'], nObj['rest'], 
                      nObj['exp'], nObj['chromatic']);
      }
    }
    return music;
  }
}

function makeMelodyButton(buttonId, editorId, music) {
  var button = document.getElementById(buttonId);
  var editor = document.getElementById(editorId);
  if (!button || !editor) {
    return false;
  }
  var staff = music.staves[0];
  var noteDiv = editor.firstChild.noteDiv;
  button.addEventListener('click', function() {
    clearNotes(editor);
    music.clear();
    music.genMelody();
    fillNotes(editor, music);
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
  var lettAcci = inheritAccidental(letter, note.staff.music.key);
  note.updateName(lettAcci + octave);
  var accis = ['bb', 'b', '', '#', 'x'];
  var defaultAcci = note.accidental;
  if (note.chromatic) {
    changeAccidental(node, note.chromatic);
    var currAcci = note.accidental;
    note.chromatic = accis.indexOf(currAcci) - accis.indexOf(defaultAcci);
  }
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
  if (active === null && direction === 1) {
    return addNewNote(node.parentNode);
  } else if (active === null) {
    return false;
  } else {
    return makeActive(active);
  }
  var div = active.parentNode.parentNode.parentNode;
  var center = div.offsetWidth / 2 + div.scrollLeft;
  var edge = active.offsetLeft + active.parentNode.offsetLeft + active.offsetWidth / 2;
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
  if (types[i + direction] === undefined) {
    return false;
  }
  noteObj.type = types[i + direction];
  adjustScroll(node);
  drawNote(noteObj, node, ['type']);
}

function addNewNote(noteDiv, where) {
  where = where || null;
  if (activeNode && activeNode.parentNode === noteDiv) {
    var a = activeNode.note;
  } else {
    var a = {};
  }
  var staff = noteDiv.parentNode.staff;
  var note = staff.addNote(a.name, a.type, a.rest, a.exp, a.chromatic, where);
  var node = createNote(note, noteDiv);
  return makeActive(node);
}

function deleteNote(noteNode) {
  if (noteNode.previousSibling) {
    makeActive(noteNode.previousSibling);
  } else if (noteNode.nextSibling) {
    makeActive(noteNode.nextSibling);
  } else {
    deactivate(noteNode);
    activeNode = null;
  }
  var index = noteNode.note.staff.notes.indexOf(noteNode.note);
  if (index > -1) {
    noteNode.note.staff.notes.splice(index, 1);
  }
  resetMusicWidth(noteNode.parentNode.parentNode.parentNode);
  noteNode.parentNode.removeChild(noteNode);
}

function changeAccidental(node, direction) {
  var note = node.note;
  var symbols = ['bb', 'b', '', '#', 'x'];
  var i = symbols.indexOf(note.accidental);
  var j = i + direction;
  j = j > 4 ? 4 : j < 0 ? 0 : j;
  if (i === j) {
    return false;
  }
  var newAcci = symbols[j];
  note.updateName(note.letter + newAcci + note.octave);
  if (note.isDiatonic()) {
    note.chromatic = 0;
  } else {
    note.chromatic += j - i;
  }
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
        addNewNote(target.noteDiv);
      else if (target.className === 'noteDiv')
        addNewNote(target);
      else
        target = null;
    }
    if (target && target.className === 'note') {
      makeActive(target);
    }
  }, false);  
}
