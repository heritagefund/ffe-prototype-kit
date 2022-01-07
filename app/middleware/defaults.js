/**
 * Placeholder objects for
 * application data
 */
const middleware = (req, res, next) => {
  const data = req.session.data
  const body = req.body

  // Default project data
  data.project = data.project || {}
  data.project.costs = data.project.costs || []
  data.project.contributions = data.project.contributions || {}
  data.project.contributions.noncash = data.project.contributions.noncash || []
  data.project.contributions.cash = data.project.contributions.cash || []
  data.project.volunteers = data.project.volunteers || []
  data.project.evidence = data.project.evidence || {}
  data.project.evidence.items = data.project.evidence.items || []

  data.project.totalCosts = data.project.totalCosts || new Number()
  data.project.totalVolunteers = data.project.totalVolunteers || new Number()
  data.project.totalNoncashContributions =
    data.project.totalNoncashContributions || new Number()
  data.project.totalCashContributions =
    data.project.totalCashContributions || new Number()

  // Default body data
  body.project = body.project || {}
  body.project.costs = body.project.costs || []
  body.project.contributions = body.project.contributions || {}
  body.project.contributions.noncash = body.project.contributions.noncash || []
  body.project.contributions.cash = body.project.contributions.cash || []
  body.project.volunteers = body.project.volunteers || []
  body.project.evidence = body.project.evidence || {}
  body.project.evidence.items = body.project.evidence.items || []

  body.project.totalCosts = body.project.totalCosts || new Number()
  body.project.totalVolunteers = body.project.totalVolunteers || new Number()
  body.project.totalNoncashContributions =
    body.project.totalNoncashContributions || new Number()
  body.project.totalCashContributions =
    body.project.totalCashContributions || new Number()

  next()
}

module.exports = middleware
