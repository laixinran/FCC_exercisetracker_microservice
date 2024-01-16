const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.json()); //parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); //parse URL in the req.body
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//set up mongoose (basically same as the moogoose section solution, check back there if you're unsure)
const mongoose = require('mongoose');

//connect to database
mongoose.connect(process.env['DB_URL'], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
});


//create a userSchema, define the document structure & field 
userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [
    {
      description: String,
      duration: Number,
      date: String
    }
  ]
});

//create a model from userSchema
let User = mongoose.model('User', userSchema);

//create an exerciseSchema
exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

//create a model from exerciseSchema
let Exercise = mongoose.model('Exercise', exerciseSchema);



//post the name of a new user to the database
app.post('/api/users', async (req, res) => {
  let username = req.body.username;
  
  //create an instance doc of the tracker model
  const userDoc = new User({
    username: username
  });

  //save the doc to the database
  await userDoc.save();

  console.log('Add User:', userDoc);
  res.json({ username: username, _id: userDoc._id});
});



//You can make a GET request to /api/users to get a list of all users (an array)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




//another post
app.post('/api/users/:_id/exercises', async (req, res) => {

try{
  let _id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date; 
  
  // If no date is provided, the current date will be used by default.
  if (date) {
    date = new Date(date);
  } else {
    date = new Date();  
  }


  //find corresponding user doc by _id
  const userDoc = await User.findById(_id);

  if (!userDoc) {
    return res.status(404).json({ error: 'User not found' });
  }

  //create an instance doc of the Exercise model
  const exerciseDoc = new Exercise({
    username: userDoc.username,
    description: description,
    duration: duration,
    date: date,
  });


  userDoc.log.push({
    description: description,
    duration: duration,
    date: date
  })
    
  await exerciseDoc.save();
  await userDoc.save();

  console.log('Add Exercise:', exerciseDoc);
  //The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.
 

  res.json({
    username: userDoc.username,
    description: exerciseDoc.description,
    duration: exerciseDoc.duration,
    date: exerciseDoc.date.toDateString(),
    _id: userDoc._id
  });
} catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
}
});


//Retrieve the complete exercise log of a user
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const _id = req.params._id;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let logs = user.log;

    // Filter logs based on from and to dates
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      logs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= fromDate && logDate <= toDate;
      });
    }

    // Limit the number of logs
    if (limit) {
      logs = logs.slice(0, parseInt(limit));
    }


    // Format the date property as a string using toDateString()
    logs = logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toDateString()
    }));

    
    const count = logs.length;

    res.json({
      username: user.username,
      count: count,
      _id: _id,
      log: logs
    });
  } catch (error){
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


  
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
