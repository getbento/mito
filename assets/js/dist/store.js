STORE = {
  options: {},

  initialize: function(options) {
    STORE.setInitialOptions(options);

    STORE.closeModalListener();
    STORE.addToCartListener();

    var form = document.getElementById('product-form');

    if (STORE.hasOptionsDropdown(form)) {
      STORE.addOptionsDropdownListener(form);
      STORE.triggerOptionsChange();
    }

    if (STORE.hasQuantities()) {
      STORE.addQuantityListener(form);
      STORE.triggerQuantityChange();
    } else {
      var allVariants = $('.hidden option');
      var $currentForm = $(form);
      allVariants.each(function() {
        var variant = $(this);
        STORE.checkVariantAvailability(variant, 1, $currentForm);
      });
    }
  },

  triggerOptionsChange: function() {
    $('select.options-dropdown').trigger('change');
  },

  triggerQuantityChange: function() {
    $('.qty').trigger('change');
  },

  hasOptionsDropdown: function(form) {
    return !!($(form).find('select.options-dropdown').length);
  },

  hasQuantities: function() {
    return STORE.options.hasQuantities;
  },

  setInitialOptions: function(options) {
    Object.keys(options).forEach(function(key) {
      STORE.options[key] = options[key];
    });
  },

  addQuantityListener: function(form) {
    //Update Variants When the Quantity Changes
    $(form).find('.qty').change(function() {
      var $dropDowns = $(this).closest('form').find('select.options-dropdown');
      var $form = $(form);
      if ($dropDowns.length) {
        STORE.filterVariants($form);
      } else {
        //If no dropdown then there is only 1 variant and inventory can be checked immediately.
        var quantitySelected = $(this).val() || 1;
        var selected_variant = $(this).parents('form').find('#variant option');
        STORE.checkVariantAvailability(selected_variant, quantitySelected, $form);
      }
    });
  },

  addOptionsDropdownListener: function(form) {
    $(form).find('select.options-dropdown').change(function() {
      var $form = $(form);
      STORE.filterVariants($form);
    });
  },

  addToCartListener: function() {
    $('#submit').click(function(e) {
      var $form = $(e.currentTarget).parents('form');
      var quantitySelected = STORE.quantitySelected($form);

      STORE.addToCart(e, quantitySelected);
    });
  },

  closeModalListener: function() {
    $('#added-to-cart .remove').click(function(e) {
      e.preventDefault();
      $('#added-to-cart').fadeOut();
    });
  },

  quantitySelected: function($form) {
    if (STORE.hasQuantities()) {
      return $form.siblings('.qty').val();
    } else {
      return 1;
    }
  },

  filterVariants: function($currentForm) {
    var possible_variants = $('select#variant option');
    var quantitySelected = STORE.quantitySelected($currentForm);


    var $selectedOptions = $currentForm.find('select.options-dropdown option:selected');
    $selectedOptions.each(function() {
      var $selectedOption = $(this);
      var selector = '[data-option-' + $selectedOption.attr('data-slug') + '="' + $selectedOption.val() + '"]';
      possible_variants = possible_variants.filter(selector);
    });

    STORE.checkVariantAvailability(possible_variants, quantitySelected, $currentForm);
  },

  checkVariantAvailability: function(selected_variant, quantitySelected, $currentForm) {
    var $cartButton;
    var $quantityInput = $currentForm.find('input[name="quantity"]');

    if (selected_variant.length === 1) {
      var variantInventory = parseInt(selected_variant.attr('data-inventory'));

      if (variantInventory === 0 || variantInventory < quantitySelected) {
        $cartButton = $currentForm.find('#submit');
        $cartButton.text('Out of Stock');
        STORE.disableButton($cartButton);
        STORE.disableQuantityInput($quantityInput);
      } else {
        var variantValue = selected_variant.first().val();
        var $hiddenVariantSelect = selected_variant.parents('select');
        $hiddenVariantSelect.val(variantValue);

        //Required to Work with HTML5 data-incrementer inputs
        STORE.enableQuantityInput($quantityInput, variantInventory);

        $cartButton = $currentForm.find('#submit');
        STORE.activateButton($cartButton);
      }
    $('.price').text('$' + selected_variant.attr('data-price'));
    } else {
      $cartButton = $currentForm.find('#submit');
      $cartButton.text('Currently Unavailable');
      STORE.disableButton($cartButton);
      STORE.disableQuantityInput($quantityInput);
    }
  },

  disableQuantityInput: function($quantityInput){
    $quantityInput.val(0).attr({'min': 0, 'max': 0});
  },

  enableQuantityInput: function($quantityInput, variantInventory){
    $('.btn-number').removeAttr('disabled');

    if($quantityInput.val() == 0 || $quantityInput.val() == 1){
      $quantityInput.val(1);
      $('.btn-number[data-type="minus"]').attr('disabled', 'disabled')
    }else if($quantityInput.val() > variantInventory){
      $quantityInput.val(variantInventory);
      $('.btn-number[data-type="plus"]').attr('disabled', 'disabled')
    }
    $quantityInput.attr({'min': 1, 'max': variantInventory});
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
        if (data.success === true) {
          var item = data.item;
          var cart = data.cart;
          var quantityAdded = data.quantity_added;

          STORE.updateCartCount(cart);
          STORE.activateButton($button);
          STORE.updateAvailableInventory(quantityAdded);


          $('select.options-dropdown').trigger('change');

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
    var totalAdded = '$' + (parseFloat(item.unit_price) * quantityAdded).toFixed(2);
    var options = item.variant.options;
    var $contentDiv = $('#added-to-cart .options');

    $('#item-name').html(name);
    $('#added-to-cart .price').text(totalAdded);

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
