const AppError = require('./../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Only the operational errors will be send in production
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Programming or unknown error -> don't leak the details to the client
  else {
    //When app is deployed by using heroku... this will provide access to the error logs
    console.log('Error', err);

    res.status(err.statusCode).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
};

//(3)TYPES OF MONGOOSE ERRORS -> WILL RETURN A NEW OPERATIONAL ERROR
//1
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  //400 stands for bad request
  return new AppError(message, 400);
};
//2
const handleDuplicateFieldsDS = (err) => {
  const message = `Duplicare field value: ${err.keyValue?.name}, Please use another value`;
  return new AppError(message, 400);
};
//3
const handleValidationErrorDB = (err) => {
  //Object.values() return an array of the given objects
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input dataset. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
//4
const handleJWTError = () => new AppError('Invalid token please try again', 401);
//5
const handleJWTExpiredError = () => new AppError('Your token has expried', 401);

//GLOBAL ERROR HANDLER - Express out of box error handler middleware (to define it give the function 4 arguments first will be always the error
module.exports = (err, req, res, next) => {
  //All operational errors will have a status code, bug will have 500. Is set appError object
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  //DEVELOPMENT
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  }

  //PRODUCTION
  else if (process.env.NODE_ENV === 'production') {
    //Operational erroes and mongoose errors handled only in production by sending meaningful message to the client (in dev we can see all the eror)
    let error = { ...err };
    error.message = err.message; //hack because the message doesn't appear

    //MONGOOSE ERRORS
    //1 Casting Error -> (Mongoose Invalid Id ERROR)
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    //2 DUPLICATE DATA FIELD SET  -> (MongoDB Driver Error) -> not having the name property
    if (err.code === 11000) error = handleDuplicateFieldsDS(error);
    //3 VALIDATION ERROR -> (Mongoose ERROR)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    //If the codiotion aboce are not met, a generic non operational error will be send
    sendErrorProd(error, res);
  }
};
