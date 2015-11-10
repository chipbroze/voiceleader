require 'pg'
require 'active_record'

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
      table.column :name,        :string
      table.column :password,    :string
    end
  end

  unless ActiveRecord::Base.connection.tables.include? 'chorales'
    create_table :chorales do |table|
      table.column :user_id,     :integer
      table.column :json,        :text
      table.column :name,        :string
      table.column :tempo,       :integer
      table.column :key,         :string
      table.column :time_sig,    :string
    end
  end

  unless ActiveRecord::Base.connection.tables.include? 'melodies'
    create_table :melodies do |table|
      table.column :chorale_id,  :integer
      table.column :index,       :integer
      table.column :voice,       :string
      table.column :clef,        :string
    end
  end

  unless ActiveRecord::Base.connection.tables.include? 'notes'
    create_table :notes do |table|
      table.column :melody_id,   :integer
      table.column :index,       :integer
      table.column :name,        :string
      table.column :rhythm_type, :string
      table.column :rest,        :boolean
      table.column :exp,         :text
      table.column :chromatic,   :integer
    end
  end
end

module Sql

  class User < ActiveRecord::Base
    validates :name, :password, presence: true
    validates :name, length: {in: 4..20}
    validates :name, uniqueness: true
    has_many  :chorales
  end

  class Chorale < ActiveRecord::Base
    belongs_to :user
    has_many   :melodies
    has_many   :notes, through: :melodies
  end
  
  class Melody < ActiveRecord::Base
    belongs_to :chorale
    has_many   :notes
  end
  
  class Note < ActiveRecord::Base
    belongs_to :melody
  end

  # Add chorale to database
  def Sql.add_chorale(username, json, music)
    return false unless (user = Sql::User.find_by name: username)
    
    chorale = user.chorales.create(
      name:     music['name'],
      json:     json,
      tempo:    music['tempo'],
      key:      music['key'],
      time_sig: music['timeSig']
    )
    music['staves'].each_with_index do |staff, i|
      melody = chorale.melodies.create(
        index: i,
        voice: staff['voice'],
        clef:  staff['clef']
      )
      staff['notes'].each_with_index do |note, j|
        note = melody.notes.create(
          index:       j,
          name:        note['name'],
          rhythm_type: note['type'],
          rest:        note['rest'],
          exp:         note['exp'],
          chromatic:   note['chromatic']
        )
      end
    end
  end
  
  # Add new user to database
  def Sql.add_user(username, password)
    user = Sql::User.create(
      name:     username,
      password: password
    ).valid?
  end
end

Sql.add_user(
  'Guest',
  '$2a$10$z4EnxjfxpVBxhcdeUshbw.qfxodOa1mJJJ6e9B3nCHyaJ9QKSspvC')
