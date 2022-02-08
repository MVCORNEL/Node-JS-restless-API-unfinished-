const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../model/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const Email = require('./../utils/email');
const upload = require('./../utils/multer');
const sharp = require('sharp');

//1 TOKEN
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

//2 SIGNUP
exports.signup = catchAsync(async (req, res, next) => {
  //The reason why the full body object is passed, is becase that will produce a huge security flaw, because the user can specifi his role as admin. an gettit the controller
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //1 CREATE JWT TOKEN
  const token = signInToken(newUser._id);

  //2 SEND WELCOME EMAIL
  await new Email(newUser).sendWelcome();

  res.status(201).json({
    //ALL
    token,
    data: { newUser },
  });
});

//3 LOGIN
exports.login = catchAsync(async (req, res, next) => {
  //1 Check if email and password are inserted
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
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

//4 PROTECTED
exports.protected = catchAsync(async (req, res, next) => {
  //1 GETTING THE TOKEN
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    //UNAUTHORIZED
    return next(new AppError('You are not logged in! Please log in to get access', 401));
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
    return next(new AppError('User recently changed password! Please log in again', 401));
  }

  req.user = user;
  next();
});

//5 RESTRICT TO
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

//6 FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    //400 BAD REQUEST
    return next(new AppError('Please insert an email address', 400));
  }
  //1 GET THE USER BASED ON THE POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    //404 NOT FOUND
    return next(new AppError('There is no user with this email address', 404));
  }
  //2 GENERATE THE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken();
  //3 UPADATE THE USER WITH THE NEW FILDS (passwordResetToken passwordResetTokenExpires) -> that are attached to the document by using methods at step 2
  //DEACTIVATE VALIDATION Here we won't have any longer the passworConfirmation on the document, so the validation won't pass ->
  await user.save({ validateBeforeSave: false });
  //4 SEND TOKEN TO THE USER
  //NOT IMPLEMENTED YET

  //WE WANT TO DO MORE THAN SENDING AN ERROR DOWN TO THE CLIENT THAT IS WHY TRY CATCH
  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      //We send the token through and email address and never here, because we assume the email is a safe place, where only the user has access
    });
  } catch (error) {
    //IN THE CASE SOMETHIGN WENT WRONG, WE DON'T WANT THE TOKEN AND ITS DATA ON DB
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    //false because the confirm password is not on the doc anylonger
    await user.save({ validateBeforeSave: false }); //save the changes to passwordResetToken passwordResetTokenExpires
    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
});

//7 RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 GET THE USER BASED ON THE RESET TOKEN (THE TOKEN SENT TO THE USER IS NOT ECRYPTED WHILE THE ONE WHITHN THE DB IS ECNRYPTED)
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  //We need to check if the RESET TOKEN has expried and if the is a user
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetTokenExpires: { $gt: Date.now() } });

  //2 If the token has not expired and there is user, set the new password
  if (!user) {
    //400 BAD REQUEST
    return next(new AppError('Token is invalid or has expried', 400));
  }

  //3 PUT THE NEW PASSWORD DETAILS THAT ARE ON THE REQ OBJECT ON THE, ON THE CURRENT DB DOCUMENT
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpired = undefined;
  //In this case we don't have to turn of the validators, because we want to validate if the pass is the same with the confirm password
  //This is the reason we want to use save and not update to run the pass and passConfirm validation
  await user.save();

  //Send token to user
  const token = signInToken(user._id);

  res.status(200).json({
    status: ' success',
    token,
  });
});

//8 UPDATE CURRENT PASSWORD
//UPDATE current user password
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //1 MAKE SURE THE USER INSERTED THE CURRENT PASS
  if (!req.body.passwordCurrent) {
    return next(new AppError('Please insert your current password', 401));
  }

  //2 FIRST GET THE USER FROM COLLECTION
  //At this point we will have the user data coming from the protect middleware, because we need protected rights to access this route
  //Select the password cause by default not included in the projection
  const user = await User.findById(req.user._id).select('+password');

  //3 CHECK IF THE POSTED CURRENT PASSWORD IN CORRECT -> compare with the one stored in DB
  if (!(await user.isPasswordCorrect(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //4 SAVE THE NEW PASSWORD (VALIDATORS WILL RUN)
  //WHY NOT findByIdAndUpdate
  //1 We havent done User.findByIdAndUpdate because the passwordConfirm validation is not going to worl, because of validator function. because this.password is not defined
  //when we update because by default Mongoose is not really hoing to keep the current object in memory
  //2 Also the 2 presave middleware are not going to work, in this case the password won;t be encrypted and also the passwordChangeAt stamp won't be set3
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  const token = signInToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

//9 Filter Object
const filterObject = (object, ...allowedFields) => {
  //easiest way to loop through an object ks
  const newObj = {};
  Object.keys(object).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = object[el];
    }
  });
  return newObj;
};

exports.uploadUserPhoto = upload.single('photo');

//RESIZE IMAGES
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //if no file return
  if (!req.file) return next();
  //We need the filename in the next middleware function, in updateMe -> when we save the filename in the database
  //We can use jpeg now becayse we covner the file in jpeg already with sharp
  req.file.filename = `user-${req.user.id}.jpeg`;
  //Instaed of having to write the file to the disk, we basicallty keep the image in the memory
  //this operations is asynchronous so we need to use async in order to not block the user loop
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

//10 UPDATE ME
exports.updateMe = catchAsync(async (req, res, next) => {
  //1 Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    //400 bad request
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
  }

  //2 FILTER DATA THAT WE DON'T WANT TO UPDATE (in case the user)
  //Update user document -> cannot use User.save because we won't fill the password, and password validations will run
  //One of the reason is we still need the email and name validators to run compered with save with validators off
  //We don't want to update everything that is within the body like body.role: 'admin'
  const filteredBody = filterObject(req.body, 'firstName', 'lastName', 'email');

  //3 Attach the photo object to the user doc
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

//11 DELETE ME -deactive the current user
//Show only active user when user queries are done
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: 'null',
  });
});
