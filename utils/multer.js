const multer = require('multer');

//1 MULTER IMAGES save in memory not on disk(buffer) -> can be save on disk but not point here before resizing
const multerStorage = multer.memoryStorage();

//MULTER FILTER
//in this function the goal is to test if the uploaded file is an image, if it is we pass true into the cb function oterwise we pass false into the callback function along with an error
const multerFilter = (req, file, cb) => {
  //no matter if it is a JPEG, PNG or a bitmap or a TIFF, the mimetype will always start with the image
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const createUpload = () => multer({ storage: multerStorage, fileFilter: multerFilter });

module.exports = createUpload();
