$(document).ready(function () {
  var $html = $('html, body');
  var $unfeatured = $('.press-section #press-unfeatured');
  var $headerOffset = $('#sticky-header').height() + 15;
  var $stickyOffset = $headerOffset;

  function scrollTo() {
    if ($html.hasClass('address-bar-sticky')) {
      $stickyOffset = $('#address-bar').height() + $headerOffset;
    }

    $html.animate({ scrollTop: $unfeatured.offset().top - $stickyOffset, }, '250');
  }

  $unfeatured.on('shown.bs.collapse', $.debounce($stickyOffset, scrollTo));
});
