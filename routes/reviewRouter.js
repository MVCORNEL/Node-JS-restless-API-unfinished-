const express = require('express');
const { getReview, getAllReviews, createReview, updateReview, deleteReview } = require('./../controller/reviewHandler');

const router = express.Router();

//Mounting the router
router.route('/').get(getAllReviews).post(createReview);
router.route('/:id').get(getReview).patch(updateReview).delete(deleteReview);

module.exports = router;
