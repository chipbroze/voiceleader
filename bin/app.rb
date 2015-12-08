require 'sinatra'
require 'json'
require './lib/VoiceLeader.rb'

# set :port, 4567
# set :environment, :production
set :static, true
set :public_folder, "static"
set :views, "views"
enable :sessions

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

# Score routes

get '/scores' do
  user = MyData::User.find_by name: session[:username]
  erb :scores, :locals => {scores: user.scores}
end

post '/scores' do
  MyData.add_score(session[:username] || "Guest", params)
  redirect('/scores', 303)
end

get '/scores/new' do
  score = MyData::Score.find(39)
  erb :new_score, :locals => {score: score} do
    erb :editor, :locals => {score: score}
  end
end

get '/scores/xml' do
  "Success"
end

get '/scores/:id' do
  begin
    score = MyData::Score.find(params[:id])
  rescue
    "That score no longer exists"
  else
    if score.user.name == session[:username]
      erb :update_score, :locals => {score: score} do
        erb :editor, :locals => {score: score}
      end
    else
      "That score doesn't belong to you"
    end
  end
end

put '/scores/:id' do
  MyData.update_score(session[:username] || "Guest", params)
  params['id']
end

delete '/scores/:id' do
  score = MyData::Score.find(params[:id])
  score.destroy
  redirect '/', 303
end

get '/theory' do
#  @key = params[:key]
#  @voices = [params[:bass], params[:tenor], params[:alto], params[:soprano]]
#  @music = make_music(@key, @voices)
#  @options = params[:options]
#  @mistakes = find_mistakes(@music, @options)
#  erb :results, :locals => {music: @music, mistakes: @mistakes}
end
