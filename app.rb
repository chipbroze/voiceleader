require 'sinatra'
require 'json'
require './lib/voiceLeader.rb'

# set :port, 4567
# set :environment, :production
set :static, true
set :public_folder, "static"
set :views, "views"
set :method_override, true
enable :sessions

# Index, Sign-in, Logout ====================================================

get '/?' do
  erb :index
end

post '/signup' do
  username = params[:username]
  password = Secure.encrypt(params[:password])
  if MyData.add_user(username, password)
    session[:username] = username
    redirect '/scores', 303
  else
    "<p>That username is taken</p>"
  end
end

get '/logout' do
  session[:username] = nil
  redirect '/'
end

post '/login' do
  session[:username] = Secure.login?(params[:username], params[:password])
  redirect('/scores', 303) if session[:username]
  "<p>Could not find specified username/password</p>"
end

# Score routes ==============================================================

get '/scores' do
  user = MyData::User.find_by name: session[:username]
  erb :scores, :locals => {scores: user.scores}
end

post '/scores' do
  MyData.add_score(session[:username], params)
  redirect '/scores', 303
end

get '/scores/new' do
  @json = ""
  @title = "New Score"
  @details = "No description yet"
  erb :new_score do
    erb :editor
  end
end

get '/scores/:id' do
  begin
    score = MyData::Score.find(params[:id])
    @id = params[:id]
    @json = score.music
    @title = score.title
    @details = score.details
  rescue
    "Score could not be found"
  else
    if score.user.name == session[:username]
      erb :update_score do
        erb :editor
      end
    else
      "Forbidden"
    end
  end
end

put '/scores/:id' do
  MyData.update_score(session[:username], params)
  redirect '/scores', 303
end

delete '/scores/:id' do
  score = MyData::Score.find(params[:id])
  score.destroy
  redirect '/scores', 303
end

# Other =====================================================================

get '/scores/:id/theory' do
  score = MyData::Score.find(params[:id])
  @music = make_music(score.music)
  @options = params[:options]
  @mistakes = find_mistakes(@music, @options)
  erb :results, :locals => {music: @music, mistakes: @mistakes}
end
