const express = require('express');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  updateMe,
  deleteMe,
  protected,
} = require('./../controller/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//CURRENT USER
router.patch('/updateMyPassword', protected, updateMyPassword);
router.patch('/updateMe', protected, updateMe);
router.delete('/deleteMe', protected, deleteMe);

module.exports = router;
