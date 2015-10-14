$(document).ready(function () {
  var $timepicker = $('#timepicker');
  var $datepicker = $('#datepicker');
  var $select_menu = $('select');
  var $submit_btn = $('button.submit');
  var $tab_select = $('select.tab-select');

  // initialize bootstrap timepicker
  $timepicker.datetimepicker({
      pickDate: false,
      minuteStepping: 30
  });

  // initialize bootstrap datepicker
  $datepicker.datetimepicker({
      pickTime: false
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

    var required = ['email', 'firstName', 'lastName', 'contact-email', 'name'];

    _.each(required, function (requiredId) {
      var $input = $form.find('#'+requiredId);

      if ($input.length > 0 && $input.val() === '') {
        $input.parent().addClass('error');
        error = 'Please complete all required fields';
      }
    });

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
          },
          error: function(xhr, status, error){
            error = 'A server error occured. Please try again later.';
            $error_msg.html(error).show();
          }
      });
    }
  });
});