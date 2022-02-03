const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../model/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

//In the JWT token the payload will be always the id used by the user to access it accoutn details and to access protected routes
const signInToken = (id) => {
  return jwt.sign(
    //1 PAYLOAD
    { id },
    process.env.JWT_SECRET,
    //3 HEADERS + OPTIONS -> USSUALT CREATE AUTOMMATICALLTY IF NOT EXTRA DETAILS
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.signup = catchAsync(async (req, res, next) => {
  //The reason why the full body object is passed, is becase that will produce a huge security flaw, because the user can specifi his role as admin. an gettit the controller
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: Date.now(),
  });

  //CREATE JWT TOKEN
  const token = signInToken(newUser._id);

  res.status(201).json({
    //ALL
    token,
    data: { newUser },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  //1 Check if email and password are inserted
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password'));
  }

  //2 Select the user based on email and password field that is set to not be seen in our projection
  const user = await User.findOne({ email: email }).select('+password');

  //3 Very important is that to check if the user exists and if the data provided is correct only in 1 step
  //  As that we will not give the user extra info wheter the pass or email is correct
  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError('Incorrect user or password', 401));
  }

  //CREATE JWT TOKEN
  const token = signInToken(user._id);

  res.status(201).json({
    //ALL
    token,
    data: { user },
  });
});

exports.protected = catchAsync(async (req, res, next) => {
  //1 GETTING THE TOKEN
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    //UNAUTHORIZED
    return next(new AppError('You are not logged in! Please log in to get access'));
  }

  //2 Verification step for the token (Verifycate if somebody modified the data or if the token already expired)
  //Promisifying a function -> making it ro return a function (Because we used Promises instead of asynchronous callbacks all over the project)
  const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3 CHECK IF THE USER STILL EXISTS, why if the user has been delete din the meantime ? -> so the token still exists but the user no loger existing
  const user = await User.findById(decodedPayload.id);
  if (!user) {
    return next(new AppError('The token belonging to this user does no loger exist', 401));
  }

  if (user.isPasswordChangedAfterJWTIssued(decodedPayload.iat)) {
    return next(new AppError('User recently changed password! Please log in again'));
  }

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  //this functin will have access to previous variables due to closures
  //in this way we can pass a varaible even if we have a a method signature
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      //403 FORBIDDEN
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
