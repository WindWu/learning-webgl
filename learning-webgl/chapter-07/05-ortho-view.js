const OrthoView = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_ProjectMatrix;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_ProjectMatrix * a_Position;
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
        const nearFar = document.getElementById("nearFar");

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

        const u_ProjectMatrix = gl.getUniformLocation(gl.program, 'u_ProjectMatrix');
        if (u_ProjectMatrix < 0) {
            console.log('Failed to set the positions of the u_ProjectMatrix');
            return;
        }

        const viewMatrix = new Matrix4();
        document.onkeydown = (event) => {
            keydown(event, gl, n, u_ProjectMatrix, viewMatrix, nearFar);
        };

        gl.clearColor(0.0, 0.8, 0.8, 1.0);

        draw(gl, n, u_ProjectMatrix, viewMatrix, nearFar);
    }

    function keydown(event, gl, n, u_ProjectMatrix, viewMatrix, nearFar) {
        const keyCode = event.keyCode;
        switch (keyCode) {
            case 39:
                g_near += 0.01;
                break;
            case 37:
                g_near -= 0.01;
                break;
            case 38:
                g_far += 0.01;
                break;
            case 40:
                g_far -= 0.01;
                break;
            default:
                return;
        }

        draw(gl, n, u_ProjectMatrix, viewMatrix, nearFar);

    }

    let g_near = 0;
    let g_far = 0.5;

    function draw(gl, n, u_ProjectMatrix, viewMatrix, nearFar) {
        viewMatrix.setOrtho(-1, 1, -1, 1, g_near, g_far);

        gl.uniformMatrix4fv(u_ProjectMatrix, false, viewMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT);

        nearFar.innerHTML = 'near: ' + Math.round(g_near * 100) / 100 + ', far: ' + Math.round(g_far * 100) / 100;

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    function initVertexBuffers(gl) {
        const vertices = new Float32Array([
            // Vertex coordinates and color(RGBA)
            0.0, 0.5, -0.4, 0.4, 1.0, 0.4, // The back green one
            -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
            0.5, -0.5, -0.4, 1.0, 0.4, 0.4,

            0.5, 0.4, -0.2, 1.0, 0.4, 0.4, // The middle yellow one
            -0.5, 0.4, -0.2, 1.0, 1.0, 0.4,
            0.0, -0.6, -0.2, 1.0, 1.0, 0.4,

            0.0, 0.5, 0.0, 0.4, 0.4, 1.0, // The front blue one 
            -0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
            0.5, -0.5, 0.0, 1.0, 0.4, 0.4,
        ]);
        const n = 9;
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