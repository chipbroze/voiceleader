# ===========
# Music Class
#============

class Music
  attr_reader :chords, :key

  # Transfer data from JSON-parsed object.
  def initialize(music_obj)
    @voices = music_obj['staves'].map { |staff| Voice.new(staff) }
    @key = music_obj['key']
    @time_sig = music_obj['timeSig']
    @chords = self.make_chords
  end

  # Align rhythms and create chords.
  def make_chords
    chords = self.homophonic.reverse.transpose
    return chords.map { |chord| Chord.new(chord) }
  end

  # Force note arrays to equal lengths.
  def homophonic
    smallest = 1
    return @voices.map { |voice| voice.split_into(smallest) }
  end

  # Group chords for error-checking
  def chord_pairs
    pairs = []
    @chords.each_cons(2) { |c, d| pairs << [c, d] }
    return pairs
  end
end

# ===========
# Voice Class
# ===========

class Voice
  attr_reader :notes

  # Map notes to Note objects 
  def initialize(staff)
    @name = staff['voice'].to_sym
    @notes = staff['notes'].map { |note| Note.new(note, @name) }
  end

  # Return array of new notes, all with same beat_length
  def split_into(beat_length)
    @notes.reduce([]) do |arr, note|
      count = note.beats / beat_length
      arr + (1..count).map { |_| Note.new(note.obj, note.voice) }
    end
  end
end

# ==========
# Note Class
# ==========

