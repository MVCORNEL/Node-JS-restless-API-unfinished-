const express = require('express');
const {
  getReview,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  setTrainingUserIds,
  setExtraFilter,
} = require('./../controller/reviewHandler');
const { protected } = require('./../controller/authController');

//ADVANCE NESTED ROUTES -> the paramet found in training can be accessed here too
const router = express.Router({ mergeParams: true });

//Mounting the router
//protected here will put the user on the req, needed cause we set the user id from the user obj put on the req
router
  .route('/')
  .get(protected, setTrainingUserIds, setExtraFilter, getAllReviews)
  .post(protected, setTrainingUserIds, createReview);
router.route('/:id').get(getReview).patch(updateReview).delete(deleteReview);

module.exports = router;
