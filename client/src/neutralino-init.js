// Bridges Neutralino global vars into window.* for ES module visibility.
// Only copies non-empty values — NL_TOKEN may still be empty at this point
// if /__neutralino_globals.js hasn't finished loading. main.ts polls for it.
(function () {
  if (typeof NL_PORT    !== 'undefined') window.NL_PORT    = NL_PORT
  if (typeof NL_OS      !== 'undefined') window.NL_OS      = NL_OS
  if (typeof NL_VERSION !== 'undefined') window.NL_VERSION = NL_VERSION
  if (typeof NL_CWD     !== 'undefined') window.NL_CWD     = NL_CWD
  if (typeof NL_ARGS    !== 'undefined') window.NL_ARGS    = NL_ARGS
  if (typeof NL_PID     !== 'undefined') window.NL_PID     = NL_PID
  if (typeof NL_APPID   !== 'undefined') window.NL_APPID   = NL_APPID
  // NL_TOKEN copiato solo se non vuoto
  if (typeof NL_TOKEN !== 'undefined' && NL_TOKEN !== '') {
    window.NL_TOKEN = NL_TOKEN
  }
})()