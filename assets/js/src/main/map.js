/*
Custom Map Js
JQuery required
*/

$(document).ready(function($){
    window.loadMap = function (config) {
        //we define here the style of the map
        var style= [
            {
                "featureType":"administrative",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"landscape",
                "elementType":"geometry.fill",
                "stylers":[
                    {
                        "color": config.main_color
                    }
                ]
            },
            {
                "featureType":"landscape",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"landscape.man_made",
                "elementType":"geometry",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"landscape.man_made",
                "elementType":"geometry.fill",
                "stylers":[
                    {
                        "color":"#f3eacf"
                    }
                ]
            },
            {
                "featureType":"landscape.man_made",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi",
                "elementType":"all",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi.attraction",
                "elementType":"all",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi.attraction",
                "elementType":"labels",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi.business",
                "elementType":"all",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi.business",
                "elementType":"labels",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi.government",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"poi.park",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"road.highway",
                "elementType":"geometry.fill",
                "stylers":[
                    {
                        "visibility":"on"
                    },
                    {
                        "color":"#e1e1e1"
                    }
                ]
            },
            {
                "featureType":"road.highway",
                "elementType":"geometry.stroke",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"road.highway",
                "elementType":"labels.icon",
                "stylers":[
                    {
                        "visibility":"simplified"
                    }
                ]
            },
            {
                "featureType":"road.highway.controlled_access",
                "elementType":"labels.icon",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"road.arterial",
                "elementType":"geometry.stroke",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"road.arterial",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"on"
                    }
                ]
            },
            {
                "featureType":"road.arterial",
                "elementType":"labels.text.fill",
                "stylers":[
                    {
                        "lightness":"38"
                    }
                ]
            },
            {
                "featureType":"road.arterial",
                "elementType":"labels.icon",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"road.local",
                "elementType":"geometry.stroke",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"road.local",
                "elementType":"labels.text.fill",
                "stylers":[
                    {
                        "lightness":"23"
                    }
                ]
            },
            {
                "featureType":"road.local",
                "elementType":"labels.text.stroke",
                "stylers":[
                    {
                        "visibility":"off"
                    },
                    {
                        "lightness":"5"
                    }
                ]
            },
            {
                "featureType":"road.local",
                "elementType":"labels.icon",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"transit",
                "elementType":"all",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"transit.line",
                "elementType":"all",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"transit.line",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"transit.station",
                "elementType":"all",
                "stylers":[
                    {
                        "visibility":"off"
                    }
                ]
            },
            {
                "featureType":"water",
                "elementType":"labels.text",
                "stylers":[
                    {
                        "visibility":"off"
                    }
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

        if (Modernizr.touch) {
            map_options.draggable = false;
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