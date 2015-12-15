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
  @@accidentals = {'' => 0, '#' => 1, 'x' => 2, 'b' => -1, 'bb' => -2}
  @@types = { 'quarter' => 1, 'half' => 2, 'whole' => 4 }
end


class Chord
  attr_accessor :mistakes
  attr_reader :pitch_set, :type, :intervals, :notes, :voices

  def initialize(notes)
    @notes = notes
    @voices = notes.reduce({}) do |hash, note|
      hash[note.voice] = note
      hash
    end
    @pitch_set = notes.map { |note| note.pitch }
    @intervals = self.get_intervals
    @type = self.get_type
    self.fill_parts
    @mistakes = []
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
    pitches = @pitch_set.map { |pitch| pitch % 12 }
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

  # Sort pitch classes and find intervals between consecutives.
  def interval_loop
    pitches = @pitch_set.map { |p| p % 12 }
    pitches.uniq!
    pitches.sort!
    pitches << pitches[0] + 12 # To compare first and last pitches
    interval_loop = []
    pitches.each_cons(2) { |p, q| interval_loop << q - p }
    return interval_loop
  end
  
  def get_type
    case self.interval_loop
    when [5, 4, 3], [4, 3, 5], [3, 5, 4]
      return :Major
    when [8, 4], [4, 8] # No fifth
      return :Major
    when [3, 4, 5], [4, 5, 3], [5, 3, 4]
      return :Minor
    when [9, 3], [3, 9] # No fifth
      return :Minor
    when [4, 4, 4]
      return :Augmented
    when [3, 3, 6], [3, 6, 3], [6, 3, 3]
      return :Diminished
    when [1, 4, 3, 4], [4, 3, 4, 1], [3, 4, 1, 4], [4, 1, 4, 3]
      return :'Major 7th'
    when [2, 4, 3, 3], [4, 3, 3, 2], [3, 3, 2, 4], [3, 2, 4, 3]
      return :'Dominant 7th'
    when [2, 4, 6], [4, 6, 2], [6, 2, 4]
      return :'Dominant 7th' # No fifth
    when [2, 3, 4, 3], [3, 4, 3, 2], [4, 3, 2, 3], [3, 2, 3, 4]
      return :'Minor 7th'
    when [3, 3, 3, 3]
      return :'Diminished 7th'
    when [2, 3, 3, 4], [3, 3, 4, 2], [3, 4, 2, 3], [4, 2, 3, 3]
      return :'Half-Diminished 7th'
    when [4, 2, 4, 2], [2, 4, 2, 4]
      return :'French Augmented 6th'
    when [5, 7], [7, 5]
      return :'Perfect Fifth'
    else
      if @notes.length < 2
        return :'Unknown Chord'
      else
        return self.inspect_unknown
      end
    end
  end

  def inspect_unknown #TODO: Figure out recursive end-point. THIS IS SLOPPY
    subchords = @notes.combination(@notes.length - 1).map do |set|
      Chord.new(set)
    end
    guess = subchords.find { |chord| chord.type != :'Unknown Chord' }
    if guess != nil
      non_chord_tones = @notes.reject { |note| guess.notes.include? note }
      non_chord_tones.each { |note| note.part = :error }
      return guess.type
    else
      return :'Unknown Chord'
    end
  end

  @@chord_possibilities = {
    :'Major' => [8, 4, 7, nil],
    :'Minor' => [9, 3, 7, nil],
    :'Augmented' => 'n/a',
    :'Diminished' => [3, 6, 9, nil],
    :'Major 7th' => [1, 9, 3, 11],
    :'Dominant 7th' => [2, 4, 7, 10],
    :'Minor 7th' => [2, 8, 4, 10],
    :'Diminished 7th' => 'n/a',
    :'Half-Diminished 7th' => [2, 5, 8, 10],
    :'Perfect Fifth' => [5, nil, 7, nil],
    :'Unknown Chord' => 'unknown'
  }

  def fill_parts
  values = @@chord_possibilities[@type]
    @notes.each do |note|
      next if note.part == :error
      poss_int = @pitch_set.map { |p| (note.pitch - p) % 12 }
      if @type == 'Diminished'
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
  
  def fill_non_chord_parts
    non_chords = @notes.select { |note| note.part == :error }
    root = @notes.find { |note| note.part == :root }
    non_chords.each do |note|
      dist_from_root = (note.pitch - root.pitch) % 12
      note.part = case dist_from_root
      when 0
        :root
      when 1, 2
        :second
      when 3, 4
        :third
      when 5
        :fourth
      when 6
        :tritone
      when 7
        :fifth
      when 8, 9
        :sixth
      when 10, 11
        :seventh
      else
        :unknown
      end
    end
  end

  # Get note name of chord root, or if unknown, the lowest voice
  def get_name
    root = @notes.find { |note| note.part == :root } || @notes[0]
    return "#{root.name} #{@type}"
  end

end
