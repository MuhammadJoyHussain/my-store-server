const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const cors = require('cors')
const admin = require('firebase-admin');
require('dotenv').config()


const port = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());




const serviceAccount = require("./Configs/fresh-valley-6c755-firebase-adminsdk-4d5uc-16a17aedea.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b9eao.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const productCollection = client.db("myStore").collection("products");
    const ordersCollection = client.db("myStore").collection("orders");


    app.get('/product', (req, res) => {
        productCollection.find()
            .toArray((err, items) => {
                res.send(items);
            })
    })



    app.get('/product/:id', (req, res) => {
        const id = ObjectID(req.params.id);

        productCollection.findOne({ _id: id }, (err, result) => {
            if (err) {

            } else {
                res.send(result)
            }
        })

    })


    app.post('/addProduct', (req, res) => {
        const product = req.body;
        productCollection.insertOne(product)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    app.delete('/deleteProduct/:id', (req, res) => {
        productCollection.deleteOne({ _id: ObjectID(req.params.id) })
            .then(result => {
                res.send(result.deletedCount > 0)
            })
    })

    app.post('/addOrders', (req, res) => {
        const orders = req.body;
        ordersCollection.insertOne(orders)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/orders', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        ordersCollection.find({ email: queryEmail })
                            .toArray((err, items) => {
                                res.status(200).send(items);
                            })
                    }
                    else {
                        res.status(401).send('un-authorized access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('un-authorized access')
                });

        } else {
            res.status(401).send('un-authorized access')
        }
    })


    app.get('/orders/:id', (req, res) => {
        const id = ObjectID(req.params.id);

        ordersCollection.findOne({ _id: id }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result)
            }
        })

    })

})

app.listen(process.env.PORT || port)