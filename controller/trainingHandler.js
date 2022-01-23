const AppError = require('./../utils/appError');
const ApiFeatures = require('./../utils/apiFeatures');
const Training = require('./../model/trainingModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./../controller/handlerFactory');

exports.getAllTrainings = handlerFactory.getAll(Training);
exports.getTraining = handlerFactory.getOne(Training);
exports.createTraining = handlerFactory.createOne(Training);
exports.deleteTraining = handlerFactory.deleteOne(Training);
exports.updateTraining = handlerFactory.updateOne(Training);
