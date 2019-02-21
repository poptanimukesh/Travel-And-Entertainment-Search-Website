$(document).ready(function() {
    
    function loadCategories(){
        var categories = ['Default', 'Airport', 'Amusement Park', 'Aquarium', 'Art Gallery', 'Bakery', 'Bar', 'Beauty Salon', 'Bowling Alley', 'Bus Station', 'Cafe', 'Campground', 'Car Rental', 'Casino', 'Lodging', 'Movie Theater', 'Museum', 'Night Club', 'Park', 'Parking', 'Restaurant', 'Shopping Mall', 'Stadium', 'Subway Station', 'Taxi Stand', 'Train Station', 'Transit Station', 'Travel Agency', 'Zoo'];

        $.each(categories, function(key, value) {   
             $('#category')
                 .append($("<option></option>")
                            .attr("value",value.toLowerCase().replace(/ /g,"_"))
                            .text(value)); 
        });
    }
    
    $.ajax({
        type: "GET",
        url: "http://ip-api.com/json",
        cache: false,
        dataType:'json',
        success: function(data){
            locationFetched = true;
            curr_lat = data.lat;
            curr_lon = data.lon;
        }
    });
    
    $('input[type=radio][name=from]').change(function() {
        if (this.value == 'here') {
            $("#location").prop("disabled", true);
            $('#location').css({
                "border": ""
            });
            $('#location-error').html("");
            $('#location').val('');
        }
        else if (this.value == 'location') {
            $("#location").prop("disabled", false);
        }
        checkSearchButton();
    });
    
    $("#keyword").on('keyup blur', function (e) {
        showError($(this),'#keyword-error','Please enter a keyword');
    });
    
    $("#location").on('keyup blur', function (e) {
        showError($(this),'#location-error','Please enter a location');
    });
    
    function showError(thisObj,elementId,msg){
        if (thisObj.val().length==0 || $.trim(thisObj.val()) == '') {
            thisObj.css("border", "2px solid red");
            $(elementId).html(msg);
        }
        else {
            thisObj.css("border", "");
            $(elementId).html("");
        }
        checkSearchButton();
    }
    
    $("#from-location").on('keyup blur', function (e) {
        if ($(this).val().length==0 || $.trim($(this).val()) == '') {
            $("#get-directions").prop('disabled',true);
        }else{
            $("#get-directions").prop('disabled',false);
        }
    });
    
    function checkSearchButton(){
        if(locationFetched && $.trim($('#keyword').val()) != '' && (($('input[name=from]:checked').val() == 'location' && $.trim($('#location').val()) != '') || $('input[name=from]:checked').val() == 'here')){
            $('#search').prop('disabled',false);
            $('#search').removeClass('disabled');
        }else{
            $('#search').prop('disabled',true);
            $('#search').addClass('disabled');
        }
    }
    
    function searchResults(){
        var page=0;
        var places = [];
        var map, uluru;
        var place_lat, place_lon;
        var calcRouteClicked=false;
        var start=0;
        var end=0;
        var limit = 20;
        
        $("#clear").click(function(){
            $("#keyword").val("");
            $("#distance").val("");
            $("#location").val("");
            $("#category").val("default");
            $("#rad").prop("checked", true);
            
            $('#location').prop('disabled',true);
            $('#search').prop('disabled',true);
            
            $('#result-div').removeClass("block").addClass("hidden");
            $('#no-result-div').removeClass("block").addClass("hidden");
            $('#place-details-tabs').removeClass("block").addClass("hidden");
            $('#failed-result-div').removeClass("block").addClass("hidden");
            $('#result-div').data("res-fetched",false);
            $("#fav-div").removeClass("block").addClass("hidden");
            $("#keyword-error").addClass("hidden");
            $("#location-error").addClass("hidden");
            
            $("#keyword").css("border", "");
            $("#location").css("border", "");
            
            $('#res-tab').click();
        });
        
        $("#search").click(function(){
            page = 0;
            places = [];
            var data = {};
            data["keyword"] = $('#keyword').val();
            data["category"] = $('#category').val();
            data["distance"] = $('#distance').val();
            data["from"] = $('input[name=from]:checked').val();
            data["lat"] = curr_lat;
            data["lon"] = curr_lon;
            data["location"] = $('#location').val();
            $('#progress-bar').removeClass("hidden").addClass("block");
            
            $('#no-result-div').removeClass("block").addClass("hidden");
            $('#failed-result-div').removeClass("block").addClass("hidden");
            $('#place-details-tabs').removeClass("block").addClass("hidden");

            $('#res-tab').click();
            $('#result-div').removeClass("block").addClass("hidden");
            
            $.ajax({
                type: "GET",
                url: "http://devnodejs-env.us-east-1.elasticbeanstalk.com/search",
                cache: false,
                data : data,
                dataType:'json',
                success: function(data){
                    //console.log("data :" + data);
                    $('#progress-bar').removeClass("block").addClass("hidden");
                    displayResultRows(data);
                },
                error: function (error) {
                    //console.log("error :" + error);
                    $('#progress-bar').removeClass("block").addClass("hidden");
                    $('#failed-result-div').removeClass("hidden").addClass("block");
                }
            });
        }); 
        
        /*$("#res-tab").click(function() {
            $('#place-details-tabs').removeClass("block").addClass("hidden");
        });
        
        $("#favo-tab").click(function() {
            $('#place-details-tabs').removeClass("block").addClass("hidden");
        });*/

        function displayResultRows(data){
            var list = data.results;

            if(list && list.length){
                places[++page] = list;
                displayRows(list,data.next_page_token);
            }else{
                $('#no-result-div').removeClass("hidden").addClass("block");
            }
        }

        function displayRows(list,nexttoken){
            var table = "";
            
            for(var i=0;i<list.length;i++){
                    //var lat = list[i].geometry.location.lat;
                    //var lng = list[i].geometry.location.lng;
                    table += "<tr id='x_" + list[i].place_id + "'>";
                    table += "<td>" + (i+1) + "</td>";
                    table += "<td><img src='" + list[i].icon + "' style='width: 35px;'></td>";
                    table += "<td style='white-space: nowrap;'><span>" + list[i].name + "</span></td>";
                    table += "<td style='white-space: nowrap;'><span>" + list[i].vicinity + "</span></td>";
                    table += "<td><button type='button' class='btn btn-sm btn-border fav-details' id='f_" + list[i].place_id + "' data-placeid=\"" + list[i].place_id + "\" data-name=\"" + list[i].name +  "\" data-icon=\"" + list[i].icon + "\" data-address=\"" + list[i].vicinity + "\">";
                    
                    storageData = JSON.parse(localStorage.getItem("list"));
                    if(storageData && storageData[list[i].place_id] && Object.keys(storageData[list[i].place_id])){
                        table += "<i class='fa fa-star checked'></i>";
                    }else{
                        table += "<i class='fa fa-star-o'></i>";
                    }
                    table += "</button></td>";
                    table += "<td><button type='button' data-placeid='" + list[i].place_id + "' class='btn btn-sm btn-border get-details' ng-click='showPlacesTabs()'>&gt;</button></td>";
                    table += "</tr>";
                }
                $('#results-table > tbody').text('');
            
                var $target = $("[ng-resultTableBody]");
                angular.element($target).injector().invoke(function($compile) {
                   var $scope = angular.element($target).scope();
                   $target.append($compile(table)($scope));
                   $scope.$apply();
               });
                $('#result-div').data("res-fetched",true);
                $('#result-div').removeClass("hidden").addClass("block");
                
                if((nexttoken || (page>0 && page<3)) && list.length==20){
                    $('#next-div').removeClass("hidden").addClass("block");
                    $('#next-btn').data("nexttoken",  nexttoken);
                }else{
                    $('#next-div').removeClass("block").addClass("hidden");
                }

                if(page>1){
                    $('#previous-div').removeClass("hidden").addClass("block");
                }else{
                    $('#previous-div').removeClass("block").addClass("hidden");
                }
            
                $('.fav-details').click(function() {
                    checkStar($(this));
                    checkStar($('#favorite-btn'));
                });

                $('.get-details').click(function() {
                    getDetail($(this));
                    $("#details").prop("disabled", false);
                    $("#fav-details-btn").prop("disabled", false);
                });

            
            
            
            $('#get-directions').click(function (){
                calcRoute();
                calcRouteClicked = true;
            });
            
            

            $("#pegman-btn").click(function (){
                if($("#pegman-img").attr('src').indexOf('Map') >=0){
                    $("#pegman-img").attr("src","http://cs-server.usc.edu:45678/hw/hw8/images/Pegman.png");
                    initMap();
                    if(calcRouteClicked)
                        calcRoute();
                }else{
                    $("#pegman-img").attr("src","http://cs-server.usc.edu:45678/hw/hw8/images/Map.png");
                    document.getElementById('directionsPanel').innerHTML ="";
                    var panorama = new google.maps.StreetViewPanorama(
                      document.getElementById('map'), {
                        position: uluru,
                        pov: {
                          heading: 34,
                          pitch: 10
                        }
                      });
                    map.setStreetView(panorama);
                }
            });

        }
        
        function getDetail(thisObj){
            $("#nav-tab a:first").tab('show');
            var request = {
                      placeId: thisObj.data('placeid')
                    };

                    service = new google.maps.places.PlacesService(document.getElementById('map'));
                    service.getDetails(request, callback);

                    function callback(place, status) {
                      if (status == google.maps.places.PlacesServiceStatus.OK) {
                        $(".table-warning").removeClass("table-warning");
                        $("#a_" + place.place_id).addClass("table-warning");
                        $("#x_" + place.place_id).addClass("table-warning");
                          
                          
                        $('#result-div').removeClass("block").addClass("hidden");
                        $('#place-details-tabs').removeClass("hidden").addClass("block");
                        $("#fav-div").removeClass("block").addClass("hidden");
                          
                        $('#place-name').text(place.name);
                        $('#dropdownMenuButton1').data("place-name",  place.name);
                        //console.log(JSON.stringify(place));
                        
                        var website = place.url;
                        if(place.website){
                            website = place.website;
                        }
                        url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent("Check out " + place.name + " located at " + place.formatted_address + ". Website : ") + "&url=" + encodeURIComponent(website) +"&hashtags=TravelAndEntertainmentSearch";
                        $("#twitter-btn").data("url", url);
                          
                        $("#favorite-btn").find(':first-child').removeClass('fa-star checked').addClass('fa-star-o');
                          
                        storageData = JSON.parse(localStorage.getItem("list"));
                        if(storageData && storageData[place.place_id] && Object.keys(storageData[place.place_id])){
                            $("#favorite-btn").find(':first-child').removeClass('fa-star-o');
                            $("#favorite-btn").find(':first-child').addClass('fa-star');
                            $("#favorite-btn").find(':first-child').addClass('checked');
                        }

                        $("#favorite-btn").data("name",place.name);
                        $("#favorite-btn").data("placeid",place.place_id);
                        $("#favorite-btn").data("icon",place.icon);
                        $("#favorite-btn").data("address",place.formatted_address);
                        

                        var tdata = "";
                        place_lat = place.geometry.location.lat();
                        place_lon = place.geometry.location.lng();
                        if(place.formatted_address){
                            tdata += "<tr><td style='white-space: nowrap;'><b>Address</b></td><td style='white-space: nowrap;'>" + place.formatted_address + "</td></tr>";
                            $('#dropdownMenuButton1').data("place-address",  place.formatted_address);
                        }
                          
                        if(place.international_phone_number)
                           tdata += "<tr><td style='white-space: nowrap;'><b>Phone Number</b></td><td style='white-space: nowrap;'>" + place.international_phone_number + "</td></tr>";
                           
                        if(place.price_level){
                            var price_lvl = ""
                            for(i=1;i<=place.price_level;i++)
                                price_lvl += "$";
                            tdata += "<tr><td style='white-space: nowrap;'><b>Price Level</b></td><td style='white-space: nowrap;'>" + price_lvl + "</td></tr>";
                        }
                          
                        if(place.rating)
                           tdata += "<tr><td style='white-space: nowrap;'><b>Rating</b></td><td><div style='display: flex'>" + place.rating + "<span style='padding-top: 4px;' id='rating'></span></div></td></tr>";
                           
                        if(place.url)
                            tdata += "<tr><td style='white-space: nowrap;'><b>Google Page</b></td><td style='white-space: nowrap;'><a target='_blank' href='" + place.url + "'>" + place.url + "</a></td></tr>";
                          
                        if(place.website)
                            tdata += "<tr><td style='white-space: nowrap;'><b>Website</b></td><td style='white-space: nowrap;'><a target='_blank' href='" + place.website + "'>" + place.website + "</a></td></tr>";
                        
                        if(place.opening_hours){
                            var curr_idx;
                            var d = moment();
                            
                            var diff = place.utc_offset - moment.parseZone(d).utcOffset();
                            d = d.add(diff/60,'h');
                            var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                            var open_time;
                            var weekday_text = place.opening_hours.weekday_text;
                            for(var i=0;i<weekday_text.length;i++){
                                if(weekday_text[i].includes(days[d.day()])){
                                    open_time = weekday_text[i].split(": ")[1];
                                    curr_idx = i;
                                }
                            }
                            tdata += "<tr><td style='white-space: nowrap;'><b>Hours</b></td><td style='white-space: nowrap;'>";
                            if(place.opening_hours.open_now == true){
                                tdata += "Open now: " + open_time + "     ";
                            }else{
                                tdata += "Closed: " + open_time + "     ";
                            }
                            tdata += "<a href='#' data-toggle='modal' data-target='#exampleModalCenter'>Daily open hours</a></td></tr>";
                            
                            var day_table="";
                            for(var i= curr_idx;i<weekday_text.length;i++){
                                day_table += "<tr>";
                                if(i==curr_idx){
                                    day_table += "<td><b>" + weekday_text[i].split(": ")[0] + "</b></td>";
                                    day_table += "<td><b>" + weekday_text[i].split(": ")[1] + "</b></td>";
                                }else{
                                    day_table += "<td>" + weekday_text[i].split(": ")[0] + "</td>";
                                    day_table += "<td>" + weekday_text[i].split(": ")[1] + "</td>";
                                }
                                
                                day_table += "</tr>";
                            }
                            for(var i=0;i<curr_idx;i++){
                                day_table += "<tr>";
                                
                                day_table += "<td>" + weekday_text[i].split(": ")[0] + "</td>";
                                day_table += "<td>" + weekday_text[i].split(": ")[1] + "</td>";
                                
                                day_table += "</tr>";
                            }
                            $("#daily-table > tbody").text("").append(day_table);
                        }

                        $('#info-table > tbody').text('').append(tdata);
                          
                        //Photos
                        $("#photo-col-1").text("");
                        $("#photo-col-2").text("");
                        $("#photo-col-3").text("");
                        $("#photo-col-4").text("");
                        var photosGrid = "";
                        if(place.photos){
                            for(var i=0;i<place.photos.length;i++){
                                var img = place.photos[i].getUrl({'maxWidth': place.photos[i].width, 'maxHeight': place.photos[i].height});
                                photosGrid = "<a target='_blank' href='" + img + "'><img class='img-thumbnail' src='" + img + "'></a>";
                                $("#photo-col-" + ((i%4)+1)).append(photosGrid);
                            }
                        }else{
                            photosGrid = "<div class='alert alert-warning text-center'>No records</div>";
                            $('#photo-gallery').text('').append(photosGrid);
                        }
                        
                        if(place.rating){
                            $("#rating").rateYo({
                                rating: place.rating,
                                readOnly : true,
                                maxValue: Math.ceil(place.rating),
                                numStars: Math.ceil(place.rating),
                                starWidth: "15px"
                            });
                        }
                          
                          
                        if($('input[name=from]:checked').val() == "here" || !$("#location").val()){
                            $('#from-location').val('Your location');
                            $("#get-directions").prop('disabled',false);
                        }else{
                            $('#from-location').val($("#location").val());
                            $("#get-directions").prop('disabled',false);
                        }
                        $('#to-location').val(place.name + ", " + place.formatted_address);
                          
                        initMap();
                        $('#travel-mode').val("DRIVING");
                        $("#directionsPanel").text("");
                          
                        //Reviews
                        googleData = place.reviews;
                        var link = $("#dropdownMenuButton2").text().replace(/\s/g,'').toLowerCase();
                        arrangeReviews($("#" + link));
                      }
                    }
        }
        
        function initMap() {
                directionsDisplay = new google.maps.DirectionsRenderer;
                directionsService = new google.maps.DirectionsService;
                uluru = {lat: place_lat, lng: place_lon};
                map = new google.maps.Map(document.getElementById('map'), {
                  zoom: 15,
                  center: uluru
                });
                marker = new google.maps.Marker({
                  position: uluru,
                  map: map
                });
                directionsDisplay.setMap(map);
                directionsDisplay.setPanel(document.getElementById('directionsPanel'));
        }
        
        function calcRoute(){
                marker.setMap(null);
                document.getElementById('directionsPanel').innerHTML ="";
                directionsService.route({
                  origin: getFromLocation(),
                  destination: $('#to-location').val(),
                  travelMode: google.maps.TravelMode[$('#travel-mode').val()],
                  provideRouteAlternatives: true
                }, function(response, status) {
                  if (status == 'OK') {
                    directionsDisplay.setDirections(response);
                  } else {
                    window.alert('Directions request failed');
                  }
                });
        }
        
        function getFromLocation(){
                if($('#from-location').val()){
                   if($('#from-location').val().toLowerCase() == "your location" || $('#from-location').val().toLowerCase() == "my location" ){
                        return {lat: curr_lat, lng: curr_lon};
                    }else{
                        return $('#from-location').val();
                    }
                }
                return null;
        }
        
        
        $('#previous-btn').click(function(){
            if(page>1){
                page--;
                displayRows(places[page]);
            }else{
                $('#previous-div').removeClass("block").addClass("hidden");
            }
        });

        $('#next-btn').click(function(){
            if(page<3){
                if(places[page+1]){
                    page++;
                    displayRows(places[page]);
                }
                else{
                    if($('#next-btn').data("nexttoken")) {
                        $('#next-div').removeClass("block").addClass("hidden");
                        $('#progress-bar').removeClass("hidden").addClass("block");
                        $('#result-div').removeClass("block").addClass("hidden");
                        $('#no-result-div').removeClass("block").addClass("hidden");

                        $.ajax({
                            type: "GET",
                            url: "http://devnodejs-env.us-east-1.elasticbeanstalk.com/nextsearch",
                            cache: false,
                            data : {"nexttoken":$('#next-btn').data("nexttoken")},
                            dataType:'json',
                            success: function(data){
                                $('#progress-bar').removeClass("block").addClass("hidden");
                                displayResultRows(data);
                            }
                        });
                    }
                }
            }
        });
        
        $(".dropdown1").click(function(){
            $('#dropdownMenuButton1').text($(this).text());
            
            if($(this).text().indexOf("Yelp") >=0 ){
                //yelp

                $("#xxx").addClass("hidden");
                $("#yyy").removeClass("hidden");
                
                $("#yelp-reviews").removeClass("hidden");
                
                if(!$('#dropdownMenuButton1').data("yelp-results")){
                    var data = {};
                    data["name"] = $('#dropdownMenuButton1').data("place-name");
                    data["address"] = $('#dropdownMenuButton1').data("place-address");

                    $.ajax({
                        type: "GET",
                        url: "http://devnodejs-env.us-east-1.elasticbeanstalk.com/yelpsearch",
                        cache: false,
                        data : data,
                        dataType:'json',
                        success: function(data){
                            
                            $("#dropdownMenuButton1").data("yelp-results", "true");
                            yelpData = data.reviews;
                            var link = $("#dropdownMenuButton2").text().replace(/\s/g,'').toLowerCase();
                            arrangeReviews($("#" + link));
                        }
                    });
                } else{
                    var link = $("#dropdownMenuButton2").text().replace(/\s/g,'').toLowerCase();
                    arrangeReviews($("#" + link));
                    }
            } else{

                $("#xxx").removeClass("hidden");
                $("#yyy").addClass("hidden");
                var link = $("#dropdownMenuButton2").text().replace(/\s/g,'').toLowerCase();
                arrangeReviews($("#" + link));
            }
            
        });
        
        function displayReviews(reviews,id1,id2,flag){
            var reviewsHtml = "";

            if(reviews && reviews.length){
                for(var i=0;i<reviews.length;i++){
                    var auth_url = ((flag==true)?reviews[i].author_url:reviews[i].url);
                    
                    reviewsHtml += "<div class='review-div'>";
                    if((flag==true)?reviews[i].profile_photo_url:reviews[i].user.image_url){
                        reviewsHtml += "<div>";
                        if(auth_url){
                            reviewsHtml += "<a target='_blank' href='" + auth_url + "'> <img src='" + ((flag==true)?reviews[i].profile_photo_url:reviews[i].user.image_url) + "' style='width: 40px;height: 40px;border-radius: 19px;'></a>";
                        }else{
                            reviewsHtml += "<img src='" + ((flag==true)?reviews[i].profile_photo_url:reviews[i].user.image_url) + "' style='width: 40px;height: 40px;border-radius: 19px;'>";
                        }
                        reviewsHtml+= "</div>";
                    }else{
                        reviewsHtml += "<div style='visibility:hidden'><img src='https://lh5.googleusercontent.com/-7JzkdHuBzY4/AAAAAAAAAAI/AAAAAAAAAAA/ACLGyWBL_LrwNvYAhaG1_RFGu_IldiAd6w/s128-c0x00000000-cc-rp-mo/photo.jpg' style='width: 40px;height: 40px;'></div>";
                    }

                    reviewsHtml += "<div style='padding-left: 10px;'>";
                    if(auth_url){
                        reviewsHtml += "<span><a target='_blank' href='" + auth_url + "'>" + ((flag==true)?reviews[i].author_name:reviews[i].user.name) + "</a></span>";
                    }else{
                        reviewsHtml += "<span>"+((flag==true)?reviews[i].author_name:reviews[i].user.name) + "</span>";
                    }
                    
                    reviewsHtml += "<br>";
                    reviewsHtml += "<div style='display: flex;'><span style='padding: 4px 4px 4px 0;' id=" + id1 + i + "></span>";
                    reviewsHtml += "<span style='color: #8e8787;'>" + (flag==true?moment.unix(reviews[i].time).format("YYYY-MM-DD HH:mm:ss"):reviews[i].time_created) + "</span></div>";
                    reviewsHtml += reviews[i].text;
                    reviewsHtml += "</div></div>";
                }
            }else{
                reviewsHtml = "";
                $("#no-reviews-div").removeClass("hidden").addClass("block review-fade");
            }

            $("#" + id1).text("").append(reviewsHtml);

            if(reviews && reviews.length){
                for(var i=0;i<reviews.length;i++){
                    $("#" + id1 + i).rateYo({
                        rating: reviews[i].rating,
                        readOnly : true,
                        maxValue: Math.ceil(reviews[i].rating),
                        numStars: Math.ceil(reviews[i].rating),
                        starWidth: "15px"
                    });
                }
            }
        }
        
        function sortReviews(sortReviewArr, reviewType, order) {
           return sortReviewArr.sort(function(a, b) { 
               if(reviewType === "time_created") {
                   return ((order === "desc") ? - (moment(a[reviewType]).unix() - moment(b[reviewType]).unix()) : (moment(a[reviewType]).unix() - moment(b[reviewType]).unix()));
               }
               return ((order === "desc") ? - (a[reviewType] - b[reviewType]) : (a[reviewType] - b[reviewType]) );
           });
        }
        
        function arrangeReviews(thisObj){
            $("#no-reviews-div").removeClass("block").addClass("hidden");
            if($('#dropdownMenuButton1').text().indexOf("Yelp") >= 0){
                //$("#yelp-reviews").removeClass("review-fade");
                var sort = thisObj.data("sort");
                if(thisObj.data("sort") === "time")
                    sort = "time_created";
                displayReviews((sort == "default")?yelpData:sortReviews($.extend([], yelpData),sort,thisObj.data("order")),"yelp-reviews","google-reviews",false);
            }else{
                //$("#google-reviews").removeClass("review-fade");
                displayReviews((thisObj.data("sort")=="default")?googleData:sortReviews($.extend([], googleData),thisObj.data("sort"),thisObj.data("order")),"google-reviews","yelp-reviews",true);
            }
        }
        
        $(".dropdown2").click(function(){
            $('#dropdownMenuButton2').text($(this).text());
            arrangeReviews($(this));
        });
        
        
        
        
        $("#twitter-btn").click(function(){

            var win = window.open($("#twitter-btn").data("url"), '_blank');
        });

        $("#details").click(function(){
            $('#result-div').removeClass("block").addClass("hidden");
            $('#place-details-tabs').removeClass("hidden").addClass("block");
        });
        
        $("#fav-details-btn").click(function(){
            $('#fav-div').removeClass("block").addClass("hidden");
            $('#place-details-tabs').removeClass("hidden").addClass("block");
        });

        $("#list-btn").click(function(){
            $('#place-details-tabs').removeClass("block").addClass("hidden");
            $('#result-div').removeClass("hidden").addClass("block");
            $('#fav-div').removeClass("hidden").addClass("block");
            if($(".fav-item a").hasClass("active") == true){
                $(".fav-item").click();
            }
        });


        function checkStar(thisObj){
            if(thisObj.find(':first-child').hasClass('checked')){
                thisObj.find(':first-child').removeClass('checked');
                thisObj.find(':first-child').removeClass('fa-star');
                thisObj.find(':first-child').addClass('fa-star-o');

                storageData = JSON.parse(localStorage.getItem("list"));
                if(storageData[thisObj.data('placeid')] && Object.keys(storageData[thisObj.data('placeid')])){
                    delete storageData[thisObj.data('placeid')];
                    localStorage.setItem("list", JSON.stringify(storageData));
                }
            }else{
                thisObj.find(':first-child').removeClass('fa-star-o');
                thisObj.find(':first-child').addClass('checked');
                thisObj.find(':first-child').addClass('fa-star');
                if(thisObj.data('placeid')){
                    if(!localStorage.getItem("list"))
                        localStorage.setItem("list", JSON.stringify({}));

                    storageData = JSON.parse(localStorage.getItem("list"));
                    storageData[thisObj.data('placeid')] = thisObj.data();
                    localStorage.setItem("list", JSON.stringify(storageData));
                }
            }
        }

        $("#favorite-btn").click(function(){
            checkStar($("#favorite-btn"));
            checkStar($('#f_' + $('#favorite-btn').data('placeid')));
        });
        
        
        $(".res-tab-item").click(function(){
            $("#result-div").removeClass("block").addClass("hidden");
            if($('#result-div').data("res-fetched") == true){
                $("#result-div").removeClass("hidden").addClass("block");
            }
            $("#place-details-tabs").removeClass("block").addClass("hidden");
        });
        
        $(".fav-item").click(function(){
            if($('#result-div').data("res-fetched") == true){
                $("#result-div").removeClass("hidden").addClass("block");
            }
            $("#place-details-tabs").removeClass("block").addClass("hidden");
            if(!localStorage.getItem("list") || localStorage.getItem("list") == "{}"){
                $('#no-fav-div').removeClass("hidden").addClass("block");
                $('#fav-div').removeClass("block").addClass("hidden");
            }
            else{
                storageData = JSON.parse(localStorage.getItem("list"));
                var table = displayFav(storageData);

                $('#fav-table > tbody').text('');
                $('#fav-div').removeClass("hidden").addClass("block");
                $('#no-fav-div').removeClass("block").addClass("hidden");
                
                var $target = $("[ng-favTableBody]");
                angular.element($target).injector().invoke(function($compile) {
                   var $scope = angular.element($target).scope();
                   $target.append($compile(table)($scope));
                   $scope.$apply();
               });
                
                if(end < countProperties(storageData)){
                    $("#fav-next-div").removeClass("hidden").addClass("block");
                }else{
                    $("#fav-next-div").removeClass("block").addClass("hidden");
                }
                
                if(end > limit){
                    $("#fav-previous-div").removeClass("hidden").addClass("block");
                }else{
                    $("#fav-previous-div").removeClass("block").addClass("hidden");
                }
                
                //next
                $("#fav-next-btn").off('click');
                $("#fav-next-btn").on('click', (function(){
                    start=end;
                    $(".fav-item").click();
                }));
                
                //prev
                $("#fav-previous-btn").off('click');
                $("#fav-previous-btn").on('click', (function(){
                    end=end-limit;
                    start=end-limit;
                    $(".fav-item").click();
                }));

                $(".del-details").click(function(){
                        checkStar($('#f_' + $(this).data('placeid')));
                        checkStar($('#favorite-btn'));
                        storageData = JSON.parse(localStorage.getItem("list"));
                        if(storageData && storageData[$(this).data('placeid')] && Object.keys(storageData[$(this).data('placeid')])){
                            delete storageData[$(this).data('placeid')];
                            localStorage.setItem("list", JSON.stringify(storageData));
                        }
                        start = end = 0;
                        $(".fav-item").click();

                });

                $(".get-details1").click(function (){
                    getDetail($(this));
                    
                    $("#fav-details-btn").prop("disabled", false);
                    $("#details").prop("disabled", false);
                    
                    $('.fav-details').click(function() {
                        checkStar($(this));
                        checkStar($('#favorite-btn'));
                    });

                    $('#get-directions').click(function (){
                        calcRoute();
                        calcRouteClicked = true;
                    });

                    $("#pegman-btn").click(function (){
                        if($("#pegman-img").attr('src').indexOf('Map') >=0){
                            $("#pegman-img").attr("src","http://cs-server.usc.edu:45678/hw/hw8/images/Pegman.png");
                            initMap();
                            if(calcRouteClicked)
                                calcRoute();
                        }else{
                            $("#pegman-img").attr("src","http://cs-server.usc.edu:45678/hw/hw8/images/Map.png");
                            document.getElementById('directionsPanel').innerHTML ="";
                            var panorama = new google.maps.StreetViewPanorama(
                              document.getElementById('map'), {
                                position: uluru,
                                pov: {
                                  heading: 34,
                                  pitch: 10
                                }
                              });
                            map.setStreetView(panorama);
                        }
                    });
                });
            }

        });

        function countProperties (storageData) {
            var count = 0;
            for (var property in storageData) {
                    count++;
            }
            return count;
        }

        function displayFav(storageData){
            var table = "";
            var i=0;
            end = start+limit;
            for(var key in storageData){
                if(i>=start && i<end){
                    table += "<tr id='a_" + storageData[key].placeid + "' ";
                    if($("#place-name").text() == storageData[key].name){
                        table += " class='table-warning' ";
                    }
                    table +=" >";
                    table += "<td>" + (i+1) + "</td>";
                    table += "<td><img src='" + storageData[key].icon + "' style='width: 35px;'></td>";
                    table += "<td style='white-space: nowrap;'><span>" + storageData[key].name + "</span></td>";
                    table += "<td style='white-space: nowrap;'><span>" + storageData[key].address + "</span></td>";
                    table += "<td><button type='button' class='btn btn-sm btn-border del-details' data-placeid='" + storageData[key].placeid + "'>";
                    table += "<i class='fa fa-trash-o'></i>";
                    table += "</button></td>";
                    table += "<td><button type='button' data-placeid='" + storageData[key].placeid + "' class='btn btn-sm btn-border get-details1' ng-click='showPlacesTabs()'>&gt;</button></td>";
                    table += "</tr>";
                    
                }
                i++;
            }
            return table;
        }
    }

    
    
    function initializeComponents(){
        loadCategories();
        searchResults();
        
    }
    
    initializeComponents();
});

