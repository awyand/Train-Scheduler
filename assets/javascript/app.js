$(document).ready(function() {


  ////// GLOBAL VARIABLES //////


  // Boolean for tracking if the user is in edit mode or not (for modal choice making)
  var isEditing = false;


  ////// FIREBASE //////


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

    // If validateInputs() returns false
    if (!validateInputs(userTrainName, userDestination, userFirstTrainTime, userFrequency)) {

      // Show error modal
      $("#error-modal").modal("show");
    } else {
      // Otherwise continue with populating Firebase and DOM

      // Save user values to a new train object
      var newTrain = {
        trainName : $("#input-train-name").val().trim(),
        destination : $("#input-destination").val().trim(),
        firstTrainTime : $("#input-first-train-time").val().trim(),
        frequency : Math.round($("#input-frequency").val().trim())
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

  // Firebase value change listener - call populateTable function
  db.ref().on("value", populateTable);

  // Delete button click handler
  $(document).on("click", ".trash-btn", function() {
    // Get unique Firebase ID from button (added on button creation)
    var trainKey = $(this).attr("data-key");
    // Remove object from Firebase
    db.ref(trainKey).remove();
  });

  // Edit button click handler
  $(document).on("click", ".edit-btn", function() {
    isEditing = true;
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
      // Give the Save Edits button a data-key equal to the Firebase ID
      $("#save-edits-btn").attr("data-key", trainKey);
    });
    // Populate a modal
    $("#edit-modal").modal("show");
  });

  // Save Edits button click handler
  $(document).on("click", "#save-edits-btn", function() {

    // Get Firebase ID from button
    var trainKey = $(this).attr("data-key");

    // Save user input to variables
    var userTrainName = $("#edit-modal-input-train-name").val().trim();
    var userDestination = $("#edit-modal-input-destination").val().trim();
    var userFirstTrainTime = $("#edit-modal-input-first-train-time").val().trim();
    var userFrequency = $("#edit-modal-input-frequency").val().trim();

    // If validateInputs() returns false
    if (!validateInputs(userTrainName, userDestination, userFirstTrainTime, userFrequency)) {
      // Hide edit modal
      $("#edit-modal").modal("hide");
      // Show error modal
      $("#error-modal").modal("show");
    } else {
      // Continue with populating Firebase and DOM
      $("#edit-modal").modal("hide");
      // Update Firebase with values
      db.ref(trainKey).set({
        trainName : userTrainName,
        destination : userDestination,
        firstTrainTime : userFirstTrainTime,
        frequency : userFrequency
      });
      isEditing = false;
    }
  });

  // Discard Changes button click hanlder
  $(document).on("click", "#discard-edits-btn", function() {
    isEditing = false;
  });

  // Close Error Modal Button Click Handler
  $(document).on("click", "#error-close", function() {
    // Show edit modal if isEditing is true
    if (isEditing) {
      $("#edit-modal").modal("show");
    }
  });


  ////// FUNCTIONS //////


  // Update clock every second and update train times every minute
  // Every second
  setInterval(function() {
    // Update current time in DOM
    var currentTime = moment().format("HH:mm:ss");
    $("#current-time").text(currentTime);
    // Check to see if it's a new minute
    if (currentTime.endsWith("00")) {
      // If so, reload DOM from Firebase by calling populateTable function
      db.ref().once("value").then(populateTable);
    }
  }, 1000);

  // Populate Table Function
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
        // Set next train time to first train time
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

      // If 1 minutes remains until next train, style to alert the user that the train is arriving
      if (minutesUntilNextTrain === 1) {
        minutesUntilNextTrain = "ARRIVING";
        blinkStatus = "blink";
      } else {
        blinkStatus = "";
      }

      // Add each child to table as a row
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
        </tr>`);
    });
  }

  function validateInputs(name, destination, first, frequency) {
    // Remove error CSS class from all lines
    $("#error-fields").removeClass("error");
    $("#error-hours").removeClass("error");
    $("#error-minutes").removeClass("error");
    $("#error-frequency").removeClass("error");

    // Initialize validationResult boolean to true
    var validationResult = true;

    // Check to see if user left any fields blank, if hours and minute are valid, and if frequency is positive
    // Add error CSS class to appropriate line based on results
    if (name.length === 0 || destination.length === 0 || first.length === 0 || frequency.length === 0) {
      $("#error-fields").addClass("error");
      validationResult = false;
    }

    if (parseInt(first.substring(0,2)) >= 24) {
      $("#error-hours").addClass("error");
      validationResult = false;
    }

    if (parseInt(first.substring(3,5)) >= 60) {
      $("#error-minutes").addClass("error");
      validationResult = false;
    }

    if (parseInt(frequency) <= 0) {
      $("#error-frequency").addClass("error");
      validationResult =  false;
    }

    return validationResult;
  }
});
