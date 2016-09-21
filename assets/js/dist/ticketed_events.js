var TICKETED_EVENTS = {
  initialize: function () {
    var $eventForm = $('#event-form');
    this.closeModalListener();
    this.variantChangeListener();
    this.triggerInventoryCheck();

    this.onSubmit = this.onSubmit.bind(this);
    this.buildTicketData = this.buildTicketData.bind(this);

    $eventForm.on('submit', function (e) {
      e.preventDefault();
      this.onSubmit();
    }.bind(this));
  },

  onSubmit: function () {
    var $eventForm = $('#event-form');
    var formValidity;

    this.hideServerError();

    formValidity = this.validateForm($eventForm);
    this.toggleFormInputError(formValidity);

    if (!formValidity) {
      return;
    }

    this.setupAjax($eventForm);

    $.ajax({
      type: 'POST',
      url: '/store/cart/add',
      data: JSON.stringify(this.buildTicketData()),
      dataType: 'json',
      success: function (data) {
        if (!data.success) {
          var message = data.message;
          if (message){
            TICKETED_EVENTS.displayServerError(message);
          }
          return;
        }

        var item = data.item;
        var cart = data.cart;
        var quantityAdded = 1;

        TICKETED_EVENTS.updateCartCount(cart);
        TICKETED_EVENTS.updateAvailableInventory(quantityAdded);

        TICKETED_EVENTS.updateModal(item, quantityAdded);
        TICKETED_EVENTS.displayModal();
        TICKETED_EVENTS.resetForm();
      },
    });
  },

  triggerInventoryCheck: function () {
    $('#variant_id').trigger('change');
  },

  variantChangeListener: function () {
    $('#variant_id').on('change', function () {
      console.log('variant changed');
      var $selectedVariant = $(this).find('option:selected');
      TICKETED_EVENTS.checkVariantInventory($selectedVariant);
    });
  },

  checkVariantInventory: function ($selectedVariant) {
    var ticketsRemaining = $selectedVariant.attr('data-remaining');
    console.log(ticketsRemaining);
    TICKETED_EVENTS.toggleAddToCartButton(ticketsRemaining);
  },

  toggleAddToCartButton: function (ticketsRemaining) {
    var $button = $('#add-to-cart-button');

    if (ticketsRemaining <= 0) {
      $button.text('Currently Unavailable');
      $button.prop('disabled', true);
    } else {
      $button.text('Add Ticket To Cart');
      $button.prop('disabled', false);
    }
  },

  setupAjax: function ($eventForm) {
    var csrftoken = $eventForm.find($('input[name="csrfmiddlewaretoken"]')).val();
    $.ajaxSetup({
      beforeSend: function (xhr, settings) {
        // these HTTP methods do not require CSRF protection
        var csrfSafeMethod = (/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type));

        if (!csrfSafeMethod && !this.crossDomain) {
          xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
      },
    });
  },

  validateForm: function ($form) {
    var $requiredInputs = $form.find('.required-fields');

    var formValid = true;
    for (var i = 0; i < $requiredInputs.length; i++) {
      var $currentInput = $($requiredInputs[i]);
      var inputValidity = this.validateInput($currentInput);
      if (!inputValidity) { formValid = false; }
    }
    return formValid;
  },

  validateInput: function ($currentInput) {
    if ($currentInput.attr('type') === 'email') {
      var emailEntered = $currentInput.val();
      var emailValidity = this.validateEmail(emailEntered);
      if (!emailValidity) {
        $currentInput.addClass('error');
        return false;
      }
    } else if (!$currentInput.val()) {
      $currentInput.addClass('error');
      return false;
    }

    $currentInput.removeClass('error');
    return true;
  },

  validateEmail: function (email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  },

  toggleFormInputError: function (formValidity) {
    var $inputErrorMessage = $('#field-error-message');

    if (formValidity) {
      $inputErrorMessage.hide();
    } else {
      $inputErrorMessage.show();
    }
  },

  displayServerError: function (message) {
    var $errorContainer = $('#server-error-message');
    var formattedMessage = '<p>' + message + '</p>';
    $errorContainer.html(formattedMessage);
  },

  hideServerError: function () {
    var $errorContainer = $('#error-message');
    $errorContainer.empty();
  },

  updateAvailableInventory: function (quantitySelected) {
    var currentInventory = parseInt($('#variant_id option:selected').attr('data-remaining'));
    var newInventory = currentInventory - quantitySelected;
    $('#variant_id option:selected').attr('data-remaining', newInventory);
  },

  displayModal: function () {
    $('#added-to-cart').fadeIn();
  },

  resetModalText: function () {
    $('#added-to-cart .variant-details').html('');
  },

  closeModalListener: function () {
    $('#added-to-cart .remove').click(function (e) {
      e.preventDefault();
      $('#added-to-cart').fadeOut();
    });
  },

  updateModal: function (item, quantityAdded) {
    TICKETED_EVENTS.resetModalText();

    var name = item.name;
    var price = item.total;

    $('#variant-details').html(name);
    $('#item-price').html('$' + price);
    $('#item-quantity').html('Qty: ' + quantityAdded);
  },

  updateCartCount: function (cart) {
    var cartItems = cart.items;
    var cartCount = 0;
    for (var i = 0; i < cartItems.length; i++) {
      var currentItem = cartItems[i];
      var itemQuantity = currentItem.quantity;
      cartCount += itemQuantity;
    }

    $('.cart-icon span').text(cartCount);
  },

  buildTicketData: function () {
    var data = {};
    var ticket = {
      ticketed_event_id: $('#ticketed_event_id').val(),
      variant_id: $('#variant_id').val(),
      quantity: 1,
    };
    ticket.fields = this.getRequiredFieldInfo();
    data.tickets = [];
    data.tickets.push(ticket);
    return data;
  },

  resetForm: function () {
    $('#event-form').find('.required-fields').val('');
  },

  getRequiredFieldInfo: function () {
    var requiredFields = $('.required-fields');
    var requiredInfo = {};
    var fieldKey;
    var fieldValue;
    var currentField;

    for (var i = 0; i < requiredFields.length; i++) {
      currentField = $(requiredFields[i]);
      fieldKey = currentField.attr('name');
      fieldValue = currentField.val();
      requiredInfo[fieldKey] = fieldValue;
    }

    return requiredInfo;
  },
};
