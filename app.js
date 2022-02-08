const dotenv = require('dotenv');
const express = require('express');
const trainingRouter = require('./routes/trainingRouter');
const reviewRouter = require('./routes/reviewRouter');
const userRouter = require('./routes/userRouter');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

//SETUP THE ENV VARIABLES FROM config.env
dotenv.config({ path: './config.env' });

//Create server
const app = express();

//Body parser put data coming form the user on req object
app.use(express.json({ limit: '10kb' }));
// //The way that the form sends data to the userver is also called urlencoded
// //extended: true //allows us to pass some more complex data(not really necessary in our case)
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//CREATE ROTUES MIDDLEWARE
app.use('/api/v1/trainings', trainingRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/users', userRouter);

//All unhandled routes
app.all('*', (req, res, next) => {
  //If next takes an argument propagates the error further to the global error handler middleware, skipping the orher middleware
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//HANDLE EXPRESS ASYNCHRONOUS ERRORS
//Express out of box error handler middleware (to define it give the function 4 arguments first will be always the error
app.use(globalErrorHandler);

module.exports = app;
