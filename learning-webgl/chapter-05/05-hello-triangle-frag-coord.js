var HelloTriangleFragCoord = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        void main() {
            gl_Position = a_Position;
        }
        `;
    const FSHADER_SOURCE =
        `
        precision mediump float;
        uniform float u_Width;
        uniform float u_Height;
        void main() {
            gl_FragColor = vec4(gl_FragCoord.x/u_Width, 0.0, gl_FragCoord.y/u_Height, 1.0);
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

        const u_Width = gl.getUniformLocation(gl.program, 'u_Width');
        if (!u_Width) {
            console.log('Failed to get the location of u_Width');
            return;
        }

        const u_Height = gl.getUniformLocation(gl.program, 'u_Height');
        if (!u_Height) {
            console.log('Failed to get the location of u_Height');
            return;
        }

        gl.uniform1f(u_Width, gl.drawingBufferWidth);
        gl.uniform1f(u_Height, gl.drawingBufferHeight);

        gl.clearColor(0.0, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    function initVertexBuffers(gl) {
        var vertices = new Float32Array([
            0, 0.5, -0.5, -0.5, 0.5, -0.5
        ]);
        var n = 3;
        var vertexBuffer = new gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return;
        }

        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(a_Position);

        return n;
    }


    return {
        main: main
    }
})();