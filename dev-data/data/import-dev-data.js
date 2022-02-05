const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Training = require('./../../model/trainingModel');
const Review = require('./../../model/reviewsModel');
const User = require('./../../model/userModel');

//Environment variables, config
//Must be run before the app file code
dotenv.config({ path: './config.env' });

//CONNECT TO DB (MONGOOSE)
//DATABASE CONNECTION
const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then((conn) => {
  console.log('DATABASE successfully connected');
});

//READ JSON FILE
const trainings = JSON.parse(fs.readFileSync(`${__dirname}/trainings.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const importData = async () => {
  try {
    await Training.create(trainings);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });
    console.log('Data successfully loaded');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Training.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  console.log('IMPORT');
  importData();
} else if ((process.argv = '--delete')) {
  console.log('DELETE');
  deleteData();
}
