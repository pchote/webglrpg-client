// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    // Character art from http://opengameart.org/content/twelve-16x18-rpg-character-sprites-including-npcs-and-elementals
    src: "art/sewer.png",
    sheetSize: [256,256],
    tileSize: [16,16],
    frames: {
        "up" : [
            [0,144],
            [16,144],
            [32,144],
            [48,144],
            [64,144],
            [80,144]
        ],
    },
    drawOffset: vec3.create([0, 0, 0]),
    hotspotOffset: vec3.create([0.5, 0.5, 0]),

    lastTime: 0,
    accumTime: 0,    
    blowTime: 0,
    frameTime: 150,

    init: function() {
        this.blowTime = Number.random(0, 5000);
    },

    tick: function(time) {
        if (lastTime == 0) {
            lastTime = time;
            return;
        }

        this.accumTime += time - lastTime;

        if (this.accumTime < this.frameTime)
            return;

        if (this.animFrame == 0 && this.accumTime < this.blowTime)
            return;

        if (this.animFrame == 5) {
            this.setFrame(0);
            this.blowTime = Number.random(1000, 5000);
        } else {
            this.setFrame(this.animFrame + 1);
            this.accumTime = 0;
        }
    },

    draw: function() {
        if (!this.loaded)
            return;

        mvPushMatrix();
        mat4.translate(mvMatrix, this.pos);

        // Lie flat on the ground
        mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);
        mat4.translate(mvMatrix, this.drawOffset);
        renderer.bindBuffer(this.vertexPosBuf, shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf, shaderProgram.textureCoordAttribute);
        renderer.bindTexture(this.texture);

        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);
        mvPopMatrix();
    },
};