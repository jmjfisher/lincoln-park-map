function createMap(){
    
    var home = {
        lat: 44.1114,
        lon: -87.652,
        zoom: 17
    }; 
    
    const map = L.map('map').setView([home.lat, home.lon], home.zoom);
    
    var streets = L.tileLayer('https://api.mapbox.com/styles/v1/jmjfisher/cjixgsvaqaiok2rnbdsohi0nx/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
        id: 'park_base',
        accessToken: 'pk.eyJ1Ijoiam1qZmlzaGVyIiwiYSI6ImNqYXVlNDg3cDVhNmoyd21oZ296ZXpwdWMifQ.OGprR1AOquImP-bemM-f2g',
        maxZoom: 20
    }).addTo(map);
    
    var imagery = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        id: 'mapbox.streets-satellite',
        accessToken: 'pk.eyJ1Ijoiam1qZmlzaGVyIiwiYSI6ImNqYXVlNDg3cDVhNmoyd21oZ296ZXpwdWMifQ.OGprR1AOquImP-bemM-f2g',
        maxZoom: 20
    });
    
    var baseMaps = {
        "Streets": streets,
        "Imagery": imagery
    };

    const apiKey = config.MY_KEY;
    const getURL = 'https://jjfisher2.carto.com/api/v2/sql?format=GeoJSON&q=';
    const postURL = 'https://jjfisher2.carto.com/api/v2/sql?q='

    updateSelector(postURL,apiKey);
    addParkBounds(map,getURL,apiKey);
    var POIlayers = addPOIs(map,getURL,apiKey);
    
    L.control.layers(baseMaps, null).addTo(map);
    
    var clickMarker = L.marker(50,50);
    
    map.on('click', function(e){
        map.removeLayer(clickMarker);
        var latlng = map.mouseEventToLatLng(e.originalEvent);
        var newLatLng = new L.LatLng(latlng.lat, latlng.lng);
        clickMarker.setLatLng(newLatLng);
        clickMarker.addTo(map);
        $('#coords').html(latlng.lat + ', ' + latlng.lng)
    });
    
    $('#email').click(function(){
        var test = $('#email').val();
        if (test == '(optional)'){
            $('#email').val('');
        }
    });
    
    $('#close').click(function(){
        $('#alert-div').hide(800)
    });

    $('#add-button').click(function(){
        var type = $('#type').val()
        var comment = $('#comment').val()
        var contact = $('#email').val()
        var entity = $('#entity').val()
        var dirtyCoords = $('#coords').html();
        if (comment && dirtyCoords){
            map.removeLayer(clickMarker);
            var coordsArray = dirtyCoords.split(', ');
            var lat = coordsArray[0];
            var lon = coordsArray[1];
            var sql = "INSERT INTO jjfisher2.comments (the_geom, type, comment, contact, date, verified, name) values (ST_SetSRID(ST_point("+lon+", "+lat+"), 4326), '"+type+"', '"+comment+"', '"+contact+"', now(), false, '"+entity+"')";

            $.post(postURL+sql+'&api_key='+apiKey)
                .done(function(){
                    addNewComments(map,getURL,apiKey);
                })
            
            setTrueFlag(entity,postURL,apiKey);
            
            $('#type').prop('selectedIndex',0)
            $('#entity').prop('selectedIndex',0)
            $('#comment').val('')
            $('#email').val('(optional)')
            $('#coords').html('');
            
        } else {
            alert('Please make sure you have selected a location and entered a comment.')
        };
    });
    
    var YAHIMarker = L.icon({
        iconUrl: 'img/star-15.svg',
        shadowUrl: 'img/star-white.svg',
        iconSize: [30, 30],
        shadowSize: [30, 30],
        shadowAnchor: [14,14]
    });
    
    var circleOptions = {
        radius: 35,
        stroke: true,
        color: 'red',
        weight: 2,
        fillOpacity: 0
    };
    
    $('#rest-button').click(function(){
        var dirtyCoords = $('#coords').html();
        if (dirtyCoords){
            map.removeLayer(clickMarker);
            var coordsArray = dirtyCoords.split(', ');
            var lat = coordsArray[0];
            var lon = coordsArray[1];
            var sql = "SELECT name, the_geom FROM JJFISHER2.BUILD_PT WHERE ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326)) = (SELECT MIN(ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326))) FROM JJFISHER2.BUILD_PT) AND restroom = 'Y'";
            
            $.getJSON(getURL+sql+'&api_key='+apiKey, function(data){
                console.log(data)
                var name = data.features[0].properties.name;
                var geom = data.features[0].geometry.coordinates;
                var feature = data.features[0];
                var restMarker = L.circleMarker([geom[1],geom[0]],circleOptions).addTo(map);
                var otherMarker = L.marker([lat,lon], {icon: YAHIMarker}).addTo(map);
                var zoomGroup = new L.featureGroup([restMarker,otherMarker]);
                map.fitBounds(zoomGroup.getBounds(), {
                    padding: [100, 100]
                });
                $('#nearest-div').css({
                    "display":"none"
                });
                $('#map').css({
                    "height": "93vh"
                });
                $('#box').css({
                    "display":"none"
                });
                $('#alert-p').html('<b>'+name+'</b> has the nearest restroom.')
                $('#alert-div').show(800)
                
                $('#close').click(function(){
                    map.removeLayer(otherMarker);
                    map.removeLayer(restMarker);
                });
            });

        } else {
            alert('Please make sure you have selected a location.')
        };
    });
    
    $('#park-button').click(function(){
        var dirtyCoords = $('#coords').html();
        if (dirtyCoords){
            map.removeLayer(clickMarker);
            var coordsArray = dirtyCoords.split(', ');
            var lat = coordsArray[0];
            var lon = coordsArray[1];
            var sql = "SELECT name, the_geom FROM JJFISHER2.PARKING_PT WHERE ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326)) = (SELECT MIN(ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326))) FROM JJFISHER2.PARKING_PT)";
            
            $.getJSON(getURL+sql+'&api_key='+apiKey, function(data){
                console.log(data)
                var name = data.features[0].properties.name;
                var geom = data.features[0].geometry.coordinates;
                var lotMarker = L.circleMarker([geom[1],geom[0]],circleOptions).addTo(map);
                var otherMarker = L.marker([lat,lon], {icon: YAHIMarker}).addTo(map);
                var zoomGroup = new L.featureGroup([lotMarker,otherMarker]);
                map.fitBounds(zoomGroup.getBounds(), {
                    padding: [100, 100]
                });
                $('#nearest-div').css({
                    "display":"none"
                });
                $('#box').css({
                    "display":"none"
                });
                $('#map').css({
                    "height": "93vh"
                });
                $('#alert-p').html('The <b>'+name+'</b> is the nearest parking lot.')
                $('#alert-div').show(800)
                
                $('#close').click(function(){
                    map.removeLayer(otherMarker);
                    map.removeLayer(lotMarker);
                });
            });

        } else {
            alert('Please make sure you have selected a location.')
        };
    });
    
    $('#build-button').click(function(){
        var dirtyCoords = $('#coords').html();
        if (dirtyCoords){
            map.removeLayer(clickMarker);
            var coordsArray = dirtyCoords.split(', ');
            var lat = coordsArray[0];
            var lon = coordsArray[1];
            var sql = "SELECT name, the_geom FROM JJFISHER2.BUILD_PT WHERE ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326)) = (SELECT MIN(ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326))) FROM JJFISHER2.BUILD_PT)";
            
            $.getJSON(getURL+sql+'&api_key='+apiKey, function(data){
                console.log(data)
                var name = data.features[0].properties.name;
                var geom = data.features[0].geometry.coordinates;
                var buildMarker = L.circleMarker([geom[1],geom[0]],circleOptions).addTo(map);
                var otherMarker = L.marker([lat,lon], {icon: YAHIMarker}).addTo(map);
                var zoomGroup = new L.featureGroup([buildMarker,otherMarker]);
                map.fitBounds(zoomGroup.getBounds(), {
                    padding: [100, 100]
                });
                $('#nearest-div').css({
                    "display":"none"
                });
                $('#box').css({
                    "display":"none"
                });
                $('#map').css({
                    "height": "93vh"
                });
                $('#alert-p').html('<b>'+name+'</b> is the nearest building.')
                $('#alert-div').show(800)
                
                $('#close').click(function(){
                    map.removeLayer(otherMarker);
                    map.removeLayer(buildMarker);
                });
            });

        } else {
            alert('Please make sure you have selected a location.')
        };
    });
    
    $('#rec-button').click(function(){
        var dirtyCoords = $('#coords').html();
        if (dirtyCoords){
            map.removeLayer(clickMarker);
            var coordsArray = dirtyCoords.split(', ');
            var lat = coordsArray[0];
            var lon = coordsArray[1];
            var sql = "SELECT name, the_geom FROM JJFISHER2.REC_PT WHERE ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326)) = (SELECT MIN(ST_DISTANCE(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")',4326))) FROM JJFISHER2.REC_PT)";
            
            $.getJSON(getURL+sql+'&api_key='+apiKey, function(data){
                console.log(data)
                var name = data.features[0].properties.name;
                var geom = data.features[0].geometry.coordinates;
                var recMarker = L.circleMarker([geom[1],geom[0]],circleOptions).addTo(map);
                var otherMarker = L.marker([lat,lon], {icon: YAHIMarker}).addTo(map);
                var zoomGroup = new L.featureGroup([recMarker,otherMarker]);
                map.fitBounds(zoomGroup.getBounds(), {
                    padding: [100, 100]
                });
                $('#nearest-div').css({
                    "display":"none"
                });
                $('#box').css({
                    "display":"none"
                });
                $('#map').css({
                    "height": "93vh"
                });
                $('#alert-p').html('The <b>'+name+'</b> is the nearest recreation location.')
                $('#alert-div').show(800)
                
                $('#close').click(function(){
                    map.removeLayer(otherMarker);
                    map.removeLayer(recMarker);
                });
            });

        } else {
            alert('Please make sure you have selected a location.')
        };
    });
    
    $('#pass-cancel').click(function(){
        $('#map').css({
            "height": "93vh"
        });
        $('#service-div').css({
            "display":"none"
        });
    });
    
    $('#pass-sub').click(function(){
        var password = $('#password').val();
        if (password == 'admin'){
            map.removeLayer(clickMarker);
            $('#password').val('');
            $('#map').css({
                "height": "93vh"
            });
            $('#service-div').css({
                "display":"none"
            });
            serviceMap(map,getURL,postURL,apiKey,POIlayers)
        }else{
            alert('Please enter the correct password.')
        };
    });
    
    L.easyButton('fa-pencil',function(btn, map){
        $('#map').css({
            "height": "78vh"
        });
        $('#service-div').css({
            "display":"none"
        });
        $('#nearest-div').css({
            "display":"none"
        });
        $('#box').css({
            "display":"inline"
        });
        $('#comment-div').css({
            "display":"inline"
        });
        },'Submit a comment',
        'comment-button',{
        position: 'bottomleft'
        }
    ).addTo(map);
    
    L.easyButton('fa-search',function(btn, map){
        $('#map').css({
            "height": "78vh"
        });
        $('#service-div').css({
            "display":"none"
        });
        $('#comment-div').css({
            "display":"none"
        });
        $('#box').css({
            "display":"inline"
        });
        $('#nearest-div').css({
            "display":"inline"
        });
        },'Search the park',
        'nearest-button',{
        position: 'bottomleft'
        }
    ).addTo(map);
    
    L.easyButton('fa-wrench',function(btn, map){
        map.removeLayer(clickMarker);
        $('#map').css({
            "height": "84vh"
        });
        $('#comment-div').css({
            "display":"none"
        });
        $('#nearest-div').css({
            "display":"none"
        });
        $('#box').css({
            "display":"none"
        });
        $('#service-div').css({
            "display":"inline"
        });
        },'Search comments - staff only',
        'wrench-button',{
        position: 'bottomright'
        }
    ).addTo(map);
    
    $('#cancel-comment-button').click(function(){
        map.eachLayer(function (layer) {
            if (layer != imagery && layer != streets){
                map.removeLayer(layer);
            };
        });
        var i;
        for (i=0;i<POIlayers.length;i++){
            map.removeLayer(POIlayers[i]);
        }
        addParkBounds(map,getURL,apiKey)
        POIlayers = addPOIs(map,getURL,apiKey);

        $('#nearest-div').css({
            "display":"none"
        });
        $('#service-div').css({
            "display":"none"
        });
        $('#comment-div').css({
            "display":"none"
        });
        $('#box').css({
            "display":"none"
        });
        $('#map').css({
            "height": "93vh"
        });
    });
    
    L.easyButton('fa-home',function(btn,map){
        map.eachLayer(function (layer) {
            if (layer != imagery && layer != streets){
                map.removeLayer(layer);
            };
        });
        var i;
        for (i=0;i<POIlayers.length;i++){
            map.removeLayer(POIlayers[i]);
        }
        addParkBounds(map,getURL,apiKey)
        POIlayers = addPOIs(map,getURL,apiKey);

        map.setView([home.lat, home.lon], home.zoom);
        $('#nearest-div').css({
            "display":"none"
        });
        $('#service-div').css({
            "display":"none"
        });
        $('#comment-div').css({
            "display":"none"
        });
        $('#box').css({
            "display":"none"
        });
        $('#map').css({
            "height": "93vh"
        });
    },'Zoom To Home').addTo(map);
    
    L.control.locate().addTo(map);
    
    L.easyButton('fa-question',function(btn,map){
        console.log('testing')
    },'About',
        'about-button',{
        position: 'topright'
        }
    ).addTo(map);;
    
}; //end createMap

