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
# Author: Raúl Gutiérrez
# E-mail Address: rgs@paraguayeduca.org
# 2009
# # #

# # #
# Author: Martin Abente
# E-mail Address:  (tincho_02@hotmail.com | mabente@paraguayeduca.org) 
# 2009
# # #
                                                                         
class LaptopsController < SearchController
  skip_filter :rpc_block, :only => [:requestBlackList, :reportStolenLaptops, :reportActivatedLaptops]
  attr_accessor :include_str

  def initialize
    super 
    @include_str = [:status,:shipment,:model]
  end

  def search
    do_search(Laptop,{ :include => @include_str })
  end

  def search_options
    crearColumnasCriterios(Laptop)
    do_search(Laptop,{ :include => @include_str })
  end

  def new
    @output["fields"] = []

    if params[:ids] 
      ids = JSON.parse(params[:ids])
      new_batch_edit(ids)
    else
      new_single_edit()
    end

  end
	
  def save

    datos = JSON.parse(params[:payload])

    if params[:uploadfile] && params[:uploadfile] != ""
      path = ReadFile.fromParam(params[:uploadfile])
      dataHash = Hash.new
      dataHash[:arrived_at] = Time.now
      dataHash[:owner_id] = datos["fields"][4]
      dataHash[:place_id] = LaptopConfig.find_by_key("place_id").value
      dataHash[:build_version] = datos["fields"][1]
      dataHash[:model_id] = datos["fields"][2]
      ReadFile.laptopsFromFile(path, 0, dataHash)
    else
      if datos["ids"]
        modify_batch(datos)
      else
        attribs = Hash.new

        data_fields = datos["fields"].reverse
      
        attribs[:serial_number] = getAbmFormValue(data_fields.pop)
        attribs[:build_version] = getAbmFormValue(data_fields.pop)
        attribs[:model_id] = getAbmFormValue(data_fields.pop)
        attribs[:shipment_arrival_id] = getAbmFormValue(data_fields.pop)
        attribs[:owner_id] = getAbmFormValue(data_fields.pop)
        attribs[:box_serial_number] = getAbmFormValue(data_fields.pop)
        attribs[:status_id] = getAbmFormValue(data_fields.pop)
        attribs[:uuid] = getAbmFormValue(data_fields.pop)
        attribs[:is_ghost] = data_fields.pop == "N" ? false : true

        if datos["id"]
          o = Laptop.find datos["id"]
          o.update_attributes!(attribs)
        else
          Laptop.create!(attribs)
        end
      end
    end 
    @output["msg"] = datos["id"] || datos["ids"] ? "Cambios guardados" : "Laptop agregada"  
  end

  def delete
    ids = JSON.parse(params[:payload])
    Laptop.destroy(ids)
    @output["msg"] = "Elementos eliminados"
  end

  def requestBlackList
    black_list = Laptop.getBlackList
    render :xml => black_list.to_xml
  end

  def reportStolenLaptops
    stolen_status = Status.find_by_internal_tag("stolen_deactivated")
    stolen_laptops =  params[:hash][:stolen_laptops]
    hostname = params[:hash][:hostname]
    place = SchoolInfo.find_by_server_hostname(hostname).place
    if stolen_laptops && stolen_status && hostname && place
      stolen_laptops.each { |stolen_laptop|
        laptop = Laptop.find_by_serial_number(stolen_laptop[:serial_number])
        if laptop
          laptop.status_id = stolen_status.id
          laptop.save
          Event.register("stolen_laptop_activity", hostname, { :serial_number => laptop.getSerialNumber }.to_json, place.id)
        end
      }
    end
    render :xml => {}.to_xml, :status => :ok
  end

  def reportActivatedLaptops

    laptops_info = params[:hash][:laptops_info]

    if laptops_info

      cond = ["laptops.serial_number in (?)", laptops_info.keys]
      Laptop.find(:all, :conditions => cond).each { |laptop|

        last_activation_date = laptops_info[laptop.serial_number]
        laptop.update_attributes({ :last_activation_date => last_activation_date })
      }
    end

    render :xml => {}.to_xml, :status => :ok
  end

  private

  def new_single_edit()
    if params[:id]
      p = Laptop.find(params[:id])
      @output["id"] = p.id
    else
      p = nil
    end
    

    h = { "label" => "Nro. Serial","datatype" => "textfield" }.merge( p ? {"value" => p.serial_number } : {} )
    @output["fields"].push(h)

    h = { "label" => "Version SO","datatype" => "textfield" }.merge( p ? {"value" => p.build_version } : {} )
    @output["fields"].push(h)

    id = p ? p.model_id : -1
    modelos = buildSelectHash2(Model,id,"name",false,[])
    h = { "label" => "Modelo","datatype" => "combobox","options" => modelos }
    @output["fields"].push(h)

    id =  p ? p.shipment_arrival_id : -1
    shipments = buildSelectHash2(Shipment,id,"comment",false,[])
    h = { "label" => "Cargamento","datatype" => "combobox","options" => shipments }
    @output["fields"].push(h)

    id = p ? p.owner_id : -1
    #people = buildSelectHash2(Person,id,"getFullName()",false,[])
    people = buildSelectHashSingle(Person, id, "getFullName()")
    h = { "label" => "En manos de","datatype" => "select","options" => people, :option => "personas" }
    @output["fields"].push(h)

    h = { "label" => "Id Caja","datatype" => "textfield" }.merge( p ? {"value" => p.box_serial_number } : {} )
    @output["fields"].push(h)

    id = p && p.status ? p.status_id : Status.find_by_internal_tag("deactivated").id
    statuses = buildSelectHash2(Status,id,"getDescription()",false,[])
    h = { "label" => "Estado","datatype" => "combobox","options" => statuses }
    @output["fields"].push(h)

    h = { "label" => "Uuid","datatype" => "textfield" }.merge( p ? {"value" => p.uuid } : {} )
    @output["fields"].push(h)

   h = { "label" => "Cargar .xls","datatype" => "uploadfield", :field_name => :uploadfile }
   @output["fields"].push(h)

    yesSelected = p ? p.is_ghost : false
    options = buildBooleanSelectHash(yesSelected)
    h = { "label" => "Fantasma", "datatype" => "combobox", "options" => options}
    @output["fields"].push(h)

  end


  ###
  # Ponemos los datos de la 1era laptop
  #
  def new_batch_edit(ids)
    p = Laptop.find(ids[0])

    @output["ids"] = ids 

    # User must check fields that where updated 
    @output["needs_update"] = true

    h = { "label" => "Version SO","datatype" => "textfield" }.merge( p ? {"value" => p.build_version } : {} )
    @output["fields"].push(h)

    id = p ? p.model_id : -1
    modelos = buildSelectHash2(Model,id,"name",false,[])
    h = { "label" => "Modelo","datatype" => "combobox","options" => modelos }
    @output["fields"].push(h)

    id =  p ? p.shipment_arrival_id : -1
    shipments = buildSelectHash2(Shipment,id,"comment",false,[])
    h = { "label" => "Cargamento","datatype" => "combobox","options" => shipments }
    @output["fields"].push(h)

    id = p ? p.owner_id : -1
    people = buildSelectHash2(Person,id,"getFullName()",false,[])
    h = { "label" => "En manos de","datatype" => "combobox","options" => people }
    @output["fields"].push(h)

    h = { "label" => "Id Caja","datatype" => "textfield" }.merge( p ? {"value" => p.box_serial_number } : {} )
    @output["fields"].push(h)

    id = p && p.status ? p.status_id : Status.find_by_internal_tag("deactivated").id
    statuses = buildSelectHash2(Status,id,"getDescription()",false,[])
    h = { "label" => "Estado","datatype" => "combobox","options" => statuses }
    @output["fields"].push(h)

  end

  def modify_batch(datos)
    data_fields = datos["fields"].reverse

    attribs = Hash.new

    h = data_fields.pop
    if h["updated"] ==  true
      attribs[:build_version] = getAbmFormValue(h)
    end

    h = data_fields.pop
    if h["updated"] ==  true
      attribs[:model_id] = getAbmFormValue(h)
    end

    h = data_fields.pop
    if h["updated"] ==  true
      attribs[:shipment_arrival_id] = getAbmFormValue(h)
    end

    h = data_fields.pop
    if h["updated"] ==  true
      attribs[:owner_id] = getAbmFormValue(h)
    end

    h = data_fields.pop
    if h["updated"] ==  true
      attribs[:box_serial_number] = getAbmFormValue(h)
    end

    h = data_fields.pop
    if h["updated"] ==  true
      attribs[:status_id] = getAbmFormValue(h)
    end

    objs = Laptop.find(datos["ids"])
    Laptop.transaction do
      objs.each { |o|
        o.update_attributes!(attribs)
      }
    end


  end

end
