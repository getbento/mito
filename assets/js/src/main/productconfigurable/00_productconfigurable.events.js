
function export_productconfig_events(){

    var product_configurable_events = {
        adapter: {
            value_change: "productconfig:adapter:value_change",
            message_change: "productconfig:adapter:message_change"
        },
        price: {
            change: "productconfig:price:change"
        },
        quantity: {
            change: "productconfig:quantity:change"
        },
        inventory: {
            change: "productconfig:inventory:change"
        },
        preview: {
            init: "productconfig:preview:init",
            complete: "productconfig:preview:complete",
            success: "productconfig:preview:success",
            error: "productconfig:preview:error"
        },
        submit: {
            init: "productconfig:submit:init",
            complete: "productconfig:submit:complete",
            success: "productconfig:submit:success",
            error: "productconfig:submit:error"
        }
    };

    // find/create necessary objects to attach our events to the window.Bento object.
    window.Bento = window.Bento || {};
    window.Bento.ConfigurableProduct = window.Bento.ConfigurableProduct || {};
    window.Bento.ConfigurableProduct.Events = window.Bento.ConfigurableProduct.Events || product_configurable_events;
};

