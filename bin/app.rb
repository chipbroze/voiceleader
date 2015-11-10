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

get '/signup' do
  erb :signup
end

get '/testing' do
  'hello world'
end


post '/signup' do
  username = params[:username]
  password = Secure.encrypt(params[:password])
  if Sql.add_user(username, password)
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
  redirect('/', 303) if session[:username]
  "<p>Could not find specified username/password</p>"
end

get '/scores' do
  @user = Sql::User.find_by name: session[:username]
  erb :scores
end

post '/scores' do
#  @key = params[:key]
#  @voices = [params[:bass], params[:tenor], params[:alto], params[:soprano]]
#  @music = make_music(@key, @voices)
#  @options = params[:options]
#  @mistakes = find_mistakes(@music, @options)
  @music = JSON.parse(params[:JSON])
  Sql.add_chorale(session[:username] || "Guest", params[:JSON], @music)
  erb :test, :locals => {json: params[:JSON]}
#  erb :results, :locals => {music: @music, mistakes: @mistakes}
end

get '/scores/new' do
  @score = nil
  erb :score
end

get '/scores/:id' do
  @chorale = Sql::Chorale.find(params[:id])
  erb :score
end

put '/scores/:id' do
#  @chorale0 = params[:chorale0]
#  @user = Sql::User.find_by name: session[:username]
#  @user.chorales[0].update_attribute(:name, @chorale0)
  redirect '/chorales', 303
end

delete '/scores/:id' do

end
