$(document).ready(function () {
  var $window = $(window);
  var $document = $(document);
  var $body = $('body');
  var $mobile_header = $('#mobile-header');
  var $address_bar = $('#address-bar');
  var $nav_wrapper = $('#nav-wrapper');
  var $sticky_header = $('#sticky-header');
  var isSticky = $body.hasClass('address-bar-sticky');
  var $oneLineTop = $('#nav-wrapper.single-line:not(.vertically-center)');

  function newHash (hash) {
    // remove hash if undefined
    hash = hash || window.location.pathname;

    if (history.pushState) {
        history.pushState(null, null, hash);
    } else {
        location.hash = hash;
    }
  }

  function toggleStickyHeader () {
    var belowNav = $window.scrollTop() > $nav_wrapper.height() + $nav_wrapper.offset().top - 60;

    if (belowNav && !$sticky_header.hasClass('show')) {
      $sticky_header.addClass('show');

      if (!window.location.hash) {
        // set active nav link on appear
        var $firstNavItem = $sticky_header.find('ul > li:first-child');
        $firstNavItem.addClass('active');
        newHash($firstNavItem.find('a').attr('href'));  
      }
    } else if (!belowNav && $sticky_header.hasClass('show')) {
      $sticky_header.removeClass('show');
      // reset active nav link on scroll up
      $sticky_header.find('li.active').removeClass('active');
      newHash();
    }
  }

  function scrollMobileHeader () {
    if ($window.scrollTop() > $address_bar.outerHeight()) {
      $mobile_header.addClass('off-screen');
    } else {
      $mobile_header.removeClass('off-screen');
    }
  }

  // if nav on one line and not verticall centered,
  // push down half image height since img is position absolute 
  // and doesn't effect parent height
  if ($oneLineTop.length > 0) {
    var $oneLineTopNav = $oneLineTop.find('nav');
    var imgHgt = $oneLineTop.find('img').height();
    var navHgt = $oneLineTopNav.height();
    var offset = (imgHgt - navHgt + 50) / 2;

    $oneLineTopNav.children('ul').css('padding-top', offset);
  }

  $window.load(toggleStickyHeader);

  $document.on('scroll', $.throttle(15, function () {
    toggleStickyHeader();
    scrollMobileHeader();
  }));
});