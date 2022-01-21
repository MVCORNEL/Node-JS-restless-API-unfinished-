const dotenv = require('dotenv');
const express = require('express');

//SETUP THE ENV VARIABLES FROM config.env
dotenv.config({ path: './config.env' });

//CREATE SERVER
const app = express();

app.get('/', (req, res) => {
  res.status(200).send('Hello form the server side');
});

module.exports = app;
