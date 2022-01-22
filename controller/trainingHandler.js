const AppError = require('../utils/appError');
const Training = require('./../model/trainingModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllTrainings = catchAsync(async (req, res, next) => {
  const trainings = await Training.find();

  res.status(200).json({
    status: 'success',
    results: trainings.length,
    data: {
      trainings,
    },
  });
});

exports.getTraining = catchAsync(async (req, res, next) => {
  const training = await Training.findById(req.params.id);

  if (!training) {
    return next(new AppError('No document with such an ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { training },
  });
});

exports.createTraining = catchAsync(async (req, res, next) => {
  const newTraining = await Training.create(req.body);

  if (!newTraining) {
    return next(new AppError('No document with such an ID', 404));
  }

  res.status(201).json({
    status: 'success',
    data: {
      data: newTraining,
    },
  });
});

exports.deleteTraining = catchAsync(async (req, res, next) => {
  const training = await Training.findByIdAndDelete(req.params.id);

  if (!training) {
    return next(new AppError('No document with such an ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateTraining = catchAsync(async (req, res, next) => {
  const updatedTraining = await Training.findByIdAndUpdate(req.params.id, req.body, {
    //returns the newly updated doc
    new: true,
    //the validators specified in the schema will run again
    runValidators: true,
  });

  if (!updatedTraining) {
    return next(new AppError('No document with such an ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      updatedTraining,
    },
  });
});
