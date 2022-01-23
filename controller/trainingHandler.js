const AppError = require('../utils/appError');
const Training = require('./../model/trainingModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllTrainings = catchAsync(async (req, res, next) => {
  // const trainings = await Training.find();

  // 1 FILTERING ->
  // 127.0.0.1:3000/api/v1/tours?duration=5
  const queryObj = { ...req.query };
  //Excluding special query fields
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => {
    delete queryObj[el];
  });

  // 1.1 ADVANCED FILTERING
  // 127.0.0.1:3000/api/v1/tours?duration[gte]=5&difficulty=easy
  // //MONGODB QUERY
  // //{difficulty: 'easy' , duration: {$gte: 5}} WHAT WE NEED
  // //{difficulty: 'easy', duration: {gte: '5'}} WHAT WE HAVE
  // //operators that have to be changed are from gte, gt, lte ,lt -> to $gte, $gt, $lte, $lt
  // let query = Tour.find(JSON.parse(queryStr)); //Returns a query, useful for chaining query methods
  let queryString = JSON.stringify(queryObj);
  queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  let query = Training.find(JSON.parse(queryString));

  // 2 SORTING
  // 127.0.0.1:3000/api/v1/tours?sort=price,date -> we cannot let a space in URL REQUEST so that is why we use , comma instead
  // What we need in Mongoose .sort('field -field2')
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  }
  // Default sorting
  else {
    query = query.sort('-createdAt');
  }

  // 3 PROJECTING (Field limiting)
  // 127.0.0.1:3000/api/v1/tours?fields=price,date -> we cannot let a space in URL REQUEST so that is why we use , comma instead
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }
  //3.1 Default projecting
  else {
    //EXCLUDE fields that we dont need. Like __v that we won't send to the client
    //__v field is a field internally used by mongoose ->but we can also exclude fields right from the schema
    query = query.select('-__v');
  }

  //4 PAGINATION
  // 127.0.0.1:3000/api/v1/tours?page=2&limit=50 -> request coming from the client
  //Default values for page=1 and limit=100
  //Pattern to follow -> page=2&limit=10
  //1-10(page 1), 11-20(page 2), 20-30 (page 3)
  const page = req.query.page || 1;
  const limit = req.query.limit || 100;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  //5 EXECUTRE QUERY
  const trainings = await query;

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
