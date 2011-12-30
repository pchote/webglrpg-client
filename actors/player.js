// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    // Character art from http://opengameart.org/content/chara-seth-scorpio
    src: "art/player.gif",
    sheetSize: [128,256],
    tileSize: [24,32],
    frames: {
        "up" : [
            [0,0],
            [24,0],
            [48,0],
            [24,0]
        ],
        "right" : [
            [0,32],
            [24,32],
            [48,32],
            [24,32]
        ],
        "down" : [
            [0,64],
            [24,64],
            [48,64],
            [24,64]
        ],
        "left" : [
            [0,96],
            [24,96],
            [48,96],
            [24,96]
        ]
    },
    drawOffset: vec3.create([-0.25, 1, 0.125]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),

    // Should the camera follow the player?
    bindCamera: true,

    tick: function(time) {
        if (!this.activityList.length) {
            var ret = this.checkInput();
            if (ret) {
                // Send activity to the server
                network.sendActivity(ret);

                // Start running activity locally to avoid latency
                // Local activity will be replaced with a server-sanitised
                // version on the next update
                this.addActivity(ret);
            }
        }
        if (this.bindCamera)
            vec3.set(this.pos, renderer.cameraPosition);
    },

    checkInput: function() {
        var moveTime = 600; // move time in ms

        var facing = Direction.None;
        switch (Keyboard.lastPressed('wsad')) {
            case 'w': facing = Direction.Up; break;
            case 's': facing = Direction.Down; break;
            case 'a': facing = Direction.Left; break;
            case 'd': facing = Direction.Right; break;
            default: return null;
        }

        var faceDir = function(facing) {
            if (this.facing == facing)
                return null;
            return ActivityLoader.create("face", [facing], this);
        }.bind(this);

        var from = vec3.create(this.pos);
        var dp = Direction.toOffset(facing);
        var to = vec3.create([Math.round(from[0] + dp[0]), Math.round(from[1] + dp[1]), 0]);

        if (!this.zone.isWalkable(this.pos[0], this.pos[1], facing))
            return faceDir(facing);

        // Check zones
        if (!this.zone.isInZone(to[0], to[1])) {
            var z = Map.zoneContaining(to[0], to[1]);
            if (!z || !z.loaded || !z.isWalkable(to[0], to[1], Direction.reverse(facing)))
                return faceDir(facing);

            return ActivityLoader.create("changezone", [this.zone.id, this.pos, z.id, to, moveTime], this);
        }

        if (!this.zone.isWalkable(to[0], to[1], Direction.reverse(facing)))
            return faceDir(facing);

        return ActivityLoader.create("move", [this.pos, to, moveTime], this);
    }

};
