const Training = require('./../model/trainingModel');

exports.getAllTrainings = async (req, res, next) => {
  const trainings = await Training.find();

  try {
    res.status(200).json({
      status: 'success',
      results: trainings.length,
      data: {
        trainings,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTraining = async (req, res, next) => {
  try {
    const training = await Training.findOne({ id: req.params.id });

    res.status(200).json({
      status: 'success',
      data: { training },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTraining = async (req, res, next) => {
  try {
    const newTraining = await Training.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newTraining,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTraining = async (req, res, next) => {
  try {
    const updatedTraining = await Training.findByIdAndUpdate(req.params.id, req.body, {
      //returns the newly updated doc
      new: true,
      //the validators specified in the schema will run again
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: { updatedTraining },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