function initAutocomplete(input_id) {
            autocomplete = new google.maps.places.Autocomplete(
                (document.getElementById(input_id)),
                {types: ['geocode']});
}

function geolocate(input_id) {
            initAutocomplete(input_id);
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                var geolocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                var circle = new google.maps.Circle({
                  center: geolocation,
                  radius: position.coords.accuracy
                });
                autocomplete.setBounds(circle.getBounds());
              });
            }
}

var app = angular.module("MyApp", ["ngAnimate"]);
app.controller("MyCtrl", function ($scope) {
$scope.place = false; 
$scope.results = true;
    
$scope.google = true;
$scope.yelp = false;
    
$scope.review = true;
    
    $scope.showPlacesTabs = function (){
        $scope.place = true;
        $scope.results = false;
    }
    
    $scope.showResultsTabs = function(){
        $scope.place = false;
        $scope.results = true;
    }
    
    $scope.clearRes = function(){
        $scope.place = false; 
        $scope.results = true;
    }
    
    $scope.googleClick = function(){
        $scope.google = true;
        $scope.yelp = false;
    }
    
    $scope.yelpClick = function(){
        $scope.google = false;
        $scope.yelp = true;
    }
    
    $scope.reviewClick = function(){
        $scope.review = !$scope.review;
    }

});
