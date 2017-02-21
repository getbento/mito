$(document).ready(function(){
    /**
     * IMPORTANT:
     * File names in this bundle are intentionally named with leading number (ie...00_, 01_, 02_) so that when 
     * Grunt concatentates them in the build process, they are compiled in order. This is very important because 
     * we need to ensure that both our Events and ProductConfigField are defined and ready before configuring 
     * our ProductConfig package – meaning, they are dependencies of this package. Please review the next few 
     * lines of code which are responsible for preparing our objects/dependencies.
     */

    // call the functions that create and attach our objects/dependencies to the `window`. Its very important to 
    // understand that by this point, the concatentation process has already run and included our files in the 
    // very specific order we need them in. (Events -> Fields -> Form)
    window.export_productconfig_events();
    window.export_productconfig_fields();

    // Now that our objects are attached to the `window` object, we are creating local shortcuts. The reason for 
    // this is to keep the implementation as familiar as possible across the different themes using this same 
    // implementation – Juno, Osaka, Sensei, etc. Common names make it easier to track down functional issues 
    // across all themes.
    var _EVENTS = window.Bento.ConfigurableProduct.Events;
    var ProductConfigField = window.Bento.ConfigurableProduct.Field;

    // ============================================================================================================
    // =============== PRODUCT FORM ===============================================================================
    // ============================================================================================================
    /**
     * The ProductConfigForm class is the main entry point to Configurable Products. This class is exposed as a 
     * singleton (because there is only ever one of these available per page) and is responsible for creating all 
     * the necessary components to make a Configurable Product form experience function properly. There are many 
     * components that make up Configurable Products, most notably Config Field Adapters, so it is recommended to 
     * read all the package documentation thoroughly before attempting to make any changes.
     *
     * Please note, because this class is exposed as a singleton, it is perfectly acceptable for it to find its 
     * own DOM node...because we're never creating more than one of either.
     * 
     * @constructor
     * @access public
     * @param {jQuery} $form - jQuery object representing the single `[data-product-config]` instance.
     */
    var ProductConfigForm = function($el){
        this.$el = $el;

        // placeholders: so we know what properties we will be creating
        this.model = null;
        this.components = {
            required_fields: [],
            prices: null,
            quantity: null,
            modal: null,
            message: null,
            submitbtn: null
        };
        
        // If we have a form, create the model and start it up!
        if (this.$el.length > 0){
            this.model = new Model(this.$el);
            this._init();
        }
    };

    ProductConfigForm.prototype = {

        /**
         * Initialize and startup. Creates all the necessary components. Please note, we must call `_immediatePreview()` 
         * last to guarentee all of our components are initialized and ready to handle dispatched events.
         * @access private
         */
        _init: function(){
            this._createRequiredFields();
            this._createPrice();
            this._createQuantity();
            this._createModal();
            this._createMessage();
            this._createSubmitBtn();
            this._immediatePreview(); // very important! must come last!
        },

        /**
         * Creates all of the `required_fields` that make up the Configurable Product experience. Please note, for a 
         * `ProductConfigField` to be added to the overall system, it MUST have a valid adapter.
         * @access private
         * @see ./_productconfigurable.requiredfields.js for more information.
         */
        _createRequiredFields: function(){
            var self = this;
            this.$el.find("[data-product-config-field]").each(function(index){
                var field = new ProductConfigField($(this), self.model);
                // add to model if an adapter was created successfully
                if (field.adapter){
                    self.model.addConfigField(field); // add it to the model
                    self.components.required_fields.push(field); // add it to our own internal cache...just in case.
                }
            });
        },

        /**
         * After all the components have been created, we need to check to see if any of our adapters require an 
         * immediate price preview request. The intention is – Dropdown Field Types use their first option as the default 
         * value. Although that option/value may effect the price (+/-), it is not included in the base price...and, to 
         * accurately reflect the current selections, we may need to make an immediate request.
         * @access private
         */
        _immediatePreview: function(){
            for (var i=0; i<this.components.required_fields.length; i++){
                var field = this.components.required_fields[i];
                if (field.adapter.requires_immediate_preview) this.model.preview();
            }
        },

        /**
         * Creates the `Prices` instance if applicable.
         * @access private
         */
        _createPrice: function(){
            var $prices = $(".price--single");
            if ($prices.length > 0) this.components.price = new Prices($prices, this.model);
        },

        /**
         * Creates the `Quantity` instance if applicable.
         * @access private
         */
        _createQuantity: function(){
            var $quantity = this.$el.find(".product-quantity").first();
            if ($quantity.length > 0) this.components.quantity = new Quantity($quantity, this.model);
        },

        /**
         * Creates the `Modal` instance if applicable.
         * @access private
         */
        _createModal: function(){
            var $modal = $("#added-to-cart").first();
            if ($modal.length > 0) this.components.modal = new Modal($modal, this.model);
        },

        /**
         * Creates the `Message` instance if applicable.
         * @access private
         */
        _createMessage: function(){
            var $message = this.$el.find(".product-config__message").first();
            if ($message.length > 0) this.components.message = new Message($message, this.model);
        },  

        /**
         * Creates the `SubmitButton` instance if applicable.
         * @access private
         */
        _createSubmitBtn: function(){
            var $submitbtn = this.$el.find("button[type='submit']").first();
            if ($submitbtn.length > 0) this.components.submitbtn = new SubmitButton($submitbtn, this.model);
        }
    };

    // ============================================================================================================
    // =============== MODEL ======================================================================================
    // ============================================================================================================
    /**
     * The Model class is responsible for keeping track of the state of various values, and when these values 
     * change – dispatching the appropriate events to notify all subscribing views that they need to update 
     * accordingly. This class is also responsible for making price preview requests and handling the actual form 
     * submission. There's a lot going on in this class (and a lot may seem unrelated), so please read the 
     * documentation of each method carefully before attempting to make changes. For an even better understanding, 
     * it is recommended and will be very helpful to read through the documentation of all the other package 
     * components as well to see how they are interacting and communicating with the model.
     * 
     * @constructor
     * @access internal
     * @param {jQuery} $form - jQuery object representing the single `form.product-config` instance.
     */
    var Model = function($form){
        this.$form = $form;
        this.$dispatcher = $("<div></div>");
        this._config_fields = [];
        
        this._quantity = 1;
        this._inventory = Number.MAX_VALUE;
        this._pricePerUnit = parseFloat($form.find("input[name='variant_base_price']").first().val());

        this._ajaxPrice = null;
        this._pricePreviewUrl = this.$form.data("product-config-preview-action");
        this._previewCount = 0;
        
        this._receipt = null;
        this._errorMessage = null;
    };

    Model.prototype = {

        /**
         * Sets the initial quantity and inventory values – originating from the `Quantity` class. This allows us 
         * to "prime" the model with real values instead of assuming `quantity=1` and having no value for inventory. 
         * Please note, we do not need to dispatch an event here because the other components don't need to know yet, 
         * and we can't yet be sure all components are ready to handle dispatched events.
         * @access public
         * @param {Int} quantity - The current quantity originating from the `Quantity` instance.
         * @param {Int} inventory - The current inventory originating from the `max` attribute of the `Quantity` instance.
         */
        setInitialQuantities: function(quantity, inventory){
            this._quantity = quantity;
            this._inventory = inventory;
        },

        /**
         * Adds a new `ProductConfigField` instance to our internal cache. This allows us to quickly and easily run 
         * operations on all instances – compiling json, validation, etc.
         * @access public
         * @param {ProductConfigField} field - A `ProductConfigField` instance with valid adapter.
         */
        addConfigField: function(field){
            this._config_fields.push(field);
        },

        /**
         * Makes a price preview AJAX request that takes all of the current user's selections and calculates the current 
         * price on-the-fly. Please note, the request endpoint is expecting data to be formatted as JSON – which is different 
         * than many other BentoBox endpoints. We also don't need a csrftoken because we are not attempting to alter data – 
         * instead, we are only trying to `GET` data.
         * @access public
         */
        preview: function(){
            var self = this;
            // kill any in-progress price preview requests. This is important because we can't guarentee the order the requests 
            // are returned – so older requests may be returned after newer requests. We are also setting a token to be matched 
            // later if and when the submissions complete.
            this._killRequestPrice();
            this._previewCount++;
            var previewToken = this._previewCount;

            // get the compiled "required_fields" json
            var json = this._getCompiledJSON();

            // notify all subscribing view that we are starting the price preview request.
            this.$dispatcher.trigger(_EVENTS.preview.init);

            // create and execute the request
            this._ajaxPrice = $.ajax({
                type: "post",
                url: this._pricePreviewUrl,
                data: JSON.stringify({ "required_fields": json }),
                contentType: "application/json",
                dataType: "json",
                success: function(data) {
                    // only update if the captured token matches the model's previewCount. If they are different, this callback 
                    // is being envoked from an older (not the most current) request.
                    if (previewToken == self._previewCount){
                        if (data.hasOwnProperty("final_price")){
                            self.setPricePerUnit(parseFloat(data.final_price));
                        }
                        // dispatch events
                        self.$dispatcher.trigger(_EVENTS.preview.complete);
                        self.$dispatcher.trigger(_EVENTS.preview.success);
                    }
                },
                error: function(){
                    // only update if the captured token matches the model's previewCount. If they are different, this callback 
                    // is being envoked from an older (not the most current) request.
                    if (previewToken == self._previewCount){
                        self.$dispatcher.trigger(_EVENTS.preview.complete);
                        self.$dispatcher.trigger(_EVENTS.preview.error);
                    }
                }
            });
        },

        /**
         * Makes and executes the actual form submission via AJAX. Please note, the request endpoint is expecting data to be 
         * formatted as JSON – which is different than many other BentoBox endpoints. To format this correctly, are NOT utilizing 
         * the form itself (ie...$form.submit()) – instead we are creating a separate AJAX request by collecting all the necessary 
         * inputs into a `data` object that will be submitted as json instead. This also means that our `csrftoken` can't be 
         * submitted as an `<input>` and instead needs to be added as a `x-CSRFToken` RequestHeader.
         * @access public
         */
        submit: function(){
            // must be valid to submit the form.
            if (this._getIsValid()){
                var self = this;
                // reset the receipt and error messages.
                this._receipt = null;
                this._errorMessage = null;

                // gather all the required inputs (and values) and capture them in a single object so we can submit this as json instead.
                var data = {
                    product_id: parseInt(this.$form.find("input[name='product_id']").first().val()),
                    variant_id: parseInt(this.$form.find("input[name='variant_id']").first().val()),
                    quantity: this._quantity,
                    required_fields: this._getCompiledJSON()
                };

                // notify all subscribing view that we are starting the price preview request.
                this.$dispatcher.trigger(_EVENTS.submit.init);

                // create and execute the request
                $.ajax({
                    type: this.$form.attr("method"),
                    url: this.$form.attr("action"),
                    data: JSON.stringify(data),
                    contentType: "application/json",

                    // we need to add the `csrftoken` as a RequestHeader due to our json payload format.
                    beforeSend: function(xhr, settings){
                        var csrftoken = self.$form.find("input[name='csrfmiddlewaretoken']").first().val();
                        var csrfSafeMethod = (/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type));

                        if (!csrfSafeMethod && !this.crossDomain) {
                          xhr.setRequestHeader("X-CSRFToken", csrftoken);
                        }
                    },

                    // Its possible that a response returns `status=200` even though the form submission has failed...so, we need to check 
                    // the actual `data.success` value. Please note, BentoBox responses can be `true` or "true", so we need to explicitly 
                    // check for both data types to accurately capture a successful response.
                    success: function(data, textStatus){
                        if (data.success == "true" || data.success == true){
                            var quantityAdded = parseInt(data.quantity_added);
                            // track it!
                            window.TRACKING.sendEvent("Add To Cart", "Click", "eCom", quantityAdded);

                            // create receipt
                            self._receipt = new Receipt(self._pricePerUnit, quantityAdded, self.getPriceFormatted(true));
                            for (var i=0; i<self._config_fields.length; i++){
                                var field = self._config_fields[i];
                                var prettyName = field.prettyName;
                                var prettyValue = field.getPrettyValue(false);
                                if (prettyValue) self._receipt.addOption(prettyName, prettyValue);
                            }

                            // set cart button
                            window.STORE.updateCartCount(data.cart);

                            // update inventory: will auto-update quantity if necessary.
                            self.setInventory(self.getInventory() - quantityAdded);
                            
                            // update quantity
                            self.setQuantity(self.getQuantity());

                            // dispatch complete/success events
                            self.$dispatcher.trigger(_EVENTS.submit.complete);
                            self.$dispatcher.trigger(_EVENTS.submit.success);   
                        }

                        // if the truthy check fails, we have an error of some sort...
                        else {
                            // this is a little ugly, but its the only way to check if its an inventory error. BentoBox won't allow a
                            // user to add items to their cart if the quantity is higher than the available stock (on the server side),
                            // so, we need to check. Unfortunately, once we've determined its an inventory problem, there's no way to
                            // tell a user exactly how many items are actually in stock...so we pop a relatively generic message.
                            var isInventoryError = (data.error && 
                                                    data.error.__all__ && 
                                                    data.error.__all__.length > 0 && 
                                                    data.error.__all__[0] == "There is not enough inventory left.");

                            // If its an inventory error, we want to show our inventory error message. If not, a generic message. I'm
                            // not sure what the use-cases are for the generic message, but we're including it just in case.
                            self._errorMessage = (isInventoryError) 
                                ? "There is not enough inventory left to complete your order. Please try again." 
                                : "An error occurred while placing your order. Please try again."; 

                            // dispatch complete/error events.
                            self.$dispatcher.trigger(_EVENTS.submit.complete);
                            self.$dispatcher.trigger(_EVENTS.submit.error);
                        }
                    },
                    // If the request outright failed...
                    error: function(xhr, status, error){
                        // set a generic error message
                        self._errorMessage = "An error occurred while placing your order. Please try again.";
                        // dispatch complete/error events.
                        self.$dispatcher.trigger(_EVENTS.submit.complete);
                        self.$dispatcher.trigger(_EVENTS.submit.error);
                    }
                });
            }
            else {
                this._errorMessage = "Please fix the invalid fields and try again.";
                this.$dispatcher.trigger(_EVENTS.submit.error);
            }
        },

        /**
         * Sets the quantity. First, the value is normalized so it can't be more than the inventory. This also attempts to set the 
         * value to "at least 1" unless "1" is higher than the current inventory. If a change occurs, dispatch a change event to 
         * all subscribing views.
         * @access public
         * @param {Int} value - The current quantity.
         */
        setQuantity: function(value){
            var value = (this._inventory <= 0) ? 0 : Math.min(this._inventory, value, Math.max(1, value));
            if (this._quantity != value){
                this._quantity = value;
                this.$dispatcher.trigger(_EVENTS.quantity.change);
            }
        },

        /**
         * Gets the current quantity.
         * @access public
         * @returns {Int} The current normalized quantity.
         */
        getQuantity: function(){
            return this._quantity;
        },

        /**
         * Sets the inventory. If a change occurs, dispatch a change event to all subscribing views. Also, if the current quantity 
         * is higher than the current inventory, update the quantity too!
         * @access public
         * @param {Int} value - The current inventory.
         */
        setInventory: function(value){
            if (this._inventory != value){
                this._inventory = value;
                this.$dispatcher.trigger(_EVENTS.inventory.change);
                // if quantity is higher than inventory...
                if (this._quantity > this._inventory) this.setQuantity(this._inventory);
            }
        },

        /**
         * Gets the current inventory.
         * @access public
         * @returns {Int} The current normalized quantity.
         */
        getInventory: function(){
            return this._inventory;
        },

        /**
         * Sets the current price-per-unit (single). Please note, we also have to check if this is a valid number because it could be 
         * a string – "0.00". Hopefully, we've ensured that is isn't before calling this method, but just in case.
         * @access public
         * @param {Number} value - The current price-per-unit (1.25).
         */
        setPricePerUnit: function(value){
            if (!isNaN(value) && this._pricePerUnit != value){
                this._pricePerUnit = value; 
                this.$dispatcher.trigger(_EVENTS.price.change);           
            }
        },

        /**
         * Gets the current price formatted as `$1.00` – optionally multiplying the price by the current quantity.
         * @access public
         * @param {Boolean} useQuantity - true if you want to multiple pricePerUnit by quantity, false if you only want single pricePerUnit.
         * @returns {String} Formatted price with dollar sign and two decimal places.
         */
        getPriceFormatted: function(useQuantity){
            var price = this._pricePerUnit;
            price *= (useQuantity) ? this._quantity : 1;
            return ("$" + price.toFixed(2));
        },

        /**
         * Gets the current `Receipt` instance that was created on the last successful submit request. Please note, when new requests are 
         * created, the `Receipt` instance gets reset to `null`.
         * @access public
         * @returns {Receipt} The `Receipt` instanced created on the last successful submit request. If no request was made, or the last 
         *                    request failed, this will return `null`.
         */
        getReceipt: function(){
            return this._receipt;
        },

        /**
         * Gets the current error message generated by `submit()` if applicable. If the last request did not result in an error, this will 
         * return `null`.
         * @access public
         * @returns {String} Error message resulting from the last failed submit request. Or `null` if the last request was successful or 
         *                   no requests have been executed yet. 
         */
        getErrorMessage: function(){
            return this._errorMessage;
        },

        /**
         * Before each preview request, we want to kill any in-progress requests. This is because we can't guarentee the order that responses 
         * are returned. For example, if you clicked a bunch of options quickly – you'd generate a bunch of requests. But, its possible that 
         * older requests are returned AFTER newer requests – which would ultimately result in showing the incorrect price. So, we need to 
         * make sure we're killing the previous requests so this doesn't happen. Please note, in the `preview()` method, we're also creating 
         * a previewCount/token that guarentees that we only update based on the newest request.
         * @access private
         */
        _killRequestPrice: function(){
            if (this._ajaxPrice && this._ajaxPrice.readyState != 4) this._ajaxPrice.abort();
            this._ajaxPrice = null;
        },

        /**
         * Very simple validation of each "required_field". Basically, we're just checking that none of the max values have been exceeded – 
         * though this shouldn't be possible via the UI. But, just in case, we're checking to make sure all fields are valid before allowing 
         * the `submit()` ajax request to proceed.
         * @access private
         * @returns {Boolean} true if all "required_fields" are valid. false if not.
         */
        _getIsValid: function(){
            var valid = true;
            for (var i=0; i<this._config_fields.length; i++){
                if (!this._config_fields[i].getValid()) valid = false;
            }
            return valid;
        },

        /**
         * Loops through all the "required_fields", gathers their individual JSON values, and compiles them into a single JSON object. This 
         * object is then used to populate the AJAX requests `data` property.
         * @access private
         * @returns {Object} The individual "required_fields" json combined into a single json object.
         */
        _getCompiledJSON: function(){
            var json = {};
            for (var i=0; i<this._config_fields.length; i++){
                var field = this._config_fields[i];
                json = $.extend(json, field.getJSON());
            }
            return json;
        }
    };

    // ============================================================================================================
    // =============== COMPONENT : PRODUCT QUANTITY ===============================================================
    // ============================================================================================================
    /**
     * The Quantity class represents the single `ProductConfigForm` `.product-quantity` element and is responsible 
     * for updating the model and responding to the appropriate change events. Please note, this class utilizes the 
     * `[data-incrementer]` component, so the markup must be configured correctly for this to work.
     * 
     * @constructor
     * @access internal
     * @param {jQuery} $el - jQuery object representing the single `.product-quantity` instance.
     * @param {Model} model - The `ProductConfigForm` shared model instance.
     */
    var Quantity = function($el, model){
        this.$el = $el;
        this.$input = this.$el.find("input[name='quantity']").first();
        this.model = model;

        this._init();
    };

    Quantity.prototype = {

        /**
         * Initialize and startup. Also sets initial quantity variables on the model so it is correctly "primed".
         * @access private
         */
        _init: function(){
            this._subscribeToInput();
            this._subscribeToModel();
            this._setInitialValues();
        },

        /**
         * Listens to the `<input>` for changes and notifies the model so it updates and dispatches the appropriate 
         * change events (when applicable).
         * @access private
         */
        _subscribeToInput: function(){
            var self = this;
            this.$input.on("change", function(e){
                self.model.setQuantity(parseInt($(this).val()));
            });
        },

        /**
         * Listens to the model for "quantity change" events and updates accordingly. Please note, we are checking 
         * that the model's value does not equal the input's value before updating so that we don't end up with a 
         * potentially infinite loop.
         * @access private
         */
        _subscribeToModel: function(){
            var self = this;
            this.model.$dispatcher.on(_EVENTS.quantity.change, function(e){
                var quantity = self.model.getQuantity();
                var curVal = parseInt(self.$input.val());

                // update min/max based on current quantity and inventory
                self.$input.attr("min", (quantity == 0) ? 0 : 1).attr("max", self.model.getInventory());

                // if the model's value doesn't equal the input's current value, update it and manually dispatch a 
                // change event so the +/- buttons update accordingly.
                if (quantity != curVal) self.$input.val(quantity).change();
            });
        },

        /**
         * On startup, we need to "prime" the model with the current quantity and inventory values. Otherwise, we 
         * would have to assume `quantity=1` and `inventory=???` doesn't really matter yet. Its just better (and 
         * safer) to explicitly set these values.
         * @access private
         */
        _setInitialValues: function(){
            var quantity = parseInt(this.$input.val());
            var inventory = parseInt(this.$input.attr("max"));
            this.model.setInitialQuantities(quantity, inventory);
        }
    };

    // ============================================================================================================
    // =============== COMPONENT : SUBMIT BUTTON ==================================================================
    // ============================================================================================================
    /**
     * The SubmitButton class represents the single `ProductConfigForm` `<button type="submit">` and is responsible 
     * for enabling/disabling updating the button's message when necessarily. 
     * 
     * @constructor
     * @access internal
     * @param {jQuery} $el - jQuery object representing the single `<button type="submit">` instance.
     * @param {Model} model - The `ProductConfigForm` shared model instance.
     */
    var SubmitButton = function($el, model){
        this.$el = $el;
        this.model = model;
        this._defaultLabel = this.$el.text();

        this._init();
    };

    SubmitButton.prototype = {

        /**
         * Initialize and startup.
         * @access private
         */
        _init: function(){
            this._subscribeToBtn();
            this._subscribeToModel();
        },

        /**
         * Listens to the button element for click events, and notifies the model that we need to 
         * submit our form.
         * @access private
         */
        _subscribeToBtn: function(){
            var self = this;
            this.$el.click(function(e){
                e.preventDefault();
                self.model.submit();
            });
        },

        /**
         * Listens to the model for various "submit events" and updates accordingly.
         * @access private
         */
        _subscribeToModel: function(){
            var self = this;

            // when a form submission request is started...
            this.model.$dispatcher.on(_EVENTS.submit.init, function(e){
                self.$el.prop("disabled", true);
                self.$el.text("Adding...");
            })
            // when a form submission request is completed...(does not matter if an error occurred)
            .on(_EVENTS.submit.complete, function(e){
                // If we have remaining inventory, turn the button back and and show the default "Add To Cart" label.
                if (self.model.getInventory() > 0){
                    self.$el.prop("disabled", false);
                    self.$el.text(self._defaultLabel);
                }
                // If there is no more inventory available, ensure the button is disabled and showing the 
                // "Out of Stock" message.
                else {
                    self.$el.prop("disabled", true);
                    self.$el.text("Currently Unavailable");
                }
            });
        }
    };

    // ============================================================================================================
    // =============== COMPONENT : PRODUCT MESSAGE ================================================================
    // ============================================================================================================
    /**
     * The Message class represents the single `ProductConfigForm` `.product-config__message` element that is 
     * responsible for updating and displaying the various error messages that may result from unsuccessful form 
     * submission.
     * 
     * @constructor
     * @access internal
     * @param {jQuery} $el - jQuery object representing the single `.product-config__message` instance.
     * @param {Model} model - The `ProductConfigForm` shared model instance.
     */
    var Message = function($el, model){
        this.$el = $el;
        this.model = model;

        this._init();
    };

    Message.prototype = {

        /**
         * Initialize and startup.
         * @access private
         */
        _init: function(){
            this._subscribeToModel();
        },

        /**
         * Listens for various "submit events" and updates accordingly.
         * @access private
         */
        _subscribeToModel: function(){
            var self = this;
            var evts = _EVENTS.submit.init + " " + _EVENTS.submit.error;
            this.model.$dispatcher.on(evts, function(e){
                self._update();
            });
        },

        /**
         * Updates the message element's message and visibility based on whether the model's error message is 
         * currently defined. Meaning, if its defined – we set and show it. If its not defined – we reset and hide it.
         * @access private
         */
        _update: function(){
            var msg = this.model.getErrorMessage();
            this.$el.text((msg) ? msg : "");
            this.$el.toggleClass("product-config__message--show", (msg) ? true : false);
        }
    };

    // ============================================================================================================
    // =============== COMPONENT : PRICES =========================================================================
    // ============================================================================================================
    /**
     * The Prices class represents all `.price--single` instances on this page and is responsible for updating each 
     * when necessary. Please note, `.price--single` instances always represent a single price-per-unit and are not 
     * multiplied by the quantity. (ie...this is not a total purchase price)
     *     
     * Also, `.price` elements are not technically "in the <form>", but it is part of the functionality...so, we're 
     * adding it to this file for clarity and convenience. 
     * 
     * @constructor
     * @access internal
     * @param {jQuery} $els - jQuery object representing all `.price--single` instances.
     * @param {Model} model - The `ProductConfigForm` shared model instance.
     */
    var Prices = function($els, model){
        this.$els = $els;
        this.model = model;

        this._init();
    };

    Prices.prototype = {

        /**
         * Initialize and startup.
         * @access private
         */
        _init: function(){
            this._subscribeToModel();
            this._update();
        },

        /**
         * Listens to the model for various events and updates accordingly.
         * @access private
         */
        _subscribeToModel: function(){
            var self = this;
            // when a preview request is started...
            this.model.$dispatcher.on(_EVENTS.preview.init, function(e){
                self._showPending();
            })
            // when a preview request completes successfully...
            .on(_EVENTS.preview.success, function(e){
               self._update();
            })
            // when a preview request results in an error...
            .on(_EVENTS.preview.error, function(e){
                self._showError();
            });
        },

        /**
         * Changes all price elements while a preview request is pending. This allows the user to get a little 
         * bit of feedback that something is "happening" or is "in progress".
         * @access private
         */
        _showPending: function(){
            this.$els.text("Updating...");
        },

        /**
         * Updates all price instances with the current formatted price-per-unit. Generally occurs only after a 
         * successful preview request has completed. Please note, excluding the `this.model.getPriceFormatted()` 
         * parameter gets only the  single `pricePerUnit` price – not including the quantity multiplier.
         * @access private
         */
        _update: function(){
            this.$els.text(this.model.getPriceFormatted()); // doesn't include quantity
        },

        /**
         * Shows a generic error message when the preview request fails. The next successful request will replace 
         * this message.
         * @access private
         */
        _showError: function(){
            this.$els.text("Error Occurred while updating price. Please try again.");
        }
    };

    // ============================================================================================================
    // =============== COMPONENT : MODAL ==========================================================================
    // ============================================================================================================
    /**
     * The Modal class represents the modal window that pops up after a succesful "Add To Cart", and displays all 
     * the user's selections, total price, images, etc. Please note, Juno uses Bootstrap's modal component and is 
     * automatically initialized via `window.STORE.initialize()`. Also, the Modal element is not technically "in 
     * the <form>", but it is part of the functionality...so, we're adding it to this file for clarity and 
     * convenience.
     * 
     * @constructor
     * @access internal
     * @param {jQuery} $el - jQuery object representing a single `#added-to-cart.modal` instance.
     * @param {Model} model - The `ProductConfigForm` shared model instance.
     */
    var Modal = function($el, model){
        this.$el = $el;
        this.model = model;
        this.$options = this.$el.find(".options").first();
        this.$price = this.$el.find(".price").first();

        this._init();
    };

    Modal.prototype = {

        /**
         * Initialize and startup.
         * @access private
         */
        _init: function(){
            this._subscribeToModel();
        },

        /**
         * Listens to the model for "submit success" event and updats accordingly.
         * @access private
         */
        _subscribeToModel: function(){
            var self = this;
            this.model.$dispatcher.on(_EVENTS.submit.success, function(e){
                self._update();
            });
        },

        /**
         * Updates and shows the modal immediately after a successful "add to cart" action. Please note, this 
         * method retrieves the model's `Receipt` instance which contains a snapshot of the successful order and 
         * all the necessary data to render the modal.
         * @access private
         */
        _update: function(){
            var receipt = this.model.getReceipt();
            this.$options.html(receipt.getOptionsFormatted());
            this.$price.text(receipt.getTotalPriceFormatted());
            this.$el.fadeIn();
        }
    };

    // ============================================================================================================
    // =============== COMPONENT : RECEIPT ========================================================================
    // ============================================================================================================
    /**
     * The Receipt class used as a helper/utility class. Once a product/variant has been successfully added to a 
     * user's cart, all of the relevant "order" information (that will later be displayed in the modal window) is 
     * captured and saved in a Receipt object – essentially, the Receipt object is a "snapshot" of the user's last
     * successful order. This allows the modal window to easily retrieve the Receipt and use its values to populate 
     * itself.
     * 
     * @constructor
     * @access internal
     * @param {String} pricePerUnit - The current variant's price...not (yet) a total price.
     * @param {Int} quantityAdded - The data.quantityAdded returned by the successful order submission/request.
     * @param {String} totalPrice - Formatted price-per-unit multiplied by the quantityAdded. ("$27.25")
     */
    var Receipt = function(pricePerUnit, quantityAdded, totalPrice){
        this.pricePerUnit = pricePerUnit || "$0.00";
        this.quantityAdded = quantityAdded || 0;
        this.totalPrice = totalPrice || "$0.00";
        this.options = [];
    };

    Receipt.prototype = {

        /**
         * Adds and stores a user's selection per field/option, allowing us to do further formatting/processing
         * on-demand from our getters.
         * @access public
         * @param {String} name - The proper name (not the slug) provided for a Field type.
         * @param {String} choice - The proper value of a provided by the Field type's adapter.
         */
        addOption: function(name, choice){
            this.options.push({ "name" : name, "choice" : choice });
        },

        /**
         * Returns the formatted total price. This method is provided to make it a little clearer (per the method 
         * name) that it is a FORMATTED price.
         * @access public
         * @returns {String} Formatted price-per-unit multiplied by the quantityAdded. ("$27.25")
         */
        getTotalPriceFormatted: function(){
            return this.totalPrice;
        },

        /**
         * Returns a formatted version of all of a user's option selections to be displayed in the modal window.
         * @access public
         * @returns {String} Formatted set of options (Name: Choice)
         */
        getOptionsFormatted: function(){
            var arr = [];
            // loop through all of the options, format each name/choice pair, and push it into our array.
            for (var i=0; i<this.options.length; i++){
                var opt = this.options[i];
                arr.push(opt.name + ": " + opt.choice);
            }
            // add our quantity as a pseudo-option (for display purposes only)
            arr.push("Qty: " + this.quantityAdded);
            // Join the elements with a <br>, enabling each option to be on its own line.
            return arr.join("<br>");
        }
    };

    // Startup! If we find a `[data-product-config]` instance, its ok to create our `ProductConfigForm`! We're also 
    // pushing everything to the bottom of the call stack to ensure everything else has properly loaded.
    setTimeout(function(){
        var $form = $("[data-product-config]").first();
        var from = ($form.length > 0) ? new ProductConfigForm($form) : null;
    }, 0);

});
