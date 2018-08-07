const ZFighting = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_ViewProjectMatrix;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_ViewProjectMatrix * a_Position;
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

        gl.clearColor(0.0, 0.8, 0.8, 1.0);
        gl.enable(gl.DEPTH_TEST);

        const u_ViewProjectMatrix = gl.getUniformLocation(gl.program, 'u_ViewProjectMatrix');
        if (!u_ViewProjectMatrix) {
            console.log('Failed to set the positions of the u_ViewProjectMatrix');
            return;
        }

        const viewProjectMatrix = new Matrix4();
        const aspect = canvas.width / canvas.height;

        viewProjectMatrix.setPerspective(30, aspect, 1, 100);
        viewProjectMatrix.lookAt(3.06, 2.5, 10.0, 0, 0, -2, 0, 1, 0);

        gl.uniformMatrix4fv(u_ViewProjectMatrix, false, viewProjectMatrix.elements);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, n / 2);
        // Enable the polygon offset function
        gl.enable(gl.POLYGON_OFFSET_FILL);
        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, n / 2); // The green triangle
        gl.polygonOffset(1.0, 1.0); // Set the polygon offset
        gl.drawArrays(gl.TRIANGLES, n / 2, n / 2); // The yellow triangle
    }

    function initVertexBuffers(gl) {
        const vertices = new Float32Array([
            // Vertex coordinates and color
            0.0, 2.5, -5.0, 0.4, 1.0, 0.4, // The green triangle
            -2.5, -2.5, -5.0, 0.4, 1.0, 0.4,
            2.5, -2.5, -5.0, 1.0, 0.4, 0.4,

            0.0, 3.0, -5.0, 1.0, 0.4, 0.4, // The yellow triagle
            -3.0, -3.0, -5.0, 1.0, 1.0, 0.4,
            3.0, -3.0, -5.0, 1.0, 1.0, 0.4,
        ]);
        const n = 6;

        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

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

        const FSIZE = vertices.BYTES_PER_ELEMENT;

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3)
        gl.enableVertexAttribArray(a_Color);

        return n;
    }

    return {
        main: main
    }
})();