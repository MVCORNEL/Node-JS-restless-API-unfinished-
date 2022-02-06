const express = require('express');
const {
  getAllTrainings,
  createTraining,
  getTraining,
  updateTraining,
  deleteTraining,
} = require('../controller/trainingHandler');
const { protected, restrictTo } = require('./../controller/authController');
//NESTED ROUTES MERGE PARAM -> in this case the parameters coming from the tour will show on the review too
const reviewRouter = require('./reviewRouter');

const trainingRouter = express.Router();

//NESTED ROUTES => The current router should use the reviews router in case ever encounter a route like this
trainingRouter.use('/:trainingId/reviews', reviewRouter);

//Mounting the router
trainingRouter.route('/').get(getAllTrainings).post(protected, restrictTo('admin'), createTraining);
trainingRouter.route('/:id').get(getTraining).patch(updateTraining).delete(deleteTraining);

module.exports = trainingRouter;
