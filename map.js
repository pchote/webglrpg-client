// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Map = new Class({
    loadedGeometry: false,
    loadedActors: false,

    // Map Data
    data: {},

    // Actors stored by key for easy lookup
    actorDict: {},

    // Actors stored as an array for easy sorting and enumeration
    actorList: [],

    // Request the map data
    initialize: function(name) {
        var file = "maps/"+name+".map";
        var self = this;
        new Request.JSON({
            url: file,
            method: 'get',
            link: 'chain',
            secure: true,
            onSuccess: function(json) { self.dataRecieved(json) },
            onFailure: function() { console.error("Error fetching map "+file)},
            onError: function(text, error) {
                console.error("Error parsing map file "+file+": "+error );
                console.error(text);
            },
        }).send();
    },

    // Recieved map definition JSON
    dataRecieved: function(data) {
        this.data = data;
        var self = this;

        // Load tileset if necessary, then create level geometry
        this.tileset = TilesetLoader.load(data.tileset);
        this.tileset.whenLoaded(function() { self.createGeometry() });

        // Load actors
        data.actors.each(function(a) { self.addActor(a) });
        this.loadedActors = true;
    },

    // Parse map data and create level
    createGeometry: function() {
        var self = this;

        // Initialize map geometry
        var vertices = [];
        var vertexTexCoords = [];
        var w = (this.data.width + 1);
        var vv = function(i,j) { return [i, j, self.data.heightMap[w*j + i]] };

        for (var j = 0, k = 0; j < this.data.height; j++) {
            for (var i = 0; i < this.data.width; i++, k++) {
                var v = [vv(i,j), vv(i+1,j), vv(i+1,j+1), vv(i,j+1)];
                vertices = vertices.concat([[v[0], v[1], v[2]], [v[0], v[2], v[3]]].flatten());
                vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileCoords(this.data.tileMap[k]));
            }
        }
        this.vertexPosBuf = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
        this.vertexTexBuf = renderer.createBuffer(vertexTexCoords, gl.STATIC_DRAW, 2);
        this.loadedGeometry = true;
    },

    // Instantiate and add an actor to the map
    addActor: function (data) {
        var a = ActorLoader.load(data.type, data);
        this.actorDict[data.id] = a;
        this.actorList.push(a);
    },

    // Remove an actor from the map
    removeActor: function (id) {
        var a = this.actorDict[id];
        this.actorList.erase(a);
        delete this.actorDict[id];
    },

    // Calculate the height of a point in the map
    getHeight: function(x, y) {
        if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height) {
            console.error("Requesting height for ["+x+","+y+"] outside of map bounds");
            return 0;
        }

        var i = Math.floor(x)
        var j = Math.floor(y);
        var dxy = vec3.create([x - i, y - j, 0]);

        // Vertex heights
        var w = (this.data.width + 1);
        var v = [
            vec3.create([0, 0, this.data.heightMap[w*j + i]]),
            vec3.create([1, 0, this.data.heightMap[w*j + i + 1]]),
            vec3.create([1, 1, this.data.heightMap[w*(j + 1)  + i + 1]]),
            vec3.create([0, 1, this.data.heightMap[w*(j + 1) + i]])
        ];

        // Pick 3 points to define the plane
        var p = (dxy[0] - dxy[1] > 0) ? [v[0], v[1], v[2]] : [v[0], v[2], v[3]];

        // Calculate intersection of line with plane
        var n = vec3.create();
        vec3.subtract(p[1], p[0]);
        vec3.subtract(p[2], p[0]);
        vec3.cross(p[1], p[2], n);
        vec3.subtract(p[0], dxy);
        return vec3.dot(p[0], n) / n[2];
    },

    draw: function() {
        if (!this.loadedGeometry || !this.loadedActors)
            return;

        mvPushMatrix();
        renderer.setCamera();
        renderer.bindBuffer(this.vertexPosBuf, shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf, shaderProgram.vertexColorAttribute);
        renderer.bindTexture(this.tileset.texture);

        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);

        mvPopMatrix();

        // Sort actors by draw order and render
        this.actorList.sort(function(a,b) { return b.pos[1] - a.pos[1]; })
        this.actorList.each(function(a) { a.draw(); });
    },

    // Actions to run after the map ticks
    // Actions should return a new action to run in the next tick, or null
    afterTick: [],
    tick: function(dt) {
        this.actorList.each(function(a) { a.tick(dt); });

        if (this.afterTick.length)
            this.afterTick = this.afterTick.map(function(a) { return a(); }).clean();
    },

    runAfterTick: function(a) {
        this.afterTick.push(a);
    }
});