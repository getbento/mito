$(document).ready(function () {  
  $('a.lightbox').nivoLightbox({
    beforeShowLightbox: function (e) {
      var $el = $(this)[0].$el;
      window.location.hash = $el.data('section') + '/' + $el.data('slug');
    },
    beforeHideLightbox: function (e) {
      window.location.hash = window.location.hash.split('/')[0].slice(1);
    },
  });
});