function addParkBounds(map,getURL,apiKey){
    
    var style = {
        weight: 4,
        opacity: 0.7,
        color: '#286524',
        dashArray: '6',
        fillOpacity: 0
    };
    $.getJSON(getURL+'SELECT * FROM jjfisher2.park_bounds_1&api_key='+apiKey, function(data){
        var feature = data.features;
        var bounds = L.geoJSON(feature, {
            style: style
        });
        bounds.addTo(map);
    });
};//end addParkBounds

function serviceMap(map,getURL,postURL,apiKey,POIlayers){
    var i;
    for (i=0; i < POIlayers.length; i++){
        var remove = POIlayers[i];
        map.removeLayer(remove);
    }
    var commentMarker = L.icon({
        iconUrl: 'img/comments-solid.svg',
        iconSize: [40, 40]
    });
    
    $.getJSON(getURL+'SELECT * FROM jjfisher2.comments where verified = false&api_key='+apiKey, function(data){
        var features = data.features
        var comments = L.geoJSON(features, {
            pointToLayer: function(feature,latlng){
                return L.marker(latlng, {icon: commentMarker})
            },
            onEachFeature: hoverCommentsService
        })
        comments.addTo(map);
    })
};

function setTrueFlag(entity,postURL,apiKey){
    
    var recList = ['NW Tennis Courts', 'NE Tennis Courts', 'SE Tennis Courts', 'Softball Field', 'Zoo'];
    var buildList = ['Sports Shelter', 'Field House', 'Cabin 1', 'Restrooms', 'Cabin 2', 'Zoo Office', 'Big Red Barn'];
    var parkingList = ['Main Lot', 'Tennis Lot', 'Zoo Lot', 'Reed Ave Lot', 'Cabin 1 Lot', 'Cabin 2 Lot'];
    
    if (recList.includes(entity)){
        var sql = "update jjfisher2.recreation set comment=true where name='"+entity+"'&api_key=";
        var statement = postURL+sql+apiKey;
        $.post(statement)
            .done(function(){
                console.log('TRUE post sucess')
            });
    } else if (buildList.includes(entity)){
        var sql = "update jjfisher2.buildings set comment=true where name='"+entity+"'&api_key=";
        var statement = postURL+sql+apiKey;
        $.post(statement)
            .done(function(){
                console.log('TRUE post sucess')
            });
    }else if (parkingList.includes(entity)){
        var sql = "update jjfisher2.parking set comment=true where name='"+entity+"'&api_key=";
        var statement = postURL+sql+apiKey;
        $.post(statement)
            .done(function(){
                console.log('TRUE post sucess')
            });
    }else{
        console.log('no specific entity')
    };
};

