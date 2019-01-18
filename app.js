const createError = require('http-errors')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const cookieParser = require('cookie-parser')
const lessMiddleware = require('less-middleware')
const logger = require('morgan')

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
})

module.exports = app
