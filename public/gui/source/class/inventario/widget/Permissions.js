
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
// Permissions.js
// A Tree-like view of all Controller and methods for permissions settings.
// Author: Martin Abente (tincho_02@hotmail.com | mabente@paraguayeduca.org)
// 2009
qx.Class.define("inventario.widget.Permissions",
{
  extend : qx.ui.container.Composite,

  construct : function(tree)
  {
    this.base(arguments, new qx.ui.layout.VBox(20),
      {
        width  : 640,
        height : 480
      });
    this.tree = tree;
    this._createLayout();
  },

  properties :
  {
    treeRoot    : { check : "Object" },
    treeWidget  : { check : "Object" }
  },

  members :
  {
    // Since the subTrees are loaded on demand, some of them are not loaded to the wigets
    //   so its necesary to check wich of them are originary selected.
    _getSubTreeValues : function(controller)
    {
      var methods = new Array();
      var subTree = controller.getUserData("subTree");
      var mLen = subTree.length;

      for (var j=0; j<mLen; j++)
      {
        if (subTree[j].selected == true) {
          methods.push(subTree[j].name);
        }
      }

      return methods;
    },


    _changeSelection : function(state)
    {
      var selectedItem = this.getTreeWidget().getSelection()[0];

      if (selectedItem instanceof qx.ui.tree.TreeFolder)
      {
        var items = selectedItem.getChildren();

        for (var i in items)
        {
          var checkbox = items[i].getUserData("checkbox");

          if (checkbox != null) {
            checkbox.setValue(state);
          }
        }
      }
      else
      {
        alert(qx.locale.Manager.tr("The selected item is not a driver"));
      }
    },

    getTreeValues : function()
    {
      var returnTree = new Array();

      var controllers = this.getTreeRoot().getChildren();
      var cLen = controllers.length;

      for (var i=0; i<cLen; i++)
      {
        var folder = {};
        folder["name"] = controllers[i].getLabel();
        folder["methods"] = new Array();

        var methods = controllers[i].getChildren();
        var mLen = methods.length;

        if (mLen > 0)
        {
          for (var j=0; j<mLen; j++)
          {
            if (methods[j].getUserData("checkbox").getValue()) {
              folder["methods"].push(methods[j].getLabel());
            }
          }
        }
        else
        {
          // alert(controllers[i].getLabel());
          folder["methods"] = this._getSubTreeValues(controllers[i]);
        }

        if (folder["methods"].length > 0) {
          returnTree.push(folder);
        }
      }

      return returnTree;
    },

    _loadSubTree_cb : function(e)
    {
      var cWidget = this.getTreeWidget().getSelection()[0];

      // alert(cWidget);
      // if ( !(cWidget instanceof qx.ui.tree.TreeFolder) || cWidget.getOpen() == true ) {return;}
      var subTree = cWidget.getUserData("subTree");

      var mLen = subTree.length;

      for (var i=0; i<mLen; i++) {
        var method = new qx.ui.tree.TreeFile(subTree[i].name);

        var checkbox = new qx.ui.form.CheckBox();
        checkbox.setFocusable(false);
        checkbox.setValue(subTree[i].selected);
        method.addWidget(checkbox);
        method.setUserData("checkbox", checkbox);

        cWidget.add(method);
      }
    },

    _createLayout : function()
    {
      var scroller = new qx.ui.container.Scroll();

      scroller.set(
      {
        width  : 400,
        height : 300
      });

      var container = new qx.ui.container.Composite(new qx.ui.layout.Basic());
      container.setAllowGrowX(false);
      container.setAllowStretchX(false);
      scroller.add(container);

      var hbox = new qx.ui.container.Composite(new qx.ui.layout.HBox(20));

      var checksButton = new qx.ui.form.Button("+");

      checksButton.addListener("execute", function() {
        this._changeSelection(true);
      }, this);

      var unChecksButton = new qx.ui.form.Button("-");

      unChecksButton.addListener("execute", function() {
        this._changeSelection(false);
      }, this);

      var tree = new qx.ui.tree.Tree().set(
      {
        width  : 400,
        height : 300
      });

      this.setTreeWidget(tree);

      container.add(tree,
      {
        left : 0,
        top  : 0
      });

      var root = new qx.ui.tree.TreeFolder("Controladores");
      root.setOpen(true);
      tree.setRoot(root);

      this.setTreeRoot(root);

      var cLen = this.tree.length;

      for (var i=0; i<cLen; i++) {
        var controller = new qx.ui.tree.TreeFolder(this.tree[i].name);
        controller.setUserData("subTree", this.tree[i].methods);
        controller.addListenerOnce("dblclick", this._loadSubTree_cb, this);
        root.add(controller);
      }

      hbox.add(unChecksButton);
      hbox.add(checksButton);
      this.add(hbox);
      this.add(scroller, { flex : 1 });
    }
  }
});
