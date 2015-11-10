function buildPage(json) {
  var music = importMusic(json);

  makeClearButton('clear-music', 'music-input', music);
  makeKeySelector('key-select', 'music-input', music);
  makeTempoInput('tempo-input', music);
  makeFormSubmit('form', music);
  drawMusic('music-input', music);
  makeMusicEditor('music-input', music);
  makeMelodyButton('melody-gen', 'music-input', music);

  var audio = new AudioEnv();
  makePlayButton('play-music', 'music-input', music, audio);
}
