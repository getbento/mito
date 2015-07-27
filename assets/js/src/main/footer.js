$(document).ready(function () {
  var $html = $('html, body');
  var $window = $(window);
  var $footer = $('#footer');
  var $footer_form = $('#footerform');

  // scroll to bottom of window on email signup reveal if not fixed position
  function onShowForm (e) {
    if ($footer.css('position') !== 'fixed') {
      var offset = $window.scrollTop() + $footer_form.height() + 40;
      $html.animate({scrollTop: offset}, '500', 'swing');
    }
  }

  $footer_form.on('shown.bs.collapse', onShowForm);
});
