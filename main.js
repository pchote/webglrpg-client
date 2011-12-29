// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var renderer;

var lastTime = 0;
function tick() {
    requestAnimFrame(tick);

    var startTime = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = startTime - lastTime;
        Map.tick(elapsed);
    }
    renderer.drawScene(function() {
        Map.draw();
    });

    lastTime = startTime;
    FrameCounter.tick(new Date().getTime() - startTime);
}

function showError(msg) {
    $('loadscreen').setStyle('display', 'none');
    $('glcanvas').setStyle('display', 'none');
    $('errorscreen').setStyle('display', 'block');
    $('errormessage').set('html', msg);
};

function start() {
    LoadScreen.init();
    FrameCounter.init();
    document.onkeydown = Keyboard.onKeyDown;
    document.onkeyup = Keyboard.onKeyUp;

    renderer = new Renderer("glcanvas");
    if (!renderer.initializedWebGl) {
        console.error("Renderer init failed - exiting");
        return;
    }

    Map.loadZone("dungeon-top").runWhenLoaded(LoadScreen.onZoneLoaded);
    Map.loadZone("dungeon-bottom").runWhenLoaded(LoadScreen.onZoneLoaded);

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

var Keyboard = {
    activeKeys: [],
    shift: false,

    onKeyDown: function(e) {
        var c = String.fromCharCode(e.keyCode);
        if (Keyboard.activeKeys.indexOf(c) < 0)
            Keyboard.activeKeys.push(c);
        Keyboard.shift = e.shiftKey;
    },

    onKeyUp: function(e) {
        var c = String.fromCharCode(e.keyCode);
        Keyboard.activeKeys.erase(c);
    },

    // Return the last pressed key in keys
    lastPressed: function(keys) {
        var lower = keys.toUpperCase();
        var max = null;
        var maxI = -1;
        for (var i = 0; i < keys.length; i++) {
            var k = lower[i];
            var index = Keyboard.activeKeys.indexOf(k);
            if (index > maxI) {
                max = k;
                maxI = index;
            }
        }
        return max;
    }
}
