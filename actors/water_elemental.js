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
            {u: 0, v: 54},
            {u: 16, v: 54},
            {u: 32, v: 54},
            {u: 48, v: 54}
        ],
        "right" : [
            {u: 0, v: 72},
            {u: 16, v: 72},
            {u: 32, v: 72},
            {u: 16, v: 72}
        ],
        "down" : [
            {u: 0, v: 90},
            {u: 16, v: 90},
            {u: 32, v: 90},
            {u: 16, v: 90}
        ],
        "left" : [
            {u: 48, v: 54},
            {u: 48, v: 72},
            {u: 48, v: 90},
            {u: 48, v: 72}
        ]
    },
    drawOffset: vec3.create([0, 0, 0]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),
    
    pos: vec3.create([2,3,0.5]),
};