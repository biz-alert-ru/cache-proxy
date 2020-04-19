require('dotenv').config();

const appPort = process.env.PORT;
const mongoUri = process.env.MONGO_URI;
const firebaseKeyPath = process.env.FIREBASE_KEY_PATH;

const express = require('express')
const admin = require('firebase-admin');
var MongoClient = require('mongodb').MongoClient
var serviceAccount = require(firebaseKeyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
let query = db.collection('business');



var mongoDB;

MongoClient.connect(mongoUri, function (err, client) {
  if (err) throw err

  mongoDB = client.db('business')
  let observer = query.onSnapshot(querySnapshot => {
    querySnapshot.docChanges().forEach(change => {
      if (change.type === 'added' || change.type === 'modified') {
        let doc = change.doc.data()
        mongoDB.collection("business").updateOne({id: change.doc.id}, { $set: doc}, { upsert: true });
        console.log('inserted or modified', change.doc.id)
      }
      if (change.type === 'removed') {
        mongoDB.collection("business").remove({id: change.doc.id});
        console.log('Removed: ', change.doc.id);
      }
    });
    // ...
  }, err => {
    console.log(`Encountered error: ${err}`);
  });
})

const app = express();
const port = appPort;

app.get('/list', (req, res) => {
  mongoDB.collection('business').find({display: true}).toArray(function (err, result) {
    if (err) throw err
    res.send(result)
  })
})

app.listen(port, () => console.log(`App listening at http://localhost:${port}/list`))
