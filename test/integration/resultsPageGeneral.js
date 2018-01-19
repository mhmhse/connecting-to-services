const chai = require('chai');
const chaiHttp = require('chai-http');
const cheerio = require('cheerio');
const nock = require('nock');
const server = require('../../server');
const constants = require('../../app/lib/constants');
const getSampleResponse = require('../resources/getSampleResponse');
const iExpect = require('../lib/expectations');

const expect = chai.expect;

chai.use(chaiHttp);

const resultsRoute = `${constants.SITE_ROOT}/results`;

describe('The results page', () => {
  const serviceApiResponse = getSampleResponse('service-api-responses/-1,54.json');
  const location = 'Midsomer';
  const latitude = 54;
  const longitude = -1;
  const numberOfNearbyResults = constants.api.nearbyResultsCount;
  const numberOfOpenResults = constants.api.openResultsCount;

  after('clean nock', () => {
    nock.cleanAll();
  });

  it('should return distance away singularly for 1 mile and pluraly for other distances', (done) => {
    nock(process.env.API_BASE_URL)
      .get(`/nearby?latitude=${latitude}&longitude=${longitude}&limits:results=${numberOfNearbyResults}`)
      .times(1)
      .reply(200, serviceApiResponse);

    chai.request(server)
      .get(resultsRoute)
      .query({ location, latitude, longitude })
      .end((err, res) => {
        iExpect.htmlWith200Status(err, res);
        const $ = cheerio.load(res.text);
        expect($('.distance').eq(0).text()).to.equal('0 miles away');
        expect($('.distance').eq(1).text()).to.equal('1 mile away');
        done();
      });
  });

  it('should provide a link to see open pharmacies by default', (done) => {
    nock(process.env.API_BASE_URL)
      .get(`/nearby?latitude=${latitude}&longitude=${longitude}&limits:results=${numberOfNearbyResults}`)
      .times(1)
      .reply(200, serviceApiResponse);

    chai.request(server)
      .get(resultsRoute)
      .query({ location, latitude, longitude })
      .end((err, res) => {
        iExpect.htmlWith200Status(err, res);
        const $ = cheerio.load(res.text);
        const toggle = $('.viewToggle a');
        expect(toggle.attr('class')).to.equal('');
        expect(toggle.attr('href')).to.have.string('&open=true');
        done();
      });
  });

  it('should provide a link to see nearby only pharmacies when viewing open pharmacies', (done) => {
    nock(process.env.API_BASE_URL)
      .get(`/open?latitude=${latitude}&longitude=${longitude}&limits:results=${numberOfOpenResults}`)
      .times(1)
      .reply(200, serviceApiResponse);

    chai.request(server)
      .get(resultsRoute)
      .query({
        location, latitude, longitude, open: true
      })
      .end((err, res) => {
        iExpect.htmlWith200Status(err, res);
        const $ = cheerio.load(res.text);
        const toggle = $('.viewToggle a');
        expect(toggle.attr('class')).to.equal('checked');
        expect(toggle.attr('href')).to.have.string('&open=false');
        done();
      });
  });
});