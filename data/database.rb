require 'sqlite3'
require 'active_record'

ActiveRecord::Base.logger = Logger.new(File.open('./data/database.log', 'w'))

ActiveRecord::Base.establish_connection(
  :adapter  => 'sqlite3',
  :database => './data/test.db'
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
      table.column :name,        :string
      table.column :key,         :string
    end
  end

  unless ActiveRecord::Base.connection.tables.include? 'melodies'
    create_table :melodies do |table|
      table.column :chorale_id,  :integer
      table.column :voice,       :string
      table.column :line,        :string
    end
  end

  unless ActiveRecord::Base.connection.tables.include? 'notes'
    create_table :notes do |table|
      table.column :melody_id,   :integer
      table.column :name,        :string
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
  def Sql.add_chorale(username, key, voice_strings)
    return false unless (user = Sql::User.find_by name: username)
    parts = ['bass', 'tenor', 'alto', 'soprano']
    chorale = user.chorales.create(name: "Name me", key: key)
    voice_strings.each_with_index do |voice_str, i|
      melody = chorale.melodies.create(voice: parts[i], line: voice_str)
      voice_str.split(',').each do |note|
        melody.notes.create(name: note)
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
