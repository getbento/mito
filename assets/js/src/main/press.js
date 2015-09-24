$(document).ready(function () {
  var $html = $('html, body');
  var $window = $(window);
  var $featured = $('.featured-press');
  var $unfeatured = $('.press-group .unfeatured');

  function scrollTo () {
    $html.animate({scrollTop: $window.scrollTop() + $featured.height() + 100 }, '400');
  }

  $unfeatured.on('shown.bs.collapse', $.debounce(100, scrollTo));
});