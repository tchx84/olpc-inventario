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
# Author: Martin Abente
# E-mail Address:  (tincho_02@hotmail.com | mabente@paraguayeduca.org) 

class DataImportController < ApplicationController
  around_filter :rpc_block

  def initialData

    definition = Hash.new

    models = Array.new
    models.push({:text => _("Load students"), :value => "students", :selected => true})
    models.push({:text => _("Load teachers"), :value => "teachers", :selected => false})
    models.push({:text => _("Load UUIDs"), :value => "uuids", :selected => false})
    definition[:models] = models

    #For now we are going to use fixed format for every file type.
    formats = Array.new
    formats.push({:text => _("Spreadsheet"), :value => "xls",:selected => true})
    definition[:formats] = formats

    @output["definition"] = definition

  end

  def import
    raise _("Nothing to import") if params[:data].blank?
    
    path = params[:data].path
    place_id = params[:place_id]
    register = current_user.person

    case params[:model]
      when "students"
        Person.import_students_xls(path, place_id, register) if path && place_id && register
      when "teachers"
        Person.import_teachers_xls(path, place_id, register) if path && place_id && register
      when "uuids"
        Laptop.import_uuids_from_csv(path)
    end
    @output["msg"] = _("The file was imported correctly.")
  end

end
