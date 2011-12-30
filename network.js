// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Network = new Class({
    dataQueue: [],
    tick: function() {
        this.dataQueue.each(this.parsePacket);
        this.dataQueue.length = 0;
    },

    parsePacket: function (p) {
        console.log("received packet", p);
        if (p.target) {
            var actor = Map.zoneDict[p.target[0]].actorDict[p.target[1]];
            var a = ActivityLoader.create(p.type, p.data, actor, p.id, p.time);
            actor.addActivity(a);
            return;
        }
    },

    sendActivity: function(activity, actor) {
        this.dataQueue.push(activity.serialize(actor));
    },
    
    injectTestData: function(startTime) {
        this.dataQueue.push({
            id:"foo1",
            time:startTime,
            target:["dungeon-top", "player"],
            type:"move",
            data:[{0:8, 1:10, 2:-1}, {0:7, 1:10, 2:0}, 600]
        });
        this.dataQueue.push({
            id:"foo2",
            time:startTime+600,
            target:["dungeon-top", "player"],
            type:"move",
            data:[{0:7, 1:10, 2:-1}, {0:6, 1:10, 2:0}, 600]
        });
        this.dataQueue.push({
            id:"foo3",
            time:startTime+1200,
            target:["dungeon-top", "player"],
            type:"move",
            data:[{0:6, 1:10, 2:-1}, {0:5, 1:10, 2:0}, 600]
        });
    }
});