/* eslint-disable max-len */
import * as functions from "firebase-functions";

import admin = require("firebase-admin");
admin.initializeApp();

// We can now send a msg to this topic with gcloud CLI, using this syntax:
// gcloud pubsub topics publish environmental-sensors --message='message body' --attribute='key=value,key=value'
exports.insertFromPubsub = functions.pubsub.topic("environmental-sensors").onPublish((message, context) => {
  functions.logger.info("The function was triggered at ", context.timestamp);

  const messageBody = message.data ? Buffer.from(message.data, "base64").toString() : null;
  functions.logger.info("Full message: ", messageBody);

  let sensorName = "";
  let temperature = "";
  let humidity = "";

  try {
    sensorName = message.attributes.sensorName;
    temperature = message.attributes.temperature;
    humidity = message.attributes.humidity;
    functions.logger.info("sensorName: ", sensorName);
    functions.logger.info("temperature: ", temperature);
    functions.logger.info("humidity: ", humidity);
  } catch (e) {
    functions.logger.error("PubSub message attributes error: ", e);
  }

  const sensorInfo = {
    "message": messageBody,
    "sensorName": sensorName,
    "temperature": temperature,
    "humidity": humidity,
  };

  return admin.firestore().collection("environmentalSensors").add(sensorInfo);
});


// deploy with: firebase deploy --only functions

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Make a simple function that sends a message to a topic
// and then that other function does something with it.

// If it's a GET request, return the same message
// If it's a POST request, get some user data from the request body,
// modify it, and return it to the user.

// Firebase docs: Call functions via HTTP requests
// https://firebase.google.com/docs/functions/http-events

// Cloud Functions: moving data from Pubsub to
// Firebase Cloud Firestore in TypeScript:
// https://www.youtube.com/watch?v=3Zohd6U6CL8

export const helloDan = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello, Dan!", { structuredData: true, numCats: 42 });
  functions.logger.info("Request: ", request.method);
  if (request.method == "POST") {
    functions.logger.info("Hellooo " + request.query.name);
  } else {
    response.send("Hello Dan - you have too many cats!");
  }
});

// Add some cloud functions to read/write to your firestore database.
// Then add a function that triggers off a Firestore database change.
// Create a pubsub listener function as one of the cloud functions in index.ts.
