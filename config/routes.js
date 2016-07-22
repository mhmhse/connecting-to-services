// eslint-disable-next-line new-cap
const router = require('express').Router();
const gpMiddleware = require('../app/middleware/gp');

function stomachAcheRender(req, res) {
  res.render('stomach-ache', {
  });
}

router.get('/search',
  (req, res) => { res.render('search', {}); }
);

router.get('/results',
  gpMiddleware.getPharmacyUrl,
  gpMiddleware.getPharmacies,
  gpMiddleware.getPharmacyOpeningTimes,
  (req, res) => {
    res.render('results', {
      pharmacyList: req.pharmacyList,
    });
  }
);

router.get('/gpdetails/:gpId',
  gpMiddleware.upperCaseGpId,
  gpMiddleware.getUrl,
  gpMiddleware.getDetails,
  gpMiddleware.getBookOnlineUrl,
  gpMiddleware.getOpeningTimes,
  gpMiddleware.render
);

router.get('/stomach-ache',
  stomachAcheRender
);

module.exports = router;
