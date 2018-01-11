$(document).ready(function() {

  // Display current time on page
  setInterval(function() {
    $("#current-time").text(moment().format("HH:mm:ss"));
  }, 1000);

  ////// Firebase Initialization //////

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

    // Save user input to variables
    var userTrainName = $("#input-train-name").val().trim();
    var userDestination = $("#input-destination").val().trim();
    var userFirstTrainTime = $("#input-first-train-time").val().trim();
    var userFrequency = $("#input-frequency").val().trim();

    // User input validation

    // Check to see if user left any fields blank
    if (userTrainName.length === 0 || userDestination.length === 0 || userFirstTrainTime.length === 0 || userFrequency.length === 0) {
      // Tell the user to complete all fields
      alert("please complete all fields");
    // Check to see if user has entered invalid numbers for first train in HH:mm
    // This should be handled by form input type (time) but as a fallback
    } else if (parseInt(userFirstTrainTime.substring(0,2)) >= 24) {
      // Tell the user that hours must be less than 24
      alert("hours must be less than 24");
    } else if (parseInt(userFirstTrainTime.substring(3,5)) >= 60) {
      // Tell the user that minutes must be less than 60
      alert("minutes must be less than 60");
    // Check to see if user has entered invalid number for frequency
    } else if (parseInt(userFrequency) <= 0) {
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
      };

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


    // var testFirst = "01:00";
    // var testFreq = "60";
    // var testFirstCoverted = moment(testFirst,"HH:mm");
    // var diffTime = moment().diff(moment(testFirstCoverted), "minutes");
    //
    // var remainder = diffTime % testFreq;
    // var minutesRemaining = testFreq - remainder;
    // console.log(`Minutes remaining: ${minutesRemaining}`);
    // var nextTrain = moment().add(minutesRemaining, "minutes");
    // var nextTrainConverted = moment(nextTrain).format("HH:mm");
    // console.log(`Next Train: ${nextTrainConverted}`);

    // Calculate Next Arrival and Minutes Away

    // Initialize variables
    var nextTrainTime = 0;
    var minutesUntilNextTrain = 0;
    var blinkStatus = "";

    // Save frequency as a number for math purposes
    var frequencyInt = parseInt(dbTrain.dbFrequency);
    // Get first train time as a moment object in HH:mm
    var dbFirstTrainTimeObject = moment(dbTrain.dbFirstTrainTime, "HH:mm");
    // Calculate how many minutes have passed since first train
    var minutesSinceFirstTrain = moment().diff(moment(dbFirstTrainTimeObject), "minutes");

    // Check to see if first train is in the future
    if (minutesSinceFirstTrain < 0) {
      nextTrainTime = dbFirstTrainTimeObject;
      minutesUntilNextTrain = Math.abs(minutesSinceFirstTrain);
    } else {
      // Divide minutes passed since first train by frequency and get remainder (i.e. how many minutes since the most recent train left)
      var minutesSinceLastTrain = minutesSinceFirstTrain % frequencyInt;
      // Get minutes remaining until next train
      minutesUntilNextTrain = frequencyInt - minutesSinceLastTrain;
      // Add minutes until next train to current time to get next train time
      nextTrainTime = moment().add(minutesUntilNextTrain, "minutes");
    }

    // Convert next train time to HH:mm format
    var nextTrainTimeConverted = moment(nextTrainTime).format("HH:mm");

    // If 1 minutes remains until next train, style to alert the user that the train is arriving now
    if (minutesUntilNextTrain === 1) {
      minutesUntilNextTrain = "ARRIVING NOW";
      blinkStatus = "blink";
    } else {
      blinkStatus = "";
    }


    // Add each child to table
    $("#schedule-body").append(`
      <tr>
        <td>${dbTrain.dbTrainName}</td>
        <td>${dbTrain.dbDestination}</td>
        <td>${dbTrain.dbFrequency}</td>
        <td>${nextTrainTimeConverted}</td>
        <td class="${blinkStatus}">${minutesUntilNextTrain}</td>
      </tr>
      `);
  });
});
