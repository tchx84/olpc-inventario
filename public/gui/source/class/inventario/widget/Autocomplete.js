/**
 *  author: crodas (crodas@member.fsf.org)
 *
 *  GPL
 */
qx.Class.define("inventario.widget.Autocomplete",
{
  extend : qx.ui.container.Composite,

  construct: function(elements)
  {
    this.base(arguments, new qx.ui.layout.VBox(5));
    this.elements = elements;
    this.setMaxWidth(250);
    this.setAlignX('right');
    this.setAlignY('top');

    this.__textfield = new qx.ui.form.TextField();
    this.__list = new qx.ui.form.List();

    this.__popup = new qx.ui.popup.Popup(new qx.ui.layout.VBox(20)).set({
      //backgroundColor: "#DFFAD3",
      padding: [2, 4],
      offset : 0,
      position : "bottom-left"
    });

    this.add(new qx.ui.basic.Label(this.tr("Quick access")));

    this.__list.hide();
    this.__textfield.setLiveUpdate(true);
    this.add(this.__textfield);

    this.__popup.add(this.__list);
    this.__popup.setMinWidth(this.__textfield.getWidth());
    this.__list.setMinWidth(this.__textfield.getWidth());

    this.__textfield.addListener("changeValue", this._onChange, this);
    this.__textfield.addListener("keypress", this._onTextKeypress, this);
    this.__list.addListener("keypress", this._onListKeypress, this);
    this.__list.addListener("disappear", this._onListDisappear, this);
  },

  destruct : function() {
    this._disposeObjects("__popup");
  },

  members:
  {
    _addData: function(value) {
      this.elements.concat(value);
    },

    _onTextKeypress: function(e) {
      if (this.__list.getVisibility() != 'visible')
        return false;

      switch (e.getKeyIdentifier()) {
      case 'Enter':
        var select = this.__list.getSelection();
        if (select.length != 1)
          return;
        var f = select[0].getUserData("callback_function");
        var context = select[0].getUserData("callback_context");
        f.call(context);
        this.__popup.hide();
        this.__list.hide();

        break;
      case 'Down':
        var items = this.__list.getSelectables();
        if (items.length == 0)
          return; /* it should never happen */
        this.__list.setSelection([ items[0] ]);
        this.__list.focus();
        this.__lastKey = 0;
      }
    },

    _onListKeypress: function(e) {
      var select = this.__list.getSelection();
      if (select.length != 1)
        return;

      switch (e.getKeyIdentifier()) {
      case 'Enter':
        var f = select[0].getUserData("callback_function");
        var context = select[0].getUserData("callback_context");
        f.call(context);
        this.__popup.hide();
        this.__list.hide();
        break;
      case 'Up':
        if (select[0].getModel() == this.__lastKey && this.__lastKey == 0) {
          this.__textfield.focus();
          this.__list.resetSelection();
        }
        break;
      }
      this.__lastKey = select[0].getModel();
    },

    _clearListElements : function(e) {
      // Remove children from list in reverse order to avoid issues with
      // in-place array modification
      var children = this.__list.getChildren();
      for (var i = children.length - 1; i >= 0; i--) {
        var child = children[i];
        this.__list.removeAt(i);
        child.dispose();
      }
    },

    _onListDisappear : function(e) {
      this._clearListElements();
    },

    _onChange: function(e) {
      var rawData = [];
      var text    = this.__textfield.getValue().toLowerCase();
      this._clearListElements();

      for (var i in this.elements)
        if (this.elements[i].label.toLowerCase().match(text))
          rawData.push(this.elements[i]);
            
      if (rawData.length > 0 && text.length > 0) {
        var size = rawData.length > 10 ? 10 : rawData.length;
        this.__list.setHeight(parseInt(25 * (size + 0.2)));
        for (var i in rawData) {
          var _item = new qx.ui.form.ListItem(rawData[i].label, "", i);
          _item.setUserData("callback_function", rawData[i].callback);
          _item.setUserData("callback_context", rawData[i].context);
          this.__list.add(_item);
          /* select the first element */
          if (i==0)
            this.__list.setSelection([_item]);
          if (parseInt(i)+1 >= size)
            break;
        }

        this.__list.show();
        this.__popup.placeToWidget(this.__textfield);
        this.__popup.show();
        this.__popup.setWidth(250);
      } else {
        this.__popup.hide();
        this.__list.hide();
      }
    }
  }
});

