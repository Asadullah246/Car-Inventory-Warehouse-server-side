const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware 

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vnmzr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const carCollection = client.db("inventory-data").collection("cars");
        app.get('/cars', async (req, res) => {
            const page = parseInt(req.query.page);
            const number = parseInt(req.query.number);
            const query = {};
            const cursor = carCollection.find(query);
            const count = await carCollection.estimatedDocumentCount();
            let cars;
            if (page || number) {
                cars = await cursor.skip(page * number).limit(number).toArray();
            }
            else {
                cars = await cursor.toArray();
            }
            res.send({ data: cars, count: count });
        })
        app.get('/someCars', async (req, res) => {
            const cars = parseInt(req.query.limit)
            const query = {};
            const cursor = carCollection.find(query);
            const loadedCars = await cursor.limit(cars).toArray();
            res.send(loadedCars)
        })

        app.post('/newCars', async (req, res) => {
            const newCar = req.body;
            const insertCar = await carCollection.insertOne(newCar);
            res.send(insertCar)

        })
        app.delete('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await carCollection.deleteOne(query);
            res.send(result)
        });

        app.put("/cars/:id", async (req, res) => {
            const id = req.params.id;
            const newQuantity = req.body.quantity;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updateQuantity = {
                $set: {
                    quantity: newQuantity

                }

            };
            const update = await carCollection.updateOne(filter, updateQuantity, option)
            res.send(update)
        })
        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const car = await carCollection.findOne(query);
            res.send(car)

        });
        app.get('/mycars', async (req, res) => {
            const getEmail = req.headers.email;
            const accessToken = req.headers.token;
            console.log(getEmail, accessToken);
           
            try {
                const decoded =await  jwt.verify(accessToken,  process.env.DB_JWTTOKEN, function(err, decoded) {
                    let email ;
                    if(err) {
                       email="invalid email"
                    }
                    if(decoded) {
                        email = decoded.email 
                    }
                    return email;
                  });
                if (getEmail === decoded) {
                    const query = {}
                    const cursor = carCollection.find(query);
                    const cars = await cursor.toArray();
                    const mycars = await cars.filter(car => car.email === getEmail)
                    
                    if(mycars.length === 0) {
                        res.send({success:"No car found"})
                    }
                   else{
                    res.send(mycars)
                   }
                }
                else{
                    res.send({error:"Unauthorized access"})
                }
            }
            catch (err) {
                

            }


        });
        app.post('/login', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.DB_JWTTOKEN)
            res.send({ token })
        })

    }
    finally {

    }


}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("backend is running")
});
app.listen(port, () => {
    console.log("listening this port is", port);
})
