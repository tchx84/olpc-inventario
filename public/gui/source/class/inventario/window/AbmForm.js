//     Copyright Paraguay Educa 2009
//
//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU General Public License as published by
//     the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.
//
//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU General Public License for more details.
//
//     You should have received a copy of the GNU General Public License
//     along with this program.  If not, see <http://www.gnu.org/licenses/>
//
//
//
//

/***************************************************
 AbmForm.js
 date: 2007-05-18
 author: Raul Gutierrez S.
 ******************************************************/


qx.Class.define("inventario.window.AbmForm",
{
  extend : inventario.window.AbstractWindow,

  construct : function(initialDataUrl, saveUrl) {
    this.base(arguments);

    this.prepared = false;

    this.setEditIds(new Array());

    if (initialDataUrl != undefined)
      this.setInitialDataUrl(initialDataUrl);

    if (saveUrl != undefined)
      this.setSaveUrl(saveUrl);
  },

  properties : {

    showSaveButton :
    {
      check : "Boolean",
      init  : true
    },

    showCloseButton :
    {
      check : "Boolean",
      init  : true
    },

    windowPopup :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    editIds :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    editRow :
    {
      check : "Number",
      init  : 0
    },

    details :
    {
      check : "Boolean",
      init  : false
    },

    vista :
    {
      check : "String",
      init  : ""
    },

    initialDataUrl :
    {
      check : "String",
      init  : ""
    },

    saveUrl :
    {
      check : "String",
      init  : ""
    },

    saveCallback :
    {
      check    : "Function",
      init     : null,
      nullable : true
    },

    saveCallbackObj :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    windowIcon :
    {
      check : "String",
      init  : "icon/22/actions/document-new.png"
    },

    dataInputObjects :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    extraData :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    verifySave :
    {
      check : "Boolean",
      init  : false
    },

    verifySaveUrl :
    {
      check : "String",
      init  : ""
    },

    fileUploadWidget :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    clearFormFieldsAfterSave :
    {
      check : "Boolean",
      init  : false
    },

    askSaveConfirmation :
    {
      check : "Boolean",
      init  : true
    }
  },

  members : {
    launch : function()
    {
      if (!this.prepared) {
        this._loadInitialData();
      } else {
        this.open();
      }
    },

    _loadInitialData : function()
    {
      var data = {};
      var viewDetails = false;
      var editRow = this.getEditRow();
      var details = this.getDetails();
      var ids = this.getEditIds();
      var vista = this.getVista();

      if (editRow > 0) {
        data["id"] = editRow;
        if (details) viewDetails = true;
      } else if (ids.length > 0) {
        data["ids"] = qx.lang.Json.stringify(ids);
      }

      if (vista != "") data["vista"] = vista;

      if (this.getExtraData()) {
        data["extra_data"] = qx.lang.Json.stringify(this.getExtraData());
      }

      var url = this.getInitialDataUrl();

      inventario.transport.Transport.callRemote(
      {
        url        : url,
        parametros : viewDetails,
        handle     : this._loadInitialDataResp,
        data       : data
      },
      this);
    },

    _loadInitialDataResp : function(remoteData, handleParams)
    {
      var vbox = this.getVbox();
      var datos = remoteData["fields"];
      var len = datos.length;
      var withTabs = false;

      this._editingFlag = false;
      this._formFields = new Array();
      this._remote_id = 0;
      this._remote_ids = new Array();
      this._update_checkboxes = new Array();
      this.setDataInputObjects(new Array());

      if (remoteData["with_tabs"]) {
        withTabs = true;
        this._tabView = new qx.ui.tabview.TabView();
        this._tabView.setWidth(500);
        vbox.add(this._tabView);

        var tab_page_title = remoteData.first_tab_title ? remoteData.first_tab_title : qx.locale.Manager.tr("Main");
        var gl = this._buildTabPageWithGrid(tab_page_title);
      } else {
        var gl = this._buildGrid();
        vbox.add(gl);
      }
      // End.

      // TODO: take to _initParams()
      if (remoteData["verify_before_save"])
      {
        this.setVerifySave(true);
        this.setVerifySaveUrl(remoteData["verify_save_url"]);
      }

      if (this.getDetails()) {
        this.setCaption(qx.locale.Manager.tr("Details"));
      }

      if (remoteData["id"])
      {
        this._editingFlag = true;
        this._remote_id = remoteData["id"];
        if (this.getCaption() == "") this.setCaption(qx.locale.Manager.tr("Edit"));
      }
      else if (remoteData["ids"])
      {
        this._editingFlag = true;
        this._remote_ids = remoteData["ids"];

        if (this.getCaption() == "")
          this.setCaption("Editar");
      }
      else
      {
        remoteData["id"];
        if (this.getCaption() == "") this.setCaption(qx.locale.Manager.tr("Add"));
      }

      if (remoteData["window_title"])
        this.setCaption(remoteData["window_title"]);

      /* HACK: until we learn to calc the size of the window automagically */
      if (remoteData["window_width"]) {
        var w = parseInt(remoteData["window_width"]);
        this.setWidth(w);
      }

      if (remoteData["window_height"]) {
        var h = parseInt(remoteData["window_height"]);
        this.setHeight(h);
      }

      var row_count = 0;

      for (var i=0; i<len; i++) {
        if (withTabs && datos[i].datatype == "tab_break") {
          gl = this._buildTabPageWithGrid(datos[i].title, datos[i].icon);
        } else {
          try {
            var field_data = this._buildField(datos[i], handleParams);

            if (field_data.drill_down_vbox) {
              gl.add(field_data.drill_down_vbox,
              {
                row    : row_count,
                column : 0
              });
            } else {
              if (field_data.label)
                gl.add(field_data.label,
                {
                  row    : row_count,
                  column : 0
                });

              gl.add(field_data.input,
              {
                row    : row_count,
                column : 1
              });

              if (remoteData["needs_update"]) {
                var update_cb = new qx.ui.form.CheckBox();

                gl.add(update_cb,
                {
                  row    : row_count,
                  column : 2
                });

                this._update_checkboxes.push(update_cb);
              }
            }
          } catch(e) {
            var str = qx.locale.Manager.tr("Problem to add the item num ") + i + qx.locale.Manager.tr(" type ") + datos[i].datatype;
            str += qx.locale.Manager.tr(" with label ") + datos[i].label + qx.locale.Manager.tr(". EXCEPTION: ") + e;
            alert(str);
          }

          row_count++;
        }
      }

      if (!handleParams) {
        if (this.getShowSaveButton() || this.getShowCloseButton())
        {
          var hbox = this._buildButtonsHbox();
          this.getVbox().add(hbox);
        }
      }

      this.prepared = true;
      this.open();
    },

    _buildButtonsHbox : function()
    {
      var hbox = new qx.ui.container.Composite(new qx.ui.layout.HBox(30));
      var spacer = new qx.ui.core.Spacer(30, 40);

      hbox.add(spacer, { flex : 1 });

      if (this.getShowSaveButton()) {
        var saveButStr = (this._remote_id != 0 || this._remote_ids.length > 0 ? qx.locale.Manager.tr("Save Changes") : qx.locale.Manager.tr("Save"));
        var bSave = new qx.ui.form.Button(saveButStr, "inventario/16/floppy2.png");
        bSave.addListener("execute", this._save_cb, this);
        this._addAccelerator("Control+G", this._save_cb, this);
        hbox.add(bSave, { flex : 1 });
      }

      if (this.getShowCloseButton()) {
        var bCancel = new qx.ui.form.Button(qx.locale.Manager.tr("Close"), "inventario/16/no.png");
        bCancel.addListener("execute", this._cancel_cb, this);
        hbox.add(bCancel, { flex : 1 });
      }

      var spacer = new qx.ui.core.Spacer(30, 40);
      hbox.add(spacer, { flex : 1 });

      return hbox;
    },

    _buildTabPageWithGrid : function(tabTitle, icon) {
      if (!icon) icon = "icon/16/apps/utilities-terminal.png";

      var currentTab = new qx.ui.tabview.Page(tabTitle, icon);
      currentTab.setLayout(new qx.ui.layout.VBox());
      var gl = this._buildGrid();
      currentTab.add(gl);
      this._tabView.add(currentTab);
      return gl;
    },

    _buildGrid : function() {
      var grid_lo = new qx.ui.layout.Grid(2, 0);
      grid_lo.setColumnFlex(1, 3);
      return new qx.ui.container.Composite(grid_lo);
    },

    _buildField : function(fieldData, readOnly) {
      var input;
      var drill_down_vbox = null;
      var rAccelKey = fieldData["accel_key"];  /* Cargo el acelerador de tecla si tiene */
      var label = null;

      if (rAccelKey) {
        var rLabel = fieldData.label;
        label = new qx.ui.basic.Label(this._underlineLabel(rLabel, rAccelKey));
      } else if (fieldData.label) {
        label = new qx.ui.basic.Label();

        label.set(
        {
          rich    : true,
          value : "<b>" + fieldData.label + "</b>"
        });
      }

      switch(fieldData.datatype) {
        case "label":
          input = new qx.ui.basic.Label();
          input.set({rich : true, value : fieldData.text.toString()})
          break;
        case "date":
          input = new qx.ui.form.DateField();

          if (fieldData.value) {
            // Expected format: yyyy-mm-dd
            var tmpV = fieldData.value.split("-");
            var _year = tmpV[0];
            var _month = Number(tmpV[1]) - 1;
            var _date = tmpV[2];
            input.setValue(new Date(_year, _month, _date));
          }

          break;

        case "numericfield":
            var max = fieldData.max ? fieldData.max : 99999999999999999999999999999;
            var min = fieldData.min ? fieldData.min : 0;
            var cur = fieldData.value ? fieldData.value : 0;
            var nf  = new qx.util.format.NumberFormat();
            input   = new qx.ui.form.Spinner(min, cur, max);
            nf.setMaximumFractionDigits(2);
            input.setNumberFormat(nf);


            break;
        case "textfield":
            input = new qx.ui.form.TextField(fieldData.value ? fieldData.value.toString() : "");

          if (fieldData.align) {
            input.setTextAlign(fieldData.align);
          }

          // Pregunto si el boton que se presiono es detalles, entonces el campo solo ReadOnly
          if (readOnly) input.setReadOnly(true);
          break;

        case "checkbox":
          input = new qx.ui.form.CheckBox(fieldData.text ? fieldData.text : "");
          input.setValue(fieldData.value ? fieldData.value : false);

          break;

        case "checkbox_selector":
          input = new inventario.widget.CheckboxSelector("", fieldData.cb_options, fieldData.max_column);
          break;

        case "permissions":
          input = new inventario.widget.Permissions(fieldData.tree);
          break;

        case "map_locator":

          var placeId = fieldData.placeId;
          var width = fieldData.width;
          var height = fieldData.height;

          if (!readOnly) {
            var readOnly = fieldData.readOnly;
          }

          input = new inventario.widget.MapLocator(placeId, readOnly, width, height, false);
          input.launch();
          break;

        case "coords_text_field":
          input = new inventario.widget.CoordsTextField(fieldData.value ? fieldData.value.toString() : "");
          break;

        case "textarea":
          input = new qx.ui.form.TextArea(this._editingFlag && fieldData.value ? fieldData.value.toString() : "");

          // Pregunto si el boton que se presiono es detalles, entonces el campo solo ReadOnly
          if (readOnly) input.setReadOnly(true);
          var width, height;

          if (fieldData.width && fieldData.height)
          {
            width = parseInt(fieldData.width);
            height = parseInt(fieldData.height);
          }
          else
          {  /* a sound default */
            width = 250;
            height = 250;
          }

          /* el grid tiene que poder contener esto! */

          break;

        case "passwordfield":

          var password = fieldData.value ? fieldData.value : "";
          input = new qx.ui.form.PasswordField(password);

          // Pregunto si el boton que se presiono es detalles, entonces el campo solo ReadOnly
          if (readOnly) input.setReadOnly(true);
          break;

        case "combobox":
          input = new qx.ui.form.SelectBox;

          var options = fieldData.options;
          inventario.widget.Form.loadComboBox(input, options, true);

          if (fieldData.vista)
          {
            input.setUserData("vista", fieldData.vista);
            input.setUserData("vista_widget", fieldData.vista_widget.toString());
            input.addListener("changeValue", this._set_select_vista_cb, this);
          }

          break;

        case "combobox_filtered":
          input = new inventario.widget.ComboBoxFiltered("", fieldData.cbs_options, fieldData.width);
          input.setDataRequestUrl(fieldData.data_request_url);
          break;

        case "select":
          input = new inventario.widget.Select(fieldData.option);

          /* Le agrego un accelerador de teclas a los botones .. */

          if (rAccelKey) {
            this._addAccelerator(rAccelKey, input.activar, input);
          }

          var options = fieldData.options;

          inventario.widget.Form.loadComboBox(input.getComboBox(), options, true);

          /* Se reconozca vista, que se manda por el servidor */
          if (fieldData.vista != null) {
              input.getAbm().setVista(fieldData.vista);
          }

          input.getAbm().setAskConfirmationOnClose(false);

          if (fieldData.text_value) {
            input.getComboBox().setUserData("text_value", true);
          }

          this.getDataInputObjects().push(input);

          /* Verifico si el boton agregar del abm2 me pide un multiAbmForm */

          if (fieldData.abm_form == "multi")
          {
            var configs = new Array();
            var can_tabs = fieldData.tabs.length;

            for (var z=0; z<can_tabs; z++)
            {
              var url = fieldData.tabs[z].url;
              var titulo = fieldData.tabs[z].titulo;
              var res = inventario.widget.Url.getUrl(url);

              configs.push(
              {
                InitialDataUrl : res["addUrl"],
                SaveUrl        : res["saveUrl"],
                titulo         : titulo,
                select         : url,
                showSelect     : true
              });
            }

            input.getAbm().setMultiAbmFormConfigs(configs);
          }

          break;

        case "abmform_details":
          input = new qx.ui.basic.Label()
          input.setRich(true);
          input.setValue("<a href='#'>" + qx.bom.String.escape(fieldData.text) + "</a>");
          input.addListener("activate", function(e) {
            var options = inventario.widget.Url.getUrl(fieldData.option);
            var form = new inventario.window.AbmForm(options.addUrl, options.saveUrl);
            form.setDetails(true);
            form.setEditRow(fieldData.id);
            form.launch();
          }, input);
          break;

        case "table":
          var rows_num = (fieldData.rows_num ? fieldData.rows_num : 5);
          var width = (fieldData.width ? fieldData.width : 250);
          var height = (fieldData.height ? fieldData.height : 250);

          input = new inventario.widget.Table2();
          input.setUseEmptyTable(true);
          input.setRowsNum(rows_num);
          input.setColsNum(fieldData["col_titles"].length);
          input.setTitles(fieldData["col_titles"]);
          input.setEditables(fieldData["editables"]);
          input.setWidths(fieldData["widths"]);
          input.setButtonsAlignment("center");

          if (fieldData["columnas_visibles"])
            input.setColumnasVisibles(fieldData["columnas_visibles"]);

          /*
                    	     * Si estamos en modo "Detalles" no nos interesa poder agregar cosas a la tabla
                    	     */

          if (this.getDetails())
            input.setWithButtons(false);
          else
            input.setWithButtons(true);

          input.setShowSelectButton(false);
          input.setShowModifyButton(false);
          input.setAddButtonLabel("+");
          input.setAddButtonIcon("");
          input.setDeleteButtonLabel("-");
          input.setDeleteButtonIcon("");

          // ku 2007-05-16
          if (fieldData.options.length > 0) input.setGridData(fieldData.options);

          input.launch();

          if (fieldData.cols_mapping)
            input.setUserData("cols_mapping", fieldData.cols_mapping);

          input.setHashKeys(fieldData.hashed_data);

          if (fieldData.formula_table)
          {
            input.setFormulaTable(fieldData.formula_table);
            input.setFormulaContext(this);
          }

          if (!this.getDetails())
            this._doAddHandlerTable(fieldData, input);

          break;

        case "uploadfield":
          input = new uploadwidget.UploadForm('uploadFrm', this.getSaveUrl());
          input.setLayout(new qx.ui.layout.Basic);

          var file = new uploadwidget.UploadField(fieldData.field_name, qx.locale.Manager.tr("Browse"), 'icon/16/actions/document-save.png');
          input.add(file,
          {
            left : 0,
            top  : 0
          });

          this.setFileUploadWidget(input);

          break;

        case "image":
          input = new qx.ui.basic.Image(fieldData.value);

          // input.setScale(true);
          // input.setWidth(64);
          // input.setHeight(64);
          break;

        case "hierarchy_on_demand":
          var dataHash = typeof fieldData.dataHash != "undefined" ? fieldData.dataHash : null;
          var options = typeof fieldData.options != "undefined" ? fieldData.options : null;
          input = new inventario.widget.HierarchyOnDemand(dataHash, options);
          break;

        case "dyntable":
          var optsLen = fieldData.options.length;
          var table_data = {};
          table_data.col_titles = new Array();
          table_data.widths = new Array();
          table_data.hashed_data = new Array();

          for (var j=0; j<optsLen; j++) {
            table_data.col_titles.push(fieldData.options[j].label);
            table_data.widths.push(fieldData.widths[j]);
	    if (fieldData.options[j].hash_data_tag) 
	      table_data.hashed_data.push(fieldData.options[j].hash_data_tag);
	    else
	      table_data.hashed_data.push(fieldData.options[j].label);
          }

          input = new inventario.widget.DynTable(table_data, fieldData.options);
          if (fieldData.data)
            input.setTableData(fieldData.data);

          break;

        case "drilldown_info":
          drill_down_vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
          var scroller = new qx.ui.container.Scroll();

          // scroller.set({ width: 400,  height: 300 });
          var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          container.setAllowGrowX(false);
          container.setAllowStretchX(false);
          scroller.add(container);
          drill_down_vbox.add(scroller);

          var objs = fieldData.value;
          var len = objs.length;

          for (var i=0; i<len; i++)
          {
            var label = objs[i].object_desc ? objs[i].object_desc : " ";
            var gbox = new qx.ui.groupbox.GroupBox(label, "icon/16/apps/utilities-text-editor.png");
            gbox.setLayout(new qx.ui.layout.VBox());
            gbox.add(this._buildDrillDownInfo(objs[i]));

            container.add(gbox);
          }

          break;

        default:
          alert(fieldData.datatype);
      }

      if (fieldData.name)
        input.setUserData("name", fieldData.name);

      // FIXME: make nicer?
      if (fieldData.datatype != "uploadfield" && fieldData.datatype != "image" &&
          fieldData.datatype != "label" && fieldData.datatype != "abmform_details") {
        this._formFields.push(input);

        /* Guardo tb. en una propiedad el input widget p/ poder acceder a el via el manejador de formulas de Table2.
	 * TODO: En realidad fields ya no haria falta pq se puede usar dataInputObjects
	 */
        this.getDataInputObjects().push(input);
      }

      var ret = {};

      if (drill_down_vbox) {
        ret.drill_down_vbox = drill_down_vbox;
      } else {
        ret.label = label;
        ret.input = input;
      }

      return ret;
    },


    /**
     * _saveFormData(): enviar datos p/ que se cree el nuevo objeto en el servidor (o se guarde la edicion)
     *
     * @param editing {var} editando o creando?
     * @param fields {var} TODOC
     * @param id {var} en caso de que estemos editando
     * @return {void} void
     */
    _saveFormData : function(editing, fields, id)
    {
      try {
        var updated = this._getDataFromFields(fields);

        if (this._update_checkboxes.length > 0 && updated == false)
        {
          alert(qx.locale.Manager.tr("You must check at least one field"));
          return;
        }

        var msgConfirmacion;

        if (editing) {
          if (typeof (id) == "object") {
            // batch edit
            this.data["ids"] = id;
            this.setEditIds(new Array());
            msgConfirmacion = qx.locale.Manager.tr("These changes will be applied to these ");
	    msgConfirmacion += id.length.toString() + qx.locale.Manager.tr(" records. Are you sure?");
          } else {
            this.data["id"] = id;
            msgConfirmacion = qx.locale.Manager.tr("Save changes?");
          }
        } else {
          msgConfirmacion = qx.locale.Manager.tr("Create?");
        }

        if (this._verify_msg != "") {
          msgConfirmacion += "\n\n" + this._verify_msg;
        }

        if (this.getAskSaveConfirmation() == false || confirm(msgConfirmacion)) {
          var url = this.getSaveUrl();

          if (url == "" || url == null) {
            /* Lets insert ourselve inside a table */
            /* FIXME can this codepath be hit? */
            var table = this.getUserData("table_obj");
            this.setSaveCallback(this._addRow2Table);
            this.setSaveCallbackObj(this);

            this._saveCallback(null, this.data["fields"]);
            this.close();
          }
          else
          {
            var payload = qx.lang.Json.stringify(this.data);
            var data = { payload : payload };

            if (this.getExtraData()) {
              data["extra_data"] = qx.lang.Json.stringify(this.getExtraData());
            }

            var vista = this.getVista();
            if (vista != "") data["vista"] = vista;

            var opts =
            {
              url        : url,
              parametros : null,
              handle     : this._saveFormDataResp,
              data       : data
            };

            if (this.getFileUploadWidget())
            {
              opts["file_upload"] = true;
              opts["file_upload_form"] = this.getFileUploadWidget();
            }

            inventario.transport.Transport.callRemote(opts, this);
          }
        }
      } catch(e) {
        alert(e.toString());
      }
    },


    /**
     * la idea seria que cuando se agrega o modifica una fila, llame otra vez al servidor
     * para que traiga la fila de lo que se agrego
     *  _saveDataResp()
     *
     * @param remoteData {var} TODOC
     * @param handleParams {var} TODOC
     * @return {void} void
     */
    _saveFormDataResp : function(remoteData, handleParams)
    {
      this._saveCallback(remoteData, this.data["fields"]);
      this.close();

      if (this.getClearFormFieldsAfterSave()) {
        this._clearFormFields();
      }
    },

    _clearFormFields : function() {
      inventario.widget.Form.resetInputs(this._formFields);
    },

    _saveCallback : function(remoteData, newData)
    {
      var f = this.getSaveCallback();
      var obj = this.getSaveCallbackObj();

      if (remoteData["msg"])
        inventario.window.Mensaje.mensaje(remoteData["msg"]);

      if (f) {
        obj = (obj ? obj : this);
        f.call(obj, newData, remoteData);
      }
    },

    _addRow2Table : function(newRow, remoteDataIgnored)
    {
      var tableObj = this.getUserData("table_obj");
      tableObj.addRows([ newRow ], -1);
    },

    _doAddHandlerTable : function(datos, tableObj)
    {
      if (datos.add_form_url) {
        /*
	 * La tabla se cargar a partir de un nuevo formulario
	 */
        this.setUserData("add_form_url", datos.add_form_url);
        this.setUserData("tableObje", tableObj);

        /*
	 * WARNING
	 *  Dentro de este handler se hacen referencias a tableObj, tableObj habria que pasar como una propiedad
	 *  definida por usuario de getAddButton() y recuperar por ahi para no tener problemas con el scope dinamico
	 */

        tableObj.getAddButton().addListener("execute", function(e)
        {
          var url = this.getUserData("add_form_url");
          var add_form = new inventario.window.AbmForm(url);
          add_form.setAskConfirmationOnClose(false);

          /* No establezco el callback...
	   * Lo delego (al asociar una tabla al nuevo AbmForm) p/ el momento de obtener los datos */

          add_form.setUserData("table_obj", this.getUserData("tableObje"));
          add_form.launch();
        }, this);

      } else {

        /*
	 * La tabla se cargar a partir de un Abm2
	 */
	
        tableObj.setUserData("abm_option", datos.option);

        if (datos.vista) {
          tableObj.setUserData("vista", datos.vista);
        }

        tableObj.getAddButton().addListener("execute", function() {
          this._table_add_cb(tableObj);
        }, this);
      }
    },

    _save_cb : function(e)
    {
      this._verify_msg = "";

      if (this.getVerifySave()) {
        var updated = this._getDataFromFields(this._formFields);
        var payload = qx.lang.Json.stringify(this.data);
        var data = { payload : payload };
        var url = this.getVerifySaveUrl();

        var opts =
        {
          url        : url,
          parametros : null,
          handle     : this._verify_save_resp,
          data       : data
        };

        inventario.transport.Transport.callRemote(opts, this);
      }
      else {
        this._do_save_cb();
      }
    },

    _verify_save_resp : function(remoteData, handleParams)
    {
      this._verify_msg = remoteData["obj_data"];
      this._do_save_cb();
    },

    _do_save_cb : function()
    {
      var pId = (this._remote_ids.length > 0 ? this._remote_ids : this._remote_id);
      this._saveFormData(this._editingFlag, this._formFields, pId);
    },

    _table_add_cb : function(tableObj)
    {

      /* Handler p/ agregar filas */

      var handlerAbm2 = function(filas)
      {
        var nuevas_filas = new Array();
        var cols_mapping = tableObj.getUserData("cols_mapping");

        for (var j=0; j<filas.length; j++)
        {
          var tmp_fila = new Array();

          for (var k=0; k<cols_mapping.length; k++)
          {
            var indice_columna = cols_mapping[k];
            tmp_fila.push(filas[j][indice_columna]);
          }

          nuevas_filas.push(tmp_fila);
        }

        tableObj.addRows(nuevas_filas, -1);
      };

      /* Le pasamos una ref al combobox a ABM2 de tal forma a que el sepa que hacer cuando se clickea en elegir */

      var popup_win = new inventario.widget.Popup(tableObj.getUserData("abm_option"));
      popup_win.getAbm().setChooseButtonCallBack(handlerAbm2);
      popup_win.getAbm().setChooseButtonCallBackContext(this);

      /* Se reconozca vista, que se manda por el servidor */

      if (tableObj.getUserData("vista")) {
        popup_win.getAbm().setVista(tableObj.getUserData("vista"));
      }

      popup_win.show();
    },

    _cancel_cb : function(e)
    {
      this.close();
    },

    _getArrayFromFields : function(fields, array)
    {
      var updated = false;

      for (var i=0; i<fields.length; i++) {
        var v = inventario.widget.Form.getInputValue(fields[i]);

        if (fields[i].getUserData("number_with_format")) {
          v = inventario.widget.Form.unFormatNumber(v);
        }

        // checkboxes: field updated?
        if (this._update_checkboxes.length > 0) {
          var h = {};
          h["value"] = v;

          h["updated"] = this._update_checkboxes[i].getValue();

          if (h["updated"]) {
            updated = true;
          }
          array.push(h);
        } else {
          array.push(v);
        }
      }

      return updated;
    },

    _getDataFromFields : function(fields)
    {
      this.data = {};
      var updated = false;

      // Deprecated ordered list of form values
      if (!fields[0].getUserData("name")) {
        var array = new Array();
        updated = this._getArrayFromFields(fields, array);
        this.data["fields"] = array;
        return updated;
      }

      // Return dictionary of {name: value}
      this.data["fields"] = {};

      for (var i=0; i<fields.length; i++)
      {
        var v = inventario.widget.Form.getInputValue(fields[i]);
        var name = fields[i].getUserData("name");

        if (fields[i].getUserData("number_with_format")) {
          v = inventario.widget.Form.unFormatNumber(v);
        }

        // checkboxes: field updated?
        if (this._update_checkboxes.length > 0)
        {
          var h = {};
          h["value"] = v;

          h["updated"] = this._update_checkboxes[i].getValue();

          if (h["updated"]) {
            updated = true;
          }
          this.data["fields"][name] = h;
        } else {
          this.data["fields"][name] = v;
        }
      }

      return updated;
    },

    _set_select_vista_cb : function(e)
    {
      var cb = e.getTarget();
      var selected_val = inventario.widget.Form.getInputValue(cb);
      var vista = cb.getUserData("vista") + "_" + selected_val.toString();
      var j = parseInt(cb.getUserData("vista_widget"));

      this.getDataInputObjects()[j].getAbm().setVista(vista);
    },

    _buildDrillDownInfo : function(hOpts)
    {
      var vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox(20));

      if (hOpts.objs)
      {
        var len = hOpts.objs.length;

        for (var i=0; i<len; i++) {
          vbox.add(this._doBuildDrillDownInfo(hOpts.objs[i]));
        }
      }
      else
      {
        vbox.add(this._doBuildDrillDownInfo(hOpts));
      }

      return vbox;
    },

    _doBuildDrillDownInfo : function(hOpts)
    {
      var hbox = new qx.ui.container.Composite(new qx.ui.layout.HBox(20));
      var grid_lo = new qx.ui.layout.Grid();
      grid_lo.setColumnFlex(0, 1);
      grid_lo.setColumnFlex(1, 3);
      var gl = new qx.ui.container.Composite(grid_lo);
      hbox.add(gl);

      var row = 0;

      for (var k in hOpts)
      {
        var label = new qx.ui.basic.Label(k.toString());
        var value = new qx.ui.basic.Label(hOpts[k].toString());

        gl.add(label,
        {
          row    : row,
          column : 0
        });

        gl.add(value,
        {
          row    : row,
          column : 1
        });

        row++;
      }

      return hbox;
    }
  }
});
