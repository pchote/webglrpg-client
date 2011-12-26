// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Facings = {Left : "left", Right : "right", Up : "up", Down : "down"};
var ActorLoader = {
    actorTypes: [],

    // Instances that require loading
    actorInstances: {},

    load: function(type, data) {
        // Actor hasn't been loaded - create a skeleton class and return an instance
        // The class will be extended with real behavior after load, updating all instances
        if (typeof(this.actorTypes[type]) === 'undefined') {
            this.actorTypes[type] = new Class({
                Extends: Actor
            });

            this.actorInstances[type] = [];
            var self = this;
            var file = "actors/"+type+".js";
            new Request({
                url: file,
                method: 'get',
                link: 'chain',
                onSuccess: function(json) {
                    var def = {};
                    try { eval(json); }
                    catch (e) {
                        var lineNumber = '';
                        // Dirty browser specific hack to determine line number in loaded file
                        if (e.lineNumber)
                            lineNumber = e.lineNumber - new Error().lineNumber + 6;

                        console.log("Error loading "+file+":"+lineNumber);
                        console.log(e.message);
                    }
                    self.actorTypes[type].implement(def);
                    self.actorTypes[type].implement({ templateLoaded: true });

                    // Instantiate existing actor instances
                    self.actorInstances[type].each(function(i) { i.instance.whenLoaded(i.data); });
                },
                onFailure: function() { console.error("Error fetching actor definition: "+file)},
            }).send();
        }

        var instance = new this.actorTypes[type]();
        if (instance.templateLoaded)
            instance.whenLoaded(data);
        else
            this.actorInstances[type].push({'instance' : instance, 'data' : data});

        return instance;
    }
}

var Actor = new Class({
    templateLoaded: false,
    src: null,
    srcSize: {w:0, h:0},
    size: {w:0, h:0},
    frames: {},    
    drawOffset: vec3.create(),
    hotspotOffset: vec3.create(),
    animFrame: 0,

    pos: vec3.create(),
    facing: Facings.Right,

    whenLoaded: function(data) {
        if (data) {
            if (data.id)
                this.id = data.id;
            if (data.pos)
                vec3.set(data.pos, this.pos);
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
        this.loaded = true;
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
        if (!this.loaded)
            return;

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