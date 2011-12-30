// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    init: function(from, fromZone, to, toZone, length) {
        this.fromZone = fromZone;
        this.toZone = toZone;
        this.from = vec3.create(from);
        this.to = vec3.create(to);
        this.facing = Direction.fromDelta([Math.round(to[0] - from[0]), Math.round(to[1] - from[1])]);
        this.length = length;
    },

    tick: function(time) {
        var a = this.actor;

        // Set facing
        if (this.facing != a.facing) {
            a.facing = this.facing;
            a.setFrame(0);
        }

        var endTime = this.startTime + this.length;
        var frac = (time - this.startTime)/this.length;
        if (time >= endTime) {
            vec3.set(this.to, a.pos);
            frac = 1;
        }
        else
            vec3.lerp(this.from, this.to, frac, a.pos);

        var newFrame = Math.floor(frac*4);
        if (newFrame != a.animFrame)
            a.setFrame(newFrame);

        // Move into the new zone
        if (!a.zone.isInZone(a.pos[0], a.pos[1])) {
            this.fromZone.removeActor(a.id);

            // Defer until aftertick to stop the actor being ticked twice
            Map.runAfterTick(function() {
                this.toZone.addActor(a);
                console.log(a.id+" changed zone from "+this.fromZone.id+" to "+this.toZone.id);
            }.bind(this));
        }

        // Calculate new height
        var hx = a.pos[0] + a.hotspotOffset[0];
        var hy = a.pos[1] + a.hotspotOffset[1];

        if (!this.switchRenderZone && !this.fromZone.isInZone(hx, hy))
            this.switchRenderZone = true;

        a.pos[2] = (this.switchRenderZone ? this.toZone : this.fromZone).getHeight(hx, hy);

        return time >= endTime;
    }
};