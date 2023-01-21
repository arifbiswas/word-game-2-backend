const express = require('express')
const cors = require("cors");
const { MongoClient } = require('mongodb');
const { query } = require('express');
require('dotenv').config();

const app = express()

app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;
const uri = process.env.DB_HOST_KEY;

const Client = new MongoClient(uri)

async function run (){
    try {
        const UserCollection = Client.db("wordGame2").collection("users");
        const WordsCollections = Client.db("wordGame2").collection("words");

        // Users API's 
        app.get("/users", async(req, res)=>{
            try {
                const user = await UserCollection.findOne( {email : req.query.email})
                    if(user){
                        res.send({ user : {user_name : user?.user_name , email : user?.email ,time : user?.time,task:user?.task , startDate : user?.startDate , day : user.day}})
                    }
                    else{
                        res.send({message : "user not found"})
                    }
            } catch (error) {
                console.log(error.message);
            }
        })
        // Register api 
         app.post("/users/register", async (req, res) =>{
            try {
                // console.log(req.body);
                const newUser = {              
                    user_name : req.body.user_name,
                    email : req.body.email,
                    password : req.body.password,
                    time : 48,
                    startDate : req.body.date,
                    day : 1,
                    task : [{day : 1 , completed : false , date : req.body.date}]
                }
            const result = await UserCollection.insertOne(newUser)
            res.send(result);

            } catch (error) {
                console.log(error.message);
            }
         })

        //  Login Api 
         app.post("/users/login", async (req, res) =>{
            try {
                const {email , password} = req.body;
                // console.log(email, password);

            const user = await UserCollection.findOne({email : req.body.email})
            // console.log(user);
            if(!user) {
                res.send({message: "Please input valid email"});
            }
             if (user?.password !== password){
                res.send({message: "incorrect password"});
            }
             if(user?.password === password && user?.email === email){
                res.send({message: "login successful" , email : user.email});
            }
            else {
                res.send({message: "login failed"});
            }
            } catch (error) {
                console.log(error.message);
            }
         })

        //  Words Apis 

         app.get("/words" , async(req, res) => {
           try {
            const user = await UserCollection.findOne({email : req.query.email});
            // console.log(user)
            if(user){
                let openTasks =[]
               for(const days of user.task){
                const Day = await WordsCollections.findOne({day : days.day});
                if(days.completed){
                    Day.completed = true;
                    Day.date = user.startDate ? user.startDate : days.date ;
                }
                if(parseInt(days.day) === 1 && user.startDate){
                    Day.date = user.startDate ? user.startDate : days.date ;
                }

                // console.log(Day)
                openTasks.push(Day)
               }
               res.send(openTasks);
            }
         else{
            res.send([]);
         }
           } catch (error) {
            console.log(error)
           }
         })


        //  task Completed 
         app.put("/completed",async(req, res)=>{
            try {
                const completedDate = new Date().toLocaleDateString();
                const user = await UserCollection.findOne({email : req.query?.email});
                const newUpdateTask = user.task.find(task => parseInt(task.day) === parseInt(req.query?.day));
                const AllCompletedTask = user.task.filter(task => parseInt(task.day) !== parseInt(req.query?.day));
                const updated = await UserCollection.updateOne({email : req.query?.email} , {$set :{
                    day : user.day + 1,
                    task : [...AllCompletedTask,{day : newUpdateTask.day , completed : true , date : completedDate },{day : parseInt(newUpdateTask.day) + 1 , completed : false}]
                }});
                res.send(updated);
                // console.log(completedTask);
                
            } catch (error) {
                console.log(error)
            }
         })

        // update Completed Days 
         app.put("/dayCompleted", async(req , res)=>{
           try {
            const date = new Date().toLocaleDateString();
            const user = await UserCollection.findOne({email : req.query.email});
            if(user){
             await UserCollection.updateOne({email : req.query.email}, {$set : {
                time : parseInt(user?.time) + 24,
            }});
            const newUser = await UserCollection.findOne({email : req.query.email});
            if(user.time < newUser.time){
                // const unCompletedTask = newUser.task.find(task => !task.completed);
                const AllCompletedTask = newUser.task.map(task => task);
                let AllUpdateCompletedTask =[];
                for(const updateOnUnCompletedTask of AllCompletedTask){
                    updateOnUnCompletedTask.completed = false;
                    AllUpdateCompletedTask.push(updateOnUnCompletedTask);
                }
                // console.log(AllUpdateCompletedTask);
                // console.log(unCompletedTask, AllCompletedTask)
                await UserCollection.updateOne({email : req.query?.email} , {$set :{
                    task : [...AllUpdateCompletedTask]
                }});
               
            }
            res.send({message : "Completed"})
            // console.log(updated)
            }
           } catch (error) {
            console.log(error);
           }
         })
       
    } catch (error) {
        console.log(error)
    }
}

run().catch(error => {
    console.log(error);
})

app.get('/', (req, res) => res.send('Word Game 2 app'))
app.listen(port, () => console.log(`Word Game 2 app listening on port ${port}!`))