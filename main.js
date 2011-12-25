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

var mapLoaded = false;
var actorsLoaded = false;
var texturesLoaded = false;
function updateLoadScreen() {
    if (!mapLoaded && map.loadedGeometry) {
        mapLoaded = true;
        $('map-done').appendText('Done');
    }

    if (!actorsLoaded && map.actorList.every(function(a) { a.templateLoaded })) {
        actorsLoaded = true;
        $('actors-done').appendText('Done');
    }

    if (!texturesLoaded && !Object.filter(renderer.textures, function(k) { return k.loaded }).length) {
        texturesLoaded = true;
        $('art-done').appendText('Done');
    }

    if (mapLoaded && actorsLoaded && texturesLoaded) {
        $('loadscreen').setStyle('display', 'none');
        $('glcanvas').setStyle('display', 'block');
        return null;
    }
    return updateLoadScreen;
}

function start() {
    renderer = new Renderer("glcanvas");
    if (!renderer.initializedWebGl) {
        console.error("Renderer init failed - exiting");
        return;
    }

    map = new Map("test");
    map.runAfterTick(updateLoadScreen);
    tick();
}