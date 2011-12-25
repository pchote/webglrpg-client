// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    // Character art from http://opengameart.org/content/chara-seth-scorpio
    src: "player.gif",
    srcSize: {w:128, h:256},
    size: {w:24, h:32},
    frames: {
        "up" : [
            {u: 0, v: 0},
            {u: 24, v: 0},
            {u: 48, v: 0},
            {u: 24, v: 0}
        ],
        "right" : [
            {u: 0, v: 32},
            {u: 24, v: 32},
            {u: 48, v: 32},
            {u: 24, v: 32}
        ],
        "down" : [
            {u: 0, v: 64},
            {u: 24, v: 64},
            {u: 48, v: 64},
            {u: 24, v: 64}
        ],
        "left" : [
            {u: 0, v: 96},
            {u: 24, v: 96},
            {u: 48, v: 96},
            {u: 24, v: 96}
        ]
    },
    drawOffset: vec3.create([-0.25, 0, 0]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),

    // Should the camera follow the player?
    bindCamera: true,

    accumTime: 0,
    lastFacing: Facings.Right,
    tick: function(dt) {
        this.accumTime += dt;
        if (this.accumTime > 250 || this.facing != this.lastFacing) {
            this.accumTime = 0;
            this.animFrame++;
            renderer.updateBuffer(this.vertexTexBuf, this.getTexCoords());
            this.lastFacing = this.facing;
        }

        switch (this.facing)
        {
            case Facings.Right:
                this.pos[0] += dt/1000;
                if (this.pos[0] >= map.data.width - 1) {
                    this.pos[0] = map.data.width - 1;
                    this.facing = Facings.Up;
                }
            break;
            case Facings.Up:
                this.pos[1] += dt/1000;
                if (this.pos[1] >= map.data.height - 1) {
                    this.pos[1] = map.data.height - 1;
                    this.facing = Facings.Left;
                }
            break;
            case Facings.Left:
                this.pos[0] -= dt/1000;
                if (this.pos[0] <= 0) {
                    this.pos[0] = 0;
                    this.facing = Facings.Down;
                }
            break;
            case Facings.Down:
                this.pos[1] -= dt/1000;
                if (this.pos[1] <= 0) {
                    this.pos[1] = 0;
                    this.facing = Facings.Right;
                }
            break;
        }

        var hx = this.pos[0]+this.hotspotOffset[0];
        var hy = this.pos[1]+this.hotspotOffset[1];
        this.pos[2] = map.getHeight(hx, hy);

        if (this.bindCamera)
            vec3.set(this.pos, renderer.cameraPosition);
    }
};