function addNewComments(map,getURL,apiKey){
    
    var commentMarker = L.icon({
        iconUrl: 'img/cross-15.svg',
        shadowUrl: 'img/cross-white.svg',
        iconSize: [30, 30],
        shadowSize: [30, 30],
        shadowAnchor: [14,14]
    });
    
    $.getJSON(getURL+'SELECT * FROM jjfisher2.comments where cartodb_id = (select max(cartodb_id) from jjfisher2.comments)&api_key='+apiKey, function(data){
        var feature = data.features
        var comments = L.geoJSON(feature, {
            pointToLayer: function(feature,latlng){
                return L.marker(latlng, {icon: commentMarker})
            },
            onEachFeature: hoverComments
        })
        comments.addTo(map);
    })
};//end addNewComments
              
function hoverComments(feature,layer){
    var name = feature.properties['name'];
    var type = feature.properties['type'];
    var comment = feature.properties['comment'];
    var popupContent = '<p><b>Type</b>:&nbsp;'+type+'</p><p><b>Name</b>:&nbsp;'+name+'</p><p><b>Comment</b>:&nbsp;'+comment+'</p>';
    
    layer.bindTooltip(popupContent, {
        offset: [0,-7],
        direction: 'top',
        className: 'popupComments'});
}; // end hoverComments

