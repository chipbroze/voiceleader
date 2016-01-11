function buildPage() {
  
  var keys = [['C', 'C Major / a minor'], ['G', 'G Major / e minor'],
             ['D', 'D Major / b minor'], ['A', 'A Major / f# minor'],
             ['E', 'E Major / c# minor'], ['B', 'B Major / g# minor'],
             ['F#', 'F# Major / d# minor'], ['C#', 'C# Major / a# minor'],
             ['F', 'F Major / d minor'], ['Bb', 'Bb Major / g minor'],
             ['Eb', 'Eb Major / c minor'], ['Ab', 'Ab Major / f minor'],
             ['Db', 'Db Major / b-flat minor'], ['Gb', 'Gb Major / e-flat minor'],
             ['Cb', 'Cb Major / a-flat minor']];
  var tempi = [];
  for (var t = 32; t < 300; t += 8) {
    var str = t.toString();
    tempi.push([str, str]);
  }

  var timeSigs = [['4/4', '4 / 4'], ['3/4', '3 / 4'], ['2/4', '2 / 4'],
                  ['2/2', '2 / 2'], ['6/8', '6 / 8'], ['7/8', '7 / 8']];

  makeClearButton('clear-music', 'music-input');
  makeSelector('key', 'music-input', keys, keyChange);
  makeSelector('tempo', 'music-input', tempi, tempoChange, 120);
  makeSelector('timeSig', 'music-input', timeSigs, timeChange);
  makeFormSubmit('save-music', 'score-data', 'music-input');
  makeDeleteButton('del-music');
  createEditor('music-input');
  makeMusicEditor('music-input');
  makeMelodyButton('melody-gen', 'music-input');

  var audio = new AudioEnv();
  makePlayButton('play-music', 'music-input', audio);
}
