const mongoose = require('mongoose');
//UNCAUGHT EXCEPTION -> shold be at the very top, or at least before any other code is executed
//THIS CAN BE BEFORE THE SERVER CAUSE THIS ERRORS DON't HAVE ANYTHING TO TO WITH ASYCN THINGS
process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION  💥! Shutting down.... ');
  console.log(err.name, err.message);
  console.log(err);
  //WHENEVER THERE IS AN UNCAUGHT EXCEPTION, WE REALLY NEED TO CRASH OUR APPLICATION
  //BECAUSE AFTER IT WAS AN UNCAUGHT EXCEPTION THE ENTIRE NODE PROCESS IS IN A SO-CALLED UNCLEAN STATE
  process.exit(1);
});

const app = require('./app');
//DATABASE CONNECTION
const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then((conn) => {
  console.log('DATABASE successfully connected');
});

//STARTUP THE SERVER
const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//UNHANDLED PROMISE REHECTIONS
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION  💥! Shutting down.... ');
  //IF WE''LL HAVE A PROBLEM AS THE DB CONNECTION OUR APP IS NOT GONNA WORK AT ALL
  //IN THIS CASE HERE, ALL WE CAN DO IS TO SHUT DOWN OUR APPLICATION
  console.log(err.name, err.message);
  //SHUT DOWN THE APP THE CODE
  //0 STAND FOR SUCCESS
  //1 STANDS FOR UNCAUGHT EXCEPTION
  // process.exit(1);//This is a very abrupt way of ending the program, because this will immediately abort all the requests that are currently still running or pending
  //GRACEFULLY WAY OF SHUTTING DOWN, WHERE WE FIRST CLOSE THE SERVER, AND ONLY AFTER WE SHUT DOWN THE APPLCIATION
  //By doing that we give time the server time to finish all the request that are still pending, or being yhandled at the time
  //and only after that the server is actually killed
  //USUALLY ON THE PRODUCTION APP ON THE WEB SERVER, we will have some tool in place that restart the application right after it crashes
  //Or also some of the platform that host node.js will automatically do taht on thei own
  server.close(() => {
    process.exit(1);
  });
});
