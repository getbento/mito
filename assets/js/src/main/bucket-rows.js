$(document).ready(function () {
  var $buckets = $('.bucket-into-rows');

  // Segment press columns into rows
  function bucketIntoRows(divs, columns) {
    $.each(divs, function (i, el) {
      if (i % columns === 0) {
        divs.slice(i , i+columns).wrapAll('<div class="row">');
      }
    });
  }
  
  $buckets.each(function (i, el) {
    var $this = $(this);
    var divs = $this.children('div');
    var children = (divs.length === 0) ? $this.children('article'): divs;
    bucketIntoRows(children, $this.data('columns'));
  });
});