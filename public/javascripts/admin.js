window.addEventListener('load', function () {
  const socket = io.connect('http://localhost:3001')

  socket.on('countdown_start', function (data) {
    console.log(data)
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
})