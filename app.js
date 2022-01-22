const dotenv = require('dotenv');
const express = require('express');
const trainingRouter = require('./routes/trainingRouter');

//SETUP THE ENV VARIABLES FROM config.env
dotenv.config({ path: './config.env' });

//CREATE SERVER
const app = express();

//MIDLEWARES

//Body parser put data coming form the user on req object
app.use(express.json({ limit: '10kb' }));

//CREATE ROTUES MIDDLEWARE
app.use('/api/v1/trainings', trainingRouter);

module.exports = app;
