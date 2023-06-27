// ============================================================================================================
// =============== BENTOBOX TRACKING ==========================================================================
// ============================================================================================================
/**
 * This object provides shortcuts and validation for sending Google Analytics and BentoAnalytics tracking 
 * events. It also provides the ability to automatically send button clicks and form submissions on elements 
 * that have the proper data-attributes on them (listed below).
 *
 * IMPORTANT: Most forms are tracked via the API and called from other files (main.js and ticketing.js). You 
 * should only apply the form data-attributes (via macro) to elements that do not use any JavaScript/Ajax, and 
 * therefore do not provide any callbacks that can be directly hooked into.
 *
 * IMPORTANT: Please note, it is possible that Google Analytics isn't enabled and BentoAnalytics is. For this 
 * reason – we are always initializing this library and then only checking if either exists in the final 
 * `sendEvent()` method. If neither Google Analytics or BentoAnalytics exists – this method will basically be 
 * a `noop()` method that does nothing at all.
 * 
 * Buttons
 *
 * Ex:
 * 
 * <a data-bb-track="button"				- Identifies the button as trackable.
 * 	  data-bb-track-on="click"				- Specifies we want to track the "click" action.
 * 	  data-bb-track-category=""				- Required. No defaults, and Tracker will not submit if empty.
 * 	  data-bb-track-action="Click"			- Optional. If not included, it defaults to "Click".
 * 	  data-bb-track-label=""				- Required. No defaults, and Tracker will not submit if empty.
 * 	  data-bb-track-value=""				- Optional. Most times, you won't use this and should exclude it.
 * 	</a>
 *
 * 
 * Forms Ex:
 * 
 * <div data-bb-track="form"					- Identifies the form as trackable.
 * 		data-bb-track-on="submit"				- Specifies we want to track the "form submit" action.
 * 		data-bb-track-category="Forms"			- Optional. If not included, it defaults to "Forms".
 * 		data-bb-track-action="Submit"			- Optional. If not included, it defaults to "Submit".
 * 		data-bb-track-label="Email Sign Up"		- Required. Tracker will not submit without a label
 * 		data-bb-track-value="2"					- Optional. Most times, you won't use this and should exclude it.
 * 		aria-hidden="true">						- Required. There's no reason to show this node to screen readers.
 * 	</div>
 */

