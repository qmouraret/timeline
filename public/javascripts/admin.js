window.addEventListener('load', function () {
  const socket = io.connect('http://localhost:3001')

  socket.on('countdown_start', function (data) {
    console.log('countdown_start ', data)
    // socket.emit('my other event', { my: 'data' })
  })

  const countdownstart = document.getElementById('idStartCountdown')
  countdownstart.onclick = function () {
    console.log('click start !')
    socket.emit('countdown start', { ok: true })
  }
  const countdownstop = document.getElementById('idStopCountdown')
  countdownstop.onclick = function () {
    console.log('click stop !')
    socket.emit('countdown stop', { ok: true })
  }

  const videoStart = document.getElementById('idStartVideo')
  videoStart.onclick = function () {
    console.log('video start !')
    socket.emit('video start', { src: '/video/short-apocalypse.mp4' })
  }
  const videoStop = document.getElementById('idStopVideo')
  videoStop.onclick = function () {
    console.log('video stop !')
    socket.emit('video stop', {})
  }
})