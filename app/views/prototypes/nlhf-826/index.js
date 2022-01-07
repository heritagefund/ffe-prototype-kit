const express = require('express')
const moment = require('moment')
const utils = require('../../../../lib/utils.js')
const router = express.Router()
const { parse } = require('json2csv')
const redis = require('redis')
const config = require('../../../config')

let client
if (config.useRedisStore) {
  if (process.env.VCAP_SERVICES) {
    const vcap = process.env.VCAP_SERVICES
    const vcapJson = JSON.parse(vcap)
    const redisCredentials = vcapJson['redis'][0].credentials
    client = redis.createClient({
      host: redisCredentials.host,
      port: redisCredentials.port,
      password: redisCredentials.password,
      tls: { servername: redisCredentials.host },
    })
  } else {
    client = redis.createClient()
  }
}

// a middleware function to persist data
router.post('/apply/*', (req, res, next) => {
  if (config.useRedisStore) {
    try {
      const csv = parse(req.session.data, { flatten: true })
      // persist session to Redis
      if (client) {
        req.session.data['lastModified'] = new Date(Date.now())
        client.hset('responses', req.sessionID, csv, redis.print)
      }
    } catch (err) {}
  }
  next()
})

/**
 * Prototype index
 */
router.all('/', (req, res) => {
  req.session.data = {}
  res.render(`${__dirname}/views/index`, { isStart: true })
})

/**
 * Redirects to first question
 */
router.all('/apply', (req, res) => {
  return res.redirect('./apply/email-address')
})

/**
 * Question: What is your email address
 */
router.all('/apply/email-address', (req, res) => {
  const submitted = req.body
  if (submitted.email) {
    return res.redirect('./where-based')
  }
  res.render(`${__dirname}/views/apply/email-address`)
})

/**
 * Question: Where are you based?
 */
router.all('/apply/where-based', (req, res) => {
  const submitted = req.body
  if (submitted.location === 'united-kingdom') {
    return res.redirect('./organisation-type')
  } else {
    // return res.redirect('./not-uk')
  }
  res.render(`${__dirname}/views/apply/where-based`)
})

/**
 * Question: What type of organisation is applying
 */
router.all('/apply/organisation-type', (req, res) => {
  const submitted = req.body
  if (submitted['organisation-type']) {
    return res.redirect('./need-permission')
  } else {
    res.render(`${__dirname}/views/apply/organisation-type`)
  }
})

/**
 * Question: Does the applicant need permission?
 */
router.all('/apply/need-permission', (req, res) => {
  const submitted = req.body
  if (submitted['need-permission']) {
    return res.redirect('./when-is-project')
  } else {
    res.render(`${__dirname}/views/apply/need-permission`)
  }
})

/**
 * Question: When will the project happen?
 */
router.all('/apply/when-is-project', (req, res) => {
  const submitted = req.body
  let saved = req.session.data

  if (submitted['projectStartDate'] && submitted['projectEndDate']) {
    // save the submitted dates back to the session and format it
    saved.projectStartDate = formatDate(saved.projectStartDate)
    saved.projectEndDate = formatDate(saved.projectEndDate)

    // *******************************************************
    // TODO: CODE HERE TO HANDLE ROUTING DEPENDING ON DATES
    // *******************************************************

    return res.redirect('./legally-receive-funding')
  } else {
    res.render(`${__dirname}/views/apply/when-is-project`)
  }
})

/**
 * Question: Able to legally receive funding?
 */
router.all('/apply/legally-receive-funding', (req, res) => {
  const submitted = req.body
  if (submitted['legallyReceiveFunding']) {
    return res.redirect('./have-uk-bank-account')
  } else {
    res.render(`${__dirname}/views/apply/legally-receive-funding`)
  }
})

/**
 * Question: Do you have a UK bank account?
 */
router.all('/apply/have-uk-bank-account', (req, res) => {
  const submitted = req.body
  /**
   * TODO: Add in logic to knock out no uk bank account answers
   */
  if (submitted['hasUKBankAccount']) {
    return res.redirect('./check-answers')
  } else {
    res.render(`${__dirname}/views/apply/have-uk-bank-account`)
  }
})

/**
 * Create account questions
 */
router.all('/apply/process-create-account', (req, res, next) => {
  const submitted = req.body
  let saved = req.session.data
  if (dataWasSubmitted(submitted)) {
    if (submitted['new-account-email'] !== '') {
      saved.email = submitted['new-account-email']
    }
    res.redirect(`./about-organisation`)
  } else {
    res.render(`${__dirname}/views/apply/create-account`)
  }
})

/**
 * Other outcomes
 */
router.all('/apply/other-outcomes', (req, res, next) => {
  const submitted = req.body
  let saved = req.session.data
  if (dataWasSubmitted(submitted)) {
    Object.keys(submitted.outcomes).forEach(function(k) {
      if (submitted.outcomes[k].description == '') {
        delete saved.outcomes[k]
      }
    })
    req.session.data = saved
    next()
    // return res.redirect('./project-costs')
  } else {
    res.render(`${__dirname}/views/apply/other-outcomes`)
  }
})

/**
 * Add costs
 */
