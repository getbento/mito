$(document).ready(function () {
  var $html = $('html, body');
  var $inquiry_btn = $('a[href="#event_inquiry');
  var $inquiry_form = $('#event_inquiry');
  var $inquiry_close = $inquiry_form.find('.cancel');

  // hide inquiry form
  function slideUp () {
    $inquiry_form.slideUp(300, function () {
      $inquiry_form.removeClass('in');
    });
  }

  // show inquiry form
  function slideDown (duration) {
    $inquiry_form.slideDown(duration, function () {
      $inquiry_form.addClass('in');
    });
  }

  // scroll to inquiry form
  function scrollTo (delay) {
    var offset = $inquiry_form.offset().top - 120;
    
    setTimeout(function () {
      $html.animate({scrollTop: offset }, '400');
    }, delay);
  }

  // on inquiry btn clik
  function onClick (e) {
    e.preventDefault();

    // if visible > hide
    if ($inquiry_form.hasClass('in')) {
      slideUp();
    } else {
      var timeout = 0;

      // if collapsed, show
      if ($inquiry_form.hasClass('collapse')) {
        timeout = 300; // delay scroll to for animation
        slideDown(timeout);
      }

      // scroll to after animation delay
      scrollTo(timeout);
    }
  }

  $inquiry_btn.click(onClick);
  $inquiry_close.click(slideUp);
});