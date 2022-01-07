const express = require('express')
const router = express.Router()

/**
 * Prototype index
 */
router.all('/', (req, res) => {
  req.session = {}
  res.render(`${__dirname}/views/start`)
})

/**
 * View catch all
 */
router.all('/:view', (req, res) => {
  res.render(`${__dirname}/views/${req.params.view}`)
})

module.exports = router
