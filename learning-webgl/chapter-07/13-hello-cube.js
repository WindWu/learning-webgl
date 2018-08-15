const HelloCube = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_mvpMatrix;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_mvpMatrix * a_Position;
            v_Color = a_Color;
        }
        `;
    const FSHADER_SOURCE =
        `
        precision mediump float;
        varying vec4 v_Color;
        void main() {
            gl_FragColor = v_Color;
        }
        `;

    function main() {
        const canvas = document.getElementById("webgl");
        const gl = getWebGLContext(canvas);
        if (!gl) {
            console.log('Failed to get the rendering context for WebGL');
            return;
        }

        if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
            console.log('Failed to initialize shaders');
            return;
        }

        const n = initVertexBuffers(gl);
        if (n < 0) {
            console.log('Failed to set the positions of the vertices');
            return;
        }

        const u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
        if (u_mvpMatrix < 0) {
            console.log('Failed to set the positions of the u_mvpMatrix');
            return;
        }

        gl.clearColor(0.0, 0.8, 0.8, 1.0);
        gl.enable(gl.DEPTH_TEST);

        const mvpMatrix = new Matrix4();
        const aspect = canvas.width / canvas.height;
        mvpMatrix.setPerspective(30, aspect, 1, 100);
        mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);

        gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }


    function initVertexBuffers(gl) {
        // Create a cube
        //    v6----- v5
        //   /|      /|
        //  v1------v0|
        //  | |     | |
        //  | |v7---|-|v4
        //  |/      |/
        //  v2------v3
        const verticesColors = new Float32Array([
            // Vertex coordinates and color
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v0 White
            -1.0, 1.0, 1.0, 1.0, 0.0, 1.0, // v1 Magenta
            -1.0, -1.0, 1.0, 1.0, 0.0, 0.0, // v2 Red
            1.0, -1.0, 1.0, 1.0, 1.0, 0.0, // v3 Yellow
            1.0, -1.0, -1.0, 0.0, 1.0, 0.0, // v4 Green
            1.0, 1.0, -1.0, 0.0, 1.0, 1.0, // v5 Cyan
            -1.0, 1.0, -1.0, 0.0, 0.0, 1.0, // v6 Blue
            -1.0, -1.0, -1.0, 0.0, 0.0, 0.0 // v7 Black
        ]);

        // Indices of the vertices
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3, // front
            0, 3, 4, 0, 4, 5, // right
            0, 5, 6, 0, 6, 1, // up
            1, 6, 7, 1, 7, 2, // left
            7, 4, 3, 7, 3, 2, // down
            4, 7, 6, 4, 6, 5 // back
        ]);

        // Create a buffer object
        const vertexColorBuffer = gl.createBuffer();
        const indexBuffer = gl.createBuffer();
        if (!vertexColorBuffer || !indexBuffer) {
            return -1;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return -1;
        }

        const a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get the storage location of a_Color');
            return -1;
        }

        const FSIZE = verticesColors.BYTES_PER_ELEMENT;

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3)
        gl.enableVertexAttribArray(a_Color);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        return indices.length;
    }

    return {
        main: main
    }
})();