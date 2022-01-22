//All error create by this class will be operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    //When status code is a 400, then will be a fail -> starts with 4
    //When the status code will be a 500, than will be an erorr -> starts with 5
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    //Later we will use this field to check if the error are operational
    //Only send error messages back to the client when these are operational
    this.isOperational = true;
    //Capturing the stack trace, that will show us where the error firstly occured
    //In this way when a new object is created, and the cosntructor function is called
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
