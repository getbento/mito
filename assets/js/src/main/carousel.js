$(document).ready(function () {
  var $document = $(document);
  var $window = $(window);
  var $carousels = $('.carousel');
  var $carousel = $($carousels[0]);
  var $parallax_carousels = $('.parallax .carousel:not(.no-parallax)');
  var $headerSlidesText = $('.carousel-caption-wrapper');
  var $hidden_carousels = $('.carousel-inner.transparent');

  // Hammer Gestures
  var hammer = {};

  function initHammerGesture (index, el) {
    hammer[index] = new Hammer(el, {
        recognizers: [
            [Hammer.Swipe,{ direction: Hammer.DIRECTION_HORIZONTAL, distance: 5, velocity: 0.3 }],
        ]
    });

    function onSwipe (ev) {
      if (ev.direction === 2) {  // left
        $(hammer[index]['element']).carousel('next');
      }
      if (ev.direction === 4) { // right
        $(hammer[index]['element']).carousel('prev');
      }
    }

    hammer[index].on('swipe', onSwipe);
  }

  $carousels.each(initHammerGesture);

  // Parallax  
  if(!(/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera)){
      var s = skrollr.init({
        forceHeight: false
      });
  }

  $hidden_carousels.removeClass('transparent');
});
