require 'sinatra'
require './lib/VoiceLeader.rb'
require './lib/VoiceLeader/chord.rb'
require './lib/VoiceLeader/voicelead.rb'

# set :port, 4567
# set :environment, :production
set :static, true
set :public_folder, "static"
set :views, "views"

get '/' do
  erb :index
end

post '/results' do
  key = params[:key]
  voices = [params[:bass], params[:tenor], params[:alto], params[:soprano]]
  music = make_music(key, voices)
  options = params[:options]
  mistakes = find_mistakes(music, options)

  erb :results, :locals => {'music' => music, 'mistakes' => mistakes}
end
