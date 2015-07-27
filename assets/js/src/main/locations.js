$(document).ready(function () {
  /*
  * Loop through multi-locations row and set elements on same row to equal heights
  */
  $multiLocationRows = $('.multi-locations > .row');

  $multiLocationRows.each(function (index, row) {
    var $columns = $(row).children();
    var childrenCount = $columns.first().children().length;

    for (var i=0; i < childrenCount - 1; i++) {
      var $children = $columns.children(':nth-child(' + (i + 1) +')');
      
      var hgt = Math.max.apply(null, $children.map(function () {
        return $(this).height();
      }).get());;

      $children.height(hgt);
    }
  });
});