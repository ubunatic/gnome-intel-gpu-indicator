const ByteArray = imports.byteArray

var JSONParser = class JSONParser {
  parse (data) {
    try {
      let obj = JSON.parse(ByteArray.toString(data))
      return obj
    } catch (err) {
      log("ParseError", err)
      return
    }
  }
  toString() { return "JSONParser" }
}

var CSVParser = class CSVParser {
  constructor(delimiter=',') {
    this.delimiter = delimiter
  }
  parse (data) {
    if (data == null) return []
    try {
      let rows = data.trim().split("\n")
      for (let i = 0; i < rows.length; i++) {
        rows[i] = rows[i].trim().split(this.delimiter)
      }
      return rows
    } catch (err) {
      log("ParseError", err)
      return []
    }
  }
  toString() { return "CSVParser" }
}

var jsonParser = new JSONParser()
var csvParser = new CSVParser()
var colParser = new CSVParser(/[ ]+/)
