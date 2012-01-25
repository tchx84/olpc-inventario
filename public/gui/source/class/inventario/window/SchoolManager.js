
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
// SchoolManager.js
// Just a full of views for a school directors.
// Author: Martin Abente (tincho_02@hotmail.com | mabente@paraguay.org)
// Paraguay Educa 2009
qx.Class.define("inventario.window.SchoolManager",
{
  extend : inventario.window.AbstractWindow,

  construct : function(page, title)
  {
    this.base(arguments, page);
    if (typeof (title) != "undefined") this.setTitle(title);
  },

  statics :
  {
    launch : function(page, place_id, title)
    {
      var schoolManager = new inventario.window.SchoolManager(page, title);
      schoolManager.setPlaceId(parseInt(place_id));
      schoolManager.setPage(page);
      schoolManager.setUsePopup(true);
      schoolManager.show();
    }
  },

  properties :
  {
    initialDataUrl :
    {
      check : "String",
      init  : ""
    },

    placeId : { check : "Number" },
    verticalBox : { check : "Object" },

    title :
    {
      check : "String",
      init  : ""
    }
  },

  members :
  {
    show : function()
    {
      var vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox(20), { height : 200 });
      this.setVerticalBox(vbox);

      var tabView = new qx.ui.tabview.TabView();
      tabView.setWidth(500);

      // General Information Tab
      var infoPage = new qx.ui.tabview.Page(qx.locale.Manager.tr("General Information"), "icon/16/apps/utilities-help.png");
      infoPage.setLayout(new qx.ui.layout.VBox());
      var infoAbm = new inventario.widget.SchoolInfo(null, this.getPlaceId().toString());
      infoAbm.setPage(infoPage);
      infoAbm.show();
      tabView.add(infoPage);

      // Section's Tab
      var sectionsPage = new qx.ui.tabview.Page(qx.locale.Manager.tr("Grades"), "icon/16/apps/utilities-terminal.png");
      sectionsPage.setLayout(new qx.ui.layout.VBox());
      var sectionsAbm = new inventario.window.Abm2(null, inventario.widget.Url.getUrl("localidades"));
      sectionsAbm.setVista(this.getPlaceId().toString());
      sectionsAbm.setPage(sectionsPage);
      sectionsAbm.show();
      tabView.add(sectionsPage);

      // Teacher's tab
      var teachersPage = new qx.ui.tabview.Page(qx.locale.Manager.tr("Teachers"), "icon/16/apps/utilities-notes.png");
      teachersPage.setLayout(new qx.ui.layout.VBox());
      var teachersAbm = new inventario.window.Abm2(null, inventario.widget.Url.getUrl("personas"));
      teachersAbm.setVista("teacher_" + this.getPlaceId().toString());
      teachersAbm.setPage(teachersPage);
      teachersAbm.show();
      tabView.add(teachersPage);

      // Student's Tab
      var studentsPage = new qx.ui.tabview.Page(qx.locale.Manager.tr("Students"), "icon/16/apps/utilities-notes.png");
      studentsPage.setLayout(new qx.ui.layout.VBox());
      var studentsAbm = new inventario.window.Abm2(null, inventario.widget.Url.getUrl("personas"));
      studentsAbm.setVista("student_" + this.getPlaceId().toString());
      studentsAbm.setPage(studentsPage);
      studentsAbm.show();
      tabView.add(studentsPage);

      // School Servers Tab
      var serversPage = new qx.ui.tabview.Page(qx.locale.Manager.tr("Servers"), "icon/16/apps/utilities-notes.png");
      serversPage.setLayout(new qx.ui.layout.VBox());
      var serversAbm = new inventario.window.Abm2(null, inventario.widget.Url.getUrl("school_infos"));
      serversAbm.setVista("place_" + this.getPlaceId().toString());
      serversAbm.setPage(serversPage);
      serversAbm.show();
      tabView.add(serversPage);

      // Google Maps Tab
      var mapPage = new qx.ui.tabview.Page(qx.locale.Manager.tr("Map"), "icon/16/apps/utilities-help.png");
      mapPage.setLayout(new qx.ui.layout.VBox());
      var mapAbm = new inventario.widget.MapLocator(Number(this.getPlaceId()), true, 600, 500, false);
      mapPage.add(mapAbm);
      mapAbm.launch();
      tabView.add(mapPage);

      this.getVerticalBox().add(tabView);

      this._doShow();
    },

    _doShow : function()
    {
      this._doShow2(this.getVerticalBox());
      this.setWindowTitle(this.getTitle());
    },

    _createInputs : function() {},

    _setHandlers : function() {},

    _createLayout : function() {},

    _loadInitialData : function() {},

    _loadInitialDataResp : function(remoteData, params) {}
  }
});