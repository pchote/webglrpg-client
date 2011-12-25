// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Facings = {Left : "left", Right : "right", Up : "up", Down : "down"};
var Actors = [];

var Actor = new Class({
    src: null,
    srcSize: {w:0, h:0},
    size: {w:0, h:0},
    frames: {},    
    drawOffset: vec3.create(),
    hotspotOffset: vec3.create(),
    animFrame: 0,

    pos: vec3.create(),
    facing: Facings.Right,

    initialize: function(data) {
        if (data) {
            if (data.x)
                this.pos[0] = data.x;
            if (data.y)
                this.pos[1] = data.y;
            if (data.facing)
                this.facing = data.facing;
        }

        this.texture = renderer.createTexture(this.src);
        var vv = function(i,j) { return [i, 0, j] };
        var v = [vv(0,0), vv(this.size.w/16, 0), vv(this.size.w/16, this.size.h/16), vv(0, this.size.h/16)];

        var vertices = [[v[2], v[3], v[0]], [v[2], v[0], v[1]]].flatten();
        var vertexTexCoords = this.getTexCoords();

        this.vertexPosBuf = renderer.createBuffer(vertices, gl.STATIC_DRAW, 3);
        this.vertexTexBuf = renderer.createBuffer(vertexTexCoords, gl.DYNAMIC_DRAW, 2);
    },

    getTexCoords: function(i) {
        var t = this.frames[this.facing][this.animFrame % 4];
        var u1 = t.u*1.0/this.srcSize.w;
        var u0 = (t.u+this.size.w)*1.0/this.srcSize.w;
        var v0 = 1.0 - t.v*1.0/this.srcSize.h;
        var v1 = 1.0 - (t.v+this.size.h)*1.0/this.srcSize.h;

        return [u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1];
    },

    draw: function() {
        mvPushMatrix();
        renderer.setCamera();
        mat4.translate(mvMatrix, this.pos);
        
        // Undo rotation so that character plane is normal to LOS
        mat4.rotate(mvMatrix, degToRad(-renderer.cameraAngle), [1, 0, 0]);
        mat4.translate(mvMatrix, this.drawOffset);
        renderer.bindBuffer(this.vertexPosBuf, shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf, shaderProgram.vertexColorAttribute);
        renderer.bindTexture(this.texture);

        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);
        mvPopMatrix();
    },

    tick: function(dt) {}
});