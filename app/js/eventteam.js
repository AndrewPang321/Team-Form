angular.module("teamform-eventteam-app", ["firebase", "ngMaterial"])
.controller("EventTeamCtrl", function($scope, $firebaseObject, $firebaseArray, $mdDialog) {
    initializeFirebase();


    $scope.user = null;

    var userRef = null;
    $scope.userObj = null;

    // observe the auth state change
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            console.log(user);

            // refresh the scope
            $scope.$apply(function() {
                $scope.user = user;

                // get the user object from the database
                userRef = firebase.database().ref().child("users").child(user.uid);
                $scope.userObj = $firebaseObject(userRef);
            });
        } else {
            // No user is signed in.
            console.log('no user is signed in');

            // refresh the scope
            $scope.$apply(function() {
                $scope.user = null;

                userRef = null;
                $scope.userObj = null;
            });
        }
    });


    $scope.eventName = getURLParameter("event");


    var eventAdminParamRef = firebase.database().ref().child("events").child($scope.eventName).child("admin").child("param");
    var eventAdminParamObj = $firebaseObject(eventAdminParamRef);
    eventAdminParamObj.$loaded().then(function(admin) {
        $scope.minTeamSize = admin.minTeamSize;
        $scope.maxTeamSize = admin.maxTeamSize;
    });


    /* teams */
    var teamRef = firebase.database().ref().child("events").child($scope.eventName).child("team");

    var teamObj = $firebaseObject(teamRef);
    teamObj.$bindTo($scope, "teams");


    // create new team function
    $scope.createTeam = function() {
        var teamNameInput = $mdDialog.prompt()
            .title("Create a New Team")
            .ok("Create")
            .cancel("Cancel");

        $mdDialog.show(teamNameInput)
            .then(function(team) {
                var newTeamRef = teamRef.child(team);
                newTeamRef.set({size: parseInt(($scope.minTeamSize + $scope.maxTeamSize) / 2), currentTeamSize: 0});
            });
    };


    // request team function
    $scope.requestTeam = function(teamName) {
        var eventMemberTeamRef = firebase.database().ref().child("events").child($scope.eventName).child("member").child($scope.user.uid).child("selection");
        var userEventRef = firebase.database().ref().child("users").child($scope.user.uid).child("events").child($scope.eventName).child("selection");
        var eventMemberTeamArray = $firebaseArray(eventMemberTeamRef);

        eventMemberTeamArray.$loaded().then(function(selections) {
            var requests = [];

            // add the selections stored in the database
            selections.forEach(function(selection) {
                requests.push(selection.$value);
            });

            // add the request team if it was not in the database
            if (!requests.includes(teamName)) {
                requests.push(teamName);
            }

            // update the record in the event
            eventMemberTeamRef.set(requests);
            // update the record in the user's profile
            userEventRef.set(requests);
        });
    };
});
