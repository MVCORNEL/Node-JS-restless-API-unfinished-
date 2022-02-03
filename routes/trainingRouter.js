const express = require('express');
const {
  getAllTrainings,
  createTraining,
  getTraining,
  updateTraining,
  deleteTraining,
} = require('../controller/trainingHandler');

const { protected, restrictTo } = require('./../controller/authController');
const trainingRouter = express.Router();

//Mounting the router
trainingRouter.route('/').get(getAllTrainings).post(protected, restrictTo('admin'), createTraining);
trainingRouter.route('/:id').get(getTraining).patch(updateTraining).delete(deleteTraining);

module.exports = trainingRouter;
