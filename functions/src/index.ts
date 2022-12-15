/* eslint-disable max-len */
import * as functions from "firebase-functions";

import admin = require("firebase-admin");
admin.initializeApp();

// TODO:
// Add some cloud functions to read/write to your firestore database.
// Then add a function that triggers off a Firestore database change.
// Create a pubsub listener function as one of the cloud functions in index.ts.

// insertFromPubsub function: listens for messages to environmental-sensors topic, then logs the data and
// stores it in an object, which it then adds as a collection to Firestore.
// Note: We don't yet have a function to read/write to the firestore database, but
// we can send a msg to the topic below with gcloud CLI, using this syntax:
// gcloud pubsub topics publish environmental-sensors --message='message body' --attribute=
// 'sensorName=value,temperature=value,humidity=value'
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

// helloDan function: listens for Https requests to https://us-central1-cate-test.cloudfunctions.net/helloDan
// logs the request method;
// in progress: responds to POST requests with personalized response
export const helloDan = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello, Dan!", { structuredData: true, numCats: 42 });
  functions.logger.info("Request: ", request.method);
  if (request.method == "POST") {
    functions.logger.info("Hellooo " + request.query.name);
  } else {
    response.send("Hello Dan - you have too many cats!");
  }
});
