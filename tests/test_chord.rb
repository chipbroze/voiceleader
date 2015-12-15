require "./lib/voiceleader/chord.rb"
require "test/unit"

class TestChord < Test::Unit::TestCase

  def test_pitches
    cmajor_root = Chord.new([0, 12, 16, 19])
    gminor_root = Chord.new([31, 34, 38, 43])
    fdom7_inv = Chord.new([9, 17, 27, 36])
    daugment = Chord.new([26, 42, 10, 14])
    cluster = Chord.new([1001, 1003, 1005, 1007])
    
    assert_equal(cmajor_root.pitch_set, [0, 12, 16, 19])
    assert_equal(gminor_root.pitch_set, [31, 34, 38, 43])
    assert_equal(fdom7_inv.pitch_set, [9, 17, 27, 36])
    assert_equal(cluster.pitch_set, [1001, 1003, 1005, 1007])
  end

  def test_type
    cmajor_root = Chord.new([0, 12, 16, 19])
    gminor_root = Chord.new([31, 34, 38, 43])
    fdom7_inv = Chord.new([9, 17, 27, 36])
    daugment = Chord.new([26, 42, 10, 14])
    cluster = Chord.new([1001, 1003, 1005, 1007])
    
    assert_equal(cmajor_root.name, 'Major Triad')
    assert_equal(gminor_root.name, 'Minor Triad')
    assert_equal(fdom7_inv.name, 'Dominant 7th')
    assert_equal(daugment.name, 'Augmented Triad')
    assert_equal(cluster.name, 'Unknown Chord')
  end
  
  def test_parts
    cmajor_root = Chord.new([0, 12, 16, 19])
    gminor_root = Chord.new([31, 34, 38, 43])
    fdom7_inv = Chord.new([9, 17, 27, 36])
    daugment = Chord.new([26, 42, 10, 14])
    cluster = Chord.new([1001, 1003, 1005, 1007])
    
    assert_equal(cmajor_root.parts['bass'], 'root')
    assert_equal(cmajor_root.parts['alto'], 'third')
    assert_equal(gminor_root.parts['tenor'], 'third')
    assert_equal(gminor_root.parts['soprano'], 'root')
    assert_equal(fdom7_inv.parts['bass'], 'third')
    assert_equal(fdom7_inv.parts['tenor'], 'root')
    assert_equal(daugment.parts['bass'], 'n/a')
    assert_equal(daugment.parts['soprano'], 'n/a')
    assert_equal(cluster.parts['bass'], 'unknown')
    assert_equal(cluster.parts['alto'], 'unknown')
  end
end
