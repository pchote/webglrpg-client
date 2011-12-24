// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Map = new Class({
    // Map Data
    // TODO: Load from a file
    data: {
        width: 5,
        height: 5,
        tileMap: [
            1,1,1,1,1,
            1,0,0,0,1,
            1,0,0,0,1,
            1,0,0,0,1,
            1,1,1,1,1
        ],
        heightMap: [
            0,0,1.0,1.0,0,0,
            0,0,0.75,0.75,0,0,
            0,0,0.5,0.5,0,0,
            0,0,0.5,0.5,0,0,
            0,0,0,0,0,0,
            0,0,-0.5,-0.2,0,0
        ],
    },

    initialize: function() {
        this.tileset = new Tileset();

        var vertices = [];
        var vertexTexCoords = [];
        var w = (this.data.width + 1);
        var vv = function(i,j) { return [i, j, self.data.heightMap[w*j + i]] };

        for (var j = 0, k = 0; j < this.data.height; j++) {
            for (var i = 0; i < this.data.width; i++, k++) {
                var self = this;
                var v = [vv(i,j), vv(i+1,j), vv(i+1,j+1), vv(i,j+1)];
                vertices = vertices.concat([[v[0], v[1], v[2]], [v[0], v[2], v[3]]].flatten());
                vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileCoords(this.data.tileMap[k]));
            }
        }
        this.vertexPosBuf = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
        this.vertexTexBuf = renderer.createBuffer(vertexTexCoords, gl.STATIC_DRAW, 2);
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
        mvPushMatrix();
        renderer.setCamera();
        renderer.bindBuffer(this.vertexPosBuf, shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf, shaderProgram.vertexColorAttribute);
        renderer.bindTexture(this.tileset.texture);

        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);

        mvPopMatrix();
    },

    tick: function(dt) {},
});