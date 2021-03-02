
const { Gio, GLib } = imports.gi
const Main = imports.ui.main
const ByteArray = imports.byteArray
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Parser = Me.imports.parser

var ROOT_NONE = "non-root"
var ROOT_SUDO = "sudo"
var ROOT_ASK  = "ask-root"

const PIPE_CREATED = "created"
const PIPE_RUNNING = "running"
const PIPE_CLOSING = "closing"
const PIPE_FINISHED = "finished"

const ReadPipeWithoutCancellable = new Error("cannot safely read from Gio.DataInputStream without cancellable")
const UnhandledPipeOutput = new Error("Unhandled pipe output")
const DuplicatePipeStart = new Error("Cannot start a running Pipe")

function NewBashCommand(bashCode) {
  return ['bash', '-c', bashCode]
}

function NewCommand(command) {
  return command.split(/\s+/)
}

function isCanceled(err) {
  return err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)
}

function stream_line_async(stream, cancellable, handle_line) {
  if (cancellable == null) {
    throw ReadPipeWithoutCancellable
  }
  let handle_result = (stream, res) => {
    let finished = false, line = null
    try {
      line = stream.read_line_finish_utf8(res)[0]
      finished = (line == null)
    } catch (err) {
      finished = true
      if (!isCanceled(err)) {
        logError(err)
      }
    } finally {
      handle_line(line, finished)
      if (!finished) next()
    }
  }
  let next = () => stream.read_line_async(GLib.PRIORITY_LOW, cancellable, handle_result)
  next()
}

var Pipe = class Pipe {
  constructor(args, parser=Parser.jsonParser, root=ROOT_NONE) {
    this.args = args
    this.parser = parser
    this.root = root
    this.flags = Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    this.status = PIPE_CREATED
    this.error = null
    this._callbacks = []
    this._cancellable = null
    this._cancel_id = 0
    this._handle_output = (out) => logError(UnhandledPipeOutput, out)
  }

  _command() {
    let cmd = []
    switch (this.root) {
      case ROOT_NONE: break
      case ROOT_SUDO: cmd = ['sudo']; break
      case ROOT_ASK:  cmd = ['pkexec']; break
      default: break
    }
    return cmd.concat(this.args)
  }

  _command_line() { return this._command().join(" ") }

  _done(err) {
    if (err != null) {
      // force exit on errors to avoid potential zombie processes
      this._force_exit()
      this.error = err
      logError(err)
    }

    // pipe is now closed and all output is processed or it was closed after an error
    let callbacks = this._callbacks
    this._callbacks = []
    for (const cb of callbacks) {
      try         { cb(this.error) }
      catch (err) { logError(err) }
    }

    // proc cancel handler is no longer needed after pipe is closed
    if (this._cancel_id > 0) {
      this._cancel_id = 0
      this._cancellable.disconnect(this._cancel_id);
    }

    // process is now finished and can be removed to allow restart
    this._proc = null
    this.status = PIPE_FINISHED
  }

  _force_exit() {
    if (this._proc == null) {
      return
    }
    this._proc.force_exit()    
    this._proc.wait(null)
    this._proc = null
    this._force_stop_reading()
    log(`stopped process for command ${this._command_line()}`)
  }

  _force_stop_reading() {
    if (this._read_stopper == null) {
      return
    }
    this._read_stopper.cancel()
    this._read_stopper = null
  }

  _start() {
    if (this._proc != null) {
      throw DuplicatePipeStart
    }
    try {
      let cmd = this._command()
      let cmd_line = this._command_line()
      let output_finished = false
      let process_finished = false

      log(`starting process for command ${cmd_line} with parser=${this.parser}`)
      this._proc = new Gio.Subprocess({ argv: cmd, flags: this.flags })
      this._proc.init(this._cancellable)

      // read lines from stdout (must be stopped via Gio.Cancellable)
      this._read_stopper = new Gio.Cancellable()
      let stream = Gio.DataInputStream.new(this._proc.get_stdout_pipe())
      stream_line_async(stream, this._read_stopper, (line, finished) => {
        try         { this._handle_output(this.parser.parse(line)) }
        catch (err) { logError(err) }
        finally {
          if (finished) {
            log(`finished processing output of command ${cmd_line}`)
            output_finished = true
            if (process_finished) this._done()
            else this.status = PIPE_CLOSING
          }
        }
      })

      // setup Gio.Cancellable as done in the books:
      // https://www.andyholmes.ca/articles/subprocesses-in-gjs.html
      this._cancel_id = 0
      if (this._cancellable instanceof Gio.Cancellable) {
        this._cancel_id = this.cancellable.connect(() => this._force_exit())
      }

      this._proc.wait_async(null, (proc, res) => {
        let err = null
        let ok  = false
        try       { ok = proc.wait_finish(res) }
        catch (e) { err = e }
        finally {
          log(`wait_async finished with ok=${ok}, error=${err} for command ${cmd_line}`)
          process_finished = true
          if (output_finished) this._done(err)
          else this.status = PIPE_CLOSING          
          // TODO: Report Bug!
          // The process keeps running and is sending output even if the `wait` is finished successfully.
          // To also stop reading from the stdout, one MUST setup a cancellable and cancel it here.
          this._force_stop_reading()
        }
      })
      this.status = PIPE_RUNNING
    } catch (err) {
      this._done(err)
    }
  }

  IsDone() { return this.status == PIPE_FINISHED }

  Stop()   { this._force_exit() }

  Done(callback) {
    if (this.IsDone()) {
      callback(this.error)
      return
    }
    this._callbacks.push(callback)
    return this
  }

  Connect(handle_output, cancellable=null) {
    this._handle_output = handle_output
    this._cancellable = cancellable
    this._start()
    return this
  }
}

function Run(command, parser=Parser.jsonParser) {
  log("running command", command, parser)
  let [ok, data, err, code] = GLib.spawn_command_line_sync(command.join(" "))
  if (!ok) {
    logError(err)
    return
  }
  return parser.parse(data)
}
