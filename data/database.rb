require 'pg'
require 'active_record'
require 'json'

# ActiveRecord::Base.logger = Logger.new(File.open('./data/database.log', 'w'))

db = URI.parse(ENV['LDB_PATH'])

ActiveRecord::Base.establish_connection(
  :adapter  => db.scheme == 'postgres' ? 'postgresql' : db.scheme,
  :host     => db.host,
  :username => db.user,
  :password => db.password,
  :database => db.path[1..-1],
  :encoding => 'utf8'
)

ActiveRecord::Schema.define do
  unless ActiveRecord::Base.connection.tables.include? 'users'
    create_table :users do |table|
      table.column :name,     :string
      table.column :password, :string
    end
  end

  unless ActiveRecord::Base.connection.tables.include? 'scores'
    create_table :scores do |table|
      table.column :user_id,  :integer
      table.column :title,    :string
      table.column :details,  :text
      table.column :music,    :text
    end
  end

end

module MyData

  class User < ActiveRecord::Base
    validates :name, :password, presence: true
    validates :name, length: {in: 4..20}
    validates :name, uniqueness: true
    has_many  :scores
  end

  class Score < ActiveRecord::Base
    belongs_to :user
  end

  # Add score to database
  def MyData.add_score(username, params)
    return false unless (user = MyData::User.find_by name: username)  
    score = user.scores.create(
      title:   params[:title],
      details: params[:details],
      music:   params[:music]
    )
  end

  # Update existing score
  def MyData.update_score(username, params)
    score = MyData::Score.find(params[:id])
    return false unless (score.user.name == username)
    score.update(
      title:   params[:title],
      details: params[:details],
      music:   params[:music]
    )
  end

  # Add new user to database
  def MyData.add_user(username, password)
    user = MyData::User.create(
      name:     username,
      password: password
    ).valid?
  end
end

MyData.add_user(
  'Guest',
  '$2a$10$z4EnxjfxpVBxhcdeUshbw.qfxodOa1mJJJ6e9B3nCHyaJ9QKSspvC')
