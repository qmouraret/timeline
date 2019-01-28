const express = require('express')
const router = express.Router()
let connectedUsers

/* GET users listing. */
const initRoute = (sockets) => {
  console.log('sockets : ', sockets.length)
  connectedUsers = sockets
  console.log('connectedUsers: ', connectedUsers)
  router.get('/', (req, res, next) => {
    const hostname = `http://${req.hostname}:3001`
    res.render('admin', { mainBodyClass: 'admin', hostname })
  })

  return router
}

module.exports = initRoute
