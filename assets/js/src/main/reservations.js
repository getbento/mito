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
    },

    initializeOpenTableFireFoxFix: function(opentableId) {
      // check if firefox
      // if not firefox, return
      // find ALL reservations buttons and nav links
      // handle the event hopefully BEFORE modal triggers
      // event.stopPropagation() should keep modal from firing after you do your thing.
      // window.something should open a new tab.
      var isFirefox = typeof InstallTrigger !== 'undefined';
      if (isFirefox !== true) {
        return;
      }

      var OTButton = $('[data-target="#modal-opentable"]');

      var url = "https://www.opentable.com/single.aspx?rid=" + opentableId + "&restref=" + opentableId + "&rtype=ism";

      $(OTButton).click(function(event) {
        var link  = $(this).find(OTButton);
        event.stopPropagation();
        link.attr("target", "_blank");
        window.open(url);
      });
    },
  };
});