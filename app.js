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

const debug = true
const debugVerbose = false

function enableGPIO(id, state)
{
  switch(id)
  {
    case 0: // Mapping light

      io.emit("updateIcon", { "id": "idControl", "enable": state })
      break;

    case 1: // Mapping light

      io.emit("updateIcon", { "id": "idLumiere", "enable": state })
      break;

    case 2: // Mapping ventil

      io.emit("updateIcon", { "id": "idVentillo", "enable": state })
      break;

    case 3: // Mapping porte1

      io.emit("updateIcon", { "id": "idRoom1", "enable": state })
      break;

    case 4: // Mapping porte2

      io.emit("updateIcon", { "id": "idRoom2", "enable": state })
      break;
    default:
      log.console("Unmapped GPIO port")
  }
}

function restoreGPIO()
{
  console.log('Restore GPIO ')

  // Disable all
  enableGPIO(0, false);
  enableGPIO(1, false);
  enableGPIO(2, false);
  enableGPIO(3, false);
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
            console.log("GPIO: ", action.data.id, " = ", action.data.state)
            var statePIN = (action.data.state == "ON")
            enableGPIO(parseInt(action.data.id), statePIN)
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
    enableGPIO(0, true)
    enableGPIO(1, true)
    enableGPIO(2, true)
    enableGPIO(3, true)
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
