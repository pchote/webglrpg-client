// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var map;
var renderer;

var lastTime = 0;
function tick() {
    requestAnimFrame(tick);
    renderer.drawScene(function() {
        map.draw();
    });

    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        map.tick(elapsed);
    }
    lastTime = timeNow;
}

function start() {
    renderer = new Renderer("glcanvas");
    if (!renderer.initializedWebGl) {
        console.error("Renderer init failed - exiting");
        return;
    }

    map = new Map("maps/test.map");
    tick();
}