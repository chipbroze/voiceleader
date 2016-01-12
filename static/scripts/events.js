/**
 * AJAX, JSON, XML Calls
 */

// Read all scores
function populateScores(scoresMenu) {
  var xReq = new XMLHttpRequest();
  xReq.addEventListener('load', function() {
    fillScoresMenu(scoresMenu, this.responseText);
  });
  xReq.open('GET', '/scores');
  xReq.send();
}

function fillScoresMenu(scoresMenu, data) {
  while (scoresMenu.lastChild.className !== 'bold-li') {
    scoresMenu.removeChild(scoresMenu.lastChild);
  }
  var arr = JSON.parse(data);
  arr.forEach(function(el) {
    var li = document.createElement('li');
    var text = document.createTextNode(el.title);
    li.setAttribute('rel', el.id);
    li.appendChild(text);
    scoresMenu.appendChild(li);
  });
}

  
// Retrieve and load score data
function loadScore(scoreId) {
  
  var xReq = new XMLHttpRequest();
  xReq.addEventListener('load', function() {
    var data = JSON.parse(this.responseText);
    
    var editor = document.getElementById('music-input');
    var music = importMusic(data.music);
    drawMusic(editor, music);
    
    var scoreForm = document.getElementById('score-data');
    scoreForm.title.value = data.title;
    scoreForm.key.value = music.key;
    scoreForm.time.value = music.timeSig;
    scoreForm.tempo.value = music.tempo;
    
    var id = document.getElementById('score-id');
    id.value = scoreId;
  });
  xReq.open('GET', '/scores/' + scoreId);
  xReq.send();
}

// Make Save Button (Create and Update)
function makeSaveButton(buttonId, formId, editor) {
  var button = document.getElementById(buttonId);
  var form = document.getElementById(formId);
  button.addEventListener('click', function(e) {
    e.preventDefault();
    var music = editor.music.JSONify();
    var formData = new FormData(form);
    formData.append('music', music);
    var id = document.getElementById('score-id').value;
    var method = id === 'new' ? 'POST' : 'PUT';
    var path = id === 'new' ? '/scores' : '/scores/' + id;
    var xReq = new XMLHttpRequest();
    xReq.addEventListener('load', function(e) {
      var txt = this.responseText;
      if (method === 'POST' && txt.length < 15) {
        alert('Score saved');
        form.id.value = txt;
      }
      else {
        alert(txt);
      }
    });
    xReq.open(method, path);
    xReq.send(formData);
  });
}

// Make Delete Button (Delete)
function makeDeleteButton(buttonId) {
  var button = document.getElementById(buttonId);
  button.addEventListener('click', function(e) {
    e.preventDefault();
    var yes = confirm('Are you sure you want to delete this score?');
    if (!yes) {
      return false;
    }
    var id = document.getElementById('score-id');
    var xReq = new XMLHttpRequest();
    xReq.addEventListener('load', function() {
      alert(this.responseText);
      id.value = 'new';
    });
    xReq.open('DELETE', '/scores/' + id.value);
    xReq.send();
  });
}



/**
 * BUTTONS AND INPUT
 */ 

function makePlayButton(buttonId, editor) {
  var audio = new AudioEnv();
  var button = document.getElementById(buttonId);
  button.addEventListener('click', function() {
    var music = editor.music;
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
      scrollMusic(music, editor, audio);
    }
  });
}

function makeClearButton(buttonId, editor) {
  var button = document.getElementById(buttonId);
  button.addEventListener('click', function() {
    clearNotes(editor);
    editor.music.clear();
  });
}

function makeSelector(id, editor, options, changeFunc, defalt) {
  var selector = document.getElementById(id);
  for (var i = 0, len = options.length; i < len; i++) {
    var option = document.createElement('option');
    var textNd = document.createTextNode(options[i][1]);
    option.value = options[i][0];
    option.appendChild(textNd);
    selector.appendChild(option);
    if (defalt) {
      selector.value = defalt;
    }
  }
  selector.addEventListener('change', function() {
    return changeFunc(selector, editor);
  });
}

