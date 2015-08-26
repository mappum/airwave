var chroma = require('chroma-js')

var defaultColors = [
  '#000000', '#5C4D6B', '#3F627B', '#1C757A', '#2BAF1F', '#6BDF5F', '#e7da37', '#ebba4f', '#F72B45'
]

var Waterfall = module.exports = function (opts) {
  if (!(this instanceof Waterfall)) return new Waterfall(opts)

  opts = opts || {}
  this.width = opts.width || 1024
  this.height = opts.height || 600
  this.rowHeight = Math.round(opts.rowHeight) || 1

  this.element = document.createElement('canvas')
  this.element.width = this.width
  this.element.height = this.height
  this.element.style.background = 'black'
  this.ctx = this.element.getContext('2d')

  var bufferCanvas = document.createElement('canvas')
  bufferCanvas.width = this.width
  bufferCanvas.height = this.rowHeight
  this.bufferCtx = bufferCanvas.getContext('2d')

  this.rows = []

  this.colors = opts.colors || defaultColors
  this.colorScale = chroma.scale(this.colors).out('hex')

  this.render()
}

    var low = Infinity
    var high = 0
Waterfall.prototype.render = function () {
  window.requestAnimationFrame(this.render.bind(this))

  while (this.rows.length) {
    var previous = this.ctx.getImageData(0, 0, this.width, this.height - this.rowHeight)
    this.ctx.putImageData(previous, 0, this.rowHeight)

    var row = this.rows.shift()
    var samplesPerPixel = Math.floor(row.length / this.width)

    for (var j = 0; j < this.width; j++) {
      var total = 0
      for (var k = j * samplesPerPixel; k < (j + 1) * samplesPerPixel; k++) {
        total += row[k]
      }
      // var v = Math.log2(total / samplesPerPixel / 32 + 2.6)
      // if (v < low) low = v
      // if (v > high) high = v
      // console.log(low +' '+high)
      var value = Math.log2(total / samplesPerPixel / 32 + 2.6)
      this.bufferCtx.fillStyle = this.colorScale(value)
      this.bufferCtx.fillRect(j, 0, 1, this.rowHeight)
    }
    var rowData = this.bufferCtx.getImageData(0, 0, this.width, this.rowHeight)
    this.ctx.putImageData(rowData, 0, 0)
  }
}

Waterfall.prototype.update = function (row) {
  this.rows.push(row)
}
