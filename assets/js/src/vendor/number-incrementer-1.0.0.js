// enforce dependency: copied from Bootstrap
if (typeof jQuery === 'undefined') { throw new Error('Number Incremnter\'s JavaScript requires jQuery') }

// plugin bootstrap minus and plus
// http://jsfiddle.net/laelitenetwork/puJ6G/
//
// IMPORTANT: This plugin is the same one used in Juno, and is copied directly from there.
//
$("[data-incrementer]").each(function() {

    var $wrapper = $(this);

    $(this).find('.btn-number').click(function(e) {
        e.preventDefault();

        var fieldName = $(this).attr('data-field');
        var type = $(this).attr('data-type');
        var input = $wrapper.find("input[name='" + fieldName + "']");
        var currentVal = parseInt(input.val());
        if (!isNaN(currentVal)) {
            if (type == 'minus') {

                if (currentVal > input.attr('min')) {
                    input.val(currentVal - 1).change();
                }
                if (parseInt(input.val()) == input.attr('min')) {
                    $(this).attr('disabled', true);
                }

            } else if (type == 'plus') {

                if (currentVal < input.attr('max')) {
                    input.val(currentVal + 1).change();
                }
                if (parseInt(input.val()) == input.attr('max')) {
                    $(this).attr('disabled', true);
                }

            }
        } else {
            input.val(0);
        }
    });
    $(this).find('.input-number').focusin(function() {
        $(this).data('oldValue', $(this).val());
    });
    $(this).find('.input-number').change(function() {

        var minValue = parseInt($(this).attr('min'));
        var maxValue = parseInt($(this).attr('max'));
        var valueCurrent = parseInt($(this).val());

        var name = $(this).attr('name');
        if (valueCurrent >= minValue) {
            $wrapper.find(".btn-number[data-type='minus'][data-field='" + name + "']").removeAttr('disabled')
        } else {
            $(this).val($(this).data('oldValue'));
        }
        if (valueCurrent <= maxValue) {
            $wrapper.find(".btn-number[data-type='plus'][data-field='" + name + "']").removeAttr('disabled')
        } else {
            $(this).val($(this).data('oldValue'));
        }


    });
    $(this).find(".input-number").keydown(function(e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 ||
            // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

});