#     Copyright Paraguay Educa 2009
#     Copyright Daniel Drake 2010
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

require 'fecha'

class Assignment < ActiveRecord::Base
  acts_as_audited

  belongs_to :source_person, :class_name => "Person", :foreign_key => :source_person_id 
  belongs_to :destination_person, :class_name => "Person", :foreign_key => :destination_person_id
  belongs_to :laptop, :class_name => "Laptop", :foreign_key => :laptop_id

  validates_presence_of :laptop_id, :message => N_("Please specify a laptop.")

  before_save { self.date_assigned = self.time_assigned = Time.now }

  def self.getColumnas()
    ret = Hash.new
    ret[:columnas] = [ 
     {:name => _("Assignment Nbr"),:key => "assignments.id",:related_attribute => "id", :width => 50},
     {:name => _("Assignment Date"),:key => "assignments.date_assigned",:related_attribute => "date_assigned", :width => 90},
     {:name => _("Assignment Time"),:key => "assignments.time_assigned",:related_attribute => "getAssignmentTime()", :width => 90},
     {:name => _("Laptop serial"),:key => "laptops.serial_number",:related_attribute => "laptop.serial_number", :width => 180},
     {:name => _("Given by"),:key => "people.name",:related_attribute => "source_person", :width => 180},
     {:name => _("Given by (Doc ID)"),:key => "people.id_document",:related_attribute => "getSourcePersonIdDoc()", :width => 180},
     {:name => _("Received by"),:key => "destination_people_assignments.name",:related_attribute => "destination_person", :width => 180},
     {:name => _("Received (Doc ID)"),:key => "destination_people_assignments.id_document",:related_attribute => "getDestinationPersonIdDoc()", :width => 180},
     {:name => _("Comment"),:key => "assignments.comment",:related_attribute => "comment", :width => 160}
    ]
    ret[:sort_column] = 0
    ret
  end

  
  def self.register(attribs)
    Assignment.transaction do
      m = Assignment.new

      laptop = Laptop.includes(:status).find_by_serial_number(attribs[:serial_number_laptop])
      m.source_person_id = laptop.assignee_id
      m.laptop_id = laptop.id

      if attribs[:id_document] and attribs[:id_document] != ""
        person = Person.find_by_id_document(attribs[:id_document])
        if !person
          raise _("Couldn't find person with document ID %s") % attribs[:id_document]
        end
        m.destination_person_id = person.id
      end

      m.comment = attribs[:comment]
      m.save!

      # Move laptop out of "En desuso" for new assignments
      if m.destination_person_id and laptop.status.internal_tag == "deactivated"
        laptop.status = Status.find_by_internal_tag("activated")
      end

      # Update laptop assignee
      laptop.assignee_id = m.destination_person_id
      laptop.save!
    end
  end

  def getAssignmentTime()
    Fecha::getHora(self.time_assigned)
  end

  def getSourcePersonIdDoc()
    self.source_person ? self.source_person.getIdDoc() : ""
  end

  def getDestinationPersonIdDoc()
    self.destination_person ? self.destination_person.getIdDoc() : ""
  end

  ###
  # Data Scope:
  # User with data scope can only access objects that are related to his
  # performing places and sub-places.
  #
  # In this context, we limit the user to viewing the history of the laptops
  # that are physically within his places. (The other option is to limit the
  # user to viewing assignments that end up within his places, but remember
  # that laptops can also be deassigned, meaning that nobody would be able to
  # see those deassignments)
  def self.setScope(places_ids)
    scope = includes(:laptop => {:owner => {:performs => {:place => :ancestor_dependencies}}})
    scope = scope.where("place_dependencies.ancestor_id in (?)", places_ids)
    Assignment.with_scope(scope) do
      yield
    end
  end
end
