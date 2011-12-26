// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    // Character art from http://opengameart.org/content/twelve-16x18-rpg-character-sprites-including-npcs-and-elementals
    src: "elementals.gif",
    srcSize: {w:64, h:128},
    size: {w:16, h:18},
    frames: {
        "up" : [
            {u: 0, v: 0},
            {u: 16, v: 0},
            {u: 32, v: 0},
            {u: 48, v: 0}
        ],
        "right" : [
            {u: 0, v: 18},
            {u: 16, v: 18},
            {u: 32, v: 18},
            {u: 16, v: 18}
        ],
        "down" : [
            {u: 0, v: 36},
            {u: 16, v: 36},
            {u: 32, v: 36},
            {u: 16, v: 36}
        ],
        "left" : [
            {u: 48, v: 0},
            {u: 48, v: 18},
            {u: 48, v: 36},
            {u: 48, v: 18}
        ]
    },
    drawOffset: vec3.create([0, 0, 0]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),

    pos: vec3.create(),
};