function hoverCommentsService(feature,layer){
    var name = feature.properties['name'];
    var type = feature.properties['type'];
    var comment = feature.properties['comment'];
    var contact = feature.properties['contact'];
    var date = feature.properties['date'];
    var popupContent = '<p><b>Type</b>:&nbsp;'+type+'</p><p><b>Name</b>:&nbsp;'+name+'</p><p><b>Comment</b>:&nbsp;'+comment+'</p><p><b>Contact</b>: '+contact+'</p><p><b>Date</b>: '+date+'</p>';
    
    layer.bindTooltip(popupContent, {
        offset: [0,-7],
        direction: 'top',
        className: 'popupComments'});
    
    layer.on('click', function(e){
        

        $('#no-button').click(function(){
            $('#service-alert-div').css({
                "display":"none"
            });
        });
        $('#yes-button').click(function(){
            $('#service-alert-div').css({
                "display":"none"
            });

            var id = feature.properties['cartodb_id'];
            var entity = feature.properties['name'];
            var apiKey = config.MY_KEY;
            var postURL = 'https://jjfisher2.carto.com/api/v2/sql?q='
            var commentSQL = "UPDATE jjfisher2.comments set verified = true where cartodb_id = "+id;

            $.post(postURL+commentSQL+'&api_key='+apiKey)
                .done(function(){
                    e.target.setOpacity(0.4);
                });
        });
        $('#service-alert-div').css({
            "display":"inline"
        });
    });
}; // end hoverCommentsService

