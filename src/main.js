var hackrf = require('hackrf-stream')
var fftStream = require('fft-stream')

var FFT_SIZE = 8192
var FFT_AVERAGE = 5

function getRadio () {
  var noHackRf = document.getElementById('no-hackrf')
  var devices = hackrf()
  console.log(devices.length + ' devices connected')

  if (devices.length === 0) {
    noHackRf.className = ''
    setTimeout(getRadio, 1000)
    return
  }
  noHackRf.className = 'hidden'

  var radio = devices.open(0, { closeOnExit: true })
  console.log('version: ' + radio.device.getVersion())
  radio.device.setLNAGain(40)
  radio.device.setVGAGain(40)
  radio.device.setTxGain(40)
  radio.setSampleRate(8e6, function () {
    radio.setBandwidth(4e6, function () {
      radio.setFrequency(89.5e6, function () {
        startWaterfall(radio.createReadStream())
      })
    })
  })
}

function startWaterfall (rx) {
  var waterfall = require('./src/waterfall.js')({
    width: 1024,
    height: 600,
    rowHeight: 1
  })
  document.body.appendChild(waterfall.element)

  var row
  var j = 0
  var fft = fftStream.createStream({ size: FFT_SIZE, signed: true })
  fft.on('data', function (frequencies) {
    if (!row) {
      row = frequencies
    } else {
      for (var k = 0; k < row.length; k++) row[k] += frequencies[k]
    }

    if (j++ >= FFT_AVERAGE) {
      for (k = 0; k < row.length; k++) row[k] /= j
      j = 0
      waterfall.update(Array.prototype.slice.call(row, row.length / 4, Math.floor(row.length / 4) * 3))
      row = null
    }
  })
  rx.pipe(fft)
}

window.onload = getRadio
