var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/old', function(req, res, next) {
  res.render('old');
});

module.exports = router;
