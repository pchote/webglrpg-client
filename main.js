// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var renderer;
var network;
var debug;

var lastTime = 0;
function tick() {
    requestAnimFrame(tick);

    var tickTime = new Date().getTime();
    if (lastTime != 0) {
        network.tick(tickTime);
        Map.tick(tickTime);
    }
    renderer.drawScene(function() {
        Map.draw();
    });

    lastTime = tickTime;
    FrameCounter.tick(new Date().getTime() - tickTime);
}

function showError(msg) {
    $('loadscreen').setStyle('display', 'none');
    $('glcanvas').setStyle('display', 'none');
    $('errorscreen').setStyle('display', 'block');
    $('errormessage').set('html', msg);
};

function start() {
    debug = new Debug(true);
    LoadScreen.init();
    FrameCounter.init();
    Keyboard.init();

    network = new Network();
    renderer = new Renderer("glcanvas");
    if (!renderer.initializedWebGl) {
        debug.error("Renderer init failed - exiting");
        return;
    }

    Map.loadZone("dungeon-top");
    Map.loadZone("dungeon-bottom");
    Map.zoneList.each(function(z) { z.runWhenLoaded(LoadScreen.onZoneLoaded) });

    //network.injectTestData.bind(network).delay(1000);
    tick();
}

var LoadScreen = {
    init: function() {
        $('loadscreen').setStyle('display', 'block');
        $('glcanvas').setStyle('display', 'none');
    },

    onZoneLoaded: function() {
        if (!Map.zoneList.every(function(z) { return z.loaded; }))
            return;

        $('loadscreen').setStyle('display', 'none');
        $('glcanvas').setStyle('display', 'block');
    }
}

var FrameCounter = {
    frames: 0,
    init: function() {
        FrameCounter.fpsDisplay = document.getElementById("fpscounter");
        FrameCounter.frameDisplay = document.getElementById("frametimer");
        FrameCounter.update();
    },

    tick: function(frameTime) {
        FrameCounter.frames++;
        FrameCounter.frameDisplay.set('html', frameTime);
    },

    update: function() {
        window.setTimeout(FrameCounter.update, 1000);
        FrameCounter.fpsDisplay.set('html', FrameCounter.frames);
        FrameCounter.frames = 0;
    }
}

