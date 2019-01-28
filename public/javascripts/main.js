window.addEventListener('load', function () {
  const socket = window.io.connect(window.hostname) // 'http://localhost:3001')
  let countdown = null
  let videoPlayer = null

  const Countdown = function () {
    this.second = document.getElementById('idSecond')
    this.minute = document.getElementById('idMinute')
  }

  const convertToTowDigit = function (number) {
    return (number <= 9) ? `0${number}` : `${number}`
  }

  Countdown.prototype = {
    interval: null,
    startTime: 0,
    tick: function () {
      console.log('tick: ', this.startTime)
      this.startTime += 1
      if (this.startTime > 59) {
        this.minute.innerText = convertToTowDigit(parseInt(this.startTime / 59))
      }
      this.second.innerText = convertToTowDigit(this.startTime % 60)
    },
    start: function () {
      const binded = this.tick.bind(this)
      this.timerElement = document.getElementById('timer')
      this.timerElement.style.display = 'block'
      this.interval = window.setInterval(binded, 1000)
    },
    stop: function () {
      this.timerElement.style.display = 'none'
      clearInterval(this.interval)
      this.interval = null
    }
  }

  const Video = function (source) {
    this.source = source
  }
  Video.prototype = {
    source: null,
    player: null,
    start: function () {
      this.player = document.getElementsByTagName('video')[0]
      if (!this.player) {
        console.log('Please initialize first the player !')
        return
      }
      this.player.style.display = 'block'
      this.player.src = this.source
      this.player.addEventListener('progress', function (data) { }, true)
      // this.player.currentTime = 10.0
      this.player.play()
    },
    stop: function () {
      this.player.style.display = 'none'
      this.player.pause()
    }
  }

  socket.on('countdown start', function (data) {
    console.log('start ', data)
    if (!countdown) {
      countdown = new Countdown()
      countdown.start()
    }
  })

  socket.on('countdown stop', function (data) {
    console.log('stop ', data)
    countdown.stop()
    countdown = null
  })

  socket.on('video start', function (data) {
    console.log('video start ', data)
    if (!videoPlayer) {
      videoPlayer = new Video(data.src)
    }
    videoPlayer.start()
  })

  socket.on('video stop', function (data) {
    console.log('video stop', data)
    videoPlayer.stop()
    videoPlayer = null
  })

  socket.on('lockGUI', function (data) {
    console.log('lockGUI', ': do nothing')
  })
  socket.on('unlockGUI start', function (data) {
    console.log('unlockGUI', ': do nothing')
  })
})
