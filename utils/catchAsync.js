//Higher level function that takes as a parameter a function
const catchAsync = (fn) => {
  //We need the next, in order to pass the error within the next fuctnion, in case an operational error occurs
  //we can catch the error here instead of catching it within the try catch block...
  //because if there is an error within the promise, the promise gets REJECTED
  return (req, res, next) => {
    //the next method will make the error to be propagated in the global error middleware
    fn(req, res, next).catch((err) => next(err));
  };
};

module.exports = catchAsync;
