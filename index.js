
const express = require('express');
const app = express()
const cors = require('cors')
let jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gumuqu0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const database = client.db("gangas_grill")
    const popularCollection = database.collection("popular_item")
    const cartCollection = database.collection("carts_item")
    const userCollection = database.collection("user_Collection")

    app.post('/jwt', async(req,res)=>{
      const data = req.body;
      // console.log(data)
      const token = jwt.sign(
        data, process.env.access_token, { expiresIn: '1h' }
      )
      res.send({token})
    })

    // middlewares
    const verifyToken = (req,res,next)=>{
      if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'})
      }
      const token = req.headers.authorization?.split(' ')[1];
      jwt.verify(token, process.env.access_token, function(err, decoded) {
        if(err){
          return res.status(401).send({message: 'forbidden access'})
        }else{
          req.decoded  = decoded;
          // console.log("fffff", req.headers.authorization)
          next()
        }
      });
    }
    // use after verify admin after vefity token
    const verifyAdmin = async(req,res, next)=>{
      const email =  req.decoded.userEmail;
      const query = {email : email};
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message: 'forbidden access'})
      }
      next()

    }

    app.get('/user/admin/:email', verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email !== req.decoded.userEmail){
        return res.status(403).send({message: 'unauthorized access'})
      }
      const query = {email : email};
      const user = await userCollection.findOne(query)
      let isAdmin = false;
      if (user){
        isAdmin = user?.role === 'admin'
      }
      res.send({isAdmin})
    })

    app.get('/menuItem', async(req, res) =>{
        const cursor = popularCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.post('/menuItem', async(req,res)=>{
      const data = req.body;
      const result = await popularCollection.insertOne(data)
      res.send(result)
    })

    app.get('/cart',async(req,res)=>{
      const email = req.query.email;
      const query = {email : email}
      const cursor = cartCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/user',verifyToken, verifyAdmin,  async(req,res)=>{
        const cursor = userCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.post('/cart', verifyToken, async(req,res)=>{
      const data = req.body;
      const result = await cartCollection.insertOne(data)
      res.send(result)
    })

    app.delete('/cart/:id', verifyToken, async(req,res)=>{
      const id = req.params.id
      const query = { _id : new ObjectId(id) }
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/user/:id', verifyToken, verifyAdmin, async(req,res)=>{
      const id = req.params.id
      const query = { _id : new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/menuItem/:id', verifyToken, verifyAdmin, async(req,res)=>{
      const id = req.params.id
      const query = { _id : new ObjectId(id) }
      const result = await popularCollection.deleteOne(query)
      res.send(result)
    })

    // save user data 
    app.post('/user', async(req,res)=>{
      const user = req.body;
      const query = {email : user.email}
      const ifExist = await userCollection.findOne(query)
      if(ifExist){
        return
      }else{
        const result = await userCollection.insertOne(user)
        res.send(result)
      }
    })


    // make user admin
    app.patch('/user/admin/:id', verifyToken, verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updatedOption = {
        $set:{
          role : "admin"
        }
      }
      const result = await userCollection.updateOne(filter, updatedOption)
      res.send(result)
    })

    


    app.get('/', (req,res)=>{
        res.send('Hello World')
    })


    app.listen(port, ()=>{
        console.log(`Example app listen on port ${port}`)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
