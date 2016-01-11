require 'sinatra'
require 'json'
require './lib/voiceleader.rb'

# set :port, 4568
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
  return "<p>Password fail</p>" if params[:password] != params[:confirm]
  password = Secure.encrypt(params[:password])
  if MyData.add_user(username, password)
    session[:username] = username
    redirect '/', 303
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
  redirect('/', 303)
end

# Score routes ==============================================================

get '/scores' do
  user = MyData::User.find_by name: session[:username]
  hash = user.scores.map do |score|
    {title: score.title, id: score.id}
  end
  hash.to_json
end

post '/scores' do
  if session[:username]
    MyData.add_score(session[:username], params)
    'Successfully saved'
  else
    'Error: You are not signed in!'
  end
end

get '/scores/new' do
  content_type :json
  { title: 'New Score' }.to_json
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
      content_type :json
      score.to_json
    else
      "Forbidden"
    end
  end
end

put '/scores/:id' do
  MyData.update_score(session[:username], params)
  'Successfully updated'
end

delete '/scores/:id' do
  if params[:id] == 'new'
    return 'Score Not Found'
  end
  score = MyData::Score.find(params[:id])
  if score
    score.destroy
    'Score Deleted'
  else
    'Score Not Found'
  end
end

# Other =====================================================================

get '/scores/:id/theory' do
  score = MyData::Score.find(params[:id])
  @music = make_music(score.music)
  @options = params[:options]
  @mistakes = find_mistakes(@music, @options)
  erb :results, :locals => {music: @music, mistakes: @mistakes}
end
