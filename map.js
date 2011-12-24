Map = function() {
    this.mapSize = [5, 5];
    this.tileset = new Tileset();

    this.init = function() {        
        this.vertexPosBuf = gl.createBuffer();
        this.vertexPosBuf.itemSize = 3;
        this.vertexPosBuf.numItems = 0;
        var vertices = [];
        
        this.vertexTexBuf = gl.createBuffer();
        this.vertexTexBuf.itemSize = 2;
        this.vertexTexBuf.numItems = 0;
        var vertexTexCoords = [];
        for (var j = 0; j < this.mapSize[1]; j++) {
            for (var i = 0; i < this.mapSize[0]; i++) {
                vertices = vertices.concat(this.makeTileQuad(i,j));
                this.vertexPosBuf.numItems += 6;
                console.log(this.makeTileQuad(i,j));
                vertexTexCoords = vertexTexCoords.concat(this.tileset.getTileCoords((i+j)%2));
                this.vertexTexBuf.numItems += 6; 
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTexCoords), gl.STATIC_DRAW);
    };

    this.draw = function() {
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
    };
    
    
    // Return vertices for two triangles for a tile at i,j
    this.makeTileQuad = function(i, j) {
        return [i, j, 0, i+1, j, 0, i+1, j+1, 0, i, j, 0, i+1, j+1, 0, i, j+1, 0];
    };
    
    this.rot = -45;
    this.tick = function(dt) {
        this.rot += dt/200.0;
    };

    this.init();
}