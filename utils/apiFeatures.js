class ApiFeatures {
  //Mongoose query is the query on which we chain the methods
  //let mongooseQuery = Tour.find(JSON.parse(queryStr)); //Returns a query, useful for chaining query methods on line
  //Tour.find().where('durration').equals(5).where('difficulty').equals('easy'); when is not awaited. Cause when awaited will be the doc result
  //we pass the mongoose query here because we dont want query within this class, because if that will be bound this class to the tours resource
  //Express query is the one that we receive from express by using req.query
  constructor(mongooseQuery, expressQuery) {
    this.mongooseQuery = mongooseQuery;
    this.expressQuery = expressQuery;
  }

  // FILTERING ->
  // 127.0.0.1:3000/api/v1/tours?duration=5
  filter() {
    const queryObjParam = { ...this.expressQuery }; //creating new object not shallow copy
    //Excluding special query fields
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObjParam[el]);
    // 1.1 ADVANCED FILTERING
    // 127.0.0.1:3000/api/v1/tours?duration[gte]=5&difficulty=easy
    // //MONGODB QUERY
    // //{difficulty: 'easy' , duration: {$gte: 5}} WHAT WE NEED
    // //{difficulty: 'easy', duration: {gte: '5'}} WHAT WE HAVE
    // //operators that have to be changed are from gte, gt, lte ,lt -> to $gte, $gt, $lte, $lt
    // let query = Tour.find(JSON.parse(queryStr)); //Returns a query, useful for chaining query metho
    let queryStr = JSON.stringify(queryObjParam);
    queryStr = queryStr.replace(/\b(gte|te|lte|lt)\b/g, (match) => `$${match}`);
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr)); //Returns a query, useful for chaining query methods
    return this;
  }

  // SORTING
  // 127.0.0.1:3000/api/v1/tours?sort=price,date -> we cannot let a space in URL REQUEST so that is why we use , comma instead
  // What we need in Mongoose .sort('field -field2')
  sort() {
    if (this.expressQuery.sort) {
      const sortBy = this.expressQuery.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  // 3 PROJECTING (Field limiting)
  // 127.0.0.1:3000/api/v1/tours?fields=price,date -> we cannot let a space in URL REQUEST so that is why we use , comma instead
  limitFields() {
    if (this.expressQuery.fields) {
      const fields = this.expressQuery.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      //EXCLUDE fields that we dont need. Like __v that we won't send to the client
      //__v field is a field internally used by mongoose ->but we can also exclude fields right from the schema
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  // 4 PAGINATION
  // 127.0.0.1:3000/api/v1/tours?page=2&limit=50 -> request coming from the client
  // Default values for page=1 and limit=100
  // Pattern to follow -> page=2&limit=10
  // 1-10(page 1), 11-20(page 2), 20-30 (page 3)
  paginate() {
    const page = this.expressQuery.page * 1 || 1; //convert to Number * and || is a nice trick for defining default values
    const limit = this.expressQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
