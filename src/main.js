var hackrf = require('hackrf-stream')

var FFT_SIZE = 2048
var FFT_AVERAGE = 10

function getRadio () {
  var noHackRf = document.getElementById('no-hackrf')
  try {
    var radio = hackrf()
    noHackRf.className = 'hidden'
    radio.device.setLNAGain(40)
    radio.device.setVGAGain(40)
    radio.setBandwidth(4e6, function () {
      radio.setFrequency(2.41e9, function () {
        startWaterfall(radio.createReadStream())
      })
    })
  } catch(e) {
    console.error(e)
    noHackRf.className = ''
    setTimeout(getRadio, 1000)
  }
}

function startWaterfall (rx) {
  var waterfall = require('./src/waterfall.js')({
    width: 1024,
    height: 600,
    rowHeight: 1
  })
  document.body.appendChild(waterfall.element)

  //var rx = require('fs').createReadStream('/Users/mappum/Downloads/QmNxNdAAGCoCdJMWvLbJQR4EyaJxqLd8hv1jVSg2jLLrAr')
  var w = blackmanWindow(FFT_SIZE)
  var row
  var j = 0
  rx.on('data', function (data) {
    for (var i = 0; i < data.length; i += FFT_SIZE * 2) {
      var slice = data.slice(i, i + FFT_SIZE * 2)
      var frequencies = toMagnitudes(fft(w(slice), FFT_SIZE), FFT_SIZE)
      if (!row) {
        row = Array.prototype.slice.call(frequencies, 0, frequencies.length / 2)
      } else {
        for (var k = 0; k < row.length; k++) {
          row[k] += frequencies[k]
        }
      }

      if (j++ === FFT_AVERAGE) {
        for (var k = 0; k < row.length; k++) {
          row[k] /= FFT_AVERAGE
        }
        j = 0
        waterfall.update(row)
        row = null
      }
    }
  })
}

function blackmanWindow (n) {
  var windowValues = new Float32Array(n)
  for (var i = 0; i < n; i++) {
    windowValues[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) +
      0.08 * Math.cos(4 * Math.PI * i / (n - 1))
  }
  return function (samples) {
    var output = {
      real: new Float32Array(n),
      imaginary: new Float32Array(n),
      length: n
    }
    for (var i = 0; i < samples.length; i += 2) {
      var windowValue = windowValues[i / 2]
      output.real[i / 2] = samples[i] * windowValue
      output.imaginary[i / 2] = samples[i + 1] * windowValue
    }
    return output
  }
}

function fft (samples, n) {
  var m = Math.log2(n)
  var x = samples.real
  var y = samples.imaginary

  // reverse bits
  var j = 0
  var n2 = n / 2
  for (var i = 1; i < n - 1; i++) {
    var n1 = n2
    while (j >= n1) {
      j -= n1
      n1 = Math.floor(n1 / 2)
    }
    j += n1

    if (i < j) {
      var t1 = x[i]
      x[i] = x[j]
      x[j] = t1
      t1 = y[i]
      y[i] = y[j]
      y[j] = t1
    }
  }

  n1 = 0
  n2 = 1
  for (var i = 0; i < m; i++) {
    n1 = n2
    n2 = n2 + n2
    var a = 0

    for (var j = 0; j < n1; j++) {
      var c = Math.cos(-2*Math.PI*a/n)
      var s = Math.sin(-2*Math.PI*a/n)
      a += 1 << (m - i - 1)

      for (var k = j; k < n; k = k + n2) {
        t1 = c * x[k + n1] - s * y[k + n1];
        t2 = s * x[k + n1] + c * y[k + n1];
        x[k + n1] = x[k] - t1;
        y[k + n1] = y[k] - t2;
        x[k] = x[k] + t1;
        y[k] = y[k] + t2;
      }
    }
  }
  return samples
}

function toMagnitudes (samples, n) {
  var magnitudes = new Float32Array(n)
  for (var i = 0; i < samples.length; i++) {
    var re = Math.pow(samples.real[i] / n, 2)
    var im = Math.pow(samples.imaginary[i] / n, 2)
    var index = (i + n / 2) % n
    magnitudes[index] = 10 * Math.log10(Math.sqrt(re + im))
  }
  return magnitudes
}

window.onload = getRadio
