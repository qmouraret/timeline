window.addEventListener('load', function () {
  const socket = window.io.connect(window.hostname) // 'http://localhost:3001')

  // TODO: needed ?
  // function lockGUI () {
  //   console.log('Lock GUI')
  //   document.getElementById('idManoirDepart').classList.add('disabled')
  //   document.getElementById('idManoirRetour').classList.add('disabled')
  //   document.getElementById('idApoDepart').classList.add('disabled')
  //   document.getElementById('idApoRetour').classList.add('disabled')
  // }
  //
  // function unlockGUI () {
  //   console.log('Unlock GUI')
  //   document.getElementById('idManoirDepart').classList.remove('disabled')
  //   document.getElementById('idManoirRetour').classList.remove('disabled')
  //   document.getElementById('idApoDepart').classList.remove('disabled')
  //   document.getElementById('idApoRetour').classList.remove('disabled')
  // }

  socket.on('countdown_start', function (data) {
    console.log('countdown_start ', data)
    // socket.emit('my other event', { my: 'data' })
  })

  socket.on('lockGUI', function () {
    console.log('lockGUI ')

    document.getElementById('idManoirDepart').classList.add('disabled')
    document.getElementById('idManoirRetour').classList.add('disabled')
    document.getElementById('idApoDepart').classList.add('disabled')
    document.getElementById('idApoRetour').classList.add('disabled')
  })

  socket.on('unlockGUI', function () {
    console.log('unlockGUI ')

    document.getElementById('idManoirDepart').classList.remove('disabled')
    document.getElementById('idManoirRetour').classList.remove('disabled')
    document.getElementById('idApoDepart').classList.remove('disabled')
    document.getElementById('idApoRetour').classList.remove('disabled')
  })

  socket.on('updateIcon', function (data) {
    let badge = ['badge-danger', 'badge-success']
    if (data.enable) {
      badge = [badge[1], badge[0]]
    }
    document.getElementById(data.id).classList.add(badge[0])
    document.getElementById(data.id).classList.remove(badge[1])
  })

  socket.on('clientError', function (data) {
    console.log('Message from server: ', data)
    document.getElementById('console').innerHTML = data.message
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

  // Make something more generic ?
  const manoirStart = document.getElementById('idManoirDepart')
  manoirStart.onclick = function () {
    socket.emit('launcher', { id: 'ManoirDepart' })
  }
  const manoirStop = document.getElementById('idManoirRetour')
  manoirStop.onclick = function () {
    socket.emit('launcher', { id: 'ManoirRetour' })
  }
  const apoStart = document.getElementById('idApoDepart')
  apoStart.onclick = function () {
    socket.emit('launcher', { id: 'ApoDepart' })
  }
  const apoStop = document.getElementById('idApoRetour')
  apoStop.onclick = function () {
    socket.emit('launcher', { id: 'ApoRetour' })
  }
  const demoButton = document.getElementById('idQuick')
  demoButton.onclick = function () {
    console.log('Start DEMO!')
    socket.emit('launcher', { id: 'DEMO' })
  }

  /// /////////////////////////////////////////////////////////////////////
  // DEV
  const testConsoleError = document.getElementById('idDemoERROR')
  testConsoleError.onclick = function () {
    socket.emit('launcher', { id: 'DEMO_ERROR' })
  }
  const urgentStop = document.getElementById('idUrgentStop')
  urgentStop.onclick = function () {
    socket.emit('shutdown', {})
  }
  const gpioON = document.getElementById('idGPIO')
  gpioON.onclick = function () {
    console.log('GPIO ON')
    socket.emit('DEV_TEST_GPIO_ON', {})
  }
})