function hoverName(feature,layer){
    var popupContent = feature.properties['name'];
    
    layer.bindTooltip(popupContent, {
        offset: [0,-7],
        direction: 'top',
        className: 'popupName'});
}; // end hoverName

function addPOIs(map,getURL,apiKey){
    
    var POIlayers = [];
    
    var buildingMarker = L.icon({
        iconUrl: 'img/home-15.svg',
        shadowUrl: 'img/home-white.svg',
        iconSize: [30, 30],
        shadowSize: [30, 30],
        shadowAnchor: [14,14]
    });
    
    var parkingMarker = L.icon({
        iconUrl: 'img/parking-15.svg',
        shadowUrl: 'img/parking-white.svg',
        iconSize: [20, 20],
        shadowSize: [20, 20],
        shadowAnchor: [9,9]
    });
    
    var zooMarker = L.icon({
        iconUrl: 'img/zoo-15.svg',
        shadowUrl: 'img/zoo-white.svg',
        iconSize: [40, 40],
        shadowSize: [40, 40],
        shadowAnchor: [19,19]
    });
    
    var baseballMarker = L.icon({
        iconUrl: 'img/baseball-15.svg',
        shadowUrl: 'img/baseball-white.svg',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        shadowAnchor: [15,15]
    });
    
    var tennisMarker = L.icon({
        iconUrl: 'img/tennis-15.svg',
        shadowUrl: 'img/tennis-white.svg',
        iconSize: [30, 30],
        shadowSize: [30, 30],
        shadowAnchor: [14,14]
    });

    $.getJSON(getURL+'SELECT * FROM jjfisher2.rec_pt&api_key='+apiKey, function(data){
        var features = data.features
        var Recreation = L.geoJSON(features, {
            pointToLayer: function(feature,latlng){
                var type = feature.properties['type'];
                if (type == 'Softball'){
                    return L.marker(latlng, {icon: baseballMarker});
                } else if (type == 'Tennis'){
                    return L.marker(latlng, {icon: tennisMarker});
                } else {
                return L.marker(latlng, {icon: zooMarker});
                }
            },
            onEachFeature: hoverName
        });
        POIlayers.push(Recreation);
        Recreation.addTo(map);
    })
        
    $.getJSON(getURL+'SELECT * FROM jjfisher2.parking_pt&api_key='+apiKey, function(data){
        var features = data.features
        var Parking = L.geoJSON(features, {
            pointToLayer: function(feature,latlng){
                return L.marker(latlng, {icon: parkingMarker});
            },
            onEachFeature: hoverName
        });
        POIlayers.push(Parking);
        Parking.addTo(map);
    })

    $.getJSON(getURL+'SELECT * FROM jjfisher2.build_pt&api_key='+apiKey, function(data){
        var features = data.features
        var Buildings = L.geoJSON(features, {
            pointToLayer: function(feature,latlng){
                return L.marker(latlng, {icon: buildingMarker});
            },
            onEachFeature: hoverName
        });
        POIlayers.push(Buildings);
        Buildings.addTo(map);
    })
    return POIlayers;
}; // end addPOIs

function updateSelector(postURL,apiKey){
    var entities = ['Big Red Barn',
        'Cabin 1',
        'Cabin 1 Lot',
        'Cabin 2',
        'Cabin 2 Lot',
        'Field House',
        'Main Lot',
        'NE Tennis Courts',
        'NW Tennis Courts',
        'Reed Ave Lot',
        'Restrooms',
        'SE Tennis Courts',
        'Softball Field',
        'Sports Shelter',
        'Tennis Lot',
        'Zoo',
        'Zoo Office',];
    var t;
    for (t=0; t < entities.length; t++){
        var value = entities[t];
        $('#entity').append('<option value="'+value+'">'+value+'</option>')
    };
}; //end updateSelector

function createAbout(){
    $('#about-button').click(function() {
        $('#overlay').fadeIn(300);  
    });
    $('#close-about').click(function() {
        $('#overlay').fadeOut(300);
    });
};

$(document).ready(createMap);
$(document).ready(createAbout);