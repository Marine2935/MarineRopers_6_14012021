const express = require('express');
const router = express.Router();

const validate = require('../middleware/password-validator');

const userCtrl = require('../controllers/user');

router.post('/signup', validate, userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;