# ===========
# Music Class
# ===========

class Music
  attr_reader :chords, :key

  # Transfer data from JSON-parsed object.
  def initialize(music_obj)
    @voices = music_obj['staves'].map { |staff| Voice.new(staff) }
    @key = music_obj['key']
    @time_sig = music_obj['timeSig']
    @chords = self.make_chords
  end

  # Group chords for error-checking
  def chord_pairs
    pairs = []
    @chords.each_cons(2) { |c, d| pairs << [c, d] }
    return pairs
  end

  protected

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

  protected

  # Parse note name into letter/octave/accidental.
  def parse_name(full_name)
    letter = full_name[0].upcase
    octave = full_name[/\d+/].to_i
    accidental = full_name[/[b#x]+/] || ""
    return letter, octave, accidental
  end

  # Class hashes for #get_pitch method
  @@letters = { 'C' => 0, 'D' => 2, 'E' => 4,
                'F' => 5, 'G' => 7, 'A' => 9, 'B' => 11 }
  @@accidentals = { '' => 0, '#' => 1, 'x' => 2, 'b' => -1, 'bb' => -2 }

  # Convert note name components into pitch class integer.
  def get_pitch
    12 * (@octave - 1) + @@letters[@letter] + @@accidentals[@accidental]
  end
  
  # Hash mapping note type to beat length.
  @@types = { 'quarter' => 1, 'half' => 2, 'whole' => 4 }
end

# ===========
# Chord Class
# ===========

class Chord
  attr_accessor :mistakes
  attr_reader :notes, :pitches, :voices, :intervals, :core_notes, :type

  def initialize(notes)
    @notes = notes
    @pitches = notes.map { |note| note.pitch }
    @pitch_set = notes.map { |note| note.pitch % 12 }.uniq
    @voices = self.get_voices_hash
    @intervals = self.get_intervals
    @core_notes, @type = self.get_core_notes_and_type
    @mistakes = []
    self.set_notes_parts
  end

  # Build chord name from root note and chord type.
  def name
    return "#{self.root.name} #{@type}"
  end

  # Return root of chord
  def root
    return @notes.find { |note| note.part == :root } || self.low_note
  end

  # Find highest and lowest notes
  def low_note
    return @notes.min_by { |note| note.pitch } 
  end

  def high_note
    return @notes.max_by { |note| note.pitch }
  end

  # Get inversion type
  def inversion
    inversions = {
      root:    :root_position,
      third:   :first_inversion,
      fifth:   :second_inversion,
      seventh: :third_inversion
    }
    inversions.default = :unknown_inversion
    return inversions[self.low_note.part]
  end

  # Find superfluous parts.
  def doublings
    pitches = @pitches.map { |p| p % 12 }
    uniq_notes = @notes.uniq { |note| note.pitch % 12 }
    return uniq_notes.reduce([]) do |arr, note|
      arr + [note.part] * (pitches.count(note.pitch % 12) - 1)
    end
  end

  protected

  # Map notes to their respective voices.
  def get_voices_hash
    @notes.reduce({}) do |hash, note|
      hash[note.voice] = note
      hash
    end
  end

  # Get array of hashes containing interval data
  def get_intervals
    @notes.combination(2).map do |low_voice, high_voice|
      {
        low:   low_voice,
        high:  high_voice,
        value: high_voice.pitch - low_voice.pitch
      }
    end
  end
 
  # Determine chord type by gradually testing smaller subchords
  def get_core_notes_and_type
    possibles = []
    size = @notes.length
    while (possibles.length == 0)
      pairs = @notes.combination(size).map do |set|
        [set, self.get_poss_type(set)]
      end
      possibles += pairs.reject { |_, type| type == :'unknown chord' }
      size -= 1
    end
    return possibles.first # TODO: Algorithm to pick most likely type
  end

  # Create loops hash for use with #get_poss_type method
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
 
  # TODO: Complete alternate type ID algorithm
  def get_poss_type_alt(note_set)
  


  end

  # Chord data for #set_notes_parts method
  @@chord_possibilities = {
    :'major' =>               [8, 4, 7, nil],
    :'minor' =>               [9, 3, 7, nil],
    :'diminished' =>          [3, 6, 9, nil],
    :'augmented' =>           :unknown,
    :'major 7th' =>           [1, 9, 3, 11],
    :'dominant 7th' =>        [2, 4, 7, 10],
    :'minor 7th' =>           [2, 8, 4, 10],
    :'diminished 7th' =>      :unknown,
    :'half-diminished 7th' => [2, 5, 8, 10],
    :'perfect fifth' =>       [5, nil, 7, nil],
    :'perfect octave' =>      [0, nil, nil, nil],
    :'unknown chord' =>       :unknown
  }

  # Set notes' 'part' attribute based on chord-type
  def set_notes_parts
    values = @@chord_possibilities[@type]
    @core_notes.each do |note|
      poss_int = @core_notes.map { |n| (note.pitch - n.pitch) % 12 }
      if @type == :diminished
        if !poss_int.include?(3)
          poss_int = [3]
        elsif !poss_int.include?(6)
          poss_int = [6]
        else
          poss_int = [9]
        end
      end 
      if values == :unknown
        note.part = :unknown
      elsif poss_int.include?(values[0])
        note.part = :root
      elsif poss_int.include?(values[1])
        note.part = :third
      elsif poss_int.include?(values[2])
        note.part = :fifth
      elsif poss_int.include?(values[3])
        note.part = :seventh
      else
        note.part = :error
      end 
    end
    self.fill_non_chord_parts
  end

  @@non_chord_types = [:root, :b9, :'9', :b3, :'3', :'4', :tt,
                       :'5', :b6, :'6', :b7, :'7', :unknown]

  def fill_non_chord_parts
    non_chords = @notes - @core_notes
    non_chords.each do |note|
      dist_from_root = (note.pitch - self.root.pitch) % 12
      note.part = @@non_chord_types[dist_from_root]
    end
  end
end
