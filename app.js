const createError = require('http-errors')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const cookieParser = require('cookie-parser')
const lessMiddleware = require('less-middleware')
const logger = require('morgan')
const fs = require('fs')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const adminRouter = require('./routes/admin')

const connectedUsers = { list: [] }

// Optional package
let GPÏOReady = false
var gpio = null
try
{
  const GPIOPackage = 'rpi-gpio'
  require.resolve(GPIOPackage)
  gpio = require(GPIOPackage)
  GPÏOReady = true
}
catch(error)
{
  console.log('Impossible to use GPIO: please install package if you are on Raspberry system.')
}

let mappingGPIO = null
try
{
  mappingGPIO = JSON.parse(fs.readFileSync("./timeline/GPIO.json"))
}
catch(error)
{
  console.log('Impossible to use GPIO: See if GPIO.json is correct.', error)
}
console.log("GPIO: ", mappingGPIO)

http.listen(3001, function () {
  console.log('listening on *:3001')
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(lessMiddleware(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/admin', adminRouter(connectedUsers))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

var startTime           // Start time after press start
var state=0             // Job state: 0 = not run, 1 = run
var instructions = []   // List of something to run
var sequence            // Timer

const debug = false
const debugVerbose = false

function enableGPIO(id, state)
{
  if(id in mappingGPIO)
  {
    const controller = mappingGPIO[id]
    if( GPÏOReady )
    {
      const pin = parseInt(controller.pin)
      var gpiop = gpio.promise;
      gpiop.setup(pin, gpio.DIR_OUT)
          .then(() => {
            return gpiop.write(pin, state)
          })
          .catch((err) => {
            io.emit("clientError", { "message": "Erreur du GPIO: "+pin+" n'a pas réussi." })
          })
    }
    io.emit("updateIcon", { "id": controller.gui, "enable": state })
  }
  else
  {
    console.log('Error GPIO: ', id)
    io.emit("clientError", { "message": "Erreur du GPIO mapping: "+id+" n'est pas connu. Reconfigurer le serveur." })
  }
}

function restoreGPIO()
{
  console.log('Restore GPIO ')

  // Disable all
  for(let key in mappingGPIO)
  {
    if(debug)
      console.log('Pin: ', key)
    enableGPIO(key, false)
  }
}

function doJob()
{
  try {
    if(debugVerbose)
      console.log('Sequencer is ready !')

    if( state == 1 )
    {
      if(debugVerbose)
        console.log('Sequencer is started for ', instructions.length, " job")
      // Analyze line
      if(instructions.length > 0)
      {
        var now = new Date()
        var diffMs = now - startTime

        if(debugVerbose)
          console.log('Time is: ', diffMs)

        // Get instruction
        var instruction = instructions[0]
        if(instruction.time > diffMs) {
          if(debugVerbose)
            console.log('Wait operation: ', diffMs, ' < ', instruction.time)
          return;
        }

        // Analyze
        for (let action of instruction.actions) {
          if(debug)
            console.log('Call operation ',action.type,' at ', diffMs, ' ( wanted:', instruction.time, ")")
          if(action.type == "video") {
            if (action.data.state == "ON") {
              if(debug)
                console.log("Play video: ", action.data.id)
              io.emit('video start', {src: action.data.id})
            } else if (action.data.state == "OFF") {
              if(debug)
                console.log("Stop video")
              io.emit('video stop', {})
            }
          } else if( action.type == "gpio"){
            if(debug)
              console.log("GPIO: ", action.data.id, " = ", action.data.state)
            var statePIN = (action.data.state == "ON")
            enableGPIO(action.data.id, statePIN)
          }
        }

        // Remove instruction
        instructions = instructions.slice(1)
      }
      else
      {
        genericStop()
      }
    }
    else {
      if(debug)
        console.log('Sequencer is not started !')
    }
  }
  catch(error)
  {
    console.error("Fatal error inside Sequencer: ", error);
  }
}

function genericStop()
{
  // Remove timer
  clearInterval(sequence)

  // Restore clean system state
  state = 0
  io.emit('video stop')
  io.emit('unlockGUI')
  restoreGPIO()
}

io.on('connection', function (socket) {
  connectedUsers.list.push(socket)
  console.log('a user connected')

  socket.on('countdown start', function (data) {
    console.log('countdown start', data)
    io.emit('countdown start')
  })

  socket.on('countdown stop', function (data) {
    console.log('countdown stop', data)
    io.emit('countdown stop')
  })

  socket.on('video start', function (data) {
    console.log('video start', data)
    io.emit('video start', data)
  })

  socket.on('video stop', function (data) {
    console.log('video stop', data)
    io.emit('video stop')
  })

  socket.on('disconnect', function () {
    connectedUsers.list = []
    console.log('user disconnected')
  })

  socket.on('DEV_TEST_GPIO_ON', function () {
    connectedUsers.list = []
    console.log('GPIO ON')
    for(let key in mappingGPIO) {
      enableGPIO(key, true)
    }
  })

  socket.on('launcher', function(idStory) {
    connectedUsers.list = []
    console.log('launcher')
    console.log("Launcher: ", idStory);

    try {
      if(state == 0)
      {
        // Read JSON and copy all instructions
        var contents = fs.readFileSync("./timeline/"+idStory.id+".json")
        instructions = JSON.parse(contents)
        console.log("Ready to play ",idStory.id," with instructions : ", instructions.length);

        // Disable GUI
        io.emit('lockGUI')

        // Start sequence
        state = 1;
        startTime = new Date();
        sequence = setInterval(doJob, 200);
      }
    }
    catch(error)
    {
      console.error(error);
    }
  })

  socket.on('shutdown', function() {
    connectedUsers.list = []
    console.log('shutdown')

    genericStop()
  })
})

module.exports = app
