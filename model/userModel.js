const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    requried: [true, 'Please tell us your name'],
    maxlength: 50,
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

//INSTANCE METHODS is a method that will be available for all the documents of a certain collection
//candidate password is the password that the user passes in the body
//user password is the password within the database (already encrypted)
userSchema.methods.isPasswordCorrect = async function (candidatePassword, userPassword) {
  //Because the password field is selected as false we won't be able to acccess to user password by using this.password, that is why we use user password
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Check of the password was changed after the JWT was issued
userSchema.methods.isPasswordChangedAfterJWTIssued = function (JWTTimestamp) {
  //this always points to the current document in the an instance method
  //1 Check if the password has been ever changed -> 10 meaning the digits base

  //2 Check if user changed password after JWT issued (each payload havign its own iat on payload time of ISSUED AT TIME in seconds)
  console.log('IAT', JWTTimestamp);
  console.log('PASS CHANGED', parseInt(this.passwordChangedAt.getTime() / 1000));

  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return 1643825850 > JWTTimestamp;
  }

  //3 If the password was not changed
  return false;
};

module.exports = mongoose.model('User', userSchema);
