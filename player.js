// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Facings = {Left : "left", Right : "right", Up : "up", Down : "down"};

var Player = new Class({
    src: "player.gif",
    srcSize: {w:128, h:256},
    size: {w:24, h:32},
    frames: {
        "up" : [
            {u: 0, v: 0},
            {u: 24, v: 0},
            {u: 48, v: 0},
            {u: 24, v: 0}
        ],
        "right" : [
            {u: 0, v: 32},
            {u: 24, v: 32},
            {u: 48, v: 32},
            {u: 24, v: 32}
        ],
        "down" : [
            {u: 0, v: 64},
            {u: 24, v: 64},
            {u: 48, v: 64},
            {u: 24, v: 64}
        ],
        "left" : [
            {u: 0, v: 96},
            {u: 24, v: 96},
            {u: 48, v: 96},
            {u: 24, v: 96}
        ]
    },

    pos: vec3.create([1,0,0]),
    drawOffset: vec3.create([-0.25, 0, 0]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),
    animFrame: 0,

    initialize: function() {
        // Character art from http://opengameart.org/content/chara-seth-scorpio
        this.texture = renderer.createTexture(this.src);
        var vv = function(i,j) { return [i, 0, j] };
        var v = [vv(0,0), vv(1.5,0), vv(1.5,2), vv(0,2)];

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
        // Hack: Characters should be displayed in a flat plane
        mat4.rotate(mvMatrix, degToRad(-renderer.cameraAngle), [1, 0, 0]);
        mat4.translate(mvMatrix, this.drawOffset);
        renderer.bindBuffer(this.vertexPosBuf, shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf, shaderProgram.vertexColorAttribute);
        renderer.bindTexture(this.texture);

        shaderProgram.setMatrixUniforms();
        //gl.disable(gl.DEPTH_TEST);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);
        //gl.enable(gl.DEPTH_TEST);
        mvPopMatrix();
    },
    
    accumTime: 0,
    facing: Facings.Right,
    lastFacing: Facings.Right,
    tick: function(dt) {
        this.accumTime += dt;
        if (this.accumTime > 250 || this.facing != this.lastFacing) {
            this.accumTime = 0;
            this.animFrame++;
            renderer.updateBuffer(this.vertexTexBuf, this.getTexCoords());
            this.lastFacing = this.facing;
        }

        switch (this.facing)
        {
            case Facings.Right:
                this.pos[0] += dt/1000;
                if (this.pos[0] >= map.data.width - 1) {
                    this.pos[0] = map.data.width - 1;
                    this.facing = Facings.Up;
                }
            break;
            case Facings.Up:
                this.pos[1] += dt/1000;
                if (this.pos[1] >= map.data.height - 1) {
                    this.pos[1] = map.data.height - 1;
                    this.facing = Facings.Left;
                }
            break;
            case Facings.Left:
                this.pos[0] -= dt/1000;
                if (this.pos[0] <= 0) {
                    this.pos[0] = 0;
                    this.facing = Facings.Down;
                }
            break;
            case Facings.Down:
                this.pos[1] -= dt/1000;
                if (this.pos[1] <= 0) {
                    this.pos[1] = 0;
                    this.facing = Facings.Right;
                }
            break;
        }

        var hx = this.pos[0]+this.hotspotOffset[0];
        var hy = this.pos[1]+this.hotspotOffset[1];
        this.pos[2] = map.getHeight(hx, hy);
    }
});