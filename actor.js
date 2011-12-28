// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Facings = {
    None: 0,
    Right: 1,
    Up: 2,
    Left: 4,
    Down: 8,
    fromDelta: function(dp) {
        if (dp[0] > 0)
            return Facings.Right;
        if (dp[0] < 0)
            return Facings.Left;
        if (dp[1] > 0)
            return Facings.Up;
        if (dp[1] < 0)
            return Facings.Down;
        return 0;
    }
};
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
        if(map.loadedGeometry)
            this.init();
    },

    getTexCoords: function(i) {
        var facingFrameMap = {};
        facingFrameMap[Facings.Left] = "left";
        facingFrameMap[Facings.Right] = "right";
        facingFrameMap[Facings.Up] = "up";
        facingFrameMap[Facings.Down] = "down";
        var t = this.frames[facingFrameMap[this.facing]][this.animFrame % 4];
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

    setFrame: function(frame) {
        this.animFrame = frame;
        renderer.updateBuffer(this.vertexTexBuf, this.getTexCoords());
    },

    activityQueue: [],
    addActivity: function(a) {
        this.activityQueue.push(a);
    },

    clearActivityQueue: function() {
        this.activityQueue.length = 0;
    },

    tick: function(dt) {
        // dt will be decremented by actions
        var args = {"dt": dt};
        if (!this.activityQueue.length)
            return;

        while (dt > 0) {
            // Remove and tick the first item in the queue
            var ret = this.activityQueue.shift().tick(this, args);

            // Insert returned actions back into the queue
            for (var i = ret.length-1; i >= 0; i--)
                this.activityQueue.splice(0, 0, ret[i]);
            dt = args.dt;
        }
    },

    // Called when the actor and map are fully loaded
    init: function() {}
});

var Activities = {}
Activities.Move = new Class({
    type: "Move",
    accumTime: 0,
    delta: vec3.create(),

    initialize: function(from, to, length) {
        this.from = vec3.create(from);
        this.to = vec3.create(to);
        this.facing = Facings.fromDelta([Math.round(to[0] - from[0]), Math.round(to[1] - from[1])]);
        this.length = length;
    },

    tick: function(a, args) {
        // Set facing
        if (this.accumTime == 0) {
            if (this.facing != a.facing)
                return [new Activities.Face(this.facing), this];
        }

        var newTime = this.accumTime + args.dt;
        if (newTime > this.length) {
            args.dt -= this.accumTime - this.length;
            newTime = this.length;
        }
        else
            args.dt = 0;

        var frac = this.accumTime/this.length;
        var newFrame = Math.floor(frac*4);
        if (newFrame != a.animFrame)
            a.setFrame(newFrame);

        this.accumTime = newTime;
        vec3.lerp(this.from, this.to, frac, a.pos);

        // Calculate new height
        var hx = a.pos[0]+a.hotspotOffset[0];
        var hy = a.pos[1]+a.hotspotOffset[1];
        a.pos[2] = map.getHeight(hx, hy);

        return (this.accumTime < this.length) ? [this] : [];
    }
});

Activities.Face = new Class({
    type: "Face",

    initialize: function(facing) {
        this.facing = facing;
    },

    tick: function(a, args) {
        a.facing = this.facing;
        a.setFrame(0);
        return [];
    }
});

Activities.InputWatcher = new Class({
    type: "InputWatcher",
    tick: function(a, args) {
        var dirKey = Keyboard.lastPressed('wsad');
        if (!dirKey) {
            // Eat any remaining time
            args.dt = 0;
            return [this];
        }

        var from = vec3.create(a.pos);
        var dp = Activities.InputWatcher.DirectionOffsets[dirKey];
        var to = vec3.create([Math.round(from[0] + dp[0]), Math.round(from[1] + dp[1]), 0]);
        var facing = Facings.fromDelta(dp);
        if (!map.canEnterTile(to[0], to[1], facing)) {
            args.dt = 0;
            return [new Activities.Face(facing), this];
        }

        var animLength = 600; // move time in ms
        return [new Activities.Move(a.pos, to, animLength), this];
    }
});

Activities.InputWatcher.DirectionOffsets = {
    'W': [0,1],
    'S': [0,-1],
    'A': [-1,0],
    'D': [1,0]
};
