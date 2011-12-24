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
        this.vertexPosBuf = gl.createBuffer();
        this.vertexPosBuf.itemSize = 3;
        this.vertexPosBuf.numItems = 0;
        var vertices = [];
        
        this.vertexTexBuf = gl.createBuffer();
        this.vertexTexBuf.itemSize = 2;
        this.vertexTexBuf.numItems = 0;
        var vertexTexCoords = [];
        for (var k = 0; k <  this.mapSize[0]*this.mapSize[1]; k++) {
            var j = Math.floor(k / this.mapSize[0]), i = k % this.mapSize[0];
            var vv = function(i,j) { return [i, j, data.height[(data.size[0] + 1)*j + i]] };
            var v = [vv(i,j), vv(i+1,j), vv(i+1,j+1), vv(i,j+1)];

            var polys = (v[1][2] == v[3][2]) ?
                [[v[0], v[1], v[2]], [v[0], v[2], v[3]]] :
                [[v[1], v[2], v[3]], [v[1], v[3], v[0]]];

            vertices = vertices.concat(polys.flatten());

            this.vertexPosBuf.numItems += 6;
            vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileCoords(data.tiles[k]));
            this.vertexTexBuf.numItems += 6;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTexCoords), gl.STATIC_DRAW);
    },

    draw: function() {
        mvPushMatrix();
        mat4.translate(mvMatrix, [0.0, 0.0, -9.0]);
        mat4.rotate(mvMatrix, degToRad(this.rot), [1, 0, 0]);
        mat4.translate(mvMatrix, [-this.mapSize[0]/2.0, -this.mapSize[1]/2.0, 0.0]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPosBuf.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexBuf);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexTexBuf.itemSize, gl.FLOAT, false, 0, 0);

        this.tileset.bindTexture();
        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);

        mvPopMatrix();
    },

    rot: -45,
    tick: function(dt) {
        //this.rot += dt/200.0;
    },
});
