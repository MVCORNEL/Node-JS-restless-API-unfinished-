const Training = require('./../model/trainingModel');
const handlerFactory = require('./../controller/handlerFactory');
const upload = require('./../utils/multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');

exports.getAllTrainings = handlerFactory.getAll(Training);
exports.getTraining = handlerFactory.getOne(Training, 'reviews');
exports.createTraining = handlerFactory.createOne(Training);
exports.deleteTraining = handlerFactory.deleteOne(Training);

//MIDDLEWARE upload IMAGES
exports.uploadTrainingImages = upload.array('images', 3);

exports.resizeTrainingImages = catchAsync(async (req, res, next) => {
  //request.files for multiple files
  //requset.file for only one file uplaoded
  console.log(req.files);
  if (!req.files) {
    return next();
  }
  console.log('HERE');
  //2 IMAGES create the images empty array
  req.body.images = [];
  //Because the code is within the async await that won't stop the code from moving from the next line
  await Promise.all(
    req.files.map(async (file, index) => {
      console.log(file);
      const fileName = `training-${req.params.id}-${index + 1}.jpg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/trainings/${fileName}`);
      req.body.images.push(fileName);
    })
  );
  next();
});

exports.updateTraining = handlerFactory.updateOne(Training);
