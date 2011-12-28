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
        this.tilesets[name].file = "tilesets/"+name+".ts";
        new Request.JSON({
            url: this.tilesets[name].file,
            method: 'get',
            link: 'chain',
            secure: true,
            onSuccess: function(json) { ts.onJsonLoaded(json) },
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

    // Actions to run when the tileset has loaded
    onLoadActions: [],
    runWhenLoaded: function(a) {
        if (this.loaded)
            a();
        else
            this.onLoadActions.push(a);
    },

    // Received tileset definition JSON
    onJsonLoaded: function(data) {
        // Merge tileset definition into this object
        Object.merge(this, data);

        this.texture = renderer.createTexture(this.src);
        var self = this;
        this.texture.runWhenLoaded(function() { self.onTextureLoaded() });

        if (this.bgColor)
    	    gl.clearColor(this.bgColor[0]/255, this.bgColor[1]/255, this.bgColor[2]/255, 1.0);
    },

    onTextureLoaded: function() {
        this.loaded = true;
        console.log("Initialized tileset", this.file);

        this.onLoadActions.each(function(a) { a() });
        this.onLoadActions.length = 0;
    },

    getTileVertices: function(id, offset) {
        return this.tileGeometry[id].v.map(function(poly) {
            return poly.map(function(v) {
                return [v[0] + offset[0], v[1] + offset[1], v[2] + offset[2]];
            });
        }).flatten();
    },

    getWalkability: function(tileId) {
        return this.tileGeometry[tileId].d;
    },

    getTileWalkPoly: function(tileId) {
        return this.tileGeometry[tileId].w;
    },

    getTileTexCoords: function(id, texId) {
        var o = this.tiles[texId];
        var s = [this.tileSize/this.sheetSize[0], this.tileSize/this.sheetSize[1]];
        return this.tileGeometry[id].t.map(function(poly) {
            return poly.map(function(v) {
                return [(v[0] + o[0])*s[0], (v[1] + o[1])*s[1]];
            });
        }).flatten();
    }
});
