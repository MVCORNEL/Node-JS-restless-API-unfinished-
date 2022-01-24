const Training = require('./../model/trainingModel');
const handlerFactory = require('./../controller/handlerFactory');

exports.getAllTrainings = handlerFactory.getAll(Training);
exports.getTraining = handlerFactory.getOne(Training, 'reviews');
exports.createTraining = handlerFactory.createOne(Training);
exports.deleteTraining = handlerFactory.deleteOne(Training);
exports.updateTraining = handlerFactory.updateOne(Training);
