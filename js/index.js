var map;

// Create a new blank array for all the listing markers.
var markers = [];


// These are the real estate listings that will be shown to the user.
// Normally we'd have these in a database instead.
var locations = [
  { id: 0, title: 'Teatro Amazonas', location: {lat: -3.13026400328893, lng: -60.02314908159843} },
  { id: 1, title: 'Jardim Botânico Adolpho Ducke', location: {lat: -3.0073486139980687, lng: -59.93967762220971} },
  { id: 2, title: 'Ponta Negra (Manaus)', location: {lat: -3.066115012379097, lng: -60.09809999253315} },
  { id: 3, title: 'Ponte Jornalista Phelippe Daou', location: {lat: -3.1203117128546087, lng:  -60.079582929611206} },
  { id: 4, title: 'Aeroporto Internacional de Manaus', location: {lat: -3.0319609869385165, lng: -60.04603885297747} },
  { id: 5, title: 'Universidade Federal do Amazonas', location: {lat: -3.0998323793813674, lng: -59.974869624148745} },
  { id: 6, title: 'Avenida das Torres', location: {lat: -3.0934318769375415, lng:  -59.98937479695357 } },
  { id: 7, title: 'Universidade do Estado do Amazonas', location: {lat: -3.0917768221643263, lng:  -60.01810188018957 } },
  { id: 8, title: 'Arena da Amazônia', location: {lat: -3.0832657510562296, lng:  -60.02815961837768 } }
];

function initMap() {
  // Create a styles array to use with the map.
  var styles = [
    {
      featureType: 'water',
      stylers: [
        { color: '#19a0d8' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
    },{
      featureType: 'transit.station',
      stylers: [
        { weight: 9 },
        { hue: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
    }
  ];
  
  ko.applyBindings(new viewModel());

  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -3.0894883, lng: -59.9963515},
    zoom: 12,
    styles: styles,
    mapTypeControl: false
  });

  var largeInfowindow = new google.maps.InfoWindow();

  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon('0091ff');

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon('FFFF24');

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
  }
  
  // Initialize pins
  showListings();
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  var lat = marker.getPosition().lat();
  var lng = marker.getPosition().lng();
  var wikiURL = 'http://pt.wikipedia.org/w/api.php?action=query&'+
      'format=json&prop=pageimages%7Cpageterms&list=&titles=' + marker.title +
      '&redirects=1&formatversion=2&piprop=thumbnail&pilimit=1&wbptterms=description';
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    
    // Wikipedia request
    var wikiRequestTimeout = setTimeout(function() {
      infowindow.setContent("<p>Failed to get wikipedia resources</p>");
    }, 8000);
    
    $.ajax({
      url: wikiURL,
      dataType: "jsonp",
      success: function(response) {
        console.log(response);
        Object.keys(response).map(function(key, index) {
          var res = response[key];
          Object.keys(res).map(function(key, index) {
            infowindow.setContent('<p>' + res[key][0].title + '</p>'+
                                 '<img src=' + getThumbnail(res[key][0]) + '>' +
                                 '<p>' + getDescription(res[key][0]) + '</p>' +
                                 '<p>' + lat + ',' + lng + '</p>');
          });
        });
        clearTimeout(wikiRequestTimeout);
      }
    });
    
    infowindow.open(map, marker);
  }
  map.setZoom(12);
}

// Get description from wikipedia API
function getDescription(descriptObj) {
  var description = '';
  Object.keys(descriptObj).map(function(key, index) {
    if (key == "terms") {
      description = descriptObj[key]
      Object.keys(description).map(function(key, index) {
        description = description[key][0];
      });
    }
  });
  
  return description;
}

// Get thumbnail from wikipedia API
function getThumbnail(thumbObj) {
  var thumb = ''
  Object.keys(thumbObj).map(function(key, index) {
    if ( key == "thumbnail") {
      thumb = thumbObj[key];
      Object.keys(thumb).map(function(key, index) {
        if (key == "source") {
          thumb = thumb[key];
        }
      });
    }
  });
  return thumb;
} 

// This function will loop through the markers array and display them all.
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
  'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
  new google.maps.Size(21, 34),
  new google.maps.Point(0, 0),
  new google.maps.Point(10, 34),
  new google.maps.Size(21,34));
  return markerImage;
}

// single place object
var singlePlace = function(data) {
  this.id = ko.observable(data.id);
  this.name = ko.observable(data.title);
  this.lat = ko.observable(data.location.lat);
  this.lng = ko.observable(data.location.lng);
};

// Handle all interactions such as, filter, search and click
var viewModel = function() {
  var self = this;
  self.query = ko.observable('');
  this.places = ko.observableArray([]);
  this.placeObjectSearch = ko.observableArray([]);
  
  // Iterate each location to construct array of places
  // and draw list in menu
  locations.forEach(function(place) {
    self.places.push(new singlePlace(place));
    self.placeObjectSearch.push(new singlePlace(place));
  });
  
  self.getMoreInfo = function(place) {
    google.maps.event.trigger(markers[place.id()], 'click');
  }
  
  // Filter function
  self.filterPins = function () {
    var search = self.query().toLowerCase();
    // Remove all places
    self.places.removeAll();
    // Itarate in temporary Object
    self.placeObjectSearch().forEach(function(place) {
      markers[place.id()].setVisible(false);
      if (place.name().toLowerCase().indexOf(search) >= 0) {
        self.places.push(place);
      }
    });
    // Redraw pins
    self.places().forEach(function(place) {
      markers[place.id()].setVisible(true);
    });
  };
}