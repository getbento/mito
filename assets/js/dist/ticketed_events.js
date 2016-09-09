TICKETED_EVENTS = {
  initialize: function () {
    var $eventForm = $('#event-form');
    this.closeModalListener();
    this.onSubmit = this.onSubmit.bind(this);
    this.buildTicketData = this.buildTicketData.bind(this);

    $eventForm.on('submit', function (e) {
      e.preventDefault();
      this.onSubmit();
    }.bind(this));
  },

  onSubmit: function () {
    var $eventForm = $('#event-form');
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

    $.ajax({
      type: 'POST',
      url: '/store/cart/add',
      data: JSON.stringify(this.buildTicketData()),
      dataType: 'json',
      success: function (data) {
        if (!data.success) {
          return;
        }
        console.log(data);
        var item = data.item;
        var cart = data.cart;
        var quantityAdded = 1;

        TICKETED_EVENTS.updateCartCount(cart);
        TICKETED_EVENTS.updateAvailableInventory(quantityAdded);

        TICKETED_EVENTS.updateModal(item, quantityAdded);
        TICKETED_EVENTS.displayModal();
      },
    });
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
    console.log(price);


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
