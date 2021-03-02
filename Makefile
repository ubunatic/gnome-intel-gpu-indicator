.PHONY: help build install uninstall debug restart develop

EXTENSION=intel-gpu-indicator
ZIPFILE=$(EXTENSION).zip
PREFIX=~/.local/share/gnome-shell/extensions/

help:
	# make targets
	# ============
	#
	#   build     build the extension and zip it
	#   install   install the extension in ~/.local
	#   uninstall uininstall the extension from ~/.local
	#   debug     start watching gnome-shell logs
	#   restart   soft-restart gnome-shell (Xorg only)
	#   develop   same as `make build install restart debug`
	#
	# For development run `make build install debug`.
	# This will build and install the current extension and
	# start watching the gnome-shell logs.

build: $(ZIPFILE)

$(ZIPFILE): src
	glib-compile-schemas src/schemas/
	cd src/ && zip -r $@ *
	mv src/$@ .

install: $(ZIPFILE)
	mkdir -p ~/.local/share/gnome-shell/extensions/$(EXTENSION)
	cp -r src/* ~/.local/share/gnome-shell/extensions/$(EXTENSION)/
	#
	# ATTENTION: Please reload your changed extension!
	#
	#   Xorg:    Press Alt+F2 and run `r` to restart Gnome Shell
	#   Wayland: Log out and log in again
	#

uninstall:
	rm -rf ~/.local/share/gnome-shell/extensions/$(EXTENSION)

debug:
	journalctl /usr/bin/gnome-shell -f -o cat

restart:
	# Run gdbus equivalent of Alt+F2 then r+Enter
	gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval 'Meta.restart(_("Restarting…"))'

develop: build install restart debug
