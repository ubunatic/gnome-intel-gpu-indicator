const { Gio } = imports.gi;
const Me = imports.misc.extensionUtils.getCurrentExtension()

function symbolic(name) {
    return Gio.icon_new_for_string(Me.path + "/icons/" + name + "-symbolic.svg")
}

function ubicon(name) {
    return Gio.icon_new_for_string(Me.path + "/icons/ubunatic/" + name + "-symbolic.svg")
}

var gicons = {
    card:   symbolic("card"),
    chip:   symbolic("microchip"),
    clock:  symbolic("clock"),
    cog:    symbolic("cog"),
    error:  symbolic("error"),
    fan:    symbolic("fan"),
    power:  symbolic("power"),
    ram:    symbolic("ram"),
    thermo: symbolic("thermometer"),
    wrench: symbolic("wrench"),
    vaccel: symbolic("forward"),

    vaccel_meter:  ubicon("vaccel-meter"),
    three_d_meter: ubicon("3d-meter"),
    power_meter:   ubicon("power-meter"),
    oscillator:    ubicon("oscillator"),
}

var GiCard   = gicons.card
var GiClock  = gicons.clock
var GiChip   = gicons.chip
var GiCog    = gicons.cog
var GiError  = gicons.error
var GiFan    = gicons.fan
var GiPower  = gicons.power
var GiRam    = gicons.ram
var GiThermo = gicons.thermo
var GiWrench = gicons.wrench
var GiVAccel = gicons.vaccel

var GiVAccelMeter = gicons.vaccel_meter
var Gi3DMeter     = gicons.three_d_meter
var GiPowerMeter  = gicons.power_meter
var GiOscillator  = gicons.oscillator