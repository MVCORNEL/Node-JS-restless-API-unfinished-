const mongoose = require('mongoose');

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
  },
  //SCHEMA OPTIONS
  {
    //When we have a virtual field that is not stored within the database, but calculated using other values
    //We want this so show up whenever there is an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
