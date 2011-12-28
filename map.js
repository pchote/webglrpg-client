// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Map = new Class({
    // Map Data
    data: {},

    // Actors stored by key for easy lookup
    actorDict: {},

    // Actors stored as an array for easy sorting and enumeration
    actorList: [],

    // Actions to run after the map ticks
    // Won't run until the map has loaded
    afterTick: [],
    runAfterTick: function(a) {
        this.afterTick.push(a);
    },

    // Actions to run when the map has loaded
    onLoadActions: [],
    runWhenLoaded: function(a) {
        if (this.loaded)
            a();
        else
            this.onLoadActions.push(a);
    },

    // Request the map data
    initialize: function(name) {
        var file = "maps/"+name+".map";
        var self = this;
        new Request.JSON({
            url: file,
            method: 'get',
            link: 'chain',
            secure: true,
            onSuccess: function(json) { self.onDataRecieved(json) },
            onFailure: function() { console.error("Error fetching map "+file)},
            onError: function(text, error) {
                console.error("Error parsing map file "+file+": "+error );
                console.error(text);
            },
        }).send();
    },

    // Recieved map definition JSON
    onDataRecieved: function(data) {
        this.data = data;
        var self = this;

        // Load tileset if necessary, then create level geometry
        this.tileset = TilesetLoader.load(data.tileset);
        this.tileset.runWhenLoaded(function() { self.onTilesetLoaded(); });

        // Load actors
        data.actors.each(function(a) { self.addActor(a) });
    },

    // Parse map data and create level
    onTilesetLoaded: function() {
        // Initialize map geometry
        this.vertexPosBuf = [];
        this.vertexTexBuf = [];
        this.walkability = [];
        var t = this.data.tiles;
        for (var j = 0, k = 0; j < this.data.height; j++) {
            var vertices = [];
            var vertexTexCoords = [];
            for (var i = 0; i < this.data.width; i++, k++) {
                var tt = this.data.tiles[k];
                var n = Math.floor(tt.length / 3);
                this.walkability[k] = Direction.All;

                for (var l = 0; l < n; l++) {
                    this.walkability[k] &= this.tileset.getWalkability(tt[3*l]);
                    vertices = vertices.concat(this.tileset.getTileVertices(tt[3*l], vec3.create([i,j,tt[3*l+2]])));
                    vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileTexCoords(tt[3*l], tt[3*l+1]));
                }

                // Custom walkability
                if (tt.length == 3*n+1)
                    this.walkability[k] = tt[3*n];
            }
            this.vertexPosBuf[j] = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
            this.vertexTexBuf[j] = renderer.createBuffer(vertexTexCoords, gl.STATIC_DRAW, 2);
        }
        this.loaded = true;
        console.log("Loaded tileset definition", this.src);

        this.onLoadActions.each(function(a) { a(); });
        this.onLoadActions.length = 0;
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
        var dp = [x - i, y - j];

        // Calculate point inside a triangle
        var getUV = function(t, p) {
            // Vectors relative to first vertex
            var u = [t[1][0] - t[0][0], t[1][1] - t[0][1]];
            var v = [t[2][0] - t[0][0], t[2][1] - t[0][1]];

            // Calculate basis transformation
            var d = 1 / (u[0]*v[1] - u[1]*v[0]);
            var T = [d*v[1], -d*v[0], -d*u[1],  d*u[0]];

            // Return new coords
            var u = (p[0] - t[0][0])*T[0] + (p[1] - t[0][1])*T[1];
            var v = (p[0] - t[0][0])*T[2] + (p[1] - t[0][1])*T[3];
            return [u,v];
        }

        // Check if any of the tiles defines a custom walk polygon
        var tiles = this.data.tiles[j*this.data.width + i];
        var n = Math.floor(tiles.length/3);
        for (var l = 0; l < n; l++) {
            var poly = this.tileset.getTileWalkPoly(tiles[3*l]);
            if (!poly)
                continue;

            // Loop over triangles
            for (var p = 0; p < poly.length; p++) {
                var uv = getUV(poly[p], dp);
                var w = uv[0] + uv[1];
                if (w <= 1)
                    return tiles[3*l+2] + (1-w)*poly[p][0][2] + uv[0]*poly[p][1][2] + uv[1]*poly[p][2][2];
            }
        }

        // Use the height of the first tile in the cell
        return tiles[2];
    },

    drawRow: function(row) {
        renderer.bindBuffer(this.vertexPosBuf[row], shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf[row], shaderProgram.textureCoordAttribute);
        renderer.bindTexture(this.tileset.texture);

        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf[row].numItems);
    },

    draw: function() {
        if (!this.loaded)
            return;

        this.actorList.sort(function(a,b) { return b.pos[1] - a.pos[1]; })
        mvPushMatrix();
        renderer.setCamera();

        var k = 0, maxK = this.actorList.length;
        for (var j = this.data.height - 1; j >= 0; j--) {
            gl.clear(gl.DEPTH_BUFFER_BIT);
            this.drawRow(j);

            for (; k < maxK && this.actorList[k].pos[1] >= j; k++)
                this.actorList[k].draw();
        }

        mvPopMatrix();
    },

    tick: function(dt) {
        if (!this.loaded)
            return;

        this.actorList.each(function(a) { a.tickOuter(dt); });

        if (this.afterTick.length)
            this.afterTick = this.afterTick.map(function(a) { return a(); }).clean();
    },


    isWalkable: function(x, y, direction) {
        if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
            return null;
        var k = y*this.data.width + x;
        return (this.walkability[k] & direction) != 0;
    }
});