// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    // Character art from http://opengameart.org/content/chara-seth-scorpio
    src: "player.gif",
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
    drawOffset: vec3.create([-0.25, 0, 0.125]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),

    // Should the camera follow the player?
    bindCamera: true,

    init: function() {
        this.addActivity(new Activities.InputWatcher());
    },

    tick: function() {
        if (this.bindCamera)
            vec3.set(this.pos, renderer.cameraPosition);
    }
};
