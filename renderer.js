// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var gl;
var shaderProgram;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var Renderer = new Class({
    // Loading flags
    initializedWebGl: false,
    loadedShaders: false,

    // Texture cache
    textures: {},

    initialize: function(canvasId) {
    	if (!window.WebGLRenderingContext) {
            showError("Your browser doesn't support WebGL." +
                '<br /><br /><a href="http://get.webgl.org">Get one that does</a>');
            return;
        }

        var canvas = document.getElementById(canvasId);
        gl = WebGLUtils.create3DContext(canvas);
        if (!gl) {
            showError("Your computer doesn't appear to support WebGL." +
                '<br /><br /><a href="http://get.webgl.org">Find out more</a>');
            return;
        }

        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    	gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        this.initializedWebGl = true;

        var fragmentShader = null;
        var vertexShader = null;

        var self = this;
        var loadShader = function(file, type, withShader) {
            new Request({
                url: file,
                method: 'get',
                link: 'chain',
                onSuccess: function(shaderText) {
                    var shader = gl.createShader(type);
                    gl.shaderSource(shader, shaderText);
                    gl.compileShader(shader);

                    // See if it compiled successfully
                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        console.error("Error compiling shader "+file+": "+gl.getShaderInfoLog(shader));
                        withShader(null);
                    }
                    withShader(shader);
                },
                onFailure: function() { console.error("Error loading shader "+file)}
            }).send();
        }

        var compile = function() {
            if (!fragmentShader || !vertexShader)
                return;

            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                console.error("Could not initialise shaders");
                return;
            }

            gl.useProgram(shaderProgram);
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
            gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

            shaderProgram.setMatrixUniforms = function() {
                gl.uniformMatrix4fv(this.pMatrixUniform, false, pMatrix);
                gl.uniformMatrix4fv(this.mvMatrixUniform, false, mvMatrix);
            };

            self.loadedShaders = true;
        }

        loadShader('main.frag', gl.FRAGMENT_SHADER, function(s) { fragmentShader = s; compile(); })
        loadShader('main.vert', gl.VERTEX_SHADER, function(s) { vertexShader = s; compile(); })
    },

    drawScene: function(drawFunc) {
        if (!this.loadedShaders)
            return;

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);

        drawFunc();
    },

    createBuffer: function(contents, type, itemSize) {
        var buf = gl.createBuffer();
        buf.itemSize = itemSize;
        buf.numItems = contents.length / itemSize;
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(contents), type);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buf;
    },

    updateBuffer: function(buffer, contents) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(contents));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },

    bindBuffer: function(buffer, attribute) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(attribute, buffer.itemSize, gl.FLOAT, false, 0, 0);
    },

    createTexture: function(src) {
        if (this.textures[src]) {
            return this.textures[src];
        }

        var t = gl.createTexture();
        t.image = new Image();
        t.loaded = false;
        t.image.onload = function() {
            console.log("loaded image "+t.image.src);
            gl.bindTexture(gl.TEXTURE_2D, t);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);

            t.loaded = true;
            t.onLoadActions.each(function(a) { a(); });
            t.onLoadActions.length = 0;
        };

        t.onLoadActions = [];
        t.runWhenLoaded = function(a) {
            if (t.loaded)
                a();
            else
                t.onLoadActions.push(a);
        }

        t.image.src = src;
        this.textures[src] = t;
        return t;
    },

    bindTexture: function(texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);
    },

    cameraAngle: 45,
    cameraPosition: vec3.create(),
    // Storage for negated camera position
    cameraOffset: vec3.create(),
    setCamera: function() {
        mat4.translate(mvMatrix, [0.0, 0.0, -15.0]);
        mat4.rotate(mvMatrix, degToRad(-this.cameraAngle), [1, 0, 0]);

        vec3.negate(this.cameraPosition, this.cameraOffset);
        mat4.translate(mvMatrix, this.cameraOffset);
    }
});

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
