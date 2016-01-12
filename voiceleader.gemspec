# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

Gem::Specification.new do |spec|
  spec.name          = "VoiceLeader"
  spec.version       = '1.0'
  spec.authors       = ["Chip Broze"]
  spec.email         = ["cbbroze@gmail.com"]
  spec.summary       = %q{A simple program to check 4-part voice leading errors}
  spec.description   = %q{Given four pitch inputs, the program performs a variety of 
                          evaluations, first grouping pitches into chords, determining 
                          their value and type, and the individual roles of each voice 
                          part within the chord.  Next, given user input, the program 
                          runs a check for various voice leading mistakes, ranging from 
                          incomplete triads to parallel fifths and treatment of sevenths}
  spec.homepage      = "http://www.chipbroze.com/"
  spec.license       = "MIT"
  
  spec.files         = ['lib/VoiceLeader.rb']
  spec.executables   = ['bin/VoiceLeader']
  spec.test_files    = ['tests/test_VoiceLeader.rb']
  spec.require_paths = ["lib"]
end
