// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Map = new Class({
    data: {
        size: [5,5],
        tiles: [
            1,1,1,1,1,
            1,0,0,0,1,
            1,0,0,0,1,
            1,0,0,0,1,
            1,1,1,1,1
        ],

        height: [
            0,0,1.0,1.0,0,0,
            0,0,0.75,0.75,0,0,
            0,0,0.5,0.5,0,0,
            0,0,0.5,0.5,0,0,
            0,0,0,0,0,0,
            0,0,0,0,0,0
        ],
    },
    initialize: function() {
        this.mapSize = this.data.size;
        this.tileset = new Tileset();

        var vertices = [];
        var vertexTexCoords = [];
        for (var k = 0; k <  this.mapSize[0]*this.mapSize[1]; k++) {
            var j = Math.floor(k / this.mapSize[0]), i = k % this.mapSize[0];
            var w = (this.data.size[0] + 1);
            var self = this;
            var vv = function(i,j) { return [i, j, self.data.height[w*j + i]] };
            var v = [vv(i,j), vv(i+1,j), vv(i+1,j+1), vv(i,j+1)];

            var polys = (v[1][2] == v[3][2] || true) ?
                [[v[0], v[1], v[2]], [v[0], v[2], v[3]]] :
                [[v[1], v[2], v[3]], [v[1], v[3], v[0]]];

            vertices = vertices.concat(polys.flatten());
            vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileCoords(this.data.tiles[k]));
        }

        this.vertexPosBuf = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
        this.vertexTexBuf = renderer.createBuffer(vertexTexCoords, gl.STATIC_DRAW, 2);
    },

    getHeight: function(pos) {
        var i = pos[0] + 0.5;
        var j = pos[1] + 0.5;
        var ii = Math.floor(i), jj = Math.floor(j);
        var di = i - ii, dj = j - jj;

        // Vertex heights
        var w = (this.mapSize[0] + 1);
        var v = [
            vec3.create([0, 0, this.data.height[w*jj + ii]]),
            vec3.create([1, 0, this.data.height[w*jj + ii + 1]]),
            vec3.create([1, 1, this.data.height[w*(jj + 1)  + ii + 1]]),
            vec3.create([0, 1, this.data.height[w*(jj + 1) + ii]])
        ];

        // Pick 3 points to define the plane
        var p = (di - dj > 0) ? [v[0], v[1], v[2]] : [v[0], v[2], v[3]];

        // Calculate intersection of line with plane
        var l0 = vec3.create([di, dj, 0]);
        var n = vec3.create();
        vec3.subtract(p[1], p[0]);
        vec3.subtract(p[2], p[0]);
        vec3.cross(p[1], p[2], n);
        vec3.subtract(p[0], l0);
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

    rot: -45,
    tick: function(dt) {
        //this.rot += dt/200.0;
    },
});
