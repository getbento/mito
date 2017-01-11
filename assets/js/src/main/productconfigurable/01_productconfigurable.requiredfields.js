
function export_productconfig_fields(){

    // capture events object to our shortcut variable. The reason for this is to keep the implementation as familiar 
    // as possible across the different themes using this same implementation – Juno, Osaka, Sensei, etc. Common names 
    // make it easier to track down functional issues across all themes.
    var _EVENTS = window.Bento.ConfigurableProduct.Events;

    // ============================================================================================================
    // =============== FIELD ======================================================================================
    // ============================================================================================================
    /**
     * The ProductConfigField is primarily an abstract "wrapper" that contains the different Field Type Adapters. 
     * This allows us to have one `ProductConfigField` instance per requested Field Type without overcomplicating 
     * the communication between the Model and field types. 
     * 
     * Please note, the Adapters are where the real magic happens by providing a common API available to its 
     * parent `ProductConfigField` instance. This means our class doesn't have to care at all about what type of 
     * Field Type it contains. Please read more about the Adapter API below.
     *
     * @constructor
     * @access public
     * @param {jQuery} $el - A jQuery object representing a single `[data-product-config-field` element.
     */
    var ProductConfigField = function($el, model){
        this.$el = $el;
        this.model = model;
        this.type = this.$el.data("product-config-field") || null;
        this.$message = this.$el.find(".product-config-field__message").first();
        // Normalize the max value to a valid integer...if possible
        this.max = this.$el.data("product-config-field-max") || null;
        this.max = (this.max && !isNaN(this.max)) ? parseInt(this.max) : null;
        this.max = (this.max && this.max == 0) ? Number.MAX_VALUE : this.max; // zero equals unlimited!
        // name used for pretty output
        this.prettyName = this.$el.find(".product-config-field__title").first().text();

        // IMPORTANT: this needs to be done after all the other properties have been defined.
        this.adapter = (this.type) ? ProductConfigFieldAdapterFactory.make(this) : null;

        // If we have a valid adapter, start it up!
        if (this.adapter) this._init();
    };

    ProductConfigField.prototype = {

        /**
         * Startup and initialize.
         * @access private
         */
        _init: function(){
            this._subscribeToAdapter();
            this._updateMessage();
        },

        /**
         * Listens to the adapter and updates accordingly.
         * @access private
         */
        _subscribeToAdapter: function(){
            var self = this;
            this.adapter.$dispatcher.on(_EVENTS.adapter.value_change, function(e){
                self._notify();
            })
            .on(_EVENTS.adapter.message_change, function(e){
                self._updateMessage();
            });
        },

        /**
         * Notifies the model when a change occurs in the adapter – but only if that change can affect the 
         * price. This is because we don't want the model making unnecessary real-time AJAX requests to 
         * update the price if the price won't actually change.
         * @access private
         */
        _notify: function(){
            if (this.adapter.will_change_price){
                this.model.preview();
            }
        },

        /**
         * Updates the direction/error message when a change occurs in the adapter. If there is no message 
         * provided (`null`), then we reset/hide our message.
         * @access private
         */
        _updateMessage: function(){
            var showModifier = "product-config-field__message--show";
            var errorModifier = "product-config-field__message--error";

            // If a message is available, show it. If the adapter is invalid, we'll also mark this as an 
            // error message.
            if (this.adapter.message){
                this.$message.text(this.adapter.message)
                .addClass(showModifier).toggleClass(errorModifier, !this.adapter.valid);
            }
            // If no message is provided, we'll reset/hide our message and error state.
            else {
                this.$message.text("").removeClass(showModifier + " " + errorModifier);
            }
        },

        /**
         * Proxy: Simply returns the Adapter's current valid state.
         * @access public
         * @returns {Boolean} - True if the adapter is valid, false if not.
         */
        getValid: function(){
            return this.adapter.valid;
        },

        /**
         * Proxy: Simply returns the Adapter's current JSON.
         * @access public
         * @returns {Object} - The Adapter's current JSON
         */
        getJSON: function(){
            return this.adapter.getJSON();
        },

        /**
         * Proxy: Simply returns the Adapter's pretty output value.
         * @access public
         * @returns {String} - The Adapter's pretty output value.
         */
        getPrettyValue: function(allowDefault){
            return this.adapter.getPrettyValue(allowDefault);
        }
    };

    // ============================================================================================================
    // =============== ADAPTER : FACTORY ==========================================================================
    // ============================================================================================================
    /**
     * The ProductConfigFieldAdapterFactory static class serves a single purpose – to encapsulate create a new 
     * adapter instance specified by the requested field type. The intention is to abstract and encapsulate the 
     * specific adapter implementations so ProductConfigField doesn't have to know how to decide how to create each 
     * adapter, and doesn't even really have to know there's any difference.
     *
     * @constructor
     * @access public
     * @static
     */
    var ProductConfigFieldAdapterFactory = function() {}

    /**
     * Creates a new adapter instance specified by the requested field type. Please note, each adapter shares a 
     * common api, but their implementations can vary greatly. For example, each adapter requires a different 
     * type of `$input` in its constructor. Please see the "Important Notes: Adapter" documentation below for 
     * more information.
     * @access public
     * @static
     * @param {ProductConfigField} - The ProductConfigField instance that is making the request.
     * @param {Mixed|Adapter} - A new adapter instance.
     */
    ProductConfigFieldAdapterFactory.make = function(field){
        var $input = null;
        var type = field.type || ""; // switch() throws an error if this is `null`

        switch(field.type){

            case "dropdown":
                $input = field.$el.find("select").first();
                return ($input.length > 0) ? new ProductConfigFieldDropdownAdapter($input) : null;
                break;

            case "free_form":
                $input = field.$el.find("textarea").first();
                return ($input.length > 0) ? new ProductConfigFieldFreeformAdapter($input) : null;
                break;

            case "checkbox":
                $input = field.$el.find("input[type='checkbox']");
                return ($input.length > 0) ? new ProductConfigFieldCheckboxAdapter($input, field.max) : null;
                break;

            case "quantity":
                $input = field.$el.find("[data-incrementer]");
                return ($input.length > 0) ? new ProductConfigFieldQuantityAdapter($input, field.max) : null;
                break;

            default:
                console.log("Product Config Field Type {" + type + "} is not current supported.");
        }
    };

    // ============================================================================================================
    // =============== IMPORTANT NOTES: ADAPTERS ==================================================================
    // ============================================================================================================
    /**
     * The following Adapters are intended to share a common API and set of properties, but can vary greatly in 
     * their individual implementation. The intention is that `ProductConfigField` shouldn't care what type of 
     * adapter it is provided. It should be able to communicate with all adapters in a common way – calling ALL the 
     * API methods regardless of type, listening for events, etc. This greatly reduces the need for a HUGE 
     * `ProductConfigField` class packed with `if/elses` to accomodate all the different field types. It also allows 
     * us to add more types in the future. All we have to do is implement and adhere to the properties and methods 
     * (below) that are required by our common Adapter API.
     *
     * Please note, ideally we would be able to enforce an API/interface via something like "implements" (similar 
     * to PHP) – but, JavaScript isn't quite there yet and any pseudo- implementations are too cumbersome, bloated, 
     * and potentially error prone. So, just do you best to follow the rules!
     * 
     * Required Properties
     *
     * - this.$el
     * - this.$dispatcher
     * - this.name
     * - this.will_change_price
     * - this.valid
     * - this.message
     * - this.requires_immediate_preview
     *
     * 
     * Required Methods
     * 
     * - setValue()     - currently never called from outside itself
     * - setMessage()   - currently never called from outside itself
     * - getJSON() 
     * - getPrettyValue()     
     */
    // ============================================================================================================
    // =============== ADAPTER : DROPDOWN =========================================================================
    // ============================================================================================================
    /**
     * The ProductConfigFieldDropdownAdapter is responsible for encapsulating the behavior of a Dropdown Field 
     * Type as well as adhering to and implementing the common Adapter API. This adapter has the following 
     * criteria and considerations:
     *     - The default value is the first option. And, if `will_change_price`, then we need to trigger an 
     *       immediate preview request by marking `requires_immediate_preview=true`.
     *     - Cannot currently have errors
     *     - Does not currently generate messages
     *     - Cannot have a max quantity
     *     - Can effect price.
     *
     * @constructor
     * @access public
     * @param {jQuery} $el - A jQuery object representing a single `<select>` element.
     */
    ProductConfigFieldDropdownAdapter = function($el){
        // Adapter API: These properities are required in all Adapters.
        this.$el = $el;
        this.$dispatcher = this.$el;
        this.name = this.$el.data("product-config-field-slug");
        this.will_change_price = (this.$el.find("option[data-product-config-field-price-variant]").length > 0) ? true : false;
        this.requires_immediate_preview = this.will_change_price;
        this.valid = true;
        this.message = null;

        // Adapter-specific properties: Not required to be implemented in all Adapters.
        this._json = {};
        this._json[this.name] = "";

        // start it up!
        this._init();
    };

    ProductConfigFieldDropdownAdapter.prototype = {

        /**
         * Startup and initialize.
         * @access private
         */
        _init: function(){
            this._subscribeToSelect();
            this._setInitialValue();
        },

        /**
         * Special case: Dropdown field types need to be set so their first option is selected by default – 
         * which means we also have to update the json immediately. However, please note, we DO NOT want to 
         * use `setValue()` because we DO NOT want to trigger a change event. If we had more than one dropdown 
         * field type and they all dispatched changed events immediately – we'd be making multiple price preview 
         * requests when one would be good enough. So, instead, the `ProductConfigField` instance will check if 
         * this (or any) adapter is marked `requires_immediate_preview=true`. If it finds at least one, it will 
         * only make a single preview request. 
         * the `ProductConfigField` class
         * @access private
         */
        _setInitialValue: function(){
            var slug = this.$el.val();
            if (slug) this._json[this.name] = slug;
        },

        /**
         * Listen to `<select>` element for changes events. If a change occurs, we are passing the 
         * current value to our `setValue()` method that is ultimately responsible for determining whether 
         * a change has actually occurred or not.
         * @access private
         */
        _subscribeToSelect: function(){
            var self = this;
            this.$el.on("change", function(e){
                self.setValue(self.$el.val());
            });
        },

        /**
         * Sets the current value and updates our json output. If a change occurs, dispatch a change event.
         * Adapter API: This method is required in all Adapters.
         *
         * TODO: Should we be attempting to update the actual <select>? Currently, this method will not do that!
         * 
         * @access public
         * @param {String} value - The currently selected `<select> <option>` name.
         */
        setValue: function(value){
            if (this._json[this.name] != value){
                this._json[this.name] = value;
                this.$dispatcher.trigger(_EVENTS.adapter.value_change);
            }
        },

        /**
         * Sets the current message and valid state. If a change occurs on either property, dispatch a change 
         * event. Please note, valid messages are intended to be displayed as additional "directions", and 
         * invalid messages are intended to be displayed as "errors".
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {String} msg - The direction/error message to display
         * @param {Boolean} valid - True if the message is a "direction". False if it is an error.
         */
        setMessage: function(msg, valid){
            if ((this.message != msg) || (this.valid != valid)){
                this.message = msg;
                this.valid = valid;
                this.$dispatcher.trigger(_EVENTS.adapter.message_change);
            }
        },

        /**
         * Gets the current JSON that represents this field/type.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @returns {Object} - { "slug" : "current_value" }
         */
        getJSON: function(){
            return this._json;
        },

        /**
         * Gets the pretty value output of this field/type. By default, we are not allowing empty (default) values 
         * to be returned. Instead, we are passing back `null` so that this field can be properly excluded from 
         * any pretty output.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {Boolean} allowDefault - true if we should allow empty/default values to be returned. false if not.
         * @returns {String} - "Hello World."
         */
        getPrettyValue: function(allowDefault){
            var slug = this._json[this.name];
            // find the currently selected option if applicable. Note, we want to ignore the `.bs-title-option` 
            // that is added automatically by the `data-selectpicker` component.
            var $option = this.$el.find("option[value='" + slug + "']").not(".bs-title-option").first();
            // Note: If we found a selected option, we have to strip out any dollar values that have been appended 
            // to the option name. (ie..."Vanilla +$1.00")
            var prettyValue = ($option.length > 0) ? $option.text().split(/[\+\-]\$/)[0].trim() : null;

            return (allowDefault) 
                ? (prettyValue) ? prettyValue : "n/a" 
                : prettyValue; // ok to return null if not allowing defaults.
        }
    };

    // ============================================================================================================
    // =============== ADAPTER : FREE FORM ========================================================================
    // ============================================================================================================
    /**
     * The ProductConfigFieldFreeformAdapter is responsible for encapsulating the behavior of a Free Form / 
     * TextArea Field Type as well as adhering to and implementing the common Adapter API. This adapter has the 
     * following criteria and considerations:
     *     - Cannot currently have errors
     *     - Does not currently generate messages
     *     - Cannot have a max quantity
     *     - Cannot effect price.
     *
     * @constructor
     * @access public
     * @param {jQuery} $el - A jQuery object representing a single `<textarea>` element.
     */
    ProductConfigFieldFreeformAdapter = function($el){
        // Adapter API: These properities are required in all Adapters.
        this.$el = $el;
        this.$dispatcher = this.$el;
        this.name = this.$el.data("product-config-field-slug"); 
        this.will_change_price = false;
        this.requires_immediate_preview = false;
        this.valid = true;
        this.message = null;

        // Adapter-specific properties: Not required to be implemented in all Adapters.
        this._json = {};
        this._json[this.name] = "";

        // start it up!
        this._init();
    };

    ProductConfigFieldFreeformAdapter.prototype = {

        /**
         * Startup and initialize.
         * @access private
         */
        _init: function(){
            this._subscribeToTextarea();
        },

        /**
         * Listen to `<select>` element for blur/un-focus events. If a change occurs, we are passing the 
         * current value to our `setValue()` method that is ultimately responsible for determining whether a 
         * change has actually occurred or not.
         * @access private
         */
        _subscribeToTextarea: function(){
            var self = this;
            this.$el.on("blur", function(e){
                self.setValue(self.$el.val());
            });
        },

        /**
         * Sets the current value and updates our json output. If a change occurs, dispatch a change event.
         * Adapter API: This method is required in all Adapters.
         *
         * TODO: Should we be attempting to update the actual <textarea>? Currently, this method will not do that!
         * 
         * @access public
         * @param {String} value - The current value of `<textarea>`
         */
        setValue: function(value){
            if (this._json[this.name] != value){
                this._json[this.name] = value;
                this.$dispatcher.trigger(_EVENTS.adapter.value_change);
            }
        },

        /**
         * Sets the current message and valid state. If a change occurs on either property, dispatch a change 
         * event. Please note, valid messages are intended to be displayed as additional "directions", and 
         * invalid messages are intended to be displayed as "errors".
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {String} msg - The direction/error message to display
         * @param {Boolean} valid - True if the message is a "direction". False if it is an error.
         */
        setMessage: function(msg, valid){
            if ((this.message != msg) || (this.valid != valid)){
                this.message = msg;
                this.valid = valid;
                this.$dispatcher.trigger(_EVENTS.adapter.message_change);
            }
        },

        /**
         * Gets the current JSON that represents this field/type.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @returns {Object} - { "slug" : "current_value" }
         */
        getJSON: function(){
            return this._json;
        },

        /**
         * Gets the pretty value output of this field/type. By default, we are not allowing empty (default) values 
         * to be returned. Instead, we are passing back `null` so that this field can be properly excluded from 
         * any pretty output.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {Boolean} allowDefault - true if we should allow empty/default values to be returned. false if not.
         * @returns {String} - "Hello World."
         */
        getPrettyValue: function(allowDefault){
            var val = this._json[this.name];
            return (allowDefault) 
                ? val 
                : (val && val != "") ? val : null;
        }
    };

    // ============================================================================================================
    // =============== ADAPTER : CHECKBOX =========================================================================
    // ============================================================================================================
    /**
     * The ProductConfigFieldCheckboxAdapter is responsible for encapsulating the behavior of a Checkbox Field Type 
     * as well as adhering to and implementing the common Adapter API. This adapter has the following criteria and 
     * considerations:
     *     - This field can have multiple `<checkbox>` elements.
     *     - Can have errors.
     *     - Does generate messages.
     *     - Can have a max quantity
     *     - Can effect price.
     *
     * @constructor
     * @access public
     * @param {jQuery} $el - A jQuery object representing one or more `<input type="checkbox">` element(s).
     * @param {Int} max - A maximum selection amount to impose on the sum of all checkboxes selected.
     */
    ProductConfigFieldCheckboxAdapter = function($el, max){
        // Adapter API: These properities are required in all Adapters.
        this.$el = $el;
        this.$dispatcher = $("<div></div>");
        this.name = this.$el.first().data("product-config-field-slug");
        this.will_change_price = (this.$el.filter("[data-product-config-field-price-variant]").length > 0) ? true : false;;
        this.requires_immediate_preview = false;
        this.valid = true;
        this.message = null;

        // Adapter-specific properties: Not required to be implemented in all Adapters.
        this._json = {};
        this._json[this.name] = [];
        this._max = max;
        
        // start it up!
        this._init();
    };

    ProductConfigFieldCheckboxAdapter.prototype = {

        /**
         * Startup and initialize.
         * @access private
         */
        _init: function(){
            this._subscribeToCheckboxes();
        },

        /**
         * Listen to all the `<checkbox>` elements for change events. If a change occurs, we are creating a new 
         * array/value that includes ONLY the checked checkboxes' slugs and passing that to our `setValue()` 
         * method which will determine whether or not a change actually occurred.
         * @access private
         */
        _subscribeToCheckboxes: function(){
            var self = this;
            this.$el.on("change", function(e){
                var arr = [];
                // get only the checked boxes and add their "value" attribute to the array (ie...value="slug")
                self.$el.filter(":checked").each(function(index){
                    arr.push($(this).attr("value"));    
                });
                // attemp to set it!
                self.setValue(arr);
            });
        },

        /**
         * Updates the enabled/disabled states of each checkbox and the corresponding message. Please note, this 
         * method is only executed if a max quantity is imposed...if not, a user can check as many as they want. 
         * Also, it should be impossible (via UI) to select MORE than the max allowed, but just in case, we are 
         * going to address that possiblity as well.
         * @access private
         */
        _updateAvailability: function(){
            // If we need to impose a max quantity...
            if (this._max){
                var count = this._json[this.name].length;
                // If we are allowed to select more checkboxes: re-enable all disabled checkboxes and reset 
                // the message.
                if (count < this._max){
                    this.$el.filter(":disabled").prop("disabled", false);
                    this.setMessage(null, true);
                    return;
                }
                // If we have reached our max: disable all unchecked checkboxes and update the directions message. 
                else if (count == this._max){
                    this.$el.not(":checked").prop("disabled", true);
                    this.setMessage("All done. To make additional changes, please remove a selected item.", true);
                    return;
                }
                // If we made it this far, it means something went wrong and there are more checkboxes selected 
                // than is allowed by the max...so, we have to disable all unchecked checkoxes and show an error 
                // message with directions on how to correct the issue. This should never happen, but we want to 
                // cover off on it anyways.
                else {
                    var diff = count - this._max;
                    var pluralized = (count == 1) ? "item" : "items";
                    this.$el.not(":checked").prop("disabled", true);
                    this.setMessage("Oops. Please remove " + diff + " selected " + pluralized + ".", false);
                }
            }
        },

        /**
         * Sets the current value as an array only the `:checked` checkboxes and updates our json output. 
         * If a change occurs, dispatch a change event. 
         * Adapter API: This method is required in all Adapters.
         *
         * TODO: Should we be attempting to update the actual <checkboxes>? Currently, this method will not do that!
         * 
         * @access public
         * @param {Array} value - An array of each `<checkbox:checked>` value attribute. ["child-slug1", "child-slug2"]
         */
        setValue: function(value){
            if (this._json[this.name] != value){
                this._json[this.name] = value;
                this._updateAvailability();
                this.$dispatcher.trigger(_EVENTS.adapter.value_change);
            }
        },

        /**
         * Sets the current message and valid state. If a change occurs on either property, dispatch a change 
         * event. Please note, valid messages are intended to be displayed as additional "directions", and 
         * invalid messages are intended to be displayed as "errors".
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {String} msg - The direction/error message to display
         * @param {Boolean} valid - True if the message is a "direction". False if it is an error.
         */
        setMessage: function(msg, valid){
            if ((this.message != msg) || (this.valid != valid)){
                this.message = msg;
                this.valid = valid;
                this.$dispatcher.trigger(_EVENTS.adapter.message_change);
            }
        },

        /**
         * Gets the current JSON that represents this field/type.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @returns {Object} - { "slug" : ["child-slug1", "child-slug2"] }
         */
        getJSON: function(){
            return this._json;
        },

        /**
         * Gets the pretty value output of this field/type. By default, we are not allowing empty (default) values 
         * to be returned. Instead, we are passing back `null` so that this field can be properly excluded from 
         * any pretty output.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {Boolean} allowDefault - true if we should allow empty/default values to be returned. false if not.
         * @returns {String} - "Chocolate, Vanilla"
         */
        getPrettyValue: function(allowDefault){
            var arr = this._json[this.name];
            var prettyArr = [];

            if (arr && (arr.length > 0)){
                for (var i=0; i<arr.length; i++){
                    // find the input that matches the currently selected slug
                    var $input = this.$el.filter("[value='" + arr[i] + "']").first();
                    if ($input.length > 0){
                        // find the inputs immediate sibling `<span>` element.
                        var $span = $input.next("span").first();
                        if ($span.length > 0){
                            // Note: we have to strip out any dollar values that have been appended to the option 
                            // name. (ie..."Vanilla +$1.00")
                            var val = $span.text().split(/[\+\-]\$/)[0].trim();
                            prettyArr.push(val);
                        }
                    }
                }
            }

            // If not allowing empty/default values and this is empty – return null. Else, join the list.
            return (!allowDefault && (prettyArr.length == 0)) ? null : prettyArr.join(", ");
        }
    };

    // ============================================================================================================
    // =============== ADAPTER : QUANTITY =========================================================================
    // ============================================================================================================
    /**
     * The ProductConfigFieldQuantityAdapter is responsible for encapsulating the behavior of a Quantity Field Type 
     * as well as adhering to and implementing the common Adapter API. This adapter has the following criteria and 
     * considerations:
     *     - This field relies on the `[data-incrementer]` component defined in `main.js`. There are a few places 
     *       in this class that are specifically addressing that component's quirks with workarounds.
     *     - This field can have multiple `[data-incrementer]` elements.
     *     - Can have errors.
     *     - Does generate messages.
     *     - Can have a max quantity – imposed on the sum of all quantity field values.
     *     - Can effect price.
     *
     * @constructor
     * @access public
     * @param {jQuery} $el - A jQuery object representing one or more `[data-incrementer]` element(s).
     * @param {Int} max - A maximum selection amount to impose on the sum of all quantity field values.
     */
    ProductConfigFieldQuantityAdapter = function($el, max){
        // Adapter API: These properities are required in all Adapters.
        this.$el = $el; // data-incrementers
        this.$dispatcher = $("<div></div>");
        this.name = this.$el.first().data("product-config-field-slug");
        this.will_change_price = (this.$el.filter("[data-product-config-field-price-variant]").length > 0) ? true : false;;
        this.requires_immediate_preview = false;
        this.valid = true;
        this.message = null;

        // Adapter-specific properties: Not required to be implemented in all Adapters.
        this._json = {};
        this._json[this.name] = {};
        this._max = max;
        this.$inputs = this.$el.find("input[type='number']");
        this.$plusBtns = this.$el.find(".btn-number[data-type='plus']");
        
        // start it up!
        this._init();
    };

    ProductConfigFieldQuantityAdapter.prototype = {

        /**
         * Initialize and startup.
         * @access private
         */
        _init: function(){
            this._initJSON();
            this._subscribeToInputs();
        },

        /**
         * Creates a key/value pair inside our json that corresponds to each input's name/slug and current 
         * value. This makes updates that happen later a little easier because we know the slug(s) exist.
         * @access private
         */
        _initJSON: function(){
            var self = this;
            this.$inputs.each(function(index){
                var $el = $(this);
                var val = parseInt($el.val());
                self._json[self.name][$el.data("product-config-option-slug")] = (!isNaN(val)) ? val : 0;
            });
        },

        /**
         * Listen to all the `<input>` elements for change events. If a change occurs, we need to normalize 
         * and update that input's values so we can determine how to update the rest of the UI component.
         * @access private
         */
        _subscribeToInputs: function(){
            var self = this;
            this.$inputs.on("change", function(e){
                self._updateByInput($(this));
            });
        },

        /**
         * Normalizes and updates a single input's value when a change is made on the input itself. For 
         * example – manually entering a number into the input, or clicking the corresponding plus/minus button.
         * @access private
         * @param {jQuery} - A jQuery object corresponding the `<input>` that has triggered a change event.
         */
        _updateByInput: function($input){
            var slug = $input.data("product-config-option-slug");
            var name = $input.attr("name");
            // normalize inputs value
            var val = parseInt($input.val());
            val = (!isNaN(val)) ? val : 0;
            // the remaining amount excluding this field – so we can tell the max that can fit in this field.
            var remaining = this._getRemaining(slug);
            
            // If the remaining with this value is less than zero...
            if ((remaining - val) < 0){
                // If over the max, and remaining doesn't equal this value, we also have to update the input 
                // and its plus button manually – and NOT set our internal value yet. Triggering a manual 
                // "change" event on the input will (inevitably) force this method to re-run, where we can then 
                // set our internal value.
                if (remaining != val){    
                    $input.val(remaining).trigger("change"); // val() won't dispatch a change on its own!
                    this.$plusBtns.filter("[data-field='" + name + "']").first().prop("disabled", true);
                }
                // If the values are the same, we can update our internal value.
                else {
                    this._setValueSingle(slug, remaining);
                }
            // If the remaining is greater than or equal to zero, go ahead and update our internal value.
            }
            else {
                this._setValueSingle(slug, val);
            }
        },

        /**
         * Gets the amount remaining based on the current selections and the max allowed. This method also 
         * can optionally exclude a slug from the tally. This intention of the "exclude" feature is that 
         * it comes in handy to know the maximum amount any one field can have before you commit to setting that 
         * field's value. Please note, if the max is not being enforced, we are returning a pseudo-unlimited number.
         * @access private
         * @param {String} - The corresponding input's slug to exclude from the remaining tally.
         * @returns {Int} The current amount remaining based on the max allowed.
         */
        _getRemaining: function(exclude){
            if (this._max){
                var total = 0;
                for (var slug in this._json[this.name]){
                    if (slug != exclude) total += this._json[this.name][slug];
                }
                return this._max - total;
            }
            return Number.MAX_VALUE;
        },

        /**
         * Updates the enabled/disabled states of each plus button and sets the corresponding directions/error 
         * message based if any more selections can be made. Please note, this method is only executed if a max 
         * quantity is imposed...if not, a user can add as many as they want. Also, it should be impossible 
         * (via UI) to select MORE than the max allowed, but just in case, we are going to address that 
         * possiblity as well.
         * @access private
         */
        _updateAvailability: function(){
            if (this._max){
                var remaining = this._getRemaining();
                // If there is still some available, turn on all plus buttons, and reset/hide the message.
                if (remaining > 0){
                    this._enablePlusBtns();
                    this.setMessage(null, true);
                }
                // If we have hit our max, disable all the plus buttons, and show additional directions.
                else if (remaining == 0){
                    this.$plusBtns.prop("disabled", true);
                    this.setMessage("All done. To make additional changes, please remove a selected item.", true);
                }
                // If we made it this far, it means something went wrong and we are over the max allowed. Even 
                // though this shouldn't be possible, we are still going to show an error message to the user 
                // with directions on how to correct the problem.
                else {
                    var diff = Math.abs(remaining);
                    var pluralized = (count == 1) ? "item" : "items";
                    this.$plusBtns.prop("disabled", true);
                    this.setMessage("Oops. Please remove " + diff + " selected " + plurizalize + ".", false);
                }
            }
        },

        /**
         * Enables all the plus buttons if their corresponding input's value does not exceed the max. This 
         * method is called from `this._updateAvailablility()` when we still have some availability. In that 
         * scenario, every plus button should be turned on – so, the max check is just in case.
         * @access private
         */
        _enablePlusBtns: function(){
            var self = this;

            this.$inputs.each(function(index){
                var $input = $(this);
                var val = self._json[self.name][$input.data("product-config-option-slug")];
                // if input value is greater than max allowed, find its corresponding plus button and disable it.
                if (val < self._max){
                    var name = $input.attr("name");
                    var $btn = self.$plusBtns.filter("[data-field='" + name + "']").first();
                    $btn.prop("disabled", false);
                }
            });
        },

        /**
         * Sets a single slug/value pair (corresponding to a single `<input>`) in the json object. If a change 
         * occurs, dispatch a change event.
         *
         * TODO: Should we be attempting to update the actual <input>? Currently, this method will not do that!
         * 
         * @access private
         * @param {String} slug - The slug (not name) of the corresponding input. `<input data-product-config-option-slug="...">`
         * @param {Int} value - The current value of the corresponding input field.
         */
        _setValueSingle: function(slug, value){
            if (this._json[this.name].hasOwnProperty(slug)){
                if (this._json[this.name][slug] != value){
                    this._json[this.name][slug] = value;
                    this._updateAvailability();
                    this.$dispatcher.trigger(_EVENTS.adapter.value_change);
                }
            }
        },

        /**
         * Sets the current json values to any differing json values if they exist. If at least one change is found,
         * dispatch an event. Please note, any slugs ommitted from the value object will be ignored, and will not 
         * effect the current json slug's value.
         * Adapter API: This method is required in all Adapters.
         *
         * TODO: Should we be attempting to update the actual <input>? Currently, this method will not do that!
         * 
         * @access public
         * @param {Object} value - An object of each sub-slug/value pair { "slug1": 12, "slug2" }
         */
        setValue: function(value){
            var changed = false;
            for (var slug in this._json[this.name]){
                var curVal = this._json[this.name][slug];
                var newVal = (value.hasOwnProperty(slug) && value[slug] && !isNaN(value[slug])) ? value[slug] : null;
                if (newVal && (newVal != curVal)){
                    this._json[this.name][slug] = newVal;
                    changed = true;
                }
            }
            if (changed){
                this._updateAvailability();
                this.$dispatcher.trigger(_EVENTS.adapter.value_change); 
            }
        },

        /**
         * Sets the current message and valid state. If a change occurs on either property, dispatch a change 
         * event. Please note, valid messages are intended to be displayed as additional "directions", and 
         * invalid messages are intended to be displayed as "errors".
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {String} msg - The direction/error message to display
         * @param {Boolean} valid - True if the message is a "direction". False if it is an error.
         */
        setMessage: function(msg, valid){
            if ((this.message != msg) || (this.valid != valid)){
                this.message = msg;
                this.valid = valid;
                this.$dispatcher.trigger(_EVENTS.adapter.message_change);
            }
        },

        /**
         * Proxy: Gets the current JSON that represents this field/type.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @returns {Object} - { "slug" : { "child-slug1": 5, "child-slug2": 10 } }
         */
        getJSON: function(){
            return this._json;
        },

        /**
         * Gets the pretty value output of this field/type. By default, we are not allowing empty (default) values 
         * to be returned. Instead, we are passing back `null` so that this field can be properly excluded from 
         * any pretty output.
         * Adapter API: This method is required in all Adapters.
         * 
         * @access public
         * @param {Boolean} allowDefault - true if we should allow empty/default values to be returned. false if not.
         * @returns {String} - "Chocolate, Vanilla"
         */
        getPrettyValue: function(allowDefault){
            var prettyArr = [];
            for (var slug in this._json[this.name]){
                // current numeric value
                var val = this._json[this.name][slug];
                // if allowing empty/defaults or the value isn't zero...
                if (allowDefault || (val != 0)){
                    // find the incrementer corresponding to the current slug.
                    var $incrementer = this.$el.has("input[data-product-config-option-slug='" + slug + "']").first();
                    if ($incrementer.length > 0){
                        // find the corresponding label inside the incrementer
                        var $label = $incrementer.next("label").first();
                        if ($label.length > 0){
                            // Note: we have to strip out any dollar values that have been appended to the option 
                            // name. (ie..."Vanilla +$1.00")
                            var name = $label.text().split(/[\+\-]\$/)[0].trim();
                            prettyArr.push(name + ": " + val);
                        }
                    }
                }
            }

            // If not allowing empty/default values and this is empty – return null. Else, join the list.
            return (!allowDefault && (prettyArr.length == 0)) ? null : prettyArr.join(", ");
        }
    };

    // find/create necessary objects to attach our ProductConfigField to the window.Bento object.
    window.Bento = window.Bento || {};
    window.Bento.ConfigurableProduct = window.Bento.ConfigurableProduct || {};
    window.Bento.ConfigurableProduct.Field = window.Bento.ConfigurableProduct.Field || ProductConfigField;
};