var TRACKING = {

	/**
     * Instance pseudo constants that can be referenced via object notation. This is intended to be used instead of passing 
     * strings around as values/labels. The benefit of this is that (1) it doesn't really matter what the actual string 
     * value is, and (2) we get more meaningful errors in the console. For example spelling "clik" wrong in a single place 
     * won't give us anything really useful. However, spelling `this.contant.aktions.clik` will throw an undefined error...
     * which is a lot easier to track down.
     * 
     * property
     * @access public
     */
	constants: {
		actions: {
			click: "click",
			submit: "submit"
		}
	},

	/**
     * Startup and initialize. Finds all of the button and form instances that should be tracked. By using the $context 
     * parameter, we can attempt to initialize only the elements found within that context, and not every button/form on 
     * the page again.
     * @access public
     * @param {jQuery|Optional} $context - A jQuery object that is the equivalent of $($context).find()
     */
	initialize: function($context) {
		this._initButtons($context);
		this._initForms($context);
	},

	/**
     * Finds all of the [data-bb-track='form'] instances within the optional $context. If we haven't already bound are 
     * tracking methods to the element, we mark it as bound/active (bb-tracking), and attempt to figure out which event you 
     * are attempting to track. Currently, only "submit" is supported. 
     * @access private
     * @param {jQuery|Optional} $context - A jQuery object that is the equivalent of $($context).find()
     */
	_initForms: function($context){
		var self = this;

		var $els = (typeof $context !== "undefined") ? $context.find("[data-bb-track='form']") : $("[data-bb-track='form']");
		$els.each(function(index){
			var $el = $(this);
			// If we have already/previously bound tracking to this element, we don't want to do it again.
			if ($el.data("bb-tracking")) return;
			// Now, its ok to make this as bound/active so we don't duplicate it later.
			$el.data("bb-tracking", true);
			// Which event should we be configuring? Note: Currently, only the "submit" event is supported.
			switch ($el.attr("data-bb-track-on")) {
				case self.constants.actions.submit:
					self._configureFormSubmitEvent($el);
					break;
			}
		});
	},

	/**
     * Binds the click event to the [data-bb-track='form'] instance. On submit, we retrieve all the values we need to 
     * configure a Google Analytics Event (category, action, label, and (optionally) value) – and then pass the parameters to 
     * our sendEvent() proxy. Please note, if the form submission does not open in a new window, it is possible that the 
     * tracking tag doesn't have enough time to be sent...and no tracking will be logged.
     * @access private
     * @param {jQuery} $el - A jQuery object representing our [data-bb-track='form'] instance.
     */
	_configureFormSubmitEvent: function($el){
		var self = this;
		var $form = $el.closest("form").first();
		
		if ($form.length > 0){
			$form.submit(function(e){
				var $el = $(this);
				var $tracker = $el.find("[data-bb-track='form'][data-bb-track-on='submit']").first();
				if ($tracker.length > 0){
					var category = $tracker.attr("data-bb-track-category") || "Forms";
					var action = $tracker.attr("data-bb-track-action") || "Submit";
					var label = $tracker.attr("data-bb-track-label") || null;
					var value = $tracker.attr("data-bb-track-value") || null;
					self.sendEvent(category, action, label, value);
				}
			});
		}
	},

	/**
     * Finds all of the [data-bb-track='button'] instances within the optional $context. If we haven't already bound are 
     * tracking methods to the element, we mark it as bound/active (bb-tracking), and attempt to figure out which event you 
     * are attempting to track. Currently, only "click" is supported. 
     * @access private
     * @param {jQuery|Optional} $context - A jQuery object that is the equivalent of $($context).find()
     */
	_initButtons: function($context){
		var self = this;
		// find all the $els within the optional $context.
		var $els = (typeof $context !== "undefined") ? $context.find("[data-bb-track='button']") : $("[data-bb-track='button']");
		$els.each(function(index){
			var $el = $(this);
			// If we have already/previously bound tracking to this element, we don't want to do it again.
			if ($el.data("bb-tracking")) return;
			// Now, its ok to make this as bound/active so we don't duplicate it later.
			$el.data("bb-tracking", true);

			// Which event should we be configuring? Note: Currently, only the "click" event is supported.
			switch ($el.attr("data-bb-track-on")) {
				case self.constants.actions.click:
					self._configureButtonsClickEvent($el);
					break;
			}
		});
	},

	/**
     * Binds the click event to the [data-bb-track='button'] instance. On click, we retrieve all the values we need to 
     * configure a Google Analytics Event (category, action, label, and (optionally) value) – and then pass the parameters to 
     * our sendEvent() proxy.
     * @access private
     * @param {jQuery} $el - A jQuery object representing our [data-bb-track='button'] instance.
     */
	_configureButtonsClickEvent: function($el){
		var self = this;
		$el.click(function(e){
			var $btn = $(this);
			var category = $btn.attr("data-bb-track-category") || null;
			var action = $btn.attr("data-bb-track-action") || "Click";
			var label = $btn.attr("data-bb-track-label") || null;
			var value = $btn.attr("data-bb-track-value") || null;
			self.sendEvent(category, action, label, value);
		});
	},

	/**
     * Before we attempt to send an event, we need to validate it to ensure all the required data is populated...otherwise, we 
     * would probably get a Google Analytics error. In most scenarios, the category, action and label have to be populated. Only 
     * the value is optional – and only used in very specific use cases.
     * @access private
     * @param {String} category - Required. Google Analytics Event Category.
     * @param {String} action - Required. Google Analytics Event Action.
     * @param {String} action - Required. Google Analytics Event Label.
     * @param {Int} value - Optional. Google Analytics Event Value.
     * @returns {Boolean} true if all the required data is popuplated, false if not.
     */
	_validateEvent: function(category, action, label, value){
		return (category && action && label) ? true : false;
	},

	/**
     * Validates that the required event parameters are populated, creates the object formatting that Google Analytics expects,
     * and finally sends the event via Google Analytics API and BentoAnalytics.
     * @access public
     * @param {String} category - Required. Google Analytics Event Category.
     * @param {String} action - Required. Google Analytics Event Action.
     * @param {String} action - Required. Google Analytics Event Label.
     * @param {Int} value - Optional. Google Analytics Event Value.
     */
	sendEvent: function(category, action, label, value){
		if (this._validateEvent(category, action, label, value)){
			// copy our properties to the Google Analytics format
			var params = {
				eventCategory: category,
				eventAction: action,
				eventLabel: label
			};
			// "value" is optional, so we check for this separately so it doesn't get included as eventValue:undefined
			if (value && (typeof value === "number")) params.eventValue = value;
			// if (beacon === true) params.transport = "beacon";
			// finally, send it!
			if (window.BentoAnalytics) window.BentoAnalytics.trackEvent(category, action, label, value);
		}
	}
};

// self initializing!
$(document).ready(function(){
	TRACKING.initialize();

	// Special case: Resy creates its own button and is only used in the footer.
	var $resy = $("#BookWithResy");
	if ($resy.length > 0){
		var venueId = $resy.data("resy-venue") || null;
		// track button trigger click
		$resy.click(function(e){
			window.TRACKING.sendEvent("Reservations Trigger Button", "Click", "Button, Footer");
		});

		// if valid venue id, track resyWidget events
		if (venueId && !isNaN(venueId)){
			window.addEventListener("message", function(msg){
				if (msg.data.type == "ResyWidgetEvent"){
					window.TRACKING.sendEvent(("Resy: " + venueId), msg.data.name, (msg.data.properties.label || "n/a"));
				}
			});
		}
	}
});
