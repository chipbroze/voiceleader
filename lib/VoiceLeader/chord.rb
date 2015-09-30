class Music

  def initialize(key, voices)
    @soprano = voices[3]
    @alto = voices[2]
    @tenor = voices[1]
    @bass = voices[0]
    @key = key
    @chords = self.make_chords
  end

  attr_reader :chords, :key, :soprano, :alto, :tenor, :bass
  
  def make_chords
    notes = [@bass.notes, @tenor.notes, @alto.notes, @soprano.notes]
    chords = notes.transpose
    chords.map! { |c| Chord.new(c) }
  end

  def chord_pairs
    pairs = []
    self.chords.each_cons(2) { |c, d| pairs << [c, d] }
    return pairs
  end

end

class Chord
  
  def initialize(notes)
    @notes = {'bass' => notes[0],
              'tenor' => notes[1],
              'alto' => notes[2],
              'soprano' => notes[3]}
    @pitch_set = notes.map { |n| n.pitch }
    @pitches = {'bass' => @pitch_set[0], 
                'tenor' => @pitch_set[1], 
                'alto' => @pitch_set[2],
                'soprano' => @pitch_set[3]}
    @bass, @tenor, @alto, @soprano = notes
    @type = self.get_type
    @parts, @parts_reverse = self.get_parts
    @intervals = self.get_intervals
    @mistakes = []
  end
  
  attr_reader :pitch_set, :pitches, :type, :parts, :parts_reverse, :intervals, :mistakes, :notes, 
              :bass, :tenor, :alto, :soprano
  attr_writer :mistakes

  # Find inversion of chord
  def low_part
    low_note = @pitches.key(@pitches.values.min)
    low_part = @parts[low_note]
  end

  # Find doubled parts, if any
  def doubled
    parts = @parts_reverse.select{ |p, v| v.length > 1 }.keys
    return parts
  end

  # Returns 2D array of intervals between voice parts
  #   form: [low voice, high voice, interval]
  def get_intervals
    ints = []
    pitch_set = @pitch_set.dup
    until pitch_set.empty?
      p_low = pitch_set.shift
      pitch_set.each { |p_hi| ints << p_hi - p_low }
    end
    low_voice = ['bass', 'bass', 'bass', 'tenor', 'tenor', 'alto']
    hi_voice = ['tenor', 'alto', 'soprano', 'alto', 'soprano', 'soprano']
    labeled_ints = [low_voice, hi_voice, ints].transpose
  end
  
  # Reduce chord to pitch classes, sort, and find intervals between consecutives
  def interval_loop
    pitches = @pitch_set.map { |p| p % 12 }
    pitches.uniq!
    pitches.sort!
    pitches << pitches[0] + 12 # To allow comparison between first and last pitches
    interval_loop = []
    pitches.each_cons(2) { |p, q| interval_loop << q - p }
    interval_loop
  end
  
  def get_type
    case self.interval_loop
    when [5, 4, 3], [4, 3, 5], [3, 5, 4]
      return 'Major'
    when [8, 4], [4, 8] # No fifth
      return 'Major'
    when [3, 4, 5], [4, 5, 3], [5, 3, 4]
      return 'Minor'
    when [9, 3], [3, 9] # No fifth
      return 'Minor'
    when [4, 4, 4]
      return 'Augmented'
    when [3, 3, 6], [3, 6, 3], [6, 3, 3]
      return 'Diminished'
    when [1, 4, 3, 4], [4, 3, 4, 1], [3, 4, 1, 4], [4, 1, 4, 3]
      return 'Major 7th'
    when [2, 4, 3, 3], [4, 3, 3, 2], [3, 3, 2, 4], [3, 2, 4, 3]
      return 'Dominant 7th'
    when [2, 4, 6], [4, 6, 2], [6, 2, 4]
      return 'Dominant 7th' # No fifth
    when [2, 3, 4, 3], [3, 4, 3, 2], [4, 3, 2, 3], [3, 2, 3, 4]
      return 'Minor 7th'
    when [3, 3, 3, 3]
      return 'Diminished 7th'
    when [2, 3, 3, 4], [3, 3, 4, 2], [3, 4, 2, 3], [4, 2, 3, 3]
      return 'Half-Diminished 7th'
    when [4, 2, 4, 2], [2, 4, 2, 4]
      return 'French Augmented 6th'
    else
      return 'Unknown Chord'
    end
  end

  def get_parts
    chord_possibilities = {
      'Major' => [8, 4, 7, nil],
      'Minor' => [9, 3, 7, nil],
      'Augmented' => 'n/a',
      'Diminished' => [3, 6, 9, nil], # error: b, b, d, f returns third, third, root, root: 0,9,6 | 3,0,9 | 6,3,0
      'Major 7th' => [1, 9, 3, 11],
      'Dominant 7th' => [2, 4, 7, 10],
      'Minor 7th' => [2, 8, 4, 10],
      'Diminished 7th' => 'n/a',
      'Half-Diminished 7th' => [2, 5, 8, 10],
      'Unknown Chord' => 'unknown'
    }
    values = chord_possibilities[@type]
    parts = {}
    parts_reverse = {'root' => [], 'third' => [], 'fifth' => [],
                     'seventh' => [], 'n/a' => [], 'unknown' => [], 'error' => []}
    
    @pitches.each do |voice, pitch|
      poss_int = @pitch_set.map { |q| (pitch - q) % 12 }
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
        parts[voice] = values
        parts_reverse[values] << voice
      elsif poss_int.include?(values[0])
        parts[voice] = 'root'
        parts_reverse['root'] << voice
      elsif poss_int.include?(values[1])
        parts[voice] = 'third'
        parts_reverse['third'] << voice
      elsif poss_int.include?(values[2])
        parts[voice] = 'fifth'
        parts_reverse['fifth'] << voice
      elsif values[3] && poss_int.include?(values[3])
        parts[voice] = 'seventh'
        parts_reverse['seventh'] << voice
      else
        parts[voice] = 'error'
        parts_reverse['error'] << voice
      end 
    end

    return [parts, parts_reverse]
  end
  
  def get_name
    root_voice = @parts_reverse['root'][0] || 'bass'
    return "#{@notes[root_voice].name} #{@type}"
  end

end

class Voice

  def initialize(note_string)
    @note_string = note_string
    @notes = self.make_notes
  end
  
  attr_reader :note_string, :notes

  def make_notes
    notes = self.note_string.split(',')
    notes.map! { |n| Note.new(n) }
  end

end

class Note

  def initialize(full_name)
    @full_name = full_name
    @letter = full_name.slice(0).upcase
    @octave = full_name.match(/\d+/).to_a[0].to_i
    @accidental = full_name.match(/[b#]+/).to_a[0]
    @name = full_name.delete(@octave.to_s)
    @pitch = self.get_pitch
  end
  
  attr_reader :full_name, :name, :letter, :octave, :accidental, :pitch
  
  def get_pitch
    letters = {'C' => 0, 'D' => 2, 'E' => 4, 'F' => 5, 'G' => 7, 'A' => 9, 'B' => 11}
    accidentals = {nil => 0, '#' => 1, '##' => 2, 'b' => -1, 'bb' => -2}
    pitch = 12 * (self.octave - 1) + letters[self.letter] + accidentals[self.accidental]
  end

end
