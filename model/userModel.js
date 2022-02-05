const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please tell us your first name!'],
  },

  lastName: {
    type: String,
    requried: [true, 'Please tell us your last name!'],
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },

  photo: { type: String, default: 'default.jpg' },

  role: { type: String, enum: ['user', 'trainer', 'admin'], default: 'user' },
  //A password having those sort are request as * 1 S c... are not really more effective. the most secure passwords are the longest ones
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //Passowrd won't be displayed on DB query
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,

  active: {
    type: Boolean,
    default: true,
    //won't be projected
    select: false,
  },
});

//HIDE DEACTIVATED FIELDS
//shows only the active suers, for any type of queries
userSchema.pre('/^find/', function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//1 PASSWORD ENCRYPTION
//The encryption will happen between the moment we receive the data and the momennt the data is acutally persisted save middleware will work for on
//PRE SAVE HOOK, run before an actual event, runs before .save() and .create() but not on insertMany()
userSchema.pre('save', async function (next) {
  //WE ONLY WANT TO ENCRYPT THE PASSWORD IF THE PASSWORD HAS ACTUALLY BEEN UPDATED
  //BECAUSE IN THE CASE USER UPDATES ONLY THE EMAIL, SO IN THAT CASE WE DON'W WANT TO ECRYPT THE PASSWORD AGAIN
  if (!this.isModified('password')) {
    return next();
  }
  //2 HASH THE PASSWORD WITH THE COST OF 12
  //BCRYPT encryption or hasing using a very well known and well-studied and very popular
  //BCRYPT WILL SALT THE PASSWORD, SO 2 identical passwords won't generate the same HASH
  //12 is the CPU INTENSITY this operation will have, default value being 10, but is a bit better to use now 12 because comp become more and more powerful
  //We want also th use asynchronous version this is this one
  this.password = await bcrypt.hash(this.password, 12);

  //3 DELETE THE CONFIRM PASSWORD FIELD , BECAUSE AT THIS POINT WE ONLY NEED THE REAL HASHED PASSWORD
  this.passwordConfirm = undefined;
  next();
});

//CHANGE passwordChangedAtProperty but only when be modified the password property (not when a new doc is created)
userSchema.pre('save', async function (next) {
  //When we create a new document we did actually modify the password, that why we have to use isNew() on mongoose documentation
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  //VERY IMPORTANT !!
  //The problem here is sometimes saving the data is a bit slower and sometimes is saved after the JSON WEB TOKEN has been created
  //That will make it sometimes that the user will not be able to log in using the new token
  //Sometimes happens that this that the JWT token is created a bit before the changedPasswordTimeStamp
  //We can foix that by substractig one second, SO that will put the the passWordChange time one second in the past(not 100% accurate) but doesn;t matter at all
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//INSTANCE METHODS is a method that will be available for all the documents of a certain collection
//candidate password is the password that the user passes in the body
//user password is the password within the database (already encrypted)
userSchema.methods.isPasswordCorrect = async function (candidatePassword, userPassword) {
  //Because the password field is selected as false we won't be able to acccess to user password by using this.password, that is why we use user password
  return await bcrypt.compare(candidatePassword, userPassword);
};

//CHECK IF PASSWORD WAS CHANGED AFTER TOEKN WAS ISSUED
userSchema.methods.isPasswordChangedAfterJWTIssued = function (JWTTimestamp) {
  //this always points to the current document in the an instance method
  //1 Check if the password has been ever changed -> 10 meaning the digits base
  // Check if user changed password after JWT issued (each payload havign its own iat on payload time of ISSUED AT TIME in seconds)
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return changedTimestamp > JWTTimestamp;
  }
  //2 If the password was not changed
  return false;
};

//CREATE PASSWORD RESET TOKEN THAT WILL BE SEND TO THE USER, THIS TOKEN WILL
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //NEVER STORE A PLAIN RESET TOKEN INTO THE DB
  //Encrypt the random generated code, and attach it to the document -> this is done in the controller
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  //10 minutes
  this.passwordResetTokenExpires = Date.now() + 1000 * 60 * 10;
  //Return the token, but not the encrypted one, this will be the token that will be sent through the email
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
