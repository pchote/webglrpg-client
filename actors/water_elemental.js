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
            [0,54],
            [16,54],
            [32,54],
            [48,54]
        ],
        "right" : [
            [0,72],
            [16,72],
            [32,72],
            [16,72]
        ],
        "down" : [
            [0,90],
            [16,90],
            [32,90],
            [16,90]
        ],
        "left" : [
            [48,54],
            [48,72],
            [48,90],
            [48,72]
        ]
    },
    drawOffset: vec3.create([0, 1, 0.2]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),
};