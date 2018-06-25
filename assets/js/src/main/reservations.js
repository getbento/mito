$(document).ready(function() {
  window.Reservations = {
    initializeOpenTableFireFoxFix: function(opentableId) {
      // check if browser is Firefox - return if not
      var isFirefox = typeof InstallTrigger !== 'undefined';
      if (isFirefox !== true) {
        return;
      }

      // create variable targeting every element that opens opentable modal
      var OTButton = $('[data-target="#modal-opentable"]');

      // url to opentable page with custom opentable ID
      var url =
        'https://www.opentable.com/single.aspx?rid=' +
        opentableId +
        '&restref=' +
        opentableId +
        '&rtype=ism';

      //opens opentable page in new tab
      $(OTButton).click(function(event) {
        event.stopPropagation();
        window.open(url);
      });
    }
  };
});
