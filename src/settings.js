const Gio = imports.gi.Gio
const Me = imports.misc.extensionUtils.getCurrentExtension()

function getSettings() {
    let settings = Gio.SettingsSchemaSource.new_from_directory(
      Me.dir.get_child("schemas").get_path(),
      Gio.SettingsSchemaSource.get_default(),
      false
    ).lookup(
      "org.gnome.shell.extensions.intel-gpu-indicator",
      true
    );
    if (!settings) {
      throw new Error("Cannot find schemas");
    }
    return new Gio.Settings({ settings_schema: settings });
  }
  