class Note
  attr_accessor :part
  attr_reader :name, :letter, :octave, :accidental,
              :pitch, :beats, :voice, :obj

  # Inherit and manipulate data from JSON-parsed object.
  def initialize(note, voice)
    @obj = note
    @letter, @octave, @accidental = self.parse_name(note['name'])
    @name = @letter + @accidental
    @pitch = self.get_pitch
    @rest = note['rest']
    @beats = @@types[note['type']]
    @voice = voice
    @part = nil
  end
  
  # Parse note name into letter/octave/accidental.
  def parse_name(full_name)
    letter = full_name[0].upcase
    octave = full_name[/\d+/].to_i
    accidental = full_name[/[b#x]+/] || ""
    return letter, octave, accidental
  end

  # Convert note name components into pitch class integer.
  def get_pitch
    12 * (@octave - 1) + @@letters[@letter] + @@accidentals[@accidental]
  end

  # Set class variables.
  @@letters = {
    'C' => 0, 'D' => 2, 'E' => 4,
    'F' => 5, 'G' => 7, 'A' => 9, 'B' => 11
  }
  @@accidentals = { '' => 0, '#' => 1, 'x' => 2, 'b' => -1, 'bb' => -2 }
  @@types = { 'quarter' => 1, 'half' => 2, 'whole' => 4 }
end

# ===========
# Chord Class
# ===========

class Chord
  attr_accessor :mistakes
  attr_reader :pitches, :type, :chord_tones, :intervals, :notes, :voices

  def initialize(notes)
    @notes = notes
    @voices = notes.reduce({}) do |hash, note|
      hash[note.voice] = note
      hash
    end
    @pitches = notes.map { |note| note.pitch }
    @pitch_set = notes.map { |note| note.pitch % 12 }.uniq
    @intervals = self.get_intervals
    @chord_tones, @type = self.get_type
    @mistakes = []
    self.fill_parts
  end

  # Create loops hash for finding chord type
  @@loops = Hash.new(:'unknown chord')
  @@types = {
    :'major' => [543, 435, 354, 8, 4],
    :'minor' => [345, 453, 534, 9, 3],
    :'diminished' => [336, 363, 633],
    :'augmented' => [444],
    :'major 7th' => [1434, 4341, 3414, 4143],
    :'dominant 7th' => [2433, 4332, 3324, 3243, 246, 462, 624],
    :'minor 7th' => [2343, 3432, 4323, 3234, 372, 723, 237],
    :'diminished 7th' => [3333],
    :'half-diminished 7th' => [2334, 3342, 3423, 4233],
    :'french augmented 6th' => [4242, 2424],
    :'perfect fifth' => [7],
    :'perfect octave' => [0]
  }
  @@types.each do |type, loop_keys|
    loop_keys.each { |key| @@loops[key] = type }
  end

  # Find intervals between consecutive pitches
  def get_poss_type(note_set)
    pitches = note_set.map { |note| note.pitch }
    pitch_set = pitches.map { |pitch| pitch % 12 }.uniq

    interval_loop = case pitch_set.length
    when 2
      sorted = pitches.sort.uniq { |p| p % 12 }
      (sorted[1] - sorted[0]) % 12
    when 1
      0
    else
      ordered = pitch_set.sort
      ordered << ordered[0] + 12 # To compare first and last pitches
      ordered.each_cons(2).map{ |p, q| q - p }.join.to_i
    end
    return @@loops[interval_loop]
  end

# Find inversion of chord
  def low_part
    low_note = @notes.min_by { |note| note.pitch } 
    return low_note.part
  end

  def hi_part
    high_note = @notes.max_by { |note| note.pitch }
    return high_note.part
  end

  # Find superfluous parts
  def doublings
    pitches = @pitches.map { |p| p % 12 }
    uniq_notes = @notes.uniq { |note| note.pitch % 12 }
    return uniq_notes.reduce([]) do |arr, note|
      arr + [note.part] * (pitches.count(note.pitch % 12) - 1)
    end
  end

  # Get array of hashes containing interval data
  def get_intervals
    @notes.combination(2).map do |low, high|
      interval = {
        low: low,
        high: high,
        value: high.pitch - low.pitch
      }
    end
  end

  def get_type
    poss_types = []
    size = @notes.length
    while (poss_types.length == 0)
      pairs = @notes.combination(size).map do |set|
        { notes: set, type: self.get_poss_type(set) }
      end
      poss_types += pairs.reject { |p| p[:type] == :'unknown chord' }
      size -= 1
    end
    pair = poss_types.first # TODO: Algorithm to pick most likely type
    return [pair[:notes], pair[:type]]
  end

  @@chord_possibilities = {
    :'major' => [8, 4, 7, nil],
    :'minor' => [9, 3, 7, nil],
    :'augmented' => 'n/a',
    :'diminished' => [3, 6, 9, nil],
    :'major 7th' => [1, 9, 3, 11],
    :'dominant 7th' => [2, 4, 7, 10],
    :'minor 7th' => [2, 8, 4, 10],
    :'diminished 7th' => 'n/a',
    :'half-diminished 7th' => [2, 5, 8, 10],
    :'perfect fifth' => [5, nil, 7, nil],
    :'perfect octave' => [0, nil, nil, nil],
    :'unknown chord' => 'unknown'
  }

  def fill_parts
  values = @@chord_possibilities[@type]
    @chord_tones.each do |note|
      poss_int = @chord_tones.map { |n| (note.pitch - n.pitch) % 12 }
      if @type == :Diminished
        if !poss_int.include?(3)
          poss_int = [3]
        elsif !poss_int.include?(6)
          poss_int = [6]
        else
          poss_int = [9]
        end
      end 
      if values == 'n/a' || values == 'unknown'
        note.part = :unknown
      elsif poss_int.include?(values[0])
        note.part = :root
      elsif poss_int.include?(values[1])
        note.part = :third
      elsif poss_int.include?(values[2])
        note.part = :fifth
      elsif values[3] && poss_int.include?(values[3])
        note.part = :seventh
      else
        note.part = :error
      end 
    end
    self.fill_non_chord_parts
  end

  @@non_chord_types = [:root, :b9, :'9', :b3, :'3', :'4', :tt, :'5', :b6, :'6', :b7, :'7', :unknown]

  def fill_non_chord_parts
    non_chords = @notes - @chord_tones
    root = @notes.find { |note| note.part == :root }
    non_chords.each do |note|
      dist_from_root = (note.pitch - root.pitch) % 12
      note.part = @@non_chord_types[dist_from_root]
    end
  end

  # Get note name of chord root, or if unknown, the lowest voice
  def get_name
    root = @notes.find { |note| note.part == :root } || @notes[0]
    return "#{root.name} #{@type}"
  end

end
