$(document).ready(function() {
  // Log current time in HH:mm
  var currentTime = moment().format("HH:mm");
  console.log(currentTime);

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDuJehwSY6WYJWDaRzhPRsIXAVLcR4oK4E",
    authDomain: "moon-base-train-scheduler.firebaseapp.com",
    databaseURL: "https://moon-base-train-scheduler.firebaseio.com",
    projectId: "moon-base-train-scheduler",
    storageBucket: "",
    messagingSenderId: "462766342864"
  };

  firebase.initializeApp(config);

  var db = firebase.database();


  ////// EVENT HANDLERS //////

  // Add train button click handler
  $(document).on("click", ".add-train-btn", function() {
    // Prevent default submit
    event.preventDefault();

    // User input validation
    // Check to see if user left any fields blank
    if (
           $("#input-first-train-time").val().trim().length === 0
        || $("#input-destination").val().trim().length === 0
        || $("#input-first-train-time").val().trim().length === 0
        || $("#input-frequency").val().trim().length === 0) {
          // Tell the user to complete all fields
          alert("please complete all fields");

        // Check to see if user has entered invalid numbers for first train in HH:mm
        // This should be handled by form input type (time) but as a fallback
        } else if (parseInt($("#input-first-train-time").val().trim().substring(0,2)) >= 24) {
          // Tell the user that hours must be less than 24
          alert("hours must be less than 24");
        } else if ($("#input-first-train-time").val().trim().substring(3,5) >= 60) {
          // Tell the user that minutes must be less than 60
          alert("minutes must be less than 60");

        // Check to see if user has entered invalid number for frequency
        } else if ($("#input-frequency").val().trim() <= 0) {
          // Tell the user that frequnecy must be a positive number
          alert("frequnecy must be a positive number");
        // If all user input validation is okay, continue with Firebase population
        } else {
          // Save user inputs to a newTrain object to push to Firebase
          var newTrain = {
            trainName : $("#input-train-name").val().trim(),
            destination : $("#input-destination").val().trim(),
            firstTrainTime : $("#input-first-train-time").val().trim(),
            frequency : $("#input-frequency").val().trim()
          }

          // Upload to Firebase
          db.ref().push(newTrain);

          // Clear Form
          $("#input-train-name").val("");
          $("#input-destination").val("");
          $("#input-first-train-time").val("");
          $("#input-frequency").val("");
        }
      });

  // Firebase event for child added hanlder
  db.ref().on("child_added", function(data, prevChildKey) {
    // Store each child to an object
    var dbTrain = {
      dbTrainName : data.val().trainName,
      dbDestination : data.val().destination,
      dbFirstTrainTime : data.val().firstTrainTime,
      dbFrequency : data.val().frequency
    }

    // Calculate Next Arrival

    // Calculate Minutes Away

    // Add each child to table
    $("#schedule-body").append(`
      <tr>
        <td>${dbTrain.dbTrainName}</td>
        <td>${dbTrain.dbDestination}</td>
        <td>${dbTrain.dbFrequency}</td>
        <td>Next Arrival</td>
        <td>Minutes Away</td>
      </tr>
      `);

  });

});
