const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', (req, res, next) => {
  const hostname = `http://${req.hostname}:3001`
  res.render('index', { mainBodyClass: 'slave', title: 'Express', hostname })
})

module.exports = router
