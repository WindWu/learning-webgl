var RoundedPoints = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute float a_PointSize;
        void main() {
            gl_Position = a_Position;
            gl_PointSize = a_PointSize;
        }
        `;
    const FSHADER_SOURCE =
        `
        #ifdef GL_ES
        precision mediump float;
        #endif
        void main() {
            float distance = distance(gl_PointCoord, vec2(0.5, 0.5));
            if(distance < 0.5) {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            } else {
                discard;
            }
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

        const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
        if (a_PointSize < 0) {
            console.log('Faile to get the storage location of a_PointSize');
            return;
        }

        var n = initVertexBuffers(gl);
        if (n < 0) {
            console.log('Failed to set the positions of the vertices');
            return;
        }

        gl.clearColor(0.0, 0.8, 0.8, 1.0);
        gl.vertexAttrib1f(a_PointSize, 10);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, n);
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
