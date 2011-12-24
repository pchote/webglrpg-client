// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

// Tile definition
// TODO: handle walkability info, etc 
Tile = function(u, v) {
    this.u = u;
    this.v = v;
}

var Tileset = new Class({
    // Tileset from http://opengameart.org/content/desert-tileset-0
    src: "desert_1.gif",
    srcWidth: 256,
    srcHeight: 512,
    tileSize: 16,
    
    tiles: {
        0: new Tile(16, 16), // Grass
        1: new Tile(16, 64)  // Water
    },

    initialize: function() {
        this.texture = renderer.createTexture(this.src);
    },

    // Return the texture uv coords for the vertices of a tile
    getTileCoords: function(tileIndex) {
        var t = this.tiles[tileIndex];
        var u0 = t.u*1.0/this.srcWidth;
        var u1 = (t.u+this.tileSize)*1.0/this.srcWidth;
        var v0 = 1.0 - t.v*1.0/this.srcHeight;
        var v1 = 1.0 - (t.v+this.tileSize)*1.0/this.srcHeight;
        return [u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1];
    }
});
