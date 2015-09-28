class Mistake

  def initialize(type, value)
    @type = type
    @value = value
  end

  attr_reader :type, :value
end

module VoiceLead
  
  def VoiceLead.parallel(chord_a, chord_b, type)
    parallel_possibilities = {'fifths' => 7, 'octaves' => 0, 'unisons' => 'U'}
    interval = parallel_possibilities[type]
    parallels = []
    
    # Creates array of index values containing desired interval (for chord_a.intervals)
    if interval == 'U'
      indexes = chord_a.intervals.each_index.select do |i|
        chord_a.intervals[i][2] == 0
      end
    else
      indexes = chord_a.intervals.each_index.select do |i|
        chord_a.intervals[i][2] != 0 &&
        chord_a.intervals[i][2] % 12 == interval
      end
    end
     
    # Find parallel motion
    parallels = indexes.select do |i|
      chord_a.intervals[i][2] == chord_b.intervals[i][2] && 
      chord_a.pitches[chord_a.intervals[i][0]] != chord_b.pitches[chord_b.intervals[i][0]]
    end
      
    # Return mistake string
    mistakes = []
    parallels.each do |p| 
      mistakes << Mistake.new("Parallel #{type.capitalize}", 
        "Between the #{chord_b.intervals[p][0]} and #{chord_b.intervals[p][1]}")
    end
    
    return mistakes
  end

  # Check for proper downward resolution of 7ths
  def VoiceLead.sevenths(chord_a, chord_b, none)
    return [] if chord_a.parts_reverse['seventh'].empty?
        
    mistakes = []
    chord_a.parts_reverse['seventh'].each do |v|
      leap = chord_a.pitches[v] - chord_b.pitches[v]
      unless (1..2).include?(leap) && ['root', 'third', 'fifth'].include?(chord_b.parts[v])
        mistakes << Mistake.new('Improperly resolved 7th', "In the #{v}")
      end
    end
    return mistakes
  end
  
  # Check for proper contour in line
  def VoiceLead.contour(chord_a, chord_b, none)
  

  end

  # No illegal intervals
  def VoiceLead.intervals(chord_a, chord_b, none)
    mistakes = []
    chord_a.pitches.each do |v, p|
      leap = (chord_a.pitches[v] - chord_b.pitches[v]).abs
      if leap > 12 || leap == 6
        mistakes << Mistake.new('Illegal interval', "In the #{v}")
      end
    end
    return mistakes
  end

  # Errors involving one chord at a time

  # Check for proper spacing between voices
  def VoiceLead.spacing(chord)
    mistakes = []
    ['soprano', 'alto', 'tenor'].each_cons(2) do |v1, v2|
      if chord.pitches[v1] - chord.pitches[v2] > 12
        mistakes << Mistake.new('Too much spacing', "Between #{v1} and #{v2}")
      end
    end
    return mistakes
  end

  # Check that notes are within appropriate range
  def VoiceLead.range(chord)
    range = {
      'soprano' => (36..55),
      'alto' => (31..48),
      'tenor' => (24..43),
      'bass' => (16..36)
    }
    mistakes = []
    chord.pitches.each do |voice, pitch|
      unless range[voice].include? pitch
        mistakes << Mistake.new('Exceeds range', "#{voice}")
      end
    end 
    return mistakes
  end 
    
end
