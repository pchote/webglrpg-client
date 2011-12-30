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

                        console.error("Error loading definition "+url+":"+lineNumber);
                        console.error(e.message);
                    }
                    self.definitions[type].implement(def);
                    self.definitions[type].implement({ templateLoaded: true });

                    // notify existing actor instances
                    self.instances[type].each(function(i) { if (i.f) i.f(i.i); });
                    console.log("Loaded definition", url);
                },
                onFailure: function() { console.error("Error fetching definition: "+url)},
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