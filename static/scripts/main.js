// Wait to run scripts until page is loaded
document.addEventListener('DOMContentLoaded', buildPage);

// Build page elements and set event listeners, etc
function buildPage() {
  
  // Set element variables for later use
  var editor = document.getElementById('music-input');
  var scoreForm = document.getElementById('score-data');
  var signupBtn = document.getElementById('signup-btn');
  var signupPop = document.getElementById('signup-form').parentNode;
  var cancelBtn = document.getElementById('cancel-btn');
  var scoresBtn = document.getElementById('scores-btn');
  var scoresMenu = document.getElementById('scores-menu');

  // Sign-up (Popup window)
  
  if (signupBtn) {
    
    signupBtn.addEventListener('click', function(e) {
      e.preventDefault();
      signupPop.hidden = false;
    });
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      signupPop.hidden = true;
    });
  }

  // Scores (Pulldown menu)
  
  if (scoresBtn) {
    
    // Toggle scores menu with button clicks
    scoresBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (scoresMenu.hidden === true) {
        getScores(scoresMenu);
        scoresMenu.hidden = false;
      } else {
        scoresMenu.hidden = true;
      }
      e.stopPropagation();
    });

    // Close drop menus on click or TODO: esc
    document.addEventListener('click', function(e) {
      if (scoresMenu.hidden === false) {
        scoresMenu.hidden = true;
      }
    });

    // Setup scores menu
    scoresMenu.addEventListener('click', function(e) {
      var target = e.target;
      if (target.tagName.toLowerCase() !== 'li') {
        return false;
      }
      var id = target.getAttribute('rel');
      getScore(id, editor, scoreForm);
    });
  }

  // Setup Editor ==========================================================

  // Key select element
  var keys = [
    ['C', 'C Major / a minor'], ['G', 'G Major / e minor'],
    ['D', 'D Major / b minor'], ['A', 'A Major / f# minor'],
    ['E', 'E Major / c# minor'], ['B', 'B Major / g# minor'],
    ['F#', 'F# Major / d# minor'], ['C#', 'C# Major / a# minor'],
    ['F', 'F Major / d minor'], ['Bb', 'Bb Major / g minor'],
    ['Eb', 'Eb Major / c minor'], ['Ab', 'Ab Major / f minor'],
    ['Db', 'Db Major / b-flat minor'], ['Gb', 'Gb Major / e-flat minor'],
    ['Cb', 'Cb Major / a-flat minor']
  ];
  makeSelector('key', editor, keys, keyChange);

  // Tempo select element
  var tempi = [];
  for (var t = 32; t < 300; t += 8) {
    var str = t.toString();
    tempi.push([str, str]);
  }
  makeSelector('tempo', editor, tempi, tempoChange, 120);

  // Time Signature select element
  var timeSigs = [
    ['4/4', '4 / 4'], ['3/4', '3 / 4'], ['2/4', '2 / 4'],
    ['2/2', '2 / 2'], ['6/8', '6 / 8'], ['7/8', '7 / 8']
  ];
  makeSelector('timeSig', editor, timeSigs, timeChange);

  // Setup Music Editor ====================================================
  makeMusicEditor(editor);

  // Setup Editor Toolbox ==================================================
  makePlayButton('play-music', editor);
  makeClearButton('clear-music', editor);
  makeMelodyButton('melody-gen', editor);
  makeSaveButton('save-music', 'score-data', editor);
  makeDeleteButton('del-music');
}
