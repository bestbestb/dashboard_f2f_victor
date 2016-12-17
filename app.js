var HOST = "http://f2fnow.chriscates.ca";
    //var HOST = "http://localhost:3000";
    var app = angular.module("meetf2f", []);

    app.controller("meetf2f", function($scope, $http) {

      var socket = io(HOST);

      socket.on("location", function(data) {


        $scope.$apply(function() {
          var match = false;
          data.date_time = moment(new Date()).fromNow();
          data.date_time_created = moment(new Date()).fromNow();
          data.location = {};
          data.account_status = data.account_status || "active";
          data.location.x = data.latitude;
          data.location.y = data.longitude;
          data.url = "https://facebook.com/" + data.facebook_id;
          $scope.users = $scope.users.map(function(u) {
            if (u.id == data.id) {
              data.date_time_created = u.date_time_created;
              u = data;
              match = true;
              console.log(u);
            }
            return u;
          });
          if (match == false) {
            $scope.users.push(data);
          }
          console.log($scope.users);
        });

      });



    // data
      $scope.head = {
           account_status: "Account Status",
           name: "User ID",
           url: "FB/LI",
           date_time_created: "Reg.Date",
           date_time: "Last Login",
           looking_for: "Asking For",
           location: "Current Location"
      };

      $scope.sort = {
           column: 'name',
           descending: false
      };

      $scope.selectedCls = function(column) {
          return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
      };

      $scope.changeSorting = function(column) {
          var sort = $scope.sort;
          if (sort.column == column) {
               sort.descending = !sort.descending;
          }
          else {
               sort.column = column;
               sort.descending = false;
          }
          console.log($scope.sort);
      };


      console.log($scope.sort.column);
      $scope.mapLat = 0;
      $scope.mapLng = 0;

      $scope.mapPopup = false;
      $scope.userPopup = false;

      $scope.current_user_id = "";
      $scope.current_name = "";
      $scope.profile_picture = "";
      $scope.users = [];
      $scope.locationHistory = [];
      $scope.chats = [];
      $scope.chatMessages = [];
      $scope.test=0;

      $scope.getUsers = function() {
        $http({
          'url': HOST + '/location',
          'method': 'GET'
        }).then(
          function(res) {
            console.log(res.data);
            res.data = res.data.map(function(d, i) {
              d.url = "https://facebook.com/" + d.facebook_id;
              d.date_time = Number(d.date_updated);
              d.date_time_string=moment(d.date_time).fromNow();
              d.date_time_created = Number(d.date_created);
              d.date_time_created_string = moment(d.date_time_created).fromNow(); 
              return d;
            });
            $scope.users = res.data;
            console.log($scope.users[0]);
          },
          function(err) {

          }
        );
      }

      $scope.getUsers();

      $scope.updateUser = function(user) {
        if (confirm("Are you sure you want to do this?")) {
          user.latitude = user.location.x;
          user.longitude = user.location.y;
          $http({
            'url': HOST + '/user',
            'method': 'PATCH',
            'data': user
          }).then(
            function(res) {
              $scope.getUsers();
            },
            function(err) {

            }
          );
        }
      }

      $scope.showMap = function(mapLat, mapLng) {
        $scope.mapPopup = true;
        $scope.mapLat = mapLat;
        $scope.mapLng = mapLng;
      }
      $scope.testFunc = function(){
        $scope.test+=1;
      }
      $scope.showUser = function(user) {
        console.log(user);
        $scope.current_user_id = user.id;
        $scope.current_name = user.name;
        $scope.profile_picture = "https://graph.facebook.com/" + user.facebook_id + "/picture?width=500&height=500";
        $scope.getLocationHistory(user.id);
        $scope.getChats(user.id);
        $scope.userPopup = true;
      }

      $scope.getChats = function(user_id) {
        $http({
          'url': HOST + '/chat?user_id=' + user_id,
          'method': 'GET',
        }).then(
          function(res) {
            $scope.chats = res.data;
          },
          function(err) {

          }
        )
      }

      $scope.openConvo = function(chat_room_id) {
        $http({
          'url': HOST + '/chat/message?chat_room_id=' + chat_room_id,
          'method': 'GET',
        }).then(
          function(res) {
            $scope.chatMessages = res.data;
          },
          function(err) {

          }
        )
      }

      $scope.filterConvo = function(looking_for) {
        $http({
          'url': HOST + '/chat/message/looking?looking_for=' + looking_for,
          'method': 'GET',
        }).then(
          function(res) {
            $scope.chatMessages = res.data;
          },
          function(err) {

          }
        )
      }

      $scope.getLocationHistory = function(user_id) {
        $http({
          'url': HOST + '/location/history?user_id=' + user_id,
          'method': 'GET',
        }).then(
          function(res) {
            res.data = res.data.map(function(d, i) {
              d.date_time = moment(Number(d.date_created)).fromNow();
              return d;
            });
            $scope.locationHistory = res.data;
          },
          function(err) {

          }
        )
      }

      $scope.exportUsers = function() {
        Json2CSV($scope.users);
      }



    });

    function Json2CSV(objArray)
    {
      var
        getKeys = function(obj){
          var keys = [];
          for(var key in obj){
            keys.push(key);
          }
          return keys.join();
        }
        , array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray
        , str = ''
      ;

      for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
          if(line != '') line += ','

          line += array[i][index];
        }

        str += line + '\r\n';
      }

      str = getKeys(objArray[0]) + '\r\n' + str;

      var a = document.createElement('a');
      var blob = new Blob([str], {'type':'application\/octet-stream'});
      a.href = window.URL.createObjectURL(blob);
      a.download = 'export.csv';
      a.click();
      return true;


    }
