#     Copyright Paraguay Educa 2009
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
# 
#   

# # #
# Author: Martin Abente
# E-mail Address:  (tincho_02@hotmail.com | mabente@paraguayeduca.org) 
# 2009
# # #
                                                                       
class Notification < ActiveRecord::Base
  has_many :notification_subscribers

  attr_accessible :name, :description, :internal_tag, :active

  validates_uniqueness_of :internal_tag
  validates_uniqueness_of :name

  FIELDS = [
    {name: _("Id"), column: :id, width: 50, visible: false},
    {name: _("Name"), column: :name},
    {name: _("Description"), column: :description, width: 255},
    {name: _("Active"), column: :active, width: 5},
  ]

  ##
  # Para que se puede usar los select
  def self.getChooseButtonColumns(vista = "")
    ret = Hash.new

    case vista
    when ""
      ret["desc_col"] = 1
      ret["id_col"] = 0
    end

    ret
  end

  ##
  # Activo o no activo
  def getActiveStatus()
    self.active ? true : false
  end

end