router.all('/apply/add-cost', (req, res, next) => {
  let submitted = req.body
  let saved = req.session.data

  let thisCost = {
    type: submitted['cost-type'],
    description: submitted['cost-description'],
    amount: parseFloat(submitted['cost-amount']).toFixed(2),
  }

  // deletes the data from the session now it has been processed
  delete saved['cost-type'], delete saved['cost-description']
  delete saved['cost-amount']

  saved.project.costs.push(thisCost)
  saved.project.totalCosts = parseFloat(
    parseFloat(saved.project.totalCosts) + parseFloat(submitted['cost-amount'])
  ).toFixed(2)

  req.session.data = saved

  return res.redirect('./project-costs')
})

router.all('/apply/process-costs', (req, res, next) => {
  return res.redirect(`./project-volunteers`)
})

/**
 * Add volunteers
 */
router.all('/apply/add-volunteer', (req, res, next) => {
  let submitted = req.body
  let saved = req.session.data

  let thisVolunteer = {
    type: submitted['volunteer-type'],
    description: submitted['volunteer-description'],
    amount: parseFloat(submitted['volunteer-amount']).toFixed(2),
  }

  // deletes the data from the session now it has been processed
  delete saved['volunteer-type']
  delete saved['volunteer-description']
  delete saved['volunteer-amount']

  saved.project.volunteers.push(thisVolunteer)
  saved.project.totalVolunteers = (
    parseFloat(saved.project.totalVolunteers) +
    parseFloat(submitted['volunteer-amount'])
  ).toFixed(2)

  req.session.data = saved

  return res.redirect('./project-volunteers')
})

router.all('/apply/process-volunteers', (req, res, next) => {
  return res.redirect(`./project-contributions-non-cash`)
})

/**
 * Add non-cash contributions
 */
router.all('/apply/add-non-cash-contribution', (req, res, next) => {
  let submitted = req.body
  let saved = req.session.data

  let thisContribution = {
    description: submitted['nc-cont-description'],
    amount: parseFloat(submitted['nc-cont-amount']).toFixed(2),
  }

  // deletes the data from the session now it has been processed
  delete saved['nc-cont-description']
  delete saved['nc-cont-amount']

  saved.project.contributions.noncash.push(thisContribution)
  saved.project.totalNoncashContributions = (
    parseFloat(saved.project.totalNoncashContributions) +
    parseFloat(submitted['nc-cont-amount'])
  ).toFixed(2)

  req.session.data = saved

  return res.redirect('./project-contributions-non-cash')
})

router.all('/apply/process-non-cash', (req, res, next) => {
  return res.redirect(`./project-contributions-cash`)
})

/**
 * Add cash contributions
 */
router.all('/apply/add-cash-contribution', (req, res, next) => {
  let submitted = req.body
  let saved = req.session.data

  let thisContribution = {
    description: submitted['cash-cont-description'],
    secured: submitted['cash-cont-secured'],
    amount: parseFloat(submitted['cash-cont-amount']).toFixed(2),
  }

  // deletes the data from the session now it has been processed
  delete saved['cash-cont-description']
  delete saved['cash-cont-amount']
  delete saved['cash-cont-secured']

  saved.project.contributions.cash.push(thisContribution)
  saved.project.totalCashContributions = (
    parseFloat(saved.project.totalCashContributions) +
    parseFloat(submitted['cash-cont-amount'])
  ).toFixed(2)

  req.session.data = saved

  return res.redirect('./project-contributions-cash')
})

router.all('/apply/process-cash-contributions', (req, res, next) => {
  return res.redirect(`./project-evidence`)
})

/**
 * Add evidence of support
 */
router.all('/apply/add-evidence', (req, res, next) => {
  let submitted = req.body
  let saved = req.session.data

  let thisEvidence = {
    description: submitted['evidence-description'],
    upload: submitted['evidence-upload'],
  }

  // deletes the data from the session now it has been processed
  delete saved['evidence-description']
  delete saved['evidence-upload']

  saved.project.evidence.items.push(thisEvidence)

  req.session.data = saved

  return res.redirect('./project-evidence')
})

router.all('/apply/process-evidence', (req, res, next) => {
  return res.redirect(`./grant-request`)
})

/**
 * grant request
 */
router.all('/apply/grant-request', (req, res, next) => {
  let submitted = req.body
  let saved = req.session.data

  if (saved.project.totalCosts && saved.project.totalCashContributions) {
    saved.project.grantAmount = parseFloat(
      saved.project.totalCosts - saved.project.totalCashContributions
    ).toFixed(2)
  }

  req.session.data = saved

  next()
})

/**
 * Format date for display
 */
function formatDate({ day, month, year } = {}) {
  day = day ? day.padStart(2, '0') : ''
  month = month ? month.padStart(2, '0') : ''
  year = year || ''

  // Apply formatting
  const date = moment.utc(`${year}-${month}-${day}`, 'YYYY-MM-DD', true)
  const formatted = date.isValid() ? date.format('D MMM YYYY') : ''

  return {
    day,
    month,
    year,
    date,
    formatted,
  }
}

/**
 *
 * Check if the object is has any properties
 * if so returns true else returns false
 * @param {Object} obj the object of data from the form post
 */
function dataWasSubmitted(obj) {
  if (Object.keys(obj).length > 0) {
    return true
  } else {
    return false
  }
}

module.exports = router
