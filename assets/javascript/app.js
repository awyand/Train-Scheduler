$(document).ready(function() {

  // Every second
  setInterval(function() {
    // Update current time in DOM
    var currentTime = moment().format("HH:mm:ss");
    $("#current-time").text(currentTime);
    // Check to see if it's a new minute
    if (currentTime.endsWith("00")) {
      // If so, reload DOM from Firebase
      db.ref().once("value").then(populateTable);
    }
  }, 1000);

  function populateTable(snapshot) {
    // Empty table body
    $("#schedule-body").empty();

    // For each child in snapshot
    snapshot.forEach(function(data) {
      // Store each child to an object
      var dbTrain = {
        dbTrainName : data.val().trainName,
        dbDestination : data.val().destination,
        dbFirstTrainTime : data.val().firstTrainTime,
        dbFrequency : data.val().frequency
      }

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
        // 1 is added to match the way that moment does rounding for minutes
        minutesUntilNextTrain = Math.abs(minutesSinceFirstTrain) + 1;
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
          <td>
            <button class="row-btn trash-btn" data-key="${data.key}">
              <i class="far fa-trash-alt"></i>
            </button>
          </td>
          <td>
            <button class="row-btn edit-btn" data-key="${data.key}">
              <i class="far fa-edit"></i>
            </button>
          </td>
          <td>${dbTrain.dbTrainName}</td>
          <td>${dbTrain.dbDestination}</td>
          <td>${dbTrain.dbFrequency}</td>
          <td>${nextTrainTimeConverted}</td>
          <td class="${blinkStatus}">${minutesUntilNextTrain}</td>
        </tr>
        `);
    });
  }

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
      alert("Please complete all fields");
    // Check to see if user has entered invalid numbers for first train in HH:mm
    // This should be handled by form input type (time) but as a fallback
    } else if (parseInt(userFirstTrainTime.substring(0,2)) >= 24) {
      // Tell the user that hours must be less than 24
      alert("Hours must be less than 24");
    } else if (parseInt(userFirstTrainTime.substring(3,5)) >= 60) {
      // Tell the user that minutes must be less than 60
      alert("Minutes must be less than 60");
    // Check to see if user has entered invalid number for frequency
    } else if (parseInt(userFrequency) <= 0) {
      // Tell the user that frequnecy must be a positive number
      alert("Frequnecy must be a positive number");
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

  // Firebase value change listener
  db.ref().on("value", populateTable);
  // db.ref().on("value", function(snapshot) {
  //
  //   // Empty table body
  //   $("#schedule-body").empty();
  //
  //   // For each child in snapshot
  //   snapshot.forEach(function(data) {
  //     // Store each child to an object
  //     var dbTrain = {
  //       dbTrainName : data.val().trainName,
  //       dbDestination : data.val().destination,
  //       dbFirstTrainTime : data.val().firstTrainTime,
  //       dbFrequency : data.val().frequency
  //     }
  //
  //     // Calculate Next Arrival and Minutes Away
  //
  //     // Initialize variables
  //     var nextTrainTime = 0;
  //     var minutesUntilNextTrain = 0;
  //     var blinkStatus = "";
  //
  //     // Save frequency as a number for math purposes
  //     var frequencyInt = parseInt(dbTrain.dbFrequency);
  //     // Get first train time as a moment object in HH:mm
  //     var dbFirstTrainTimeObject = moment(dbTrain.dbFirstTrainTime, "HH:mm");
  //     // Calculate how many minutes have passed since first train
  //     var minutesSinceFirstTrain = moment().diff(moment(dbFirstTrainTimeObject), "minutes");
  //
  //     // Check to see if first train is in the future
  //     if (minutesSinceFirstTrain < 0) {
  //       nextTrainTime = dbFirstTrainTimeObject;
  //       // 1 is added to match the way that moment does rounding for minutes
  //       minutesUntilNextTrain = Math.abs(minutesSinceFirstTrain) + 1;
  //     } else {
  //       // Divide minutes passed since first train by frequency and get remainder (i.e. how many minutes since the most recent train left)
  //       var minutesSinceLastTrain = minutesSinceFirstTrain % frequencyInt;
  //       // Get minutes remaining until next train
  //       minutesUntilNextTrain = frequencyInt - minutesSinceLastTrain;
  //       // Add minutes until next train to current time to get next train time
  //       nextTrainTime = moment().add(minutesUntilNextTrain, "minutes");
  //     }
  //
  //     // Convert next train time to HH:mm format
  //     var nextTrainTimeConverted = moment(nextTrainTime).format("HH:mm");
  //
  //     // If 1 minutes remains until next train, style to alert the user that the train is arriving now
  //     if (minutesUntilNextTrain === 1) {
  //       minutesUntilNextTrain = "ARRIVING NOW";
  //       blinkStatus = "blink";
  //     } else {
  //       blinkStatus = "";
  //     }
  //
  //     // Add each child to table
  //     $("#schedule-body").append(`
  //       <tr>
  //         <td>
  //           <button class="row-btn trash-btn" data-key="${data.key}">
  //             <i class="far fa-trash-alt"></i>
  //           </button>
  //         </td>
  //         <td>
  //           <button class="row-btn edit-btn" data-key="${data.key}">
  //             <i class="far fa-edit"></i>
  //           </button>
  //         </td>
  //         <td>${dbTrain.dbTrainName}</td>
  //         <td>${dbTrain.dbDestination}</td>
  //         <td>${dbTrain.dbFrequency}</td>
  //         <td>${nextTrainTimeConverted}</td>
  //         <td class="${blinkStatus}">${minutesUntilNextTrain}</td>
  //       </tr>
  //       `);
  //   });
  // });

  // Delete button click handler
  $(document).on("click", ".trash-btn", function() {
    // Get unique Firebase ID from button (added on button creation)
    var trainKey = $(this).attr("data-key");
    // Remove object from Firebase
    db.ref(trainKey).remove();
  });

  // Edit button click handler
  $(document).on("click", ".edit-btn", function() {
    // Get unique Firebase ID from button (added on button creation)
    var trainKey = $(this).attr("data-key");
    // Get current values from Firebase
    db.ref(trainKey).once("value").then(function(singleTrainSnap) {
      // Populate modal with values from snapshot
      $("#edit-modal-train-name").text(singleTrainSnap.val().trainName);
      $("#edit-modal-input-train-name").val(singleTrainSnap.val().trainName);
      $("#edit-modal-input-destination").val(singleTrainSnap.val().destination);
      $("#edit-modal-input-first-train-time").val(singleTrainSnap.val().firstTrainTime);
      $("#edit-modal-input-frequency").val(singleTrainSnap.val().frequency);
    });
    // Populate a modal
    $("#edit-modal").modal("show");
  });

  // Save edits button click handler
  $(document).on("click", "#save-edits-btn", function() {
    // Send to validate inputs
    // Update Firebase
    // Empty edit form
  });

  ////// FUNCTIONS //////
  // validate input function

});
