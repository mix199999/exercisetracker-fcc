const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {Schema} = mongoose;
mongoose.connect(process.env.DB_URL);

const userSchema = new Schema({
  username: String,
});
const User = mongoose.model('User', userSchema);
const exerciseSchema = new Schema({
  user_id: {type: String, require: true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model('Exercise', exerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get(
  '/api/users', async(req, res)=>{
    const users = await User.find({}).select("_id username");
    if(users){
      res.json(users);
    }else{
     res.json({error: "No users found"}); 
    }    
  })

app.post("/api/users",async (req, res) =>{
  console.log(req.body);
  const userObj = new User({
    username: req.body.username
  })
  try{
    const user= await userObj.save();
    res.json(user);
    console.log(user)
  }catch(err){
    console.log(err);
  }
});
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id; 
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.json({ error: "User not found" });
    } else {
      const exerciseObj = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: id,
        username: user.username,
        description: exercise.description, 
        duration: exercise.duration, 
        date: exercise.date.toDateString(),
      });
    }
  } catch (err) {
    console.log(err);
    res.send("Error" + err);
  }
});

app.get("/api/users/:_id/logs", async (req, res) =>{
  const id = req.params._id;
  const { from, to, limit } = req.query;
  try{
    const user = await User.findById(id);
    if(!user){
      res.json({error: "User not found"});
    }else{
      let filter = {user_id: id};
      let dateFilter = {};
      if(from){
        dateFilter["$gte"] = new Date(from);
      }
      if(to){
        dateFilter["$lte"] = new Date(to);
      }
      if(from || to){
        filter.date = dateFilter;
      }
      let exercises = await Exercise.find(filter).limit(limit);
      let log = exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      }));
      res.json({
        _id: id,
        username: user.username,
        count: exercises.length,
        log,
      });
    }
  }catch(err){
    console.log(err);
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
