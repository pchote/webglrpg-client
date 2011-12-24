// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Map = new Class({
    initialize: function() {
        var data = {
            size: [5,5],
            tiles: [
                1,1,1,1,1,
                1,0,0,0,1,
                1,0,0,0,1,
                1,0,0,0,1,
                1,1,1,1,1
            ],

            height: [
                0,0,0,0,0,0,
                0,0,0,0,0,0,
                0,0,0.3,0.5,0,0,
                0,0,0.4,0.2,0,0,
                0,0,0,0,0,0,
                0,0,0,0,0,0
            ],
        };

        this.mapSize = data.size;
        this.tileset = new Tileset();

        var vertices = [];
        var vertexTexCoords = [];
        for (var k = 0; k <  this.mapSize[0]*this.mapSize[1]; k++) {
            var j = Math.floor(k / this.mapSize[0]), i = k % this.mapSize[0];
            var vv = function(i,j) { return [i, j, data.height[(data.size[0] + 1)*j + i]] };
            var v = [vv(i,j), vv(i+1,j), vv(i+1,j+1), vv(i,j+1)];

            var polys = (v[1][2] == v[3][2]) ?
                [[v[0], v[1], v[2]], [v[0], v[2], v[3]]] :
                [[v[1], v[2], v[3]], [v[1], v[3], v[0]]];

            vertices = vertices.concat(polys.flatten());
            vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileCoords(data.tiles[k]));
        }

        this.vertexPosBuf = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
        this.vertexTexBuf = renderer.createBuffer(vertexTexCoords, gl.STATIC_DRAW, 2);
    },

    draw: function() {
        mvPushMatrix();
        mat4.translate(mvMatrix, [0.0, 0.0, -9.0]);
        mat4.rotate(mvMatrix, degToRad(this.rot), [1, 0, 0]);
        mat4.translate(mvMatrix, [-this.mapSize[0]/2.0, -this.mapSize[1]/2.0, 0.0]);
        
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
