// JavaScript Document
(function(){
    var app = angular.module('fourSquare', []);
    
     app.controller("fourController", ["$http", "$scope", function($http, $scope){
        var venues = this;
        this.section = "food", this.start="", this.end="";
        this.sectOptions = ["food", "drinks", "shops", "arts", "outdoors", "sights"]; 
        this.show = true, this.spinner = true;
        this.directionsDisplay, this.geocoder, this.map,
        this.directionsService = new google.maps.DirectionsService();
        this.clickedDiv = -1;
        
        var fourAPI = "https://api.foursquare.com/v2/venues/explore";
        
        this.selectTab = function(setTab) {
             this.section = setTab;
             this.getVenues();
        };
        
        this.isSelected = function(checkTab) {
             return this.section === checkTab;
        };
        
        this.isClicked = function(index) {
            return this.clickedDiv === index;
        };
    
        this.getVenues = function() {
            $scope.directPanel = false;
            this.clickedDiv = -1;

            if (!venues.spinner) {
                venues.spinner = true;
            }    
            
            if(this.map) {
                this.resizeMap();
            }
            
            var config = {
                params: {
                    client_id: "FUUNFVS1KWHL1AT0NLM1DXTA2ZCP21R3HNRJSVZT0CWN5XM0", 
                    client_secret: "UKS4ZAEKGMQ1JBWGOBROVJ2TSNBLMPEHTZR4TNMRL2VG50KL",
                    ll: "6.4531,3.3958", section: this.section, v: "20130815", callback: "JSON_CALLBACK"
                }
            };
            
            $http.jsonp(fourAPI, config).success(venues.venuesCallBack);
        };
    
        this.venuesCallBack = function(resp) {
                venues.results = resp.response.groups[0].items;
                
                if(venues.results.length > 0 ) {
                     venues.spinner = false;
                     venues.show = true; 
                     $.each(venues.results, function(index, result){ 
                        venues.validateResults(result);

                        var photoEndPt = "https://api.foursquare.com/v2/venues/" + result.venue.id + "/photos";
                        var photoConfig =  { 
                            params: {
                                client_id: "FUUNFVS1KWHL1AT0NLM1DXTA2ZCP21R3HNRJSVZT0CWN5XM0", 
                                client_secret: "UKS4ZAEKGMQ1JBWGOBROVJ2TSNBLMPEHTZR4TNMRL2VG50KL",
                                 v: "20140714", callback: "JSON_CALLBACK" 
                            }
                        };
                        
                        $http.jsonp(photoEndPt, photoConfig).success(function(data){
                            return venues.photoCallBack(index, data);
                        });
                    });
                } else { venues.show = false; }
        };
        
        //validates results retrieved from venues endpoint
        this.validateResults = function(result) {
              var addr = result.venue.location.address, city = result.venue.location.city;

              //check for undefined error inconsistency with object values that are needed
              if(result.venue.price && typeof  result.venue.price.message === "undefined"){
                  result.venue.price.message ="n/a";
              }
              
              if (typeof addr === "undefined" && typeof city === "undefined")
                  result.venue.location.address = "Lagos";
              if (typeof addr === "undefined" && typeof city !== "undefined")
                  result.venue.location.address = city;
              if (typeof addr !== "undefined" && typeof city !== "undefined")
                   result.venue.location.address = addr + ", " + city; 

              if (typeof result.venue.rating === "undefined") {
                  result.venue.rating = "n/a";
              }
        };
     
        this.photoCallBack = function(index, data) { //callback function for retrieving photos of venues
            var photoUrl = "";
            var photoSize = "150x130";
                     
            if (typeof data.response.photos !== 'undefined'){ 
              var dataRes = data.response.photos.items[0];
             if(dataRes) {  
              if (typeof dataRes.prefix !== "undefined" && typeof dataRes.suffix !== "undefined") {
                photoUrl = dataRes.prefix + photoSize + dataRes.suffix;
                venues.results[index].venue.photoUrl = photoUrl;
              }
             }
            }
            if( typeof data.response.photos.items[0] === 'undefined' || typeof data.response.photos=== 'undefined' ) { 
              console.log(venues.section);
              switch (venues.section) {
                case "food":
                   venues.results[index].venue.photoUrl = "img/plate.png"; 
                   break;
                case "drinks":
                   venues.results[index].venue.photoUrl = "img/cocktails.png";
                   break;
                case "shops":
                   venues.results[index].venue.photoUrl = "img/basket.png"; 
                   break;
                case "arts":
                   venues.results[index].venue.photoUrl = "img/theatre.png";
                   break;
                default:
                   venues.results[index].venue.photoUrl = "img/beach.png";
              }
            }
        };
               
        this.initialize = function() {  //initializes map once the page loads
              venues.directionsDisplay = new google.maps.DirectionsRenderer({draggable: true});  //object for rendering route lanes on the mao
              venues.geocoder = new google.maps.Geocoder();  //object for converting address to co-ordinates on the map
              
              var mapOptions = {
                zoom: 15,
                center: new google.maps.LatLng(6.4531, 3.3958)
              };
              
              var input = document.getElementById('start'), inputTwo = document.getElementById('end');
              
              var defaultBounds = new google.maps.LatLngBounds(new google.maps.LatLng(8.0000, 10.0000),
                                                                new google.maps.LatLng(8.0000, 10.0000));
              var placeOptions = {
                  types: ['(cities)'],
                 componentRestrictions: {country: "ng"},
                 bounds: defaultBounds
              };
              var searchBox = new google.maps.places.SearchBox(input, placeOptions );
              var searchBoxx = new google.maps.places.SearchBox(inputTwo, placeOptions);
        
              venues.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        
              venues.directionsDisplay.setMap(venues.map);
              venues.directionsDisplay.setPanel(document.getElementById('directions-panel'));
        
              var control = document.getElementById('control');
              control.style.display = 'block';
              venues.map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
        };
        
        this.calcRoute = function(btClicked) { //calculates direction route between addresses
          if (btClicked) {
              if ($.trim(this.start) === "" || $.trim(this.end) === "") {
                 alert("No input field should be left blank");
                 return ;
              }
          }
          
          var request = {
            origin: venues.start,
            destination: venues.end,
            provideRouteAlternatives: true,
            travelMode: google.maps.TravelMode.DRIVING
          };
      
          venues.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) { 
               $scope.$apply(function(){
                  $scope.directPanel = true;
               }) 
         
               venues.directionsDisplay.setMap(venues.map);
               venues.directionsDisplay.setDirections(response);
            }
            else { 
               $scope.$apply(function(){
                 $scope.directPanel = false; 
               });
               venues.resizeMap();
               alert("Google couldn't find a route between the addresses");
            }
          });
        };
        
        //gets the address in string format of a given co-ordinate position
        this.searchPlace = function (pos) {
            venues.geocoder.geocode( { 'latLng': pos}, function(results, status) { //takes address and gets its co-ordinates
                    //alert("inside geocoder");                                       
              if (status == google.maps.GeocoderStatus.OK) { 
                if (results[1]) {
                    venues.start = results[1].formatted_address;  //address in string for the co-ordinates we passed
                    venues.calcRoute(false);
                } else {
                    alert('No results found');
                }
              } else {
                  this.resizeMap();
                  alert("Google could not locate the address on the map");
              }//end else
           }); //close geocoder
        };
        
        //gets co-ordinates of user's current location using geolocation
        this.geoLocate = function (endAddr, index) {
             this.end = endAddr; 
             this.clickedDiv = index;
             
             if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    venues.searchPlace(pos);
                }, function() {
                     alert('Error: The Geolocation service failed');
                });
             } else {
                // Browser doesn't support Geolocation
                alert('Error: Your browser doesn\'t support geolocation');
             }
        };
        
        this.resizeMap = function() { //resolves issues with when map's display property was set to none in css
           if (this.directionsDisplay) {
              this.directionsDisplay.setMap(null); //remove previous direction route lanes and markers
            }
           
            this.map.setCenter(new google.maps.LatLng(6.4531, 3.3958)); //centers the map to the co-ordinates of lagos
        };
        
        this.getVenues();
        google.maps.event.addDomListener(window, 'load', this.initialize); //loads maps when a new page loads
     }]);
})();