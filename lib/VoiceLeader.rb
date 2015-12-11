require './lib/VoiceLeader/chord.rb'
require './lib/VoiceLeader/voicelead.rb'
require './data/database.rb'
require 'bcrypt'

###########
# Results #
###########

def make_music(music_json)
  music_hash = JSON.parse(music_json)
  music = Music.new(music_hash)
end

def find_mistakes(music, options)
  if not options
    options = ['p_fifths', 'p_octaves', 'p_unisons', 'sevenths', 'intervals', 'spacing', 'range', 'crossing', 'doubling']
  end

  pair_options = {
    'p_fifths' => [:parallel, 'fifths'],
    'p_octaves' => [:parallel, 'octaves'],
    'p_unisons' => [:parallel, 'unisons'],
    'sevenths' => [:sevenths, 'none'],  # unsure how to call variable arguments in loop
    'intervals' => [:intervals, 'none']
  }
  music.chord_pairs.each do |chord_a, chord_b|
    options.select{ |o| pair_options.has_key? o }.each do |o|
      chord_a.mistakes += VoiceLead.send(pair_options[o][0], chord_a, 
                                         chord_b, pair_options[o][1])
    end
  end
  single_options = {
    'spacing' => :spacing,
    'range' => :range,
    'crossing' => :crossing,
    'doubling' => :doubling
  }
  music.chords.each do |chord|
    options.select{ |o| single_options.has_key? o }.each do |o|
      chord.mistakes += VoiceLead.send(single_options[o], chord)
    end
  end
end

############
# Security #
############

module Secure
  
  def Secure.encrypt(text)
    BCrypt::Password.create(text)
  end

  def Secure.login?(username, password)
    if (user = MyData::User.find_by name: username)
      hash = BCrypt::Password.new(user.password)
      return username if hash == password
    end
    return nil
  end

end
