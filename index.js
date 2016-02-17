const ctx = new window.AudioContext()
const DEFAULT_PITCH = 240
const DEFAULT_FREQ = 2000
const DEFAULT_GAIN = 0.1

function createOsc(pitch, wave) {
  const osc = ctx.createOscillator()
  osc.frequency.value = pitch
  osc.type = wave
  return osc
}

function createFilter(freq, type) {
  const filter = ctx.createBiquadFilter()
  filter.frequency.value = freq
  filter.type = type
  return filter
}

const compressor = ctx.createDynamicsCompressor()
compressor.threshold.value = -50
compressor.knee.value = 40
compressor.ratio.value = 12
compressor.reduction.value = -50
compressor.attack.value = 0
compressor.release.value = 0.25

const osc = createOsc(DEFAULT_PITCH, "sawtooth")
const filter = createFilter(DEFAULT_FREQ, "lowshelf")
const gain = ctx.createGain()
const verbGain = ctx.createGain()
const convolver = ctx.createConvolver()
const output = ctx.createGain()

const req = new XMLHttpRequest()
req.open("GET", "ir.wav", true)
req.responseType = "arraybuffer"

req.onload = () => {
  const data = req.response
  ctx.decodeAudioData(data, (buf) => {
    convolver.buffer = buf
    init()
  }, (err) => console.log(err))
}

req.send()

function init() {
  const mixInput = ctx.createGain()
  const canvas = document.getElementById("canvas-blended")
  const cam = CamMotion.Engine()
  const canvasCtx = canvas.getContext("2d")
  const img = document.getElementById("whale")

  osc.connect(filter)
  filter.connect(compressor)
  compressor.connect(mixInput)
  mixInput.connect(convolver)
  mixInput.connect(gain)
  convolver.connect(verbGain)
  verbGain.connect(output)
  gain.connect(output)
  output.gain.value = 0.8
  output.connect(ctx.destination)
  osc.start(0)

  cam.on("frame", () => {
    const p = cam.getMovementPoint(true)

    if (cam.getAverageMovement(p.x-p.r/2, p.y-p.r/2, p.r, p.r)>5) {
      osc.frequency.value = p.x
      filter.frequency.value = p.x * 2
      canvasCtx.clearRect(0, 0, 1000, 1300)
      canvasCtx.drawImage(img, p.x , p.y)
    }
    const x =  p.y / (p.y / 0.8)  / 1.0
    const gain1 = Math.cos(x * 0.5*Math.PI)
    const gain2 = Math.cos((1.0 - x) * 0.5*Math.PI)
    verbGain.gain.value = gain1
    gain.gain.value = gain2

  })

  cam.start()
}
