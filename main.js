// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var gl;
var shaderProgram;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var map;
var renderer;

var lastTime = 0;
function tick() {
    requestAnimFrame(tick);
    renderer.drawScene(function() {
            map.draw();
    });

    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        map.tick(elapsed)
    }
    lastTime = timeNow;
}

function start() {
    renderer = new Renderer();

	var canvas = document.getElementById("glcanvas");
	gl = WebGLUtils.setupWebGL(canvas);
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

	if (gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Set clear color to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		
        // Initialize the shaders; this is where all the lighting for the
        // vertices and so forth is established.
        initShaders();
        
        map = new Map();
    
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        tick();
	}
}