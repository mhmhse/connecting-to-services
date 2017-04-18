const log = require('../../app/lib/logger');
const Postcode = require('postcode');
const https = require('https');
const messages = require('../lib/messages');

const baseUrl = 'https://api.postcodes.io';

const isleOfManLatLon = {
  latitude: 54.206457,
  longitude: -4.570902
};

function isleOfManPostcode(result) {
  return result.country === 'Isle of Man';
}

function getLatLon(result) {
  return {
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

function getCoordinates(result) {
  return isleOfManPostcode(result) ? isleOfManLatLon : getLatLon(result);
}

function lookup(res, next) {
  let url;
  const location = res.locals.location;
  const outcode = Postcode.validOutcode(location);

  if (outcode) {
    url = `${baseUrl}/outcodes/${location}`;
  } else {
    const encodedLocation = encodeURIComponent(location);
    url = `${baseUrl}/postcodes/${encodedLocation}`;
  }

  https.get(url, (postcodeRes) => {
    log.info('postcodeio-lookup-start');
    let body = '';

    postcodeRes.on('data', (chunk) => {
      body += chunk;
    });

    postcodeRes.on('end', () => {
      log.info('postcodeio-lookup-end');
      let postcode;

      switch (postcodeRes.statusCode) {
        case 200:
          postcode = JSON.parse(body);
          // eslint-disable-next-line no-param-reassign
          res.locals.coordinates = getCoordinates(postcode.result);
          next();
          break;
        case 404:
          log.warn({ res: postcodeRes, location }, '404 from postcodes.io');
          next({ type: 'invalid-postcode', message: messages.invalidPostcodeMessage(location) });
          break;
        default:
          log.warn({ url, response: postcodeRes.statusCode, location }, `Postcode service error: ${postcodeRes.statusCode}`);
          next({
            type: 'postcode-service-error',
            message: `Postcode service error: ${postcodeRes.statusCode}`,
          });
      }
    });
  }).on('error', (e) => {
    log.error({ err: e, location, type: 'postcode-service-error' }, 'Postcode lookup failed');
    next({ type: 'postcode-service-error', message: e.message });
  });
}

module.exports = {
  lookup,
};
