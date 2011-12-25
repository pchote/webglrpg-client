// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

// Tile definition
// TODO: handle walkability info, etc 

var TilesetLoader = {
    tilesets: {},

    load: function(name) {
        var ts = this.tilesets[name];
        if (ts)
            return ts;

        this.tilesets[name] = ts = new Tileset();
        var file = "tilesets/"+name+".ts";
        new Request.JSON({
            url: file,
            method: 'get',
            link: 'chain',
            secure: true,
            onSuccess: function(json) { ts.dataRecieved(json) },
            onFailure: function() { console.error("Error fetching map "+file)},
            onError: function(text, error) {
                console.error("Error parsing map file "+file+": "+error );
                console.error(text);
            },
        }).send();

        return this.tilesets[name];
    }
}

var Tileset = new Class({
    src: null,
    sheetSize: [0,0],
    tileSize: 0,
    tiles: {},

    loaded: false,
    loadActions: [],

    // Received tileset definition JSON
    dataRecieved: function(data) {
        // Merge tileset definition into this object
        Object.merge(this, data);
        this.texture = renderer.createTexture(this.src);

        // Run whenReady actions
        this.loaded = true;
        this.loadActions.each(function(a) { a() });
        this.loadActions.length = 0;
    },

    // Add an action to run after the tileset has loaded
    whenLoaded: function(func) {
        if (this.loaded)
            func(); // Already loaded, run immediately
        else
            this.loadActions.push(func); // Add to queue
    },

    // Get the texture uv coords for a tile
    getTileCoords: function(tileIndex) {
        var t = this.tiles[tileIndex];
        var u0 = t.u*1.0/this.sheetSize[0];
        var u1 = (t.u+this.tileSize)*1.0/this.sheetSize[0];
        var v0 = 1.0 - t.v*1.0/this.sheetSize[1];
        var v1 = 1.0 - (t.v+this.tileSize)*1.0/this.sheetSize[1];
        return [u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1];
    }
});
