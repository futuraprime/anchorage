var ANCHORAGE_COORD = {
  latitude : 61.2167,
  longitude : 149.9
};
var metric = false;
var skycons = new Skycons({'color': '#222'});

function convertTemp(temp) {
  var C = (parseFloat(temp) - 273.15);
  var F = C * 9/5 + 32;
  // return Math.round(currentFormat === 'metric' ? C + 'C' : F + 'F');\
  return metric ? Math.round(C) + '&deg;C' : Math.round(F) + '&deg;F';
}
function convertRelativeTemp(tempDiff) {
  if(metric) { return tempDiff; }
  return Math.round(tempDiff * 9/5);
}

Handlebars.registerHelper('convert_temp', convertTemp);

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

var location_template = Handlebars.compile("<canvas class='skycon' id='skycon_{{id}}' width='128' height='128'></canvas><h2 class='place'>{{name}}</h2><div class='temp'>{{{convert_temp main.temp}}}</div>");
var result_template = Handlebars.compile("\
  <div class='result-main'>{{result}}</div>\
  <a href='https://twitter.com/share' class='twitter-share-button' data-text='{{tweet_text}}' data-count='none'>Tweet</a>\
  <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>\
");

function calculateSkycon(data) {
  // http://openweathermap.org/wiki/API/Weather_Condition_Codes
  var daylight = data.weather[0].icon.substr(2) == 'd' ? true : false;
  var id = parseInt(data.weather[0].id);
  if(id < 600) { return 'RAIN'; }
  if(id < 700) { return 'SNOW'; }
  if(id < 800) { return 'FOG'; }
  if(id < 802) { return daylight ? 'CLEAR_DAY' : 'CLEAR_NIGHT'; }
  if(id < 804) { return daylight ? 'PARTLY_CLOUDY_DAY' : 'PARTLY_CLOUDY_NIGHT'; }
  if(id < 900) { return 'CLOUDY'; }
  switch(id) {
    case 900:
    case 905:
      return 'WINDY';
    case 901:
    case 902:
      return 'RAIN';
    case 906:
      return 'SLEET';
  }
  // hopefully that covers it...
}

var anchoragePromise = getDataForLocation('Anchorage, AK');
anchoragePromise.then(function(data) {
  // data.name = "Anchorage, AK";
  $('#anchorage').html(location_template(data));
  skycons.add('skycon_'+data.id, calculateSkycon(data));
  skycons.play();
});

function compare(yourlocPromise) {
  yourlocPromise.then(function(data) {
    $('#yourloc').html(location_template(data));
    skycons.add('skycon_'+data.id, calculateSkycon(data));
  });
  $.when(anchoragePromise, yourlocPromise).then(function(anchorage, yourloc) {
    var $result = $('#result');
    var tempDiff = anchorage[0].main.temp - yourloc[0].main.temp;
    if(anchorage[0].main.temp > yourloc[0].main.temp) {
      $result.html(result_template({
        result : 'YES',
        tweet_text : "Brrr! It's "+convertRelativeTemp(tempDiff)+" degrees colder here than Anchorage!"
      }));
    } else {
      $result.html({
        result : 'NO',
        tweet_text : "At least it's warmer here than in Anchorage."
      });
    }
  });
}

var $form = $('#location_form');
var $location = $('#location');

$form.submit(function(evt) {
  evt.preventDefault();
  var location = $location.val();
  var yourlocPromise = getDataForLocation(location);
  compare(yourlocPromise);
  $form.hide();
});

function showInput() {
  $form.show();
}

if("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(function(position) {
    var coords = position.coords;
    var yourlocPromise = getDataForCoords(coords.latitude, coords.longitude);
    compare(yourlocPromise);
  }, function(err) {
    showInput();
  });
} else {
  showInput();
}
