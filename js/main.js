var APP_ID = 'a67740996cd63c22107050fd8ce0bc97';
var ANCHORAGE_COORD = {
  latitude : 61.2167,
  longitude : 149.9
};
var currentFormat = 'metric';

Handlebars.registerHelper('convert_temp', function(temp) {
  var C = (parseFloat(temp) - 273.15);
  var F = C * 9/5 + 32;
  // return Math.round(currentFormat === 'metric' ? C + 'C' : F + 'F');\
  return currentFormat === 'metric' ? Math.round(C) + '&deg;C' : Math.round(F) + '&deg;F';
});

function getDataForCoords(lat, lng) {
  return $.getJSON('http://api.openweathermap.org/data/2.5/weather?callback=?', {
    // APPID : APP_ID,
    lat : lat,
    lon : lng
  });
}
function getDataForLocation(location) {
  return $.getJSON('http://api.openweathermap.org/data/2.5/weather?callback=?', {
    q : location
  });
}

var location_template = Handlebars.compile("<h2 class='place'>{{name}}</h2><h3>Temp: {{{convert_temp main.temp}}}</h3>");

var anchoragePromise = getDataForLocation('Anchorage, AK');
anchoragePromise.then(function(data) {
  // data.name = "Anchorage, AK";
  $('#anchorage').html(location_template(data));
});

if("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(function(position) {
    var coords = position.coords;
    // console.log(position,coords.latitude, coords.longitude);
    var yourlocPromise = getDataForCoords(coords.latitude, coords.longitude)
    yourlocPromise.then(function(data) {
      $('#yourloc').html(location_template(data));
    });
    $.when(anchoragePromise, yourlocPromise).then(function(anchorage, yourloc) {
      var $result = $('#result');
      // console.log('results', anchorage, yourloc);
      if(anchorage[0].main.temp > yourloc[0].main.temp) {
        $result.html('YES');
      } else {
        $result.html('NO');
      }
    });
  }, function(err) {
    // error
  });
}
