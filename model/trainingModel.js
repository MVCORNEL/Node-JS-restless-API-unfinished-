const mongoose = require('mongoose');
const slugify = require('slugify');

const trainingSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'A training must have a role'],
      trim: true,
      maxlength: [20, 'A training role must be at most 20 characters'],
      minlength: [3, 'A training role have at least 3 characters'],
    },
    location: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      //long first after lat
      coordinates: [Number],
      address: String,
      description: String,
    },
    earning: {
      type: String,
      required: [true, 'A training must have an earning potetial specified as rate'],
    },
    duration: {
      type: Number,
      required: [true, 'A training must have a duration time'],
    },
    startingDate: {
      type: Date,
      required: [true, 'A training must have a starting date'],
    },
    description: {
      type: String,
      trim: true,
      require: [true, 'A training must have a description'],
    },
    images: {
      type: [String],
      required: [true, 'A tour must have at least 3 cover images'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      //won't be shown when DB si queried
      select: false,
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //this function will run each time a new value is set for this field(roudn with 1 decimal)
      set: (val) => Math.round(val * 10) / 10,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    slug: String,
  },
  //SCHEMA OPTIONS
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//PRE SAVE MIDDLEWARE -> runs for save() and create() but not for insertMany(), before the doc is saved to DB
//this points to the current document
trainingSchema.pre('save', function (next) {
  this.slug = slugify(this.role, { lower: true });
  next();
});

const Training = mongoose.model('Training', trainingSchema);

module.exports = Training;
