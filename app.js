var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var bodyParser = require('body-parser');
var axios = require('axios');
const yelp = require('yelp-fusion');

var geocodeurl = "https://maps.googleapis.com/maps/api/geocode/json";
var searchurl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
var detailsurl = "https://maps.googleapis.com/maps/api/place/details/json";
var photourl = "https://maps.googleapis.com/maps/api/place/photo";
var searchkey = "AIzaSyCDFIYbmYQob2YMTwwuiJUQK_m1OLUeryI";
var geocodekey = "AIzaSyBfU15xX7eGI3i6l562tYAUEElrwQv8-EY";
var radius = 16090;

const apiKey = 'fhLXxl9KFvz84tRHkmATOyBle0T6ZeS0vH0yYjAiui06-kU-lfJPXjbGiSQHd0EJ0wTlBomgfuQ5-H107sgafCm84AniEPx8JpDMs9T7TM6b6j8i7XKQgFJvhXXBWnYx';
const client = yelp.client(apiKey);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/search', function(req, res) {
    
    if(req.query.distance){
        radius = req.query.distance * 1609;
    }
    var lat = req.query.lat;
    var lon = req.query.lon;
    
    if(req.query.location){
        var geourl = geocodeurl + "?address=" + encodeURIComponent(req.query.location) + "&key=" + geocodekey;
        console.log(geourl);
        axios
            .get(geourl)
            .then(response => {
                if(response.data.results && response.data.results.length){
                    lat = response.data.results[0].geometry.location.lat;
                    lon = response.data.results[0].geometry.location.lng;
                    console.log('new lat :' + lat + ", long :" + lon);

                    var url = searchurl + "?location=" + lat + "," + lon + "&radius=" + radius + "&type=" + encodeURIComponent(req.query.category) + "&keyword=" + encodeURIComponent(req.query.keyword) + "&key=" + geocodekey;
                    console.log(url);
                    axios
                        .get(url)
                        .then(response => {
                            console.log('call done :' + response.data);
                            res.setHeader('Content-Type','application/json');
                            res.send(JSON.stringify(response.data));
                        })
                        .catch(error => {
                        console.log(error);
                        });
                }else{
                    console.log("No results");
                    res.setHeader('Content-Type','application/json');
                    res.send(JSON.stringify("{}"));
                }
            })
            .catch(error => {
            console.log(error);
            });
    }else{
        var url = searchurl + "?location=" + lat + "," + lon + "&radius=" + radius + "&type=" + encodeURIComponent(req.query.category) + "&keyword=" + encodeURIComponent(req.query.keyword) + "&key=" + geocodekey;
        console.log(url);
        axios
            .get(url)
            .then(response => {
                console.log('call done :' + response.data);
                res.setHeader('Content-Type','application/json');
                res.send(JSON.stringify(response.data));
            })
            .catch(error => {
            console.log(error);
            });
    }
});

app.get('/nextsearch', function(req, res) {
    
    var url = searchurl + "?pagetoken=" + req.query.nexttoken + "&key=" + geocodekey;
    console.log(url);
    axios
        .get(url)
        .then(response => {
            console.log('call done :' + response.data);
            res.setHeader('Content-Type','application/json');
            res.send(JSON.stringify(response.data));
        })
        .catch(error => {
        console.log(error);
        });
});

app.get('/yelpsearch', function(req, res) {
    console.log(req.body);
    var arr = req.query.address.split(",");
    res.setHeader('Content-Type','application/json');
    
    // matchType can be 'lookup' or 'best'
    client.businessMatch('best', {
      name: req.query.name,
      address1: arr[0],
      address2: arr[1].trim() + ", " + arr[2].trim(),
      city: arr[1].trim(),
      state: arr[2].trim().split(" ")[0],
      country: 'US'
    }).then(response => {
        if(response && response.jsonBody.businesses && response.jsonBody.businesses.length){
            client.reviews(response.jsonBody.businesses[0].id).then(response => {
              res.send(response.jsonBody);
            }).catch(e => {
              console.log(e);
            });
        }else{
            console.log("no record found");
            res.send(JSON.stringify("{}"));
        }
    }).catch(e => {
      console.log(e);
    });

});


var port = process.env.PORT || 3000;
console.log(port);
server.listen(port);