var music = new Music(60, 'C', [4, 4]);
music.addStaff('soprano', 'treble');
music.addStaff('alto', 'treble');
music.addStaff('tenor', 'tenor');
music.addStaff('bass', 'bass');

makeClearButton('clear-music', 'music-input', music);
makeKeySelector('key-select', 'music-input', music);
makeTempoInput('tempo-input', music);
drawMusic('music-input', music);
makeMusicEditor('music-input', music);

var audio = new AudioEnv();
makePlayButton('play-music', 'music-input', music, audio);

