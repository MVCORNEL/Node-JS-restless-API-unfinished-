const express = require('express');
const {
  getAllTrainings,
  createTraining,
  getTraining,
  updateTraining,
  deleteTraining,
} = require('../controller/trainingHandler');

const trainingRouter = express.Router();

//Mounting the router
trainingRouter.route('/').get(getAllTrainings).post(createTraining);
trainingRouter.route('/:id').get(getTraining).patch(updateTraining).delete(deleteTraining);

module.exports = trainingRouter;
