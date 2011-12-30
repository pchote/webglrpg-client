// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var Direction = {
    None: 0,
    Right: 1,
    Up: 2,
    Left: 4,
    Down: 8,
    All: 15,

    fromDelta: function(dp) {
        if (dp[0] > 0)
            return Direction.Right;
        if (dp[0] < 0)
            return Direction.Left;
        if (dp[1] > 0)
            return Direction.Up;
        if (dp[1] < 0)
            return Direction.Down;
        return 0;
    },

    reverse: function(dir) {
        switch (dir) {
            case Direction.Right: return Direction.Left;
            case Direction.Up: return Direction.Down;
            case Direction.Left: return Direction.Right;
            case Direction.Down: return Direction.Up;
        }
        return Direction.None;
    },

    actorSequence: function(dir) {
        switch (dir) {
            case Direction.Right: return "right";
            case Direction.Up: return "up";
            case Direction.Left: return "left";
            case Direction.Down: return "down";
        }
        return "down";
    }
};

var Actor = new Class({
    templateLoaded: false,
    drawOffset: vec3.create(),
    hotspotOffset: vec3.create(),
    animFrame: 0,

    pos: vec3.create(),
    facing: Direction.Right,

    onLoadActions: new ActionQueue(),
    runWhenLoaded: function(a) {
        if (this.loaded) a();
        else this.onLoadActions.add(a);
    },

    onLoad: function(instanceData) {
        if (this.loaded)
            return;

        if (!this.src || !this.sheetSize || !this.tileSize || !this.frames) {
            console.error("Invalid actor definition");
            return;
        }

        this.zone = instanceData.zone;
        if (instanceData.id)
            this.id = instanceData.id;
        if (instanceData.pos)
            vec3.set(instanceData.pos, this.pos);
        if (instanceData.facing)
            this.facing = instanceData.facing;

        this.texture = renderer.loadTexture(this.src)
        this.texture.runWhenLoaded(this.onTilesetOrTextureLoaded.bind(this));
        this.vertexTexBuf = renderer.createBuffer(this.getTexCoords(), gl.DYNAMIC_DRAW, 2);

        this.zone.tileset.runWhenDefinitionLoaded(this.onTilesetDefinitionLoaded.bind(this));
    },

    onTilesetDefinitionLoaded: function() {
        var s = this.zone.tileset.tileSize;
        var ts = [this.tileSize[0]/s, this.tileSize[1]/s];
        var v = [[0,0,0], [ts[0], 0, 0], [ts[0], 0, ts[1]], [0, 0, ts[1]]];
        var poly = [[v[2], v[3], v[0]], [v[2], v[0], v[1]]].flatten();
        this.vertexPosBuf = renderer.createBuffer(poly, gl.STATIC_DRAW, 3);

        this.zone.tileset.runWhenLoaded(this.onTilesetOrTextureLoaded.bind(this));
    },

    onTilesetOrTextureLoaded: function() {
        if (this.loaded || !this.zone.tileset.loaded || !this.texture.loaded)
            return;

        this.init(); // Hook for actor implementations
        this.loaded = true;
        console.log("Initialized actor "+this.id+" in "+this.zone.id);

        this.onLoadActions.run();
    },

    getTexCoords: function(i) {
        var t = this.frames[Direction.actorSequence(this.facing)][this.animFrame % 4];
        var ss = this.sheetSize;
        var ts = this.tileSize;
        var bl = [(t[0] + ts[0])/ss[0], t[1]/ss[1]];
        var tr = [t[0]/ss[0], (t[1] + ts[1])/ss[1]];
        var v = [bl, [tr[0], bl[1]], tr, [bl[0], tr[1]]];
        var poly = [[v[0], v[1], v[2]], [v[0], v[2], v[3]]];
        return poly.flatten();
    },

    draw: function() {
        if (!this.loaded)
            return;

        mvPushMatrix();
        mat4.translate(mvMatrix, this.pos);

        // Undo rotation so that character plane is normal to LOS
        mat4.rotate(mvMatrix, degToRad(-renderer.cameraAngle), [1, 0, 0]);
        mat4.translate(mvMatrix, this.drawOffset);
        renderer.bindBuffer(this.vertexPosBuf, shaderProgram.vertexPositionAttribute);
        renderer.bindBuffer(this.vertexTexBuf, shaderProgram.textureCoordAttribute);
        renderer.bindTexture(this.texture);

        shaderProgram.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPosBuf.numItems);
        mvPopMatrix();
    },

    setFrame: function(frame) {
        this.animFrame = frame;
        renderer.updateBuffer(this.vertexTexBuf, this.getTexCoords());
    },

    setFacing: function(facing) {
        this.facing = facing;
        this.setFrame(this.animFrame);
    },

    activityDict: {},
    activityList: [],
    addActivity: function(a) {
        if (this.activityDict[a.id])
            this.removeActivity(a.id);

        this.activityDict[a.id] = a;
        this.activityList.push(a);
    },

    removeActivity: function(id) {
        this.activityList.erase(this.activityDict[id]);
        delete this.activityDict[id];
    },

    tickOuter: function(time) {
        if (!this.loaded)
            return;

        // TODO: ensure events are run in the same order everywhere
        var toRemove = [];
        this.activityList.each(function(a) {
            if (!a.loaded || a.startTime > time)
                return;

            // Activity returns true when it is complete
            if (a.tick(time))
                toRemove.push(a);
        });

        toRemove.each(function(a) { this.removeActivity(a.id); }.bind(this));

        if (this.tick)
            this.tick(time);
    },

    // Hook for actor implementations
    init: function() {}
});

var ActorLoader = new DynamicClassLoader(Actor, function(type) { return 'actors/'+type+'.js'; });
