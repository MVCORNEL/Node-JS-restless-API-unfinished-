const handlerFactory = require('./handlerFactory');
const Review = require('./../model/reviewsModel');

exports.setExtraFilter = (req, res, next) => {
  if (req.params.trainingId) {
    req.extraFilter = { training: req.params.trainingId };
  }
  next();
};
exports.getAllReviews = handlerFactory.getAll(Review);
exports.getReview = handlerFactory.getOne(Review);

exports.setTrainingUserIds = (req, res, next) => {
  ///Allows nested routes (we just define them when they ar enot there)
  //this will still allow the user to specify manually the tour and the user ID
  console.log(req.params.trainingId);
  if (!req.body.training) req.body.training = req.params.trainingId;
  //VEry importantat to protect the route otherwise the use won't be on the req
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
exports.createReview = handlerFactory.createOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
