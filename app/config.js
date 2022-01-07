// Use this file to change prototype configuration.

// Note: prototype config can be overridden using environment variables (eg on heroku)

module.exports = {
  // Service name used in header. Eg: 'Renew your passport'
  serviceName: 'National Lottery Heritage Fund',

  // Latest release number
  productName: 'v0.0.0',

  // Default port that prototype runs on
  port: '3000',

  // Enable or disable password protection on production
  useAuth: 'true',

  // Automatically stores form data, and send to all views
  useAutoStoreData: 'true',

  // Enable cookie-based session store (persists on restart)
  // Please note 4KB cookie limit per domain, cookies too large will silently be ignored
  useCookieSessionStore: 'true',

  useRedisStore: process.env.VCAP_SERVICES || process.env.USE_REDIS_STORE,

  // Enable or disable built-in docs and examples.
  useDocumentation: 'true',

  // Force HTTP to redirect to HTTPS on production
  useHttps: 'true',

  // Cookie warning - update link to service's cookie page.
  cookieText:
    'This is a test site – if you’ve arrived at this page by mistake, go to <a href="https://www.heritagefund.org.uk">heritagefund.org.uk</a>',

  // Enable or disable Browser Sync
  useBrowserSync: 'true',

  useVersionCSS: 'false',
}
