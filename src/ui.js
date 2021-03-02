const { Clutter, St, Gio, GLib, GObject, Soup } = imports.gi
const ModalDialog = imports.ui.modalDialog
const Dialog = imports.ui.dialog

var Yes = _("Yes")
var No = _("No")

var YesNoDialog = GObject.registerClass(
  class SensorDialog extends ModalDialog.ModalDialog {
    _init(title, callback) {
      super._init({ styleClass: "extension-dialog" })
      this._callback = callback

      this.contentLayout.add(new Dialog.MessageDialogContent({ title: title }))

      this.setButtons([
        {
          label: Yes,
          key: Clutter.Escape,
          action: this._yes.bind(this),
        },
        {
          label: No,
          default: true,
          action: this._no.bind(this),
        },
      ])
    }

    _yes() {
      this._callback(true)
      this.close()
    }

    _no() {
      this._callback(false)
      this.close()
    }
  }
)

function NewStatusIcon(gicon) {
  let icon = new St.Icon({ style_class: "system-status-icon" })
  if (gicon) {
      icon.gicon = gicon
  }
  // TODO: check what  icon_name: "action-unavailable-symbolic.symbolic" does
  return icon
}

function NotifyError(command, err) {
  let title = "Command " + command + " failed"
  log(title, err)
  Main.notifyError(title, err.message)
}
