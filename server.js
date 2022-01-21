const app = require('./app');
const mongoose = require('mongoose');

//DATABASE CONNECTION
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then((conn) => {
  console.log('DATABASE successfully connected');
});

//STARTUP THE SERVER
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
