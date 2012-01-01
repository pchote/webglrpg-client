// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

Activity = new Class({
    onConstruct: function(type, actor, id, time, args) {
        this.actor = actor;
        this.id = id;
        this.type = type;
        this.startTime = time;
        this.creationArgs = args;
    },

    onLoad: function(args) {
        this.init.apply(this, args);
        this.loaded = true;
    },

    serialize: function() {
        return {
            "id": this.id,
            "time": this.startTime,
            "target" : [this.actor.zone.id, this.actor.id],
            "type": this.type,
            "data": this.creationArgs,
        };
    }
});

var ActivityLoader = new DynamicClassLoader(Activity, config.activityRequestUrl);
ActivityLoader.create = function(type, args, actor, id, time) {
    if (!time)
        time = new Date().getTime();
    if (!id)
        id = actor.id+"-"+type+"-"+time;
    return this.load(type, function(a) { a.onLoad(args); }, function(a) { a.onConstruct(type, actor, id, time, args); });
};