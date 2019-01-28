const fs = require('fs')
const gpioManager = require('./gpio')

const configure = (io, connectedUsers = { list: [] }) => {
  let startTime // Start time after press start
  let state = 0 // Job state: 0 = not run, 1 = run
  let instructions = [] // List of something to run
  let sequence // Timer
  const debug = false
  const debugVerbose = false

  gpioManager.configure()

  let GPIOReady = gpioManager.isReady()
  let gpio = gpioManager.gpio()

  let mappingGPIO = null
  try {
    mappingGPIO = JSON.parse(fs.readFileSync('./timeline/GPIO.json'))
  } catch (error) {
    console.log('Impossible to use GPIO: See if GPIO.json is correct.', error)
  }
  console.log('GPIO: ', mappingGPIO)

  const doJob = () => {
    try {
      if (debugVerbose) {
        console.log('Sequencer is ready !')
      }

      if (state === 1) {
        if (debugVerbose) {
          console.log('Sequencer is started for ', instructions.length, ' job')
        }
        // Analyze line
        if (instructions.length > 0) {
          const now = new Date()
          const diffMs = now - startTime

          if (debugVerbose) {
            console.log('Time is: ', diffMs)
          }

          // Get instruction
          const instruction = instructions[0]
          if (instruction.time > diffMs) {
            if (debugVerbose) {
              console.log('Wait operation: ', diffMs, ' < ', instruction.time)
            }
            return
          }

          // Analyze
          for (let action of instruction.actions) {
            if (debug) {
              console.log('Call operation ', action.type, ' at ', diffMs, ' ( wanted:', instruction.time, ')')
            }
            if (action.type === 'video') {
              if (action.data.state === 'ON') {
                if (debug) {
                  console.log('Play video: ', action.data.id)
                }
                io.emit('video start', { src: action.data.id })
              } else if (action.data.state === 'OFF') {
                if (debug) {
                  console.log('Stop video')
                }
                io.emit('video stop', {})
              }
            } else if (action.type === 'gpio') {
              if (debug) {
                console.log('GPIO: ', action.data.id, ' = ', action.data.state)
              }
              const statePIN = (action.data.state === 'ON')
              enableGPIO(action.data.id, statePIN)
            }
          }

          // Remove instruction
          instructions = instructions.slice(1)
        } else {
          genericStop()
        }
      } else {
        if (debug) {
          console.log('Sequencer is not started !')
        }
      }
    } catch (error) {
      console.error('Fatal error inside Sequencer: ', error)
    }
  }

  const genericStop = () => {
    // Remove timer
    clearInterval(sequence)

    // Restore clean system state
    state = 0
    io.emit('video stop')
    io.emit('unlockGUI')
    restoreGPIO()
  }

  const restoreGPIO = () => {
    console.log('Restore GPIO ')

    // Disable all
    for (let key in mappingGPIO) {
      if (debug) {
        console.log('Pin: ', key)
      }
      enableGPIO(key, false)
    }
  }

  const enableGPIO = (id, state) => {
    if (id in mappingGPIO) {
      const controller = mappingGPIO[id]
      if (GPIOReady) {
        const pin = parseInt(controller.pin)
        const gpiop = gpio.promise
        gpiop.setup(pin, gpio.DIR_OUT)
          .then(() => {
            return gpiop.write(pin, state)
          })
          .catch((err) => {
            console.error('*Error gpio*\n', err)
            io.emit('clientError', { 'message': 'Erreur du GPIO: ' + pin + ' n\'a pas réussi.' })
          })
      }
      io.emit('updateIcon', { 'id': controller.gui, 'enable': state })
    } else {
      console.log('Error GPIO: ', id)
      io.emit('clientError', { 'message': 'Erreur du GPIO mapping: ' + id + ' n\'est pas connu. Reconfigurer le serveur.' })
    }
  }

  io.on('connection', (socket) => {
    connectedUsers.list.push(socket)
    console.log('a user connected')

    socket.on('countdown start', (data) => {
      console.log('countdown start', data)
      io.emit('countdown start')
    })

    socket.on('countdown stop', (data) => {
      console.log('countdown stop', data)
      io.emit('countdown stop')
    })

    socket.on('video start', (data) => {
      console.log('video start', data)
      io.emit('video start', data)
    })

    socket.on('video stop', (data) => {
      console.log('video stop', data)
      io.emit('video stop')
    })

    socket.on('disconnect', () => {
      connectedUsers.list = []
      console.log('user disconnected')
    })

    socket.on('DEV_TEST_GPIO_ON', () => {
      connectedUsers.list = []
      console.log('GPIO ON')
      for (let key in mappingGPIO) {
        enableGPIO(key, true)
      }
    })

    socket.on('launcher', (idStory) => {
      connectedUsers.list = []
      console.log('launcher')
      console.log('Launcher: ', idStory)

      try {
        if (state === 0) {
          // Read JSON and copy all instructions
          const contents = fs.readFileSync('./timeline/' + idStory.id + '.json')
          instructions = JSON.parse(contents)
          console.log('Ready to play ', idStory.id, ' with instructions : ', instructions.length)

          // Disable GUI
          io.emit('lockGUI')

          // Start sequence
          state = 1
          startTime = new Date()
          sequence = setInterval(doJob, 200)
        }
      } catch (error) {
        console.error(error)
      }
    })

    socket.on('shutdown', () => {
      connectedUsers.list = []
      console.log('shutdown')
      genericStop()
    })
  })
}

module.exports = { configure }
