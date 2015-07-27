$(document).ready(function () {
  var $document = $(document);
  var $window = $(window);
  var $carousels = $('.carousel');
  var $carousel = $($carousels[0]);
  var $parallax_carousels = $('.parallax .carousel:not(.no-parallax)');
  var $headerSlidesText = $('.carousel-caption-wrapper');

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
  function isElementInView (el) {
      //special bonus for those using jQuery
      if (typeof jQuery === "function" && el instanceof jQuery) {
          el = el[0];
      }

      var rect = el.getBoundingClientRect();

      return (
          rect.bottom >= 0 &&
          rect.top <= $(window).height()
      );
  }

  function parallaxCarousel () {
    var scrollTop = $window.scrollTop();
    var windowHeight = $window.height();
    var diff = 500;

    $parallax_carousels.each(function (index, el) {
      if (isElementInView(el)) {
        var $this = $(el);
        var $inner = $this.find('.carousel-inner');

        var carouselHeight = $this.height();
        var carouselOffset = $this.offset().top;
        
        var position = (scrollTop - carouselOffset + windowHeight) / (carouselHeight + windowHeight);
        position = Math.max(Math.min(position, 1), 0);
        
        var offset = -diff + diff*position;
        $inner.css({'transform': 'translate3d(0px, ' + offset + 'px, 0px)'});

        if ($this.attr('id') === 'header-carousel') {
          $headerSlidesText.css('top', offset*-1);
        }
      }
    });

    $('.carousel-inner.transparent').removeClass('transparent');
  }

  if (!jQuery.browser.mobile) {
    $window.on('load scroll resize', function() {
       window.requestAnimationFrame(parallaxCarousel);
    });
  }
});
