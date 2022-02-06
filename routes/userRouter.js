const express = require('express');
const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('../controller/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  updateMe,
  deleteMe,
  protected,
  restrictTo,
} = require('./../controller/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protected);
//CURRENT USER
router.patch('/updateMyPassword', updateMyPassword);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));
// //BY ADMIN
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
