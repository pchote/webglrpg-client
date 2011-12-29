// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Map = {
    zoneDict: {},
    zoneList: [],

    // Sort zones for correct render order
    sortZones: function() {
        this.zoneList.sort(function(a,b) { return b.bounds[1] - a.bounds[1]; });
    },

    addZone: function(zoneId) {
        var z = new Zone(zoneId);
        this.zoneDict[zoneId] = z;
        this.zoneList.push(z);

        // Insert into render order
        z.runWhenLoaded(function() { Map.sortZones(); });
    },

    removeZone: function(zoneId) {
        this.actorList.erase(this.zoneDict[zoneId]);
        delete this.zoneDict[zoneId];
    },

    tick: function(dt) {
        for (var z in this.zoneDict)
            this.zoneDict[z].tick(dt);
    },

    draw: function(dt) {
        for (var z in this.zoneDict)
            this.zoneDict[z].draw();
    }
}

var Zone = new Class({
    // Zone Data
    data: {},

    // Actors stored by key for easy lookup
    actorDict: {},

    // Actors stored as an array for easy sorting and enumeration
    actorList: [],

    // Actions to run when the map has loaded
    onLoadActions: [],
    runWhenLoaded: function(a) {
        if (this.loaded) a();
        else this.onLoadActions.push(a);
    },

    // Zone ctor
    initialize: function(zoneId) {
        // TODO: Check LocalStorage / IndexDB for cached data
        // Pull zone data from server
        this.id = zoneId;
        var self = this;
        new Request.JSON({
            url: "maps/"+zoneId+".map",
            method: 'get',
            link: 'chain',
            secure: true,
            onSuccess: function(json) { self.onJsonLoaded(json) },
            onFailure: function() { console.error("Error fetching zone "+zoneId)},
            onError: function(text, error) {
                console.error("Error parsing zone "+zoneId+": "+error );
                console.error(text);
            },
        }).send();
    },

    // Recieved zone definition JSON
    onJsonLoaded: function(data) {
        this.bounds = data.bounds;
        this.size = [data.bounds[2] - data.bounds[0], data.bounds[3] - data.bounds[1]];
        this.cells = data.cells;
        var self = this;

        // Load tileset if necessary, then create level geometry
        this.tileset = TilesetLoader.load(data.tileset);
        this.tileset.runWhenLoaded(function() { self.onTilesetLoaded(); });

        // Load actors
        data.actors.each(function(a) { self.addActor(a) });
    },

    onTilesetLoaded: function() {
        // Initialize zone geometry
        this.vertexPosBuf = [];
        this.vertexTexBuf = [];
        this.walkability = [];

        for (var j = 0, k = 0; j < this.size[1]; j++) {
            var vertices = [];
            var vertexTexCoords = [];
            for (var i = 0; i < this.size[0]; i++, k++) {
                var cell = this.cells[k];
                this.walkability[k] = Direction.All;

                var n = Math.floor(cell.length / 3);
                for (var l = 0; l < n; l++) {
                    var tilePos = vec3.create([this.bounds[0] + i, this.bounds[1] + j, cell[3*l+2]]);
                    this.walkability[k] &= this.tileset.getWalkability(cell[3*l]);
                    vertices = vertices.concat(this.tileset.getTileVertices(cell[3*l], tilePos));
                    vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileTexCoords(cell[3*l], cell[3*l+1]));
                }

                // Custom walkability
                if (cell.length == 3*n+1)
                    this.walkability[k] = cell[3*n];
            }
            this.vertexPosBuf[j] = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
            this.vertexTexBuf[j] = renderer.createBuffer(vertexTexCoords, gl.STATIC_DRAW, 2);
        }

        this.loaded = true;
        console.log("Initialized zone", this.id);

        this.onLoadActions.each(function(a) { a(); });
        this.onLoadActions.length = 0;
    },

    // Instantiate and add an actor to the zone
    addActor: function (actorData) {
        actorData.zone = this;
        var a = ActorLoader.load(actorData);
        this.actorDict[actorData.id] = a;
        this.actorList.push(a);
    },

    // Remove an actor from the zone
    removeActor: function (id) {
        this.actorList.erase(this.actorDict[id]);
        delete this.actorDict[id];
    },

    // Calculate the height of a point in the zone
    getHeight: function(x, y) {
        if (!this.isInZone(x, y)) {
            console.error("Requesting height for ["+x+", "+y+"] outside zone bounds");
            return 0;
        }

        var i = Math.floor(x);
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
        var cell = this.cells[(j - this.bounds[1])*this.size[0] + i - this.bounds[0]];
        var n = Math.floor(cell.length/3);
        for (var l = 0; l < n; l++) {
            var poly = this.tileset.getTileWalkPoly(cell[3*l]);
            if (!poly)
                continue;

            // Loop over triangles
            for (var p = 0; p < poly.length; p++) {
                var uv = getUV(poly[p], dp);
                var w = uv[0] + uv[1];
                if (w <= 1)
                    return cell[3*l+2] + (1-w)*poly[p][0][2] + uv[0]*poly[p][1][2] + uv[1]*poly[p][2][2];
            }
        }

        // Use the height of the first tile in the cell
        return cell[2];
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
        for (var j = this.size[1] - 1; j >= 0; j--) {
            gl.clear(gl.DEPTH_BUFFER_BIT);
            this.drawRow(j);

            for (; k < maxK && this.actorList[k].pos[1] >= j + this.bounds[1]; k++)
                this.actorList[k].draw();
        }

        mvPopMatrix();
    },

    tick: function(dt) {
        if (!this.loaded)
            return;

        this.actorList.each(function(a) { a.tickOuter(dt); });
    },

    isInZone: function(x, y) {
        return x >= this.bounds[0] && y >= this.bounds[1] &&
               x < this.bounds[2] && y < this.bounds[3]
    },

    isWalkable: function(x, y, direction) {
        if (!this.isInZone(x,y))
            return null;

        var i = Math.floor();
        var j = Math.floor(y - this.bounds[1]);

        return (this.walkability[(y - this.bounds[1])*this.size[0] + x - this.bounds[0]] & direction) != 0;
    }
});