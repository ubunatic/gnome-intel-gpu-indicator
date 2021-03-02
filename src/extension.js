const { Clutter, Gio, GLib, GObject, Soup } = imports.gi
const St = imports.gi.St
const Dialog = imports.ui.dialog
const Lang = imports.lang
const Bind = Lang.bind
const Main = imports.ui.main
const Mainloop = imports.mainloop
const ModalDialog = imports.ui.modalDialog
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const ByteArray = imports.byteArray
const Gtk = imports.gi.Gtk
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Gi = Me.imports.gicons
const Cmd = Me.imports.commands
const Ui = Me.imports.ui
const Exec = Me.imports.exec
const Cfg = Me.imports.settings

const MODE_EMPTY  = "empty"
const MODE_GPU_NAME = "gpu"
const MODE_TEMP   = "temp"
const MODE_POWER  = "power"
const MODE_VIDEO  = "video"
const MODE_RENDER = "render"
const MODE_ALL    = "all"

let defaultDevice = "none"
let timeout
let sensorIndicator
let _Error = _("Error")

const SensorIndicator = new Lang.Class({
  Name: "SensorIndicator",
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "SensorIndicator")

    this.statusIcon = Ui.NewStatusIcon(Gi.GiCard)
    this.panelTitle = new St.Label({y_align: Clutter.ActorAlign.CENTER, text: ""})

    let topBox = new St.BoxLayout()
    topBox.add_actor(this.statusIcon)
    topBox.add_actor(this.panelTitle)
    this.add_actor(topBox)

    this.nameModeItem = this._addMenuItem("Show GPU Name", Gi.GiChip, Bind(this, this._activateGPUNameMode))
  
    this._addSeparator()
    this.powerModeItem   = this._addMenuItem("Show Power Usage", Gi.GiPower,  Bind(this, this._activatePowerMode))
    this.renderModeItem  = this._addMenuItem("Show Render Load", Gi.GiCard,   Bind(this, this._activateRenderMode))
    this.videoModeItem   = this._addMenuItem("Show VA Load", Gi.GiVAccel, Bind(this, this._activateVideoMode))
  
    /* Root Access Variant Experiments
    this.videoModeItem   = this._addMenuItem("TEST: non root",     Gi.GiVAccel, Bind(this, this._activateNonRoot))
    this.vsudoModeItem   = this._addMenuItem("TEST: sudo",         Gi.GiVAccel, Bind(this, this._activateSudo))
    this.vrootModeItem   = this._addMenuItem("TEST: request root", Gi.GiVAccel, Bind(this, this._activateRoot))
    /**/
  
    // this.tempModeItem = this._addMenuItem("Show Temperature", Gi.GiThermo, Bind(this, this._activateTempMode))

    this._addSeparator()
    this.allModeItem   = this._addMenuItem("Show All", Gi.GiCard,  Bind(this, this._activateAllMode))
    // this.detachItem = this._addMenuItem("Detach",   Gi.GiCard,  Bind(this, this._activateDetach))
    this.quitItem      = this._addMenuItem("Quit",     Gi.GiError, Bind(this, this._activateStop))
  
    this.settings = Cfg.getSettings()
    this.device = defaultDevice
    this.root = Exec.ROOT_SUDO
    this._setTitleMode(MODE_GPU_NAME)
  },

  _activateNonRoot: function() { this.root = Exec.ROOT_NONE; this._setTitleMode(MODE_VIDEO) },
  _activateRoot:    function() { this.root = Exec.ROOT_ASK;  this._setTitleMode(MODE_VIDEO) },
  _activateSudo:    function() { this.root = Exec.ROOT_SUDO; this._setTitleMode(MODE_VIDEO) },

  _activateGPUNameMode:  function() { this._setTitleMode(MODE_GPU_NAME) },
  _activatePowerMode:    function() { this._setTitleMode(MODE_POWER) },  
  _activateRenderMode:   function() { this._setTitleMode(MODE_RENDER) },
  _activateTempMode:     function() { this._setTitleMode(MODE_TEMP) },
  _activateVideoMode:    function() { this._setTitleMode(MODE_VIDEO) },
  _activateAllMode:      function() { this._setTitleMode(MODE_ALL) },
  _activateDetach:       function() { /* TODO: implement detach */ },
  _activateStop:         function() { this._stopGpuTop(); this._clearAfter(1.0) },

  _addSeparator: function() { this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()) },
  _addMenuItem: function (text, gicon, activate) {
    let item = new PopupMenu.PopupImageMenuItem(text, gicon)
    this.menu.addMenuItem(item)
    if (activate != null) {
      item.connect("activate", activate)
    }
    return item
  },

  _setGIcon: function (gicon) { this.statusIcon.gicon = gicon },
  _setTitle: function (text, gicon=null)  {
    this.panelTitle.set_text(text)
    if (gicon != null) {
      this._setGIcon(gicon)
    }
  },

  /*
  _askShowAll: function () {
    let cb = (ok) => ok && this._setTitleMode(MODE_ALL)
    let dialog = new Ui.YesNoDialog("Show All GPU Sensors?", cb);
    dialog.open(global.get_current_time());    
  },
  */

  _showGPUName: function () {
    let gpus = Cmd.ListGPUs()
    log("gpus", gpus)
    if(gpus.length > 0) {
      this._setTitle(gpus[0], Gi.GiCard)
      return
    }

    this._setTitle(_("No GPU"), Gi.GiError)
  },

  _stopGpuTop: function () {
    Cmd.StopGpuTop()
  },

  _startGpuTop: function () {
    if (Cmd.gpu_top_pipe != null) {
      log("gpu top is already running")
      return
    }

    switch (this.root) {
      case Exec.ROOT_SUDO: this._setTitle(_("Running as root..."),        Gi.GiClock); break
      case Exec.ROOT_ASK:  this._setTitle(_("Requesting root access..."), Gi.GiClock); break
      default:             log("running GPU commands as non-root user")
    }

    let handle_row = (row) => {
      if (row == null) return
      
      /* Data Example
      Position:    0    1        2   3     4      5      6       7   8   9      10  11  12      13  14  15      16  17  18
      Field:     Freq MHz      IRQ RC6 Power     IMC MiB/s           RCS/0           BCS/0           VCS/0          VECS/0 
      Sub Field: req  act       /s   %     W     rd     wr       %  se  wa       %  se  wa       %  se  wa       %  se  wa 
                   0    0        0   0  0.00   2008     73    0.00   0   0    0.00   0   0    0.00   0   0    0.00   0   0 
                  38   30       41  97  0.08   1278     86    1.10   0   0    0.00   0   0    0.00   0   0    0.00   0   0 
                  24   24       65  95  0.03   1493     72    2.09   0   0    0.00   0   0    0.00   0   0    0.00   0   0
      */

      // log("vaccel data", data, data.length)
      let text = _("No Data")
      let gicon = Gi.GiError      
      let index, unit
      switch (this._mode) {
        case MODE_RENDER: index = 7;  unit = "%"; gicon = Gi.GiCard; break
        case MODE_POWER:  index = 4;  unit = "W"; gicon = Gi.GiPower; break
        case MODE_TEMP:   index = 4;  unit = "W"; gicon = Gi.GiThermo; break // TODO: how to read temps?
        case MODE_VIDEO:  index = 13; unit = "%"; gicon = Gi.GiVAccel; break
        case MODE_ALL:
          if (row.length > 13) {
            gicon = Gi.GiPower
            // TODO: pad text or find a way to have a fixed size output box
            text = `${row[4]}W  ⚙ ${row[7]}%  🎞 ${row[13]}%`
          }
          break
        default: return
      }
      
      if (this._mode != MODE_ALL && row.length > index) {
         text = `${row[index]}${unit}`
      }
      this._setTitle(text, gicon)
    }

    let handle_done = (err) => {
      if (err) {
        logError(err)
        this._setTitle(_Error, Gi.GiError)
        this._clearAfter(10.0)
        return
      }
    }

    Cmd.StartGpuTop(handle_row, handle_done, this.root)
  },

  _clearAfter: function (seconds=5.0) {
    timeout = Mainloop.timeout_add_seconds(seconds, () => {
      this._setTitleMode(MODE_EMPTY)
      return false
    })
  },

  _toggleMenuItem: function (item) {
    /* Example to hide and show menu items
    item.visible = !item.visible
    item.setSensitive(item.visible)
    */
  },

  _setTitleMode: function (mode) {
    // TODO: stop running processes if needed
    this._stopGpuTop()
    switch (mode) {
      case MODE_EMPTY:
        this._setTitle("", Gi.GiCard)
        break
      case MODE_GPU_NAME:
        this._showGPUName()
        break
      case MODE_RENDER:
      case MODE_VIDEO:
      case MODE_TEMP:
      case MODE_POWER:
      case MODE_ALL:
        this._startGpuTop()
        break
      default:
        this._setTitle(_Error, Gi.GiError)
        Main.notifyError("Invalid Indicator Mode", mode)
        timeout = Mainloop.timeout_add_seconds(5.0, () => this._setTitleMode(MODE_GPU_NAME))
        return
    }
    this._mode = mode
  },
})

function enable() {
  sensorIndicator = new SensorIndicator()
  Main.panel.addToStatusArea(
    "sensor-indicator",
    sensorIndicator
  )
}

function disable() {
  Mainloop.source_remove(timeout)
  sensorIndicator._stopGpuTop()
  sensorIndicator.destroy()
}
