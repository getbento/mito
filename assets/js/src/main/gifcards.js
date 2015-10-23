$(document).ready(function () {

  $('.show-giftcard-form').on('click', function(event) {
    event.preventDefault();
    
    $('.formContainer').hide();

    var formSelector = '#' + $(this).data('target');
    $(formSelector).fadeIn();
  });

});