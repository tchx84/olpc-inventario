# Copyright One Laptop per Child 2013
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>

class ConnectionEvent < ActiveRecord::Base
  belongs_to :laptop, inverse_of: :connection_events
  attr_accessible :ip_address, :vhash, :free_space, :stolen, :connected_at

  validates :laptop, :presence => true
  validates :vhash, :allow_nil => true, :format => { :with => /[a-z0-9]{64}/ }
  before_save { self.connected_at = Time.zone.now if self.connected_at.nil? }

  FIELDS = [
    {name: _("Id"), column: :id, width: 50},
    {name: _("Laptop"), association: :laptop, column: :serial_number},
    {name: _("Connected at"), column: :connected_at, width: 150, default_sort: :desc},
    {name: _("IP address"), column: :ip_address},
    {name: _("Software version"), column: :vhash, attribute: :software_version},
    {name: _("Software version hash"), column: :vhash},
    {name: _("Free disk space"), column: :free_space},
  ]

  def connected_at=(value)
    # special case: if the connected time is provided as a string without
    # UTC offset (as we would expect from normal usage), it is actually a
    # UTC time. Make sure it gets interpreted that way.
    if value.is_a?(String) and value !~ /[+-][0-9]{4}$/
      value = ActiveSupport::TimeZone.new('UTC').parse(value)
    end
    write_attribute(:connected_at, value)
  end

  def software_version
    SoftwareVersion.find_by_vhash(vhash)
  end
end
