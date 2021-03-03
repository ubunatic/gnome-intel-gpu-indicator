# Development
First run `make help` to know what development helpers are available.
Then make sure you understand how the extension works by reading the main source file [extension.js](src/extension.js).

## UI Setup

On startup of the Gnome Shell or when enabling the extension manually, the Gnome Shell calls `enable()` in [extension.js](src/extension.js).
This is where you set up the UI elements and register all actions.

Each action then may start one or more system processes to run the binaries that are required to
collect hardware metrics. Some of the binaries require root access (also see [README.md](README.md).)

## Reading Data from SubProcesses

**ATTENTION**: Be very careful when spawning processes and make sure to start at most one process per binary.

Running one-time commands is straight forward (see `Exec.Run` in [src/exec.js](src/exec.js)).

However, often you need to collect data continuously, which can be easily done wrong in Gnome Shell extensions, since having `wait_finish`ed a pending `wait_async` does not guarantee that the process actually stopped. You may end up with many instances of the same process littering your system.

<!--
TODO uj: file bug!
-->

Use the provided `Exec.Pipe` class from [src/exec.js](src/exec.js) as this provides methods to safely stop a pipe AND also stop reading from the stdout pipe of the process, which is required to actually stop the subprocess. See [src/commands.js](src/commands.js) how to use it.

## Data Sources
This section describes how the extension obtains hardware metrics.

### Intel GPUs
For Intel GPUs there is no user-land tool to get the data. The most commonly used tool is
`intel_gpu_top` from the `intel-gpu-tools` package. It must be run as root.

```
sudo intel_gpu_top -l
```

The CSV output used by the extension is the following.

```
 Freq MHz      IRQ RC6 Power     IMC MiB/s           RCS/0           BCS/0           VCS/0          VECS/0 
 req  act       /s   %     W     rd     wr       %  se  wa       %  se  wa       %  se  wa       %  se  wa 
   0    0        0  98  0.00   1563     24    0.00   0   0    0.00   0   0    0.00   0   0    0.00   0   0 
  26   26       53  96  0.11   1405    161    2.68   0   0    0.00   0   0    0.00   0   0    0.00   0   0
```

The extensions currently reads the Power, RCS, and VCS values.

<!---
## Nvidia GPUs

## AMD GPUs

## Other
-->

## Icons

Status icons should be named `<icon-name>-symbolic.svg`. The "symbolic" ensures that unwanted SVG colors are ignored and the colorscheme of your Desktop is applied.
If you create icons yourself, make sure they are "optimized".

<!--
TODO: add Inkscape CLI command to optimize SVGs
-->

Also Icons should be square and the content should be fit in a way that make them nice status icons. This will need some tweaking as aligning the content in the middle of the icon not always gives the best result.

Status icons can become very tiny on big screens, avoid having too much details. These won't be seen anyways. Less is more!


