/*
Custom Map Js
JQuery required
*/

$(document).ready(function($){
    window.loadMap = function (config) {
        //we define here the style of the map
        var style= [
            {
                //set saturation for the labels on the map
                elementType: "labels",
                stylers: [
                    {saturation: config.saturation_value}
                ]
            },
            {   //poi stands for point of interest - don't show these lables on the map
                featureType: "poi",
                elementType: "labels.text",
                stylers: [
                    {visibility: "off"}
                ]
            },
            {   //poi stands for point of interest - don't show these lables on the map
                featureType: "poi.business",
                elementType: "all",
                stylers: [
                    {visibility: "off"}
                ]
            },
            {
                //don't show road lables on the map
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [
                    {visibility: "off"}
                ]
            },
            //style different elements on the map
            {
                featureType: "poi",
                elementType: "geometry.fill",
                stylers: [
                    { hue: config.main_color },
                    { visibility: "off" },
                    { lightness: config.brightness_value },
                    { saturation: config.saturation_value }
                ]
            },
            {
                featureType: "transit",
                elementType: "lables.text",
                stylers: [
                    { visibility: "off" },
                ]
            },
            {
                featureType: "transit",
                elementType: "geometry.fill",
                stylers: [
                    { hue: config.main_color },
                    { visibility: "off" },
                    { lightness: config.brightness_value },
                    { saturation: config.saturation_value }
                ]
            },
            {
                featureType: "landscape",
                stylers: [
                    { hue: config.main_color },
                    { visibility: "on" },
                    { lightness: config.brightness_value },
                    { saturation: config.saturation_value }
                ]

            },
            {
                featureType: "road",
                elementType: "geometry.fill",
                stylers: [
                    { hue: config.main_color },
                    { visibility: "on" },
                    { lightness: config.brightness_value },
                    { saturation: config.saturation_value }
                ]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [
                    { hue: config.main_color },
                    { visibility: "on" },
                    { lightness: config.brightness_value },
                    { saturation: config.saturation_value }
                ]
            }
        ];

        //set google map options
        var map_options = {
            center: config.map_location,
            zoom: config.map_zoom,
            panControl: false,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            scrollwheel: false,
            styles: style,
        }

        //inizialize the map
        var map = new google.maps.Map(document.getElementById(config.canvas_id), map_options);
        
        //add a custom marker to the map
        var marker = new google.maps.Marker({
            position: config.map_location,
            map: map,
            visible: true,
            icon: config.marker_url,
        });

        if (config.onLoad) {
            google.maps.event.addListenerOnce(map, 'idle', function () {
                // do something only the first time the map is loaded
                config.onLoad();
            });
        }

        //add custom buttons for the zoom-in/zoom-out on the map
        function CustomZoomControl(controlDiv, map) {
            //grap the zoom elements from the DOM and insert them in the map
            var controlUIzoomIn= document.getElementById('cd-zoom-in'),
                controlUIzoomOut= document.getElementById('cd-zoom-out');
            controlDiv.appendChild(controlUIzoomIn);
            controlDiv.appendChild(controlUIzoomOut);

            // Setup the click event listeners and zoom-in or out according to the clicked element
            google.maps.event.addDomListener(controlUIzoomIn, 'click', function() {
                map.setZoom(map.getZoom()+1)
            });
            google.maps.event.addDomListener(controlUIzoomOut, 'click', function() {
                map.setZoom(map.getZoom()-1)
            });
        }

        var zoomControlDiv = document.createElement('div');
        var zoomControl = new CustomZoomControl(zoomControlDiv, map);

        //insert the zoom div on the top left of the map
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(zoomControlDiv);
    }
});