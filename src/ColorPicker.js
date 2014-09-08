// Generated by CoffeeScript 1.7.1
(function() {
  Ext.define('WR.application.component.widget.ColorPicker', {
    extend: 'Ext.form.field.Picker',
    alternateClassName: 'WR.component.ColorPicker',
    alias: 'widget.color-picker',
    fieldStyle: {
      color: 'inherit',
      background: 'transparent'
    },
    invalidText: "Colors must be in a the hex format #FFFFFF.",
    regex: /^\#[0-9A-F]{6}$/i,
    triggerCls: Ext.baseCSSPrefix + 'form-arrow-trigger',
    allowBlank: true,
    alignOnSelect: false,
    initComponent: function() {
      Ext.apply(this, {
        listeners: {
          change: function(picker, v) {
            if (picker.isValid()) {
              return this.colorSelect(picker, v);
            }
          },
          select: function() {
            return this.colorizeField();
          },
          afterrender: function() {
            return this.colorizeField();
          },
          scope: this
        }
      });
      return this.callParent(arguments);
    },
    createPicker: function() {
      var colorWheelCfg;
      colorWheelCfg = {
        xtype: 'color-wheel',
        pickerField: this,
        renderTo: document.body,
        floating: true,
        hidden: true
      };
      this.picker = Ext.widget(colorWheelCfg);
      this.mon(this.picker, {
        select: 'colorSelect',
        scope: this
      });
      return this.picker;
    },
    colorizeField: function() {
      var avg, h2d, picker, raw, val;
      picker = this.getPicker();
      raw = picker.getRawValue();
      if (!Ext.isArray(raw)) {
        h2d = function(d) {
          return parseInt(d, 16);
        };
        val = this.value.replace('#', '');
        raw = [h2d(val.slice(1, 3)), h2d(val.slice(3, 5)), h2d(val.slice(5))];
      }
      avg = (raw[0] + raw[1] + raw[2]) / 3;
      if (this.rendered) {
        this.bodyEl.setStyle('background', this.value);
        return this.bodyEl.setStyle('color', avg > 128 ? '#000' : '#FFF');
      }
    },
    colorSelect: function(picker, color) {
      this.setValue(color.toUpperCase());
      this.fireEvent('select', this, color);
      if (this.alignOnSelect) {
        return this.alignPicker();
      }
    },
    onExpand: function() {
      if (!this._canvasRendered) {
        this.picker.drawPalette();
        return this._canvasRendered = true;
      }
    }
  });

  Ext.define('WR.application.component.widget.ColorWheel', {
    alias: 'widget.color-wheel',
    extend: 'Ext.ColorPalette',
    canvasSupported: true,
    height: 200,
    minWidth: 200,
    itemCls: Ext.baseCSSPrefix + 'color-picker',
    canvasWrapperCls: Ext.baseCSSPrefix + 'canvas-wheel-container',
    wheelCanvasCls: Ext.baseCSSPrefix + 'canvas-wheel',
    gradientCanvasCls: Ext.baseCSSPrefix + 'canvas-gradient',
    wheelImage: 'assets/img/wheel.png',
    gradientImage: 'assets/img/gradient.png',
    renderTpl: ["<div class='{canvasWrapperCls}'></div>"],
    initComponent: function() {
      this.stylesheet = Ext.util.CSS.createStyleSheet(("." + this.canvasWrapperCls + " canvas { position: absolute; top: 0; left: 0; cursor: pointer;}") + ("." + this.gradientCanvasCls + "  { z-index: 90; }") + ("." + this.wheelCanvasCls + "  { z-index: 99; }") + ("." + this.itemCls + " { position: relative; overflow: hidden; }"));
      this.wheelImg = (function(src) {
        var img;
        img = new Image();
        img.onload = Ext.emptyFn;
        img.src = src;
        return img;
      })(this.wheelImage);
      this.gradientImage = (function(src) {
        var img;
        img = new Image();
        img.onload = Ext.emptyFn;
        img.src = src;
        return img;
      })(this.gradientImage);
      return this.callParent(arguments);
    },
    initRenderData: function() {
      var data;
      data = {
        canvasWrapperCls: this.canvasWrapperCls
      };
      return Ext.apply(this.callParent(), data);
    },
    onRender: function() {
      var dh;
      this.callParent(arguments);
      dh = Ext.DomHelper;

      /* Draw Wheel */
      this.wheelWrapper = this.el.child('.' + this.canvasWrapperCls);
      this.wheel = dh.append(this.wheelWrapper, {
        tag: 'canvas',
        width: this.getWidth(),
        cls: this.wheelCanvasCls,
        height: this.getHeight()
      });

      /* Draw Gradient */
      this.gradient = dh.append(this.wheelWrapper, {
        tag: 'canvas',
        width: this.getWidth(),
        cls: this.gradientCanvasCls,
        height: this.getHeight()
      });
      return this.mon(this.el, 'click', this.parseImageColor, this);
    },
    afterRender: function() {
      if (this.canvasSupported) {
        this.wheelDT = new Ext.dd.DragTracker({
          el: this.wheel
        });
        this.wheelDT.on('drag', this.wheelTrack, this);
      }
      return this.callParent(arguments);
    },
    wheelTrack: function(tracker, e) {
      return this.parseImageColor(e, tracker.dragTarget);
    },
    drawPalette: function() {
      this.wheel.getContext('2d').drawImage(this.wheelImg, 0, 0);
      return this.fillGradient(this.getValue());
    },
    fillGradient: function(val) {
      var center, context;
      context = this.gradient.getContext('2d');
      center = [97.5, 98];
      context.clearRect(0, 0, this.gradient.width, this.gradient.height);
      context.beginPath();
      context.fillStyle = val;
      context.strokeStyle = val;
      context.arc(center[0], center[0], 65, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
      return context.drawImage(this.gradientImage, 33, 32);
    },
    parseImageColor: function(e, target) {
      var context, data, position, val;
      context = this.wheel.getContext('2d');
      position = Ext.fly(target).getXY();
      position = [e.getXY()[0] - position[0], e.getXY()[1] - position[1]];
      try {
        data = context.getImageData(position[0], position[1], 1, 1).data;
      } catch (_error) {
        e = _error;
        return;
      }
      if (data[3] === 0) {
        context = this.gradient.getContext('2d');
        data = context.getImageData(position[0], position[1], 1, 1).data;
        if (data[3] === 0) {
          return;
        }
        val = this.hexValue(data[0], data[1], data[2]);
      } else {
        val = this.hexValue(data[0], data[1], data[2]);
        this.fillGradient(val);
      }
      this.rawValue = data;
      return this.select(val);
    },
    select: function(color, suppressEvent) {
      if (color !== this.value) {
        this.value = color;
      }
      if (suppressEvent !== true) {
        return this.fireEvent('select', this, color);
      }
    },
    getRawValue: function() {
      return this.rawValue;
    },
    getValue: function() {
      return this.value;
    },
    hexValue: function(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
  });

}).call(this);
