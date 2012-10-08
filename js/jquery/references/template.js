(function($)
{
    var PLUGIN_NAME = "myPlugin"; // TODO: Plugin name goes here.
    var DEFAULT_OPTIONS =
    {
        // TODO: Default options for plugin.
    };
    var pluginInstanceIdCount = 0;

    var I = function(/*HTMLElement*/ element)
    {
        return new Internal(element);
    };

    var Internal = function(/*HTMLElement*/ element)
    {
        this.$elem = $(element);
        this.elem = element;
        this.data = this.getData();

        // Shorthand accessors to data entries:
        this.id = this.data.id;
        this.options = this.data.options;
    };

    /**
     * Initialises the plugin.
     */
    Internal.prototype.init = function(/*Object*/ customOptions)
    {
        var data = this.getData();

        if (!data.initialised)
        {
            data.initialised = true;
            data.options = $.extend(DEFAULT_OPTIONS, customOptions);

            // TODO: Set default data plugin variables.
            // TODO: Call custom internal methods to intialise your plugin.
        }
    };

    /**
     * Returns the data for relevant for this plugin
     * while also setting the ID for this plugin instance
     * if this is a new instance.
     */
    Internal.prototype.getData = function()
    {
        if (!this.$elem.data(PLUGIN_NAME))
        {
            this.$elem.data(PLUGIN_NAME, {
                id : pluginInstanceIdCount++,
                initialised : false
            });
        }

        return this.$elem.data(PLUGIN_NAME);
    };

    // TODO: Add additional internal methods here, e.g. Internal.prototype.<myPrivMethod> = function(){...}

    /**
     * Returns the event namespace for this widget.
     * The returned namespace is unique for this widget
     * since it could bind listeners to other elements
     * on the page or the window.
     */
    Internal.prototype.getEventNs = function(/*boolean*/ includeDot)
    {
        return (includeDot !== false ? "." : "") + PLUGIN_NAME + "_" + this.id;
    };

    /**
     * Removes all event listeners, data and
     * HTML elements automatically created.
     */
    Internal.prototype.destroy = function()
    {
        this.$elem.unbind(this.getEventNs());
        this.$elem.removeData(PLUGIN_NAME);

        // TODO: Unbind listeners attached to other elements of the page and window.
    };

    var publicMethods =
    {
        init : function(/*Object*/ customOptions)
        {
            return this.each(function()
            {
                I(this).init(customOptions);
            });
        },

        destroy : function()
        {
            return this.each(function()
            {
                I(this).destroy();
            });
        }

        // TODO: Add additional public methods here.
    };

    $.fn[PLUGIN_NAME] = function(/*String|Object*/ methodOrOptions)
    {
        if (!methodOrOptions || typeof methodOrOptions == "object")
        {
            return publicMethods.init.call(this, methodOrOptions);
        }
        else if (publicMethods[methodOrOptions])
        {
            var args = Array.prototype.slice.call(arguments, 1);

            return publicMethods[methodOrOptions].apply(this, args);
        }
        else
        {
            $.error("Method '" + methodOrOptions + "' doesn't exist for " + PLUGIN_NAME + " plugin");
        }
    };
})(jQuery);
