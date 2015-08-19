var chroma = require('chroma-js')

var defaultColors = [
  0x000000,
  0xffffff
]

var Waterfall = module.exports = function (opts) {
  if (!(this instanceof Waterfall)) return new Waterfall(opts)

  opts = opts || {}
  this.width = opts.width || 1024
  this.height = opts.height || 600
  this.element = document.createElement('canvas')
  this.element.setAttribute('width', this.width)
  this.element.setAttribute('height', this.height)
  this.ctx = this.element.getContext('2d')
  this.colors = opts.colors || defaultColors
  this.rowHeight = Math.round(opts.rowHeight) || 1
  this.rows = []

  this.colorScale = chroma.scale([
    '#000000', '#5C4D6B', '#3F627B', '#1C757A', '#2BAF1F', '#6BDF5F', '#e7da37', '#ebba4f', '#F72B45'
  ]).out('hex')

  this.render()
}

Waterfall.prototype.render = function () {
  window.requestAnimationFrame(this.render.bind(this))

  while (this.rows.length) {
    var previous = this.ctx.getImageData(0, 0, this.width, this.height - this.rowHeight)
    this.ctx.putImageData(previous, 0, this.rowHeight)

    var row = this.rows.shift()

    for (var j = 0; j < this.width; j++) {
      var value = Math.pow(row[j] / 8 + 0.5, 3)
      this.ctx.fillStyle = this.colorScale(value)
      this.ctx.fillRect(j, 0, 1, this.rowHeight)
    }
  }
}

Waterfall.prototype.update = function (row) {
  this.rows.push(row)
}
