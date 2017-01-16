var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/new', function(req, res, next) {
  res.render('new');
});

module.exports = router;
