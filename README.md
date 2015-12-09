Voiceleader
===========
VoiceLeader is a work in progress, and can be visited at [http://voiceleader.herokuapp.com/](http://voiceleader.herokuapp.com/).

Eventually, this little app should allow music theory teachers and students to input short SATB voiceleading exercises for evaluation.  It could also possibly allow users to generate short music compositions (with or without errors).

Input
-----
The app currently supports a very rudimentary input system created with html/javascript.  The editor contains a set of 4 staves (soprano, alto, tenor, bass).  Clicking on any staff adds a note to that staff.  The arrow keys can move notes up and down, and can move between notes with left and right.  The delete key also works.  The user can change note length with the '.' and ',' keys, and can add sharps and flats with the '=' and '-' keys.  Clicking the button "Melody Generator" fills the soprano staff with a random melody in the current key, and the alto and tenor staves with simple harmonies.

Playback
--------
The "Play Music" button will schedule playback of the current score using WebAudioAPI. Playback is also currently accompanied by a scrolling animation of the notes.

Voiceleading
------------
The app will eventually support a wide range of voiceleading error-checkers.

