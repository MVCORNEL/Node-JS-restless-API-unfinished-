const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const ApiFeatures = require('./../utils/apiFeatures');

exports.getOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findById(req.params.id);

    if (!document) {
      //also return immediately, because otherwise will try to send 2 responses back
      return next(new AppError('No document found with such an ID', 404));
    }
    //200 OK
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    //201 CREATED
    res.status(201).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });
};

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const deletedDocument = await Model.findByIdAndDelete(req.body);
    if (!deletedDocument) {
      //also return immediately, because otherwise will try to send 2 responses back
      return next(new AppError('No document found with such an ID', 404));
    }
    //204 NO CONTENT
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //the newly updated doc will be returned
      new: true,
      //validators specified in the schema will be run
      runValidators: true,
    });
    if (!document) {
      //also return immediately, because otherwise will try to send 2 responses back
      return next(new AppError('No document found with such an ID', 404));
    }
    //204 NO CONTENT
    res.status(200).json({
      status: 'success',
      data: { document },
    });
  });
};

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    const mongooseQuery = Model.find();
    const expressQuery = req.query;
    //mongoose query is processed within the ApiFeatures class
    const apiQuery = new ApiFeatures(mongooseQuery, expressQuery).filter().sort().limitFields().paginate();
    const documents = await apiQuery.mongooseQuery;

    res.status(200).json({
      status: 'success',
      results: documents?.length || 0,
      data: {
        documents,
      },
    });
  });
};
