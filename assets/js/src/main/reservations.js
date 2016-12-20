$(document).ready(function() {
  window.Reservations = {
    initializeSeatmeModal: function(seatmeId) {
      Reservations.seatmeId = seatmeId;
      var reservationsButton = $('[data-target="#modal-seatme"]');
      reservationsButton.on('click', Reservations.showSeatmeModal);
      reservationsButton.removeAttr("data-toggle");
    },

    showSeatmeModal: function(event) {
      event.preventDefault();

      var url = 'https://www.yelpreservations.com/r/' + Reservations.seatmeId;
      var isMobile = window.matchMedia("only screen and (max-width: 760px)");

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
        id:  'seatmeIframe',
        width: '100%',
        height: '570px',
        frameborder: 0,
        scrolling: 'no'
      });
      modalBody.append(seatmeIframe);
    }
  };

});