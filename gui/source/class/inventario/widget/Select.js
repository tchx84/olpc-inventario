
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
// Select.js
// fecha: 2007-03-11
// autor: Kaoru Uchiyamada
//
//
//
/**
 * Constructor
 *
 * @param param {}  El parametro p/ Popup
 * @param options {} Hash con parametros opcionales
 */
qx.Class.define("inventario.widget.Select",
{
  extend : qx.ui.container.Composite,




  /*
      *****************************************************************************
         CONSTRUCTOR
      *****************************************************************************
      */

  construct : function(param, options)
  {
    try
    {
      qx.ui.container.Composite.call(this, new qx.ui.layout.HBox(20));

      var tituloVentana = "Buscador";
      this.setUrl(param);

      var input;

      if (options && options["text_field"]) {
        input = new qx.ui.form.TextField();
      } else {
        input = new qx.ui.form.SelectBox();
      }

      this.setComboBox(input);
      this.add(this.getComboBox());

      this.setButton(new qx.ui.form.Button('..'));
      this.add(this.getButton());

      this.getButton().addListener("execute", this._create, this);

      /* Titulo venta */

      if (options && options["titulo"] && options["titulo"] != "") {
        tituloVentana = options["titulo"];
      }

      /* Le pasamos una ref al combobox a ABM2 de tal forma a que el sepa que hacer cuando se clickea en elegir */

      /* Crear Abm */

      var url = inventario.widget.Url.getUrl(this.getUrl());
      var abm = new inventario.window.Abm2(null, url);
      abm.setUsePopup(true);
      abm.setWindowTitle(tituloVentana);
      abm.setAbstractPopupWindowHeight(450);
      abm.setAbstractPopupWindowWidth(800);
      abm.setWithChooseButton(true);
      abm.setPaginated(true);

      if (options && options["refresh_on_show"] != null) {
        abm.setRefreshOnShow(options["refresh_on_show"]);
      }

      abm.setAskConfirmationOnClose(false);

      if (options && options["vista"]) {
        abm.setVista(options["vista"]);
      }

      if (options && options["callback"])
      {
        abm.setChooseButtonCallBack(options["callback"]);
        abm.setChooseButtonCallBackContext(options["callback_context"]);
        abm.setChooseButtonCallBackInputField(this.getComboBox());

        if (options["callback_params"]) {
          abm.setChooseButtonCallBackParams(options["callback_params"]);
        }
      }
      else
      {
        abm.setChooseComboBox(this.getComboBox());
      }

      this.setAbm(abm);
    }
    catch(e)
    {
      inventario.window.Mensaje.mensaje(e);
    }
  },




  /*
      *****************************************************************************
         PROPERTIES
      *****************************************************************************
      */

  properties :
  {
    comboBox : { check : "Object" },
    button : { check : "Object" },

    abm :
    {
      check    : "Object",
      init     : null,
      nullable : true
    },

    url :
    {
      check : "String",
      init  : "productos"
    }
  },




  /*
      *****************************************************************************
         MEMBERS
      *****************************************************************************
      */

  members :
  {
    /**
     * TODOC
     *
     * @return {void} 
     */
    activar : function() {
      this._create();
    },


    /**
     * TODOC
     *
     * @param vista {var} TODOC
     * @return {void} 
     */
    setVistaAbm : function(vista)
    {
      vista = (vista ? vista : "");
      this.getAbm().setVista(vista);
    },


    /**
     * TODOC
     *
     * @return {void} 
     */
    _create : function()
    {
      try {
        this.getAbm().show();
      } catch(e) {
        inventario.window.Mensaje.mensaje(e);
      }
    }
  }
});