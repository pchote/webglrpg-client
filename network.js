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
        debug.log("received packet", p);
        switch (p.type) {
            case 'addactor':
                var d = p.data;
                var zone = Map.zoneDict[d.zone];
                if (!zone) {
                    debug.log("Recieved actor packet for unknown zone '"+d.zone+"'");
                    return;
                }

                Map.runAfterTick(function(args) {
                    // First arg is the current tick time
                    if (args[0] < d.time)
                        return true;

                    zone.loadActor(d.data);
                });
            break;
            case 'removeactor':
                var d = p.data;
                var zone = Map.zoneDict[d.zone];
                if (!zone) {
                    debug.log("Recieved actor packet for unknown zone '"+d.zone+"'");
                    return;
                }

                Map.runAfterTick(function(args) {
                    // First arg is the current tick time
                    if (args[0] < d.time)
                        return true;

                    zone.removeActor(d.id);
                });
            break;
            case 'activity':
                var d = p.data;
                var getActor = function() {
                    var actor = Map.zoneDict[d.zone].actorDict[d.actor];
                    if (actor)
                        return actor;

                    // Search other zones
                    for (var i = 0; i < Map.zoneList.length; i++) {
                        var a = Map.zoneList[i].actorDict[d.actor]
                        if (a) {
                            debug.log("Received activity for actor '"+d.actor+"' in zone '"+d.zone+"', but actor was in zone '"+Map.zoneList[i].id+"'");
                            return a;
                        }
                    }

                    // Actor not found
                    return null;
                };

                var actor = getActor();
                if (actor)
                    actor.addActivity(ActivityLoader.create(d.type, d.args, actor, d.id, d.time));
                else
                    debug.error("Received activity for unknown actor '"+d.actor+"'");
            break;
        }
    },

    sendActivity: function(activity) {
        this.dataQueue.push({
            type: "activity",
            data: activity.serialize()
        });
    },

    injectTestData: function() {
        /*
         * Packet types
         */
        var startTime = new Date().getTime();
        this.dataQueue.push({
            type:"addactor",
            data: {
                zone:"dungeon-top",
                data:{"id": "e5", "type": "water_elemental", "pos":[3,8,0], "facing":1},
                time: startTime + 1000
            }
        });

        var next = function() {
            this.dataQueue.push({
                type:"activity",
                data: {
                    id:"test2",
                    zone:"dungeon-top",
                    actor: "e5",
                    type:"move",
                    args:[[3, 8, 0], [4, 8, 0], 600],
                    time:startTime + 2000
                }
            });
            this.dataQueue.push({
                type:"activity",
                data: {
                    id:"test3",
                    zone:"dungeon-top",
                    actor: "e5",
                    type:"move",
                    args:[[4, 8, 0], [5, 8, 0], 600],
                    time:startTime + 2600
                }
            });
            this.dataQueue.push({
                type:"removeactor",
                data:{
                    zone:"dungeon-top",
                    id: "e5",
                    time:startTime + 3500
                }
            });
        }
        next.bind(this).delay(1500);
    }
});