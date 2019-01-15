const express = require('express')
const router = express.Router()
let connectedUsers

/* GET users listing. */
const initRoute = function (sockets) {
  console.log('sockets : ', sockets.length)
  connectedUsers = sockets
  router.get('/', function (req, res, next) {

    res.render('admin', {})
  })

  return router
}

module.exports = initRoute
