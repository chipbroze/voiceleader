class Mistake
  attr_reader :type, :value

  def initialize(type, value)
    @type = type
    @value = value
  end
end


module VoiceLead

  # =========================
  # Errors between two chords
  # =========================

  # Check for parallel intervals of a given type.
  def self.parallel(chord_a, chord_b, type)
    poss_parallels = {fifths: 7, octaves: 0, unisons: 'U'}
    error_int = poss_parallels[type]

    # Select chord_a intervals that match 'interval'.
    poss_errors = chord_a.intervals.select do |interval|
      if error_int == 'U'
        interval[:value] == 0
      else
        interval[:value] != 0 &&
        interval[:value] % 12 == error_int
      end
    end
     
    # Find matching interval in chord_b, then compare values.
    parallels = poss_errors.select do |int_a|
      int_b = chord_b.intervals.find do |int_b|
        int_b[:low].voice == int_a[:low].voice &&
        int_b[:high].voice == int_a[:high].voice
      end
      int_b[:value] == int_a[:value] &&
      int_b[:low].pitch != int_a[:low].pitch
    end
      
    # Return mistake(s) array.
    return parallels.map do |p_int| 
      Mistake.new(
        "Parallel #{type}", 
        "Between the #{p_int[:low].voice} and #{p_int[:high].voice}"
      )
    end
  end

  # Check for proper downward resolution of 7ths.
  def self.sevenths(chord_a, chord_b, _)
    sevenths = chord_a.notes.select { |note| note.part == :seventh }
    
    bad_sevenths = sevenths.reject do |note_a|
      note_b = chord_b.voices[note_a.voice]
      leap = note_a.pitch - note_b.pitch
      (1..2).include?(leap) &&
      %i(root third fifth).include?(note_b.part)
    end

    return bad_sevenths.map do |seventh|
      Mistake.new(
        'Improperly resolved 7th',
        "In the #{seventh.voice}"
      )
    end
  end
  
  # Check for illegal intervals
  def self.intervals(chord_a, chord_b, none)
    bad_leaps = chord_a.notes.select do |note|
      leap = (note.pitch - chord_b.voices[note.voice].pitch).abs
      leap > 12 || leap == 6
    end

    return bad_leaps.map do |leap_note|
      Mistake.new(
        'Illegal interval',
        "In the #{leap_note.voice}"
      )
    end
  end

  # ==========================
  # Errors involving one chord
  # ==========================

  # Check for proper spacing between voices (excluding lowest voice).
  def self.spacing(chord)
    bad_spacings = chord.notes[1..-1].each_cons(2).select do |low, high|
      interval = (high.pitch - low.pitch).abs
      interval > 12
    end

    return bad_spacings.map do |lo_note, hi_note|
      Mistake.new(
        'Too much spacing',
        "Between #{hi_note.voice} and #{lo_note.voice}"
      )
    end
  end

  # Check for voice-crossing.
  def self.crossing(chord)
    crossings = chord.intervals.select { |i| i[:value] < 0 }
    
    return crossings.map do |interval|
      Mistake.new(
        'Voice crossing',
        "Between #{interval[:low].voice} and #{interval[:high].voice}"
      )
    end
  end
  
  # Check that notes are within appropriate range.
  def self.range(chord)
    range = {
      soprano: (36..60),
      alto: (31..51),
      tenor: (24..44),
      baritone: (20..40),
      bass: (16..36)
    }
    err_notes = chord.notes.reject { |n| range[n.voice].include? n.pitch }
    
    return err_notes.map do |note|
      Mistake.new(
        'Exceeds range',
        "#{note.voice}"
      )
    end
  end 
  
  # Check for appropriate doubling.
  # TODO: Check for doubled leading tone.
  def self.doubling(chord)
    return [] if chord.doublings.empty?

    error_msgs = []

    if chord.notes.length - chord.doublings.length < 3
      error_msgs << 'Chord incomplete; too many doublings'
    end

    rules = {
      root: [:root, 'Root'],
      third: [chord.hi_part, 'Highest note'],
      fifth: [:fifth, 'Fifth'],
      seventh: [:root, 'Root'],
      unknown: [:unknown, 'Unknown'],
      error: [:error, 'Error']
    }
    unless chord.doublings.include? rules[chord.low_part][0]
      error_msgs << "#{rules[chord.low_part][1]} should be doubled"
    end 
    
    return error_msgs.map do |msg|
      Mistake.new( 'Doubling', msg )
    end
  end
end
