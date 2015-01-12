var ANCHORAGE_COORD = {
  latitude : 61.2167,
  longitude : 149.9
};
var metric = false;
var skycons = new Skycons({'color': '#111'});

function convertTemp(temp) {
  var C = (parseFloat(temp) - 273.15);
  var F = C * 9/5 + 32;
  // return Math.round(currentFormat === 'metric' ? C + 'C' : F + 'F');\
  return metric ? Math.round(C) + '&deg;C' : Math.round(F) + '&deg;F';
}
function convertRelativeTemp(tempDiff) {
  if(metric) { return tempDiff; }
  return Math.round(
    tempDiff * 9/5);
}

function decodeEntities(string) {
  return $('<div>').html(string).text();
}
function encodeWithEntities(string) {
  return encodeURIComponent(decodeEntities(string));
}
Handlebars.registerHelper('convert_temp', convertTemp);
Handlebars.registerHelper('encodeURIComponent', encodeURIComponent);
Handlebars.registerHelper('decodeEntities', decodeEntities);
Handlebars.registerHelper('encodeWithEntities', encodeWithEntities);

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
  <div class='result-secondary'>{{{text}}}</div>\
  <a href='https://twitter.com/share?text={{{encodeWithEntities text}}}&url={{{url}}}' class='tweet-button'><i class='fa fa-twitter fa-lg'></i> Tweet This!</a>\
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
  data.name = "Anchorage, AK";
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
    var anchorageTemp = Math.round(anchorage[0].main.temp);
    var yourlocTemp = Math.round(yourloc[0].main.temp);
    var tempDiff = anchorageTemp - yourlocTemp;
    var plural = convertRelativeTemp(tempDiff) === 1 ? '' : 's';
    if(anchorageTemp > yourlocTemp) {
      $result.html(result_template({
        result : 'YES',
        url : window.location.href,
        text : "Brrr! It&rsquo;s "+convertRelativeTemp(tempDiff)+" degree"+plural+" colder here than Anchorage!"
      }));
    } else if(anchorageTemp === yourlocTemp) {
      $result.html(result_template({
        result : 'NO',
        url : window.location.href,
        text : "Brrr! It's just as cold in Anchorage!"
      }));
    } else {
      $result.html(result_template({
        result : 'NO',
        url : window.location.href,
        text : "Phew! At least it&rsquo;s not as cold as Anchorage."
      }));
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
    $form.hide();
    var coords = position.coords;
    var yourlocPromise = getDataForCoords(coords.latitude, coords.longitude);
    compare(yourlocPromise);
  }, function(err) {
    showInput();
  });
} else {
  showInput();
}

$('body').on('click', 'a.tweet-button', function(evt) {
  evt.preventDefault();
  var href = evt.target.href;
  window.open(href, '_blank', 'height=450,width=600')
})
