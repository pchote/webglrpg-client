// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var DynamicClassLoader = new Class({
    // Class prototype definitions
    definitions: [],

    // Dictionary of type: instances that require notifying when loaded
    instances: {},
    
    initialize: function(baseClass, requestUrlLookup) {
        this.baseClass = baseClass;
        this.requestUrlLookup = requestUrlLookup
    },

    load: function(type) {
        var afterLoad = arguments[1];
        var afterConstruct = arguments[2];

        // Unknown class type - create a skeleton class to be updated once the code has downloaded
        if (typeof(this.definitions[type]) === 'undefined') {
            this.definitions[type] = new Class({
                Extends: this.baseClass
            });

            this.instances[type] = [];
            var self = this;
            var url = this.requestUrlLookup(type);
            new Request({
                url: url,
                method: 'get',
                link: 'chain',
                onSuccess: function(json) {
                    var def;
                    try { eval(json); }
                    catch (e) {
                        var lineNumber = '';
                        // Dirty browser specific hack to determine line number in loaded file
                        if (e.lineNumber)
                            lineNumber = e.lineNumber - new Error().lineNumber + 6;

                        debug.error("Error in type definition for "+type+":"+lineNumber);
                        debug.error(e.message);
                    }
                    self.definitions[type].implement(def);
                    self.definitions[type].implement({ templateLoaded: true });

                    // notify existing actor instances
                    self.instances[type].each(function(i) { if (i.f) i.f(i.i); });
                    debug.log("Loaded definition for type '"+type+"'");
                },
                onFailure: function() { debug.error("Error fetching definition for '"+type+"'")},
            }).send();
        }

        var instance = new this.definitions[type]();
        if (afterConstruct)
            afterConstruct(instance);

        if (afterLoad) {
            if (instance.templateLoaded)
                afterLoad(instance);
            else
                this.instances[type].push({ 'i':instance, 'f': afterLoad });
        }

        return instance;
    }
});

var Keyboard = {
    activeKeys: [],
    shift: false,

    init: function() {
        document.onkeydown = Keyboard.onKeyDown;
        document.onkeyup = Keyboard.onKeyUp;
    },

    onKeyDown: function(e) {
        var c = String.fromCharCode(e.keyCode).toLowerCase();
        if (Keyboard.activeKeys.indexOf(c) < 0)
            Keyboard.activeKeys.push(c);
        Keyboard.shift = e.shiftKey;
    },

    onKeyUp: function(e) {
        var c = String.fromCharCode(e.keyCode).toLowerCase();
        Keyboard.activeKeys.erase(c);
    },

    // Return the last pressed key in keys
    lastPressed: function(keys) {
        var lower = keys.toLowerCase();
        var max = null;
        var maxI = -1;
        for (var i = 0; i < keys.length; i++) {
            var k = lower[i];
            var index = Keyboard.activeKeys.indexOf(k);
            if (index > maxI) {
                max = k;
                maxI = index;
            }
        }
        return max;
    }
}

var ActionQueue = new Class({
    actions: [],
    add: function(a) {
        this.actions.push(a);
    },

    run: function() {
        this.actions.each(function(a) { a(); });
        this.actions.length = 0;
    }
});

var Debug = new Class({
    initialize: function(useConsole) {
        this.useConsole = useConsole
    },
    
    log: function() {
        if (!this.useConsole)
            return;
        console.log.apply(console, arguments);
    },

    error: function() {
        if (!this.useConsole)
            return;
        debug.error.apply(console, arguments);
    }
});