const express = require('express');
const webpush = require('web-push');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);
const fs = require('fs');
const dotenv = require('dotenv');
// Add multer
const multer = require('multer');

dotenv.config();
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};

db.defaults({
  subscriptions: []
}).write();

// Read model from .data/model.json
// const model = require('./.data/model.json');
var model = ""

function sendNotifications(subscriptions) {
  // Create the notification content.
  const notification = JSON.stringify({
    title: "Hello, Notifications!",
    options: {
      body: `ID: ${Math.floor(Math.random() * 100)}`,
    }
  });
  // Customize how the push service should attempt to deliver the push message.
  // And provide authentication information.
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails
  };
  // Send a push message to each client specified in the subscriptions array.
  subscriptions.forEach(subscription => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substr((endpoint.length - 8), endpoint.length);
    webpush.sendNotification(subscription, notification, options)
      .then(result => {
        // console.log(`Endpoint ID: ${id}`);
        // console.log(`Result: ${result.statusCode}`);
      })
      .catch(error => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Error: ${error} `);
      });
  });
}

var epoch_trainee = 0;
var epoch_participants;
var epoch_model = model;
var epoch_id = 0;

function epoch() {
  if (!epoch_trainee) {
    epoch_participants = db.get('subscriptions').value();
    if (!epoch_participants.length) {
      console.log("No reciepients, skipping.");
      return "hello"
    }
    console.log("Epoch: ", epoch_id, " started...")
  }
  console.log(epoch_trainee, ": sending...");
  sendNotifications([epoch_participants[epoch_trainee]]);
  epoch_trainee++
}

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('model'));

// Handle form submission.
app.use(express.urlencoded({ extended: true }));

app.post('/add-subscription', (request, response) => {
  console.log(`Subscribing ${request.body.endpoint}`);
  db.get('subscriptions')
    .push(request.body)
    .write();
  response.sendStatus(200);
});

app.post('/remove-subscription', (request, response) => {
  console.log(`Unsubscribing ${request.body.endpoint}`);
  db.get('subscriptions')
    .remove({ endpoint: request.body.endpoint })
    .write();
  response.sendStatus(200);
});

app.post('/notify-me', (request, response) => {
  console.log(`Notifying ${request.body.endpoint}`);
  const subscription =
    db.get('subscriptions').find({ endpoint: request.body.endpoint }).value();
  sendNotifications([subscription]);
  response.sendStatus(200);
});

app.post('/notify-all', (request, response) => {
  console.log('Notifying all subscribers');
  const subscriptions =
    db.get('subscriptions').cloneDeep().value();
  if (subscriptions.length > 0) {
    sendNotifications(subscriptions);
    response.sendStatus(200);
  } else {
    response.sendStatus(409);
  }
});

app.get('/vapid-public-key', (request, response) => {
  response.send(vapidDetails.publicKey);
});

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/model", (request, response) => {
  response.json(model);
});

app.post("/epoch_model", (request, response) => {
  console.log(`${epoch_trainee - 1} returned trained model.`);
  epoch_model = request.body.model;
  fs.writeFile("./.data/model.json", JSON.stringify(epoch_model), (err) => {
    if (err) {
      console.log(err);
    }
  })
  response.sendStatus(200);
  // If all participants done, dont call epoch
  epoch_trainee == epoch_participants.length ? finished_epoch() : epoch();
});

function finished_epoch() {
  console.log("Finished epoch ", epoch_id);
  // Save model to .data/model-epoch_id.json
  fs.writeFile(`./.data/model-${epoch_id}.json`, JSON.stringify(epoch_model), (err) => {
    if (err) {
      console.log(err);
    }
  })
  epoch_id++;
}

app.get("/epoch", (request, response) => {
  // Restart the training queue
  epoch_trainee = 0;
  epoch();
  response.json(epoch_model);
});


// New and improved school and coaching
// From Allen -> FIITJEE
var asker = undefined;
var training_in_progress = false;
var model = [...Array(10)].map(e => Array(10).fill(0));

app.get("/getdata", (req, res) => {
  // Who asks?
  console.log(req.query.id, " requests data");
  if (training_in_progress) { res.send({ "busy": true }); return; }
  asker = req.query.id;
  training_in_progress = true;
  res.json(model);
  // Reset the trainee after 10 seconds
  setTimeout(resetTrainee, 10000);
})

const storage = multer.diskStorage({
  destination: './model',
  filename: function (req, file, cb) {
    cb(null, file.fieldname)
  }
})
const upload = multer({ storage: storage })

app.post("/getbackdata", upload.fields([{ name: 'model.json', maxCount: 1 }, { name: 'model.weights.bin', maxCount: 1 }]), (req, res) => {
  // Who gives back?
  console.log(req.query.id, " gives back data");
  if (req.query.id != asker) {
    res.send("Not your turn"); return;
  } else {
    asker = undefined;
    training_in_progress = false;
    res.send("OK");
  }
});

function resetTrainee() {
  if (asker) {
    console.log(asker, " timed out");
    asker = undefined;
    training_in_progress = false;
  }
}

app.get("/epoch_model", (request, response) => {
  console.log(epoch_trainee - 1, "requests model");
  response.json(epoch_model);
});

const listener = app.listen(process.env.PORT || 808, () => {
  console.log(`Listening on port ${listener.address().port}`);
});