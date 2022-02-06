const mongoose = require('mongoose');
const Training = require('./trainingModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a review'],
      trim: true,
      maxlength: 300,
    },
    rating: {
      type: Number,
      required: [true, 'A review must have rating'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      //We don't want to display this field when query the db
      select: false,
    },
    training: {
      type: mongoose.Schema.ObjectId,
      ref: 'Training',
      required: [true, 'Review must depend on a training'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must depend on a user'],
    },
  },
  //SCHEMA OPTIONS
  {
    //When we have a virtual field that is not stored within the database, but calculated using other values
    //We want this so show up whenever there is an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Preventing a user having more reviews on a tour
reviewSchema.index({ training: 1, user: 1 }, { unique: true });

//Populate the user into the review
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email photo',
  });
  next();
});

//STATIC METHOD used to calculate the averages
reviewSchema.statics.calcAverageRatings = async function (trainingId) {
  //id of the training currently belongign to
  //AGGREGATION PIPELINE (this point to he model) (Aggregation pipeline always on the model)
  const stats = await this.aggregate([
    { $match: { training: trainingId } },
    {
      $group: {
        _id: '$training',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //Update the TRAINING fields, but only when there are reviews
  if (stats.length > 0) {
    await Training.findByIdAndUpdate(trainingId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  }
  //Default values
  else {
    await Training.findByIdAndUpdate(trainingId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5,
    });
  }
};

//CALC AVERAGE ON CREATE
//Very important so update the Training fields only after the documents were already save to the DB
//PRE SAVE HOOK, run before an actual event, runs before .save() and .create() but not on insertMany()
reviewSchema.post('save', function () {
  //PROBLEM -> the problem here is that the Review variable is not defined yet ->
  //and we cannot move this code after the Review declaration(not gonna work cause the model won;t have the static model than)
  //because like in express in mogngoose the code runs in sequence, because we will only declare it only after the review model was created
  // Review.calcAverageRatings(this.training);
  this.constructor.calcAverageRatings(this.training);
});

//CALC AVERAGE ON UPDATE AND ON DELETE
//Update review avg and quantity on Update and delete -> findByIdAndUpdate, findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //this here will point to the current document not to the current query
  //if we want to execute the query and find the id of the document we must create a o copy of the query first because a query will execute only once
  //will pass the id of this clone query to the next
  //We also have to save the document otherwise we won't have access to the static method
  this.result = await this.clone().findOne();
  next();
});
//Calculate the document avgereges after the doc was saved, otherwise it won't be pu to date
reviewSchema.post(/^findOneAnd/, async function () {
  await this.result.constructor.calcAverageRatings(this.result.training);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
