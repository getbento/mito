$(document).ready(function () {
  var $timepicker = $('#timepicker');
  var $datepicker = $('#datepicker');
  var $select_menu = $('select');
  var $submit_btn = $('button.submit');
  var $tab_select = $('select.tab-select');

  // initialize bootstrap timepicker
  $timepicker.datetimepicker({
      pickDate: false,
      minuteStepping: 30,
      debug: true
  });

  // initialize bootstrap datepicker
  $datepicker.datetimepicker({
      pickTime: false,
      debug: true
  });

  // initialize select2.js dropdowns
  $select_menu.select2({
    minimumResultsForSearch: Infinity
  });

  // on select dropdown change mobile, e.g. menus
  $tab_select.on('change', function () {
    var $this = $(this);
    var file = $this.find(':selected').attr('file');

    if (file) {
      window.open(file);
      return true;
    }

    $this.parents('section').find('.nav a[href=#'+$this.val().replace(/ /g,'')+']').tab('show');
  });

  function validateEmail (email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  }

  // submit form
  $submit_btn.click(function (e) {
    e.preventDefault();
    var $this = $(this);
    var $form = $this.parents('form');
    var $error_msg = $form.find('.error-msg');
    var $success_msg = $form.find('.success-msg');

    var error;

    function resetErrors() {
      error = false;
      $error_msg.hide();
      $success_msg.hide();
      $form.find('.error').removeClass('error');
    }

    //Validations
    resetErrors();

    var required = ['email', 'firstName', 'lastName', 'contact-email', 'name', 'datepicker'];

    _.each(required, function (requiredId) {
      var $input = $form.find('#'+requiredId);

      if ($input.length > 0 && $input.val() === '') {
        $input.parent().addClass('error');
        error = 'Please complete all required fields';
      }
    });

    var $emailInput = $form.find('#contact-email').length ? $form.find('#contact-email') : $form.find('#email').length ? $form.find('#email') : null;

    if ( $emailInput && $emailInput.val() && !validateEmail($emailInput.val()) ) {
      $emailInput.parent().addClass('error');
      error = 'Please enter a valid email';
    }

    if (error) {
      $error_msg.html(error).show();
      return false;
    } else {
      var datastring = $form.serialize();

      $.ajax({
          type: 'POST',
          url: $form.attr("action"),
          data: datastring,
          success: function(data, textStatus) {
            resetErrors();
            $this.hide();
            $success_msg.show();

            // Bento Tracking
            // Notes: 
              //  - Some forms return "true", and some return true, so we're checking for both before submitting a tracking request.
              //  - We have to identify which form has been submitted using the below if/else/switch, and attempt
              //    to return; as soon as we find it.
              //  - #product-form: This is tracked in store.js > addToCart()
              //  - #event-form: This is tracked in ticketed_events.js > onSubmit()
              //  - gift cards are tracked in /templates/store/gift_cards.html > Bento.GiftCards.initialize()
            if (data.success == "true" || data.success === true){
              // If this is the newsletter form...
              if ($form.is("#newsletter")){
                window.TRACKING.sendEvent("Forms", "Submit", "Email Sign Up");
                return;  
              }
              // Else, if it exists, we're going to look for the value of <input type="hidden" name="form" value="?">
              // to identify the form.
              else {
                switch ($form.find("input[name='form']").first().val()) {
                  case "private-events":
                    window.TRACKING.sendEvent("Forms", "Submit", "Private Events");
                    break;

                  case "contact":
                    window.TRACKING.sendEvent("Forms", "Submit", "Contact");
                    break;
                }
              }
            }
          },
          error: function(xhr, status, error){
            error = 'A server error occured. Please try again later.';
            $error_msg.html(error).show();
          }
      });
    }
  });
});