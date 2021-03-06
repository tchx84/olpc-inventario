#     Copyright Daniel Drake 2012
#
#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
# 
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
# 
#     You should have received a copy of the GNU General Public License
#     along with this program.  If not, see <http://www.gnu.org/licenses/>

class SoftwareVersion < ActiveRecord::Base
  belongs_to :model

  attr_accessible :name, :vhash, :model_id, :description

  validates :name, :presence => true
  validates :vhash, :uniqueness => true, :allow_nil => true, :format => { :with => /[a-z0-9]{64}/ }

  before_validation { |version|
    version.vhash = nil if !version.vhash.nil? and version.vhash.empty?
  }

  FIELDS = [ 
    {name: _("Id"), column: :id, width: 50},
    {name: _("Name"), column: :name},
    {name: _("Laptop model"), association: :model, column: :name},
    {name: _("Description"), column: :description, width: 200},
    {name: _("Hash"), column: :vhash},
  ]

  def to_s
    name
  end
end
