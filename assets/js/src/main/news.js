$(document).ready(function () {
  var $html = $('html, body');
  var $window = $(window);
  var $featured = $('.featured-news');
  var $unfeatured = $('.news-group .unfeatured');

  function scrollTo () {
    $html.animate({scrollTop: $window.scrollTop() + $featured.height() + 100 }, '400');
  }

  $unfeatured.on('shown.bs.collapse', $.debounce(100, scrollTo));

  $('.modal.news').on('show.bs.modal', function (e) {
    var $el = $(this);
    window.location.hash = $el.data('section') + '/' + $el.data('slug');
  });
  $('.modal.news').on('hide.bs.modal', function (e) {
     window.location.hash = window.location.hash.split('/')[0].slice(1);
  });

});