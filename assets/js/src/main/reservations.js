$(document).ready(function() {
  window.Reservations = {
    initializeSeatmeModal: function(seatmeId) {
      Reservations.seatmeId = seatmeId;
      var reservationsButton = $('[data-target="#modal-seatme"]');
      reservationsButton.on('click', Reservations.showSeatmeModal);
      reservationsButton.removeAttr('data-toggle');
    },

    showSeatmeModal: function(event) {
      event.preventDefault();

      var url = 'https://www.yelp.com/reservations/' + Reservations.seatmeId;
      var isMobile = window.matchMedia('only screen and (max-width: 760px)');

      if (isMobile.matches) {
        window.open(url, '_blank');
        return;
      }

      var reservationsModal = $('#modal-seatme');

      reservationsModal.modal('show');

      var modalBody = reservationsModal.find('div.modal-content');

      var iframeExists = $('#seatmeIframe').length > 0;

      if (iframeExists) {
        return;
      }

      var seatmeIframe = $('<iframe>', {
        src: url,
        id: 'seatmeIframe',
        width: '100%',
        height: '570px',
        frameborder: 0
      });
      modalBody.append(seatmeIframe);
    },

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
