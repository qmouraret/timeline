window.addEventListener('load', function () {
  const socket = io.connect('http://localhost:3001')
  let countdown = null

  const Countdown = function () {}
  Countdown.prototype = {
    interval: null,
    startTime: 0,
    tick: function () {
      console.log('tick: ', this.startTime, this.interval)
      const second = document.getElementById('idSecond')
      this.startTime += 1
      second.innerText = (this.startTime <= 9) ? `0${this.startTime}` : `${this.startTime}`
    },
    start: function () {
      const binded = this.tick.bind(this)
      this.interval = window.setInterval(binded, 1000)
    },
    stop: function () {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  socket.on('countdown start', function (data) {
    console.log(data)
    if (!countdown) {
      countdown = new Countdown()
      countdown.start()
    }
  })
  socket.on('countdown stop', function (data) {
    console.log(data)
    countdown.stop()
  })
})