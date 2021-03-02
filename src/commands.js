const Me = imports.misc.extensionUtils.getCurrentExtension()
const Exec = Me.imports.exec
const { Run, Pipe } = Exec
const { NewCommand, NewBashCommand } = Exec
const Parser = Me.imports.parser

const listGPUs = NewCommand("lshw -C display -json")
const intelGpuTop = NewCommand("intel_gpu_top -l")

var gpu_top_pipe = null

function ListGPUs() {
    let data = Run(listGPUs)
    if(data == undefined){
        return []
    }
    if (data.length > 0) {
        return data.map((obj) => obj.product)
    }
    return []
}

function StopGpuTop() {
    if (gpu_top_pipe != null) {
        gpu_top_pipe.Stop()
        gpu_top_pipe = null
    }
}

function StartGpuTop(handle_row, handle_done, root_mode) {
    if (gpu_top_pipe != null) {
        return
    }
    handle_rows = (rows) => {
        for (const row of rows) handle_row(row)
    }
    gpu_top_pipe = new Pipe(intelGpuTop, Parser.colParser, root_mode)
    gpu_top_pipe.Connect(handle_rows).Done(handle_done)
}
