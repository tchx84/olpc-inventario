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
# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.


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


class ApplicationController < ActionController::Base
  include FastGettext::Translation

  # FIXME: rails3 sets protect_from_forgery by default in new projects.
  # We should set it too, but it seems incompatible with qooxdoo (or whatever
  # component is responsible for sending POST data from the UI).

  cache_sweeper :object_sweeper
  before_filter :set_gettext_locale
  before_filter :auth_control, :except => :index
  before_filter :access_control, :except => :index
  around_filter :do_scoping, :except => :index

  def initialize 
    super
    @check_authentication = true
  end

  def index
    # Render the standard application template (which launches the JS app and
    # opens the login screen)
    render :layout => 'application', :nothing => true
  end

  private 

  ###
  # tch says: 
  # Im aware that this method is not the best way acomplish this.
  # But, i had no other choice rather than rewriting it all, so 
  # lets live/get with it.
  def do_scoping(&block)

    # Finding current user's performing places
    person = current_user.person
    places_objs = Place.includes(:performs)
    places_objs = places_objs.where("performs.person_id = ? and performs.profile_id = ?", person.id, person.profile.id)
    places_ids = places_objs.collect(&:id)

    #File.open("/tmp/debug.txt", "w") { |f| f.write('hola'); }
    # {{{ Change our scope, selecting a sub-scope
    #if params[:vista] and params[:vista].match(/scope_\d/)
        #scope_id = params[:vista].split("_")[1].to_i
        #places_objs.each { |p_obj|
            #if p_obj.getDescendantsIds().include?(scope_id)
                #places_ids = [scope_id]
                #break
            #end
        #}
    #end
    # }}}

    classes = getScopedClasses()
    set_scope(classes, places_ids, block)
    #yield 

  end

  def set_scope(classes, places_ids, block)
   if (classes.length == 1)
       classes[0].setScope(places_ids) { block.call }
     else
       classes[0].setScope(places_ids) { 
          len = classes.length - 1
          set_scope(classes.slice(1, len), places_ids, block) 
       }
     end
  end
  
  ####
  #  this should be moved to lib/ along with a method (add_to_scoped_classes) that allows models 
  #  to register themselves as scoped classes
  #
  def getScopedClasses()      
    [ Place, Person, Laptop, ProblemReport, ProblemSolution, BankDeposit, Event, Node, SchoolInfo, Movement, Lot, StatusChange, User, PartMovement, NotificationSubscriber, Assignment]
  end

  ###
  # Get ID from AbmForm 
  #
  def getId(p_id)
    p_id.to_i != -1 ? p_id.to_i : nil
  end

  ###
  # Check User permissions.
  #
  def verify_permission(controller_name, method_name, user)

    return true if user.hasProfiles?(["root","developer"])

    user_query = User.includes(:person => {:performs => {:profile => {:permissions => :controller}}})
    user_query = user_query.where("users.person_id = ? and permissions.name = ? and controllers.name = ?", user.person.id, method_name, controller_name)
    return true if user_query.first
    false
  end

  ###
  # Checks for access_control
  #
  def access_control

    ret = verify_permission(params[:controller].camelize, params[:action] , current_user)
    if !ret
      msg = _("You don't have authorization for this section.")
      case request.format()
        when "application/xml"
          rest_access_response(msg)
        else
          json_access_response(msg)
      end
      return false
    end
  end

  def rest_access_response(msg)
    render :text => msg, :status => 403
  end

  def json_access_response(msg)
    @output["result"] = "error"
    @output["msg"] =  msg
    render :json => @output
  end

  ###
  # Controls for authentication.
  #
  def auth_control

    case request.format()
      when "application/xml"
        rest_auth_control
      else
        json_auth_control
    end

  end

  def rest_auth_control
    if user = authenticate_with_http_basic { |u, p| User.login(u, p) }
      session[:user_id] = user.id
      true
    else
      request_http_basic_authentication
      false
    end
  end

  def json_auth_control
    @output = {}

    if @check_authentication && !session[:user_id]
      @output["result"] = "error"
      @output["msg"] =  _("You are not authenticated")
      render :json => @output
      return false
    else
      @output["result"] = "ok"
    end
  end

  ####
  # If the editing id exists, we just save. Otherwise we create. 
  #
  def save_object(model_ref, editing_id, attribs)
    if editing_id
      obj = model_ref.find(editing_id)
      obj.update_attributes!(attribs)
    else
      obj = model_ref.create!(attribs)
    end
    obj
  end

  #  Funciones para ACLs
  def current_user
    session[:user_id] ? User.find(session[:user_id]) : User.new
  end

  # buildSelectHash(): retorna una vector de hashes listo p/ que se genere un combobox
  def buildSelectHash(pClassName,pSelectedId,pText)
    ret = []
    for x in pClassName.all
      v = x.id
      t = eval("x." + pText.to_s)
      s = v.to_i == pSelectedId.to_i ? true : false
      ret.push( {:text => t,:value => v,:selected => s} )
    end
    # TODO: ordenar alfabeticamente por text..
    ret
  end


  # buildSelectHash2(): hice esta para no romper el api de buildSelectHash, eventualmente deberian fusionarse en una sola
  def buildSelectHash2(pClassName,pSelectedId,pText,includeBlank,condiciones = [],extraValues = [], includes = [])
    ret = []

    ret.push( {:text => " ",:value => "-1",:selected => true} ) if includeBlank

    hopts = Hash.new
    if condiciones.length > 0
      hopts[:conditions] = condiciones
      hopts[:include] = includes
    end


    for x in pClassName.find(:all,hopts)
      v = x.id
      t = eval("x." + pText.to_s)
      s = v.to_i == pSelectedId.to_i ? true : false
      h = {:text => t,:value => v,:selected => s}
      h["attribs"] = Hash.new
      extraValues.each { |columna|
        valTemp = x.send(columna.to_sym)
        h["attribs"][columna] = valTemp
      }
      ret.push(h)
    end

    # TODO: ordenar alfabeticamente por text..
    ret
  end

  def buildSelectHashSingle(pClassName, pSelectedId, pText)
    hash = { :text => "", :value => "", :selected => true }
    if pSelectedId != -1
      hash[:value] = pSelectedId
      hash[:text] = eval("pClassName.find_by_id(pSelectedId)." + pText.to_s)
    end
    [hash]
  end

  # Generates a combobox with boolean values
  #
  # FIXME: we should use the bool datatype in the Database
  def buildBooleanSelectHash(yesSelected)
    ret = []
    ret.push( {:text => _("Yes"),:value => "S",:selected => yesSelected ? true : false} )
    ret.push( {:text => _("No"),:value => "N",:selected => yesSelected == false ? true : false} )
    ret
  end

  # Generates a combobox with boolean values
  def buildBooleanSelectHash2(yesSelected)
    ret = []
    ret.push( {:text => _("Yes"),:value => "1",:selected => yesSelected ? true : false} )
    ret.push( {:text => _("No"),:value => "0",:selected => yesSelected == false ? true : false} )
    ret
  end

  # Generates a combobox for a variable attributes
  # @datos Array of Hashes [ { text, value, selected (bool) } , ... ]
  def buildVariableSelectHash(datos,key)
    ret = []
    for d in datos
      ret.push( { :text => d["text"],:value => d["value"],:selected => d["value"] == key ? true : false  } )
    end
    ret
  end

  ###
  # rpc_block(): here we handle AJAX requests (and serialization out to JSON)
  #
  def rpc_block

    begin
      # call the actual controller method that is being called.
      yield
    rescue
      # HACK: no idea on how to handle this exception gracefully.
      if $!.class.to_s != "ActionView::MissingTemplate"
        @output["result"] = "error"
        @output["msg"] = $!.to_s
        @output["codigo"] = $!.backtrace.join("\n")
      end
    end

    render :json => @output
  end

  ###
  # Create an Array of Hashes for Checkboxes.
  #
  def buildCheckHash(pClassName,method,check_included=false,included_list=[], id_subset=nil)
    list = []
    results = pClassName.order("id")
    results = results.where(:id => id_subset) if id_subset
    results.each  { |o|
      h = Hash.new
      h[:label] =  o.send(method)
      h[:cb_name] = o.id
      h[:checked] = check_included ? included_list.include?(o) : true
      list.push(h)
    }
    list
  end

  ###
  # Some class has an special hierarchy structure, so this helps to build
  # the combobox entry for it.
  def buildHierarchyHash(modelClass, hierarchyMethod, hierarchyAttribute, infoMethod, targetId, pruneCond, pruneInc, includeBlank)
    
    cb_entries = []
    cb_entries.push(comboBoxifize()) if includeBlank

    roots = current_user.root_places()
    roots_filtered = roots.includes(pruneInc).where(pruneCond)

    roots.each { |classSubObj|
      if roots_filtered.include?(classSubObj)
        cb_entries.push(comboBoxifize(classSubObj, targetId, classSubObj.send(infoMethod)))
      end

      cb_entries += buildHierarchyHashR(classSubObj, hierarchyMethod, infoMethod, targetId, pruneCond, pruneInc,nil)
    }

    cb_entries
  end

  def buildHierarchyHashR(classObj, hierarchyMethod, infoMethod, targetId, pruneCond, pruneInc, concatInf)

    cb_entries = []
    next_concatInf = (concatInf ? concatInf+':' : "") + classObj.send(infoMethod)

    objSet = classObj.send(hierarchyMethod)
    objSet_filtered = objSet.where(pruneCond).includes(pruneInc)

    objSet.each { |classSubObj|

      if objSet_filtered.include?(classSubObj)
        cb_entries.push(comboBoxifize(classSubObj, targetId, next_concatInf+':'+classSubObj.send(infoMethod)))
      end

      cb_entries += buildHierarchyHashR(classSubObj, hierarchyMethod, infoMethod, targetId, pruneCond, pruneInc, next_concatInf)
    }

    cb_entries
  end

  def comboBoxifize(classObj = nil, targetId = nil, text = nil)
    entry = Hash.new
    entry[:text] = text ? text : ""
    entry[:value] = classObj ? classObj.id : -1
    entry[:selected] = (classObj && classObj.id == targetId) || (!classObj) ? true : false
    entry
  end

  # #
  # Language support facilities
  #
  def getAcceptedLang
    ["es", "en"]
  end

  def getLangText(lang)
    { "es" => _("Spanish"), "en" => _("English") }[lang]
  end
end
