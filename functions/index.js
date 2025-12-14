/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(user.uid);

  const newUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    // Add any other default user data here
  };

  try {
    await userRef.set(newUser, { merge: true }); // Use merge to avoid overwriting existing data if function is re-triggered
    console.log(`User document created for ${user.uid}`);
  } catch (error) {
    console.error(`Error creating user document for ${user.uid}:`, error);
  }
});


// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
