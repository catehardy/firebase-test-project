/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";

import admin = require("firebase-admin");
admin.initializeApp();

// Imports the Google Cloud client library
import { PubSub } from "@google-cloud/pubsub";

// deploy with: firebase deploy --only functions

// 1. Write a function which sends a message to PS TOPIC environmental-sensors (with attributes)
// 2. Write a function that triggers message function 1 (trigger should be an http request - see helloDan func)
// 3. Write a function which subscribes to that TOPIC and then writes to the firestore database

// 1. Function which sends a message to PS TOPIC environmental-sensors (with attributes)
// Code adapted from here: Publish messages to topics: https://cloud.google.com/pubsub/docs/publisher#node.js_3
// Note: We can also send a msg to that topic with gcloud CLI, using this syntax:
// gcloud pubsub topics publish environmental-sensors --message='message body' --attribute='sensorName=value,temperature=value,humidity=value'

const environmentalSensors = "projects/cate-test/topics/environmental-sensors";
const data = JSON.stringify({message: "Latest sensor reports"});

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

async function publishMessageWithCustomAttributes() {
  // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
  const dataBuffer = Buffer.from(data);

  // Add custom attributes to the message
  const customAttributes = {
    sensorName: "sensor-004",
    temperature: "75",
    humidity: "87",
  };

  const messageId = await pubSubClient
      .topic(environmentalSensors)
      .publish(dataBuffer, customAttributes);
  console.log(`Message ${messageId} published.`);
}

// 2. Function that triggers PS message function publishMessageWithCustomAttributes
// helloDan function: listens for https requests to https://us-central1-cate-test.cloudfunctions.net/helloDan
// logs the request method;
// for GET requests, triggers the publishMessageWithCustomAttributes function
// in progress: responds to POST requests with personalized response
export const helloDan = functions.https.onRequest(async (request, response) => {
  functions.logger.info("Hello, Dan!", { structuredData: true, numCats: 42 });
  functions.logger.info("Request: ", request.method);
  if (request.method == "POST") {
    await publishMessageWithCustomAttributes().catch(console.error);
    response.send("Hi Dan, you have the correct number of cats");
    functions.logger.info("Hellooo " + request.body);
  } else {
    await publishMessageWithCustomAttributes().catch(console.error);
    response.send("Hello Dan - you have too many cats!");
  }
});

// 3. Function which subscribes to environmental-sensors TOPIC and then writes to the Firestore database
// listens for messages to environmental-sensors topic,
// then logs the data and stores it in an object,
// which it then adds as a collection to Firestore.

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


export const helloCate = functions.https.onRequest(async (request, response) => {
  functions.logger.info("Hello " + JSON.stringify(request.body));
  const data = request.body;
  if (request.method == "POST") {
    const name = data.name;
    const time = data.time;
    await admin.firestore().collection("helloCate").add({name, time});
    response.status(200).send("OK");
  } else {
    response.status(405).send("Method Not Allowed");
  }
});

