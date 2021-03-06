#     Copyright Paraguay Educa 2009, 2010
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
# Author: Martin Abente - mabente@paraguayeduca.org
#


class PartMovement < ActiveRecord::Base
  belongs_to :part_movement_type
  belongs_to :part_type
  belongs_to :place
  belongs_to :person

  attr_accessible :part_movement_type, :part_movement_type_id
  attr_accessible :part_type, :part_type_id
  attr_accessible :place, :place_id
  attr_accessible :person, :person_id
  attr_accessible :amount

  FIELDS = [ 
     {name: _("Id"), column: :id},
     {name: _("Movement"), association: :part_movement_type, column: :name},
     {name: _("Part"), association: :part_type, column: :description, width: 255},
     {name: _("Amount"), column: :amount},
     {name: _("Responsible (CI)"), association: :person, column: :id_document},
     {name: _("Creation Date"), column: :created_at},
  ]

  def self.registerReplacements(problem_solution)
    attribs = {}
    attribs[:part_movement_type_id] = PartMovementType.find_by_internal_tag("part_replacement_out").id
    attribs[:person_id] = problem_solution.solved_by_person.id    
    attribs[:place_id] = problem_solution.problem_report.place.id
    problem_solution.solution_type.part_types.each { |part_type|
      attribs[:amount] = 1
      attribs[:part_type_id] = part_type.id
      attribs[:created_at] = problem_solution.created_at if problem_solution.created_at
      PartMovement.create!(attribs)
    }
  end

  def self.registerTransfer(attribs, from_place_id, to_place_id)
    part_movement_type_out_id = PartMovementType.find_by_internal_tag("part_transfered_out").id
    part_movement_type_in_id = PartMovementType.find_by_internal_tag("part_transfered_in").id

    attribs[:place_id] = from_place_id
    attribs[:part_movement_type_id] = part_movement_type_out_id
    PartMovement.create!(attribs)

    attribs[:place_id] = to_place_id
    attribs[:part_movement_type_id] = part_movement_type_in_id
    PartMovement.create!(attribs)
  end

  def getPartMovementTypeName
    self.part_movement_type ? self.part_movement_type.name : ""
  end

  def getPartTypeDescription
    self.part_type ? self.part_type.description : ""
  end

  def getAmount
    self.amount ? self.amount.to_s : "?"
  end

  def getResponsibleIdDoc
    self.person ? self.person.getIdDoc : ""
  end

  ###
  # Data Scope:
  # User with data scope can only access objects that are related to his
  # performing places and sub-places.
  def self.setScope(places_ids)
    scope = includes({:place => :ancestor_dependencies})
    scope = scope.where("place_dependencies.ancestor_id in (?)", places_ids)
    PartMovement.with_scope(scope) do
      yield
    end
  end

end
