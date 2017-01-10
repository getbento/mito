STORE = {
  initialize: function() {
    STORE.closeModalListener();

    //Update Variants When An Option is Changed
    $('.options-dropdown').change(function() {
      var $dropdown = $(this);
      STORE.filterVariants($dropdown);
    });

    $('.options-dropdown').trigger('change');

    STORE.addToCartListener();
  },

  addToCartListener: function() {
    $('form#product-form button').click(function(e) {
      var quantitySelected = 1;
      STORE.addToCart(e, quantitySelected);
    });
  },

  closeModalListener: function() {
    $('#added-to-cart .remove').click(function(e) {
      e.preventDefault();
      $('#added-to-cart').fadeOut();
    });
  },

  filterVariants: function($dropdown) {
    var possible_variants = $('select#variant option');
    // possible_variants.removeAttr('selected');
    var quantitySelected = 1;

    $('select.options-dropdown option:selected').each(function() {
      var $selectedOption = $(this);
      possible_variants = possible_variants.filter('[data-option-'+$selectedOption.attr('data-slug')+'="'+$selectedOption.val()+'"]');
    });

    STORE.checkVariantAvailability($dropdown, possible_variants, quantitySelected);
  },

  checkVariantAvailability: function($dropdown, possible_variants, quantitySelected) {
    var $cartButton;

    if (possible_variants.length == 1) {
      var variantInventory = parseInt(possible_variants.attr('data-inventory'));

      if (variantInventory === 0 || variantInventory < quantitySelected) {
        $cartButton = $dropdown.parents('form').find('button');
        $cartButton.text('Out of Stock');
        STORE.disableButton($cartButton);
      }else {
        var variantValue = possible_variants.first().val();
        // console.log('Variant:');
        // console.log(variantValue);

        $('select#variant').val(variantValue);
        //  console.log('select#variant.val():');
        // console.log($('select#variant').val());

        $cartButton = $dropdown.parents('form').find('button');
        STORE.activateButton($cartButton);
      }

      $('.price').text("$" + possible_variants.attr('data-price'));
    } else {
      $cartButton = $dropdown.parents('form').find('button');
      $cartButton.text('Currently Unavailable');
      STORE.disableButton($cartButton);
    }
  },

  addToCart: function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    var $button = $(e.currentTarget);
    $button.text('Adding...');
    var frm = $button.parent();

    STORE.disableButton($button);
    STORE.clearError();

    $.ajax({
      type: frm.attr('method'),
      url: frm.attr('action'),
      data: frm.serialize(),
      success: function(data) {
        STORE.activateButton($button);
        if (data.success === true) {
          var item = data.item;
          var cart = data.cart;
          var quantityAdded = data.quantity_added;

          STORE.updateCartCount(cart);
          STORE.activateButton($button);
          STORE.updateAvailableInventory(quantityAdded);

          $('.options-dropdown').trigger('change');

          STORE.updateModal(item, quantityAdded);
          STORE.displayModal();
          // track it!
          window.TRACKING.sendEvent("Add To Cart", "Click", "eCom", parseInt(quantityAdded));
        } else if (data.success === false) {
          STORE.displayError(data.message);
        }
      },
    });
  },

  displayError: function(errorMessage) {
    var errorContainer = $('#errorContainer');
    errorContainer.html(errorMessage);
    errorContainer.fadeIn();
  },

  clearError: function() {
    var errorContainer = $('#errorContainer');
    errorContainer.html('');
    errorContainer.hide();
  },

  updateModal: function(item, quantityAdded) {
    STORE.resetModalText();

    var name = item.name;
    var options = item.variant.options;
    var $contentDiv = $('#added-to-cart .options');

    $('#item-name').html(name);

    for (var i = 0; i < options.length; i++) {
      var optionName = options[i].name;
      var optionChoice = options[i].choice;
      var optionHtml = optionName + ': ' + optionChoice + '<br>';
      $contentDiv.append(optionHtml);
    }

    STORE.setModalQuantityText($contentDiv, quantityAdded);
  },

  setModalQuantityText: function($contentDiv, quantityAdded) {
    $contentDiv.append('Qty: ' + quantityAdded);
  },

  updateAvailableInventory: function(quantitySelected) {
    var currentInventory = parseInt($('form#product-form #variant option:selected').attr('data-inventory'));
    var newInventory = currentInventory - quantitySelected;
    $('form#product-form #variant option:selected').attr('data-inventory', newInventory);
  },

  updateCartCount: function(cart) {
    var cartItems = cart.items;
    var cartCount = 0;
    for (var i = 0; i < cartItems.length; i++) {
      var currentItem = cartItems[i];
      var itemQuantity = currentItem.quantity;
      cartCount += itemQuantity;
    }

    $('.cart-icon span').text(cartCount);
  },

  activateButton: function($button) {
    $button.text('Add To Cart').removeAttr('disabled');
  },

  disableButton: function($button) {
    $button.attr('disabled', '');
  },

  displayModal: function() {
    $('#added-to-cart').fadeIn();
  },

  resetModalText: function() {
    $('#added-to-cart .options').html('');
  },
};
