$(document).ready(function () {
  var $body = $('html, body');
  var $scrollspy = $('#sticky-nav-wrapper');
  var $menus = $('#menus a[data-toggle="tab"], #menu a[data-toggle="tab"]');
  var $sticky_header = $('#sticky-header');
  var $anchorLinks = $('#address-bar a, .carousel-caption a, nav a, a.anchor');
  // Javascript to enable link to tab

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function newHash (hash) {
    // remove hash if undefined
    hash = hash || window.location.pathname;

    // Register 'fake' page view for Google Analytics dashboard
    var page_name = capitalizeFirstLetter(hash.substr(1).replace(/-/g, " "));
    _gaq.push(["_set", "title", page_name]);
    _gaq.push(['_trackPageview', page_name]);

    // use pushstate to prevent jumping on hash change
    if (history.pushState) {
        history.pushState(null, null, hash);
    } else {
        location.hash = hash;
    }
  }

  function deepLink () {
    if (window.location.hash) {
      var hashArray = window.location.hash.split('/');
      var $section = $(hashArray[0]);

      if ($section.length > 0) {
        // scroll to section
        var offset = $section.offset().top;
        $body.scrollTop(Math.round(offset));

        // make nav item active
        $scrollspy.find('a[href="'+hashArray[0]+'"]').parent().addClass('active');

        // if modal or tab link, open
        if (hashArray[1]) {
          var $modalLink = $section.find('.lightbox[data-slug="'+hashArray[1]+'"]');

          if ($modalLink.length > 0) {
            $modalLink.click();
            return;
          }

          var $modalLink = $section.find('.thumbnail[data-target="#modal-'+ $section.attr('id').toLowerCase() +'-'+hashArray[1]+'"]');
          if ($modalLink.length > 0) {
            $modalLink.click();
            return;
          }

          if ( $section.attr('id').toLowerCase() === 'news' ) {
            var $modalLink = $('[data-target="#modal-news-'+hashArray[1]+'"]');

            if ($modalLink.length > 0) {
              $modalLink[0].click();
              return;
            }
          }

          var $tabLink = $section.find('.nav-pills a[href="#'+hashArray[1]+'"]');

          if ($tabLink.length > 0) {
            $tabLink.click();
            return;
          }
        }
      }
    }
  }

  setTimeout(function () {
    deepLink();
  }, 500);

  $anchorLinks.on('click', function (e) {
    var href = $(this).attr('href');
    // if link to an anchor tag, intercept and parse for deeplink
    if (href && href.slice(0,1) === '#' && href.length > 1) {
      e.preventDefault();
      newHash(href);
      setTimeout(function () {
        deepLink();
      }, 1);
    }
  });

  // update hash on scrollspy change
  $scrollspy.on('activate.bs.scrollspy', function (e) {
    var activeSection = $(e.target).find('a').attr('href');

    if ($sticky_header.hasClass('show') && (!window.location.hash || window.location.hash.split('/')[0] !== activeSection)) {
      newHash(activeSection);
    }
  });

  // menus tab show
  $menus.on('shown.bs.tab', function (e) {
    window.location.hash = 'menus/'+$(e.target).attr('href').slice(1);
  });
});