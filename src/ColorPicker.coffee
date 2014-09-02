Ext.define 'Ext.ux.ColorPicker',
  extend: 'Ext.form.field.Picker'

  alternateClassName: 'WR.component.ColorPicker'
  alias: 'widget.color-picker'

  fieldStyle:
    color      : 'inherit'
    background : 'transparent'

  invalidText  : "Colors must be in a the hex format #FFFFFF.",
  regex        : /^\#[0-9A-F]{6}$/i,

  triggerCls   : Ext.baseCSSPrefix + 'form-arrow-trigger',
  allowBlank   : yes

  alignOnSelect: no

  initComponent: ->
    Ext.apply @,
      listeners:
        change : (picker, v) -> @colorSelect(picker, v) if picker.isValid()
        select : -> @colorizeField()
        afterrender: -> @colorizeField()
        scope  : @

    @callParent arguments

  createPicker: ->
    colorWheelCfg =
      xtype       : 'color-wheel'
      pickerField : @
      renderTo    : document.body
      floating    : true
      hidden      : true
      focusOnShow : true

    @picker = Ext.widget colorWheelCfg

    @mon @picker,
      select: 'colorSelect'
      scope : @

    @picker

  colorizeField: ->
    picker = @getPicker()
    raw    = picker.getRawValue()

    if !Ext.isArray raw
      h2d = (d) -> parseInt d, 16
      val = @value.replace '#', ''
      raw = [
        h2d val.slice(1, 3)
        h2d val.slice(3, 5)
        h2d val.slice(5)
      ]

    avg = (raw[0] + raw[1] + raw[2]) / 3

    if @rendered
      @bodyEl.setStyle('background', @value)
      @bodyEl.setStyle('color', if avg > 128 then '#000' else '#FFF')

  colorSelect:(picker, color) ->
    @setValue color.toUpperCase()
    @fireEvent 'select', @, color

    @alignPicker() if @alignOnSelect

Ext.define 'Ext.ux.ColorWheel',
  alias: 'widget.color-wheel'
  extend: 'Ext.ColorPalette'

  canvasSupported: yes

  height   : 200
  minWidth : 200

  itemCls           : Ext.baseCSSPrefix + 'color-picker',
  canvasWrapperCls  : Ext.baseCSSPrefix + 'canvas-wheel-container'
  wheelCanvasCls    : Ext.baseCSSPrefix + 'canvas-wheel'
  gradientCanvasCls : Ext.baseCSSPrefix + 'canvas-gradient'

  wheelImage    : 'img/wheel.png'
  gradientImage : 'img/gradient.png'

  renderTpl: [
    "<div class='{canvasWrapperCls}'></div>"
  ]

  initComponent: ->
    @stylesheet = Ext.util.CSS.createStyleSheet(
        ".#{@canvasWrapperCls} canvas { position: absolute; top: 0; left: 0; cursor: pointer;}" +
        ".#{@gradientCanvasCls}  { z-index: 0; }" +
        ".#{@wheelCanvasCls}  { z-index: 1; }" +
        ".#{@itemCls} { position: relative; overflow: hidden; }"
    )

    @wheelImg = ((src)->
      img        = new Image()
      img.onload = Ext.emptyFn
      img.src    = src
      img
    )(@wheelImage)

    @gradientImage = ((src)->
      img        = new Image()
      img.onload = Ext.emptyFn
      img.src    = src
      img
    )(@gradientImage)

    @callParent arguments

  initRenderData: ->
    data = canvasWrapperCls: @canvasWrapperCls
    return Ext.apply @callParent(), data

  onRender: ->
    @callParent arguments
    dh = Ext.DomHelper

    ### Draw Wheel ###

    @wheelWrapper =  @el.child('.' + @canvasWrapperCls)
    @wheel       = dh.append @wheelWrapper,
      tag    : 'canvas',
      width  : @getWidth(),
      cls    : @wheelCanvasCls,
      height : @getHeight()


    ### Draw Gradient ###

    @gradient = dh.append @wheelWrapper,
      tag    : 'canvas',
      width  : @getWidth(),
      cls    : @gradientCanvasCls,
      height : @getHeight()

    @gradient = G_vmlCanvasManager.initElement @gradient unless typeof G_vmlCanvasManager is 'undefined'

    Ext.defer (->
      @wheel.getContext('2d').drawImage(@wheelImg, 0, 0)
      @fillGradient(@value)
    ), 10, @

    @mon @el, 'click', @parseImageColor, @

  afterRender: ->
    if @canvasSupported
      @wheelDT =  new Ext.dd.DragTracker el: @wheel
      @wheelDT.on 'drag', @wheelTrack ,@
    @callParent arguments

  wheelTrack: (tracker, e) ->
    @parseImageColor(e, tracker.dragTarget)

  fillGradient:(val) ->
    context = @gradient.getContext('2d')
    center  = [97.5, 98]

    context.clearRect(0, 0, @gradient.width, @gradient.height)
    context.beginPath()

    context.fillStyle   = val
    context.strokeStyle = val

    context.arc(center[0], center[0], 65, 0, 2*Math.PI, false)

    context.closePath()
    context.fill()

    @gradient.getContext('2d').drawImage(@gradientImage, 33, 32)

  parseImageColor: (e, target) ->
    context  = @wheel.getContext('2d')
    position = Ext.fly(target).getXY()
    position = [
        e.getXY()[0] - position[0]
        e.getXY()[1] - position[1]
    ]

    try
      data = context.getImageData(position[0], position[1], 1, 1).data
    catch e
      return

    if data[3] is 0
      context = @gradient.getContext('2d')
      data    = context.getImageData(position[0], position[1], 1, 1).data
      if data[3] is 0 then return
      val = @hexValue(data[0], data[1], data[2])
    else
      val = @hexValue(data[0], data[1], data[2])
      @fillGradient(val)

    @rawValue = data
    @select(val)

  select: (color, suppressEvent) ->
    @value = color if color isnt @value
    @fireEvent('select', @, color) unless suppressEvent is yes

  getRawValue: -> @rawValue
  getValue   : -> @value

  hexValue : (r,g,b) ->
    "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