function keyChange(selector, editor) {
  var music = editor.music;
  music.key = selector.value;
  makeKeySig(editor, music);
  for (var i = 0, len = editor.childNodes.length; i < len; i++) {
    var staffNode = editor.childNodes[i];
    var noteNodes = staffNode.noteDiv.childNodes;
    drawKeySig(staffNode.staff, staffNode);
    for (var n = 0, lem = noteNodes.length; n < lem; n++) {
      var node = noteNodes[n];
      node.note.updateKey();
      drawNote(node.note, node, ['accidental']);
    }
  }
}

function timeChange(selector, editor) {
  var music = editor.music;
  music.timeSig = selector.value;
  makeTimeSig(editor, music);
  for (var i = 0, len = editor.childNodes.length; i < len; i++) {
    var staffNode = editor.childNodes[i];
    drawTimeSig(staffNode.staff, staffNode);
  }
}

function tempoChange(selector, editor) {
  var music = editor.music;
  music.tempo = parseInt(selector.value);
}


function importMusic(json) {
  if (json === undefined) {
    var music = new Music(120, 'C', '4/4');
    music.addStaff('soprano', 'treble');
    music.addStaff('alto', 'treble');
    music.addStaff('tenor', 'tenor');
    music.addStaff('bass', 'bass');
  } else {
    var obj = JSON.parse(json);
    var music = new Music(obj['tempo'], obj['key'], obj['timeSig']);
    for (var s = 0, len = obj['staves'].length; s < len; s++) {
      var sObj = obj['staves'][s];
      var staff = music.addStaff(sObj['voice'], sObj['clef']);
      for (var n = 0, lem = sObj['notes'].length; n < lem; n++) {
        var nObj = sObj['notes'][n];
        staff.addNote(nObj['name'], nObj['type'], nObj['rest'], 
                      nObj['exp'], nObj['chromatic']);
      }
    }
  }
  return music;
}

function makeMelodyButton(buttonId, editor) {
  var button = document.getElementById(buttonId);
  if (!button || !editor) {
    return false;
  }
  button.addEventListener('click', function() {
    var music = editor.music;
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

/**
 * User Interaction : Event Listeners
 */

function makeMusicEditor(editor) {
  editor.setAttribute('tabindex', '1');
  createEditor(editor);

  editor.addEventListener('keydown', function(e) {
    e = e || window.event;
    var keyCode = e.which || e.keyCode;
    var shiftKey = e.shiftKey;
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
    case 61:
    case 43:
    case 187: // +/=
      changeAccidental(activeNode, 1);
      break;
    case 173:
    case 95:
    case 189: // -/_
      changeAccidental(activeNode, -1);
      break;
    case 60:
    case 188: // comma
      changeNoteType(activeNode, -1);
      break;
    case 62:
    case 190: // period
      changeNoteType(activeNode, 1);
      break;
    default:
      break;
    }
    e.preventDefault();
    return false;
  }, false);
  
  editor.addEventListener('mousedown', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    switch (target.className) {
    case 'note-img':
    case 'ledger':
      makeActive(target.parentNode);
      break;
    case 'accidental':
      target = target.parentNode;
    case 'note':
      var where = target.note.staff.notes.indexOf(target.note);
      addNewNote(target.parentNode, where);
      break;
    case 'note-div':
      addNewNote(target);
      break;
    case 'staff':
      addNewNote(target.noteDiv);
      break;
    default:
      break;
    }
  });

  // Dragging
  var startMouseY = null;
  var dragImg = document.createElement('img');
  dragImg.src = IMAGE_DIR + 'drag-img.png';

  editor.addEventListener('dragstart', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    if (target.className !== 'note-img') {
      e.preventDefault();
      return false;
    }
    startMouseY = e.clientY;
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  });

  editor.addEventListener('drag', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    target = target.parentNode;
    var distance = Math.floor((e.clientY - startMouseY) / SPACE);
    if (distance !== 0) {
      moveNote(target, distance * -1);
      startMouseY += distance * SPACE;
    }
  });

}
