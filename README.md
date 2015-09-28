Voiceleader
===========
VoiceLeader is a work in progress.

Eventually, this little app should allow music theory teachers and students to input short SATB voiceleading exercises for evaluation.

Get it Working
--------------
Enter the following command within the voiceleader directory: ruby bin/app.rb

Note that you must have the Sinatra gem installed.  

Go to http://localhost:8080/ to see the homepage.

Input
-----
The app currently supports a very rudimentary input system created with html/javascript.  The homepage contains a set of 4 staves (soprano, alto, tenor, bass).  Clicking on any staff adds a note to that staff.  The arrow keys can move notes up and down, and can move between notes with left and right.  The delete key also works.  The user can input up to 10 notes per voice part, but sharps and flats are not yet supported.  Clicking the button "Fill Pitches" will fill the associated input fields with the pitch classes of the notes entered above.  Users can also type pitch classes directly into the input fields for greater flexibility.

Voiceleading
------------
The app will eventually support a wide range of voiceleading error-checkers, but is currently only able to check for chord types, individual notes' placement within each chord (root, third, fifth, seventh), parallel 8ths, parallel 5ths, parallel unisons, and improperly resolved 7ths.

