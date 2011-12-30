// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    // Character art from http://opengameart.org/content/twelve-16x18-rpg-character-sprites-including-npcs-and-elementals
    src: "art/elementals.gif",
    sheetSize: [64,128],
    tileSize: [16,18],
    frames: {
        "up" : [
            [0,0],
            [16,0],
            [32,0],
            [48,0]
        ],
        "right" : [
            [0,18],
            [16,18],
            [32,18],
            [16,18]
        ],
        "down" : [
            [0,36],
            [16,36],
            [32,36],
            [16,36]
        ],
        "left" : [
            [48,0],
            [48,18],
            [48,36],
            [48,18]
        ]
    },
    drawOffset: vec3.create([0, 0, 0.2]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),
};