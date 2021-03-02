Sensors Indicator
=================
Show 3D Rendering Load, Video Acceleration Load, and Power Usage of Intel GPUs
via `sudo intel_gpu_top -l`.


Requirements
------------
You must allow your Desktop user to run `sudo intel_gpu_top` without password prompt.
This can be easily set up with a new sudoers files such as `/etc/sudoers.d/10-intel_gpu_top`:
```
your_user_name ALL = (root) NOPASSWD: /usr/bin/intel_gpu_top
```
Make sure the binary path in the sudoers file points to the actual `intel_gpu_top` binary in your system.


Development
-----------
Run `make help` for details.


Icons
-----

All icons are from font-awesome: http://fontawesome.io via https://github.com/encharm/Font-Awesome-SVG-PNG.
