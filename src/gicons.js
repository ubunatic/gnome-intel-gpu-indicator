const { Gio } = imports.gi;
const Me = imports.misc.extensionUtils.getCurrentExtension()

function symbolic(name) {
    return Gio.icon_new_for_string(Me.path + "/icons/" + name + "-symbolic.svg")
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
