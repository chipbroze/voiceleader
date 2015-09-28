require "./lib/VoiceLeader/voicelead.rb"
require "test/unit"

class TestVoiceLead < Test::Unit::TestCase

  def test_parallel
    g = Chord.new([7, 11, 14, 19])
    c = Chord.new([0, 4, 7, 12])
    assert_equal(VoiceLead.parallel(g, c, 'unisons'), nil)
    assert_equal(VoiceLead.parallel(g, c, 'octaves'), 
      "Parallel octaves between the bass and soprano.")
    assert_equal(VoiceLead.parallel(g, c, 'fifths'), 
      "Parallel fifths between the bass and alto.")
    
    g2 = Chord.new([7, 14, 23, 23])
    c2 = Chord.new([0, 16, 24, 24])
    assert_equal(VoiceLead.parallel(g2, c2, 'unisons'),
      "Parallel unisons between the alto and soprano.")
    assert_equal(VoiceLead.parallel(g2, c2, 'octaves'), nil)
    assert_equal(VoiceLead.parallel(g2, c2, 'fifths'), nil)
  end

  def test_sevenths
    g = Chord.new([7, 11, 14, 17])
    c = Chord.new([0, 4, 7, 12])
    assert_equal(VoiceLead.sevenths(g, c), 
      "Improperly resolved 7th in soprano.")

    g = Chord.new([7, 11, 14, 17])
    c = Chord.new([0, 12, 7, 16])
    assert_equal(VoiceLead.sevenths(g, c), nil)
    
    g = Chord.new([7, 11, 14, 19])
    c = Chord.new([0, 12, 7, 16])
    assert_equal(VoiceLead.sevenths(g, c), nil)
  end

end
