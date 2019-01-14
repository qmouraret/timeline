const express = require('express')
const router = express.Router()
let connectedUsers

/* GET users listing. */
const initRoute = function (sockets) {
  console.log('sockets : ', sockets.length)
  connectedUsers = sockets
  router.get('/', function (req, res, next) {

    res.send('respond with a resource' + connectedUsers.list.length)
  })

  return router
}

module.exports = initRoute
