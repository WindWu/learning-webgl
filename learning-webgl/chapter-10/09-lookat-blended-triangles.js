const LookatBlendedTriangles = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_ViewMatrix;
        uniform mat4 u_ProjectMatrix;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_ProjectMatrix * u_ViewMatrix * a_Position;
            v_Color = a_Color;
        }
        `;
    const FSHADER_SOURCE =
        `
        #ifdef GL_ES
        precision mediump float;
        #endif
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

        const u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
        const u_ProjectMatrix = gl.getUniformLocation(gl.program, 'u_ProjectMatrix');

        if (!u_ViewMatrix || !u_ProjectMatrix) {
            console.log('Failed to set the positions of uniform storage location');
            return;
        }

        const viewMatrix = new Matrix4();
        document.onkeydown = (event) => {
            keydown(event, gl, n, u_ViewMatrix, viewMatrix);
        };

        // Create Projection matrix and set to u_ProjMatrix
        const projMatrix = new Matrix4();
        projMatrix.setOrtho(-1, 1, -1, 1, 0, 2);
        gl.uniformMatrix4fv(u_ProjectMatrix, false, projMatrix.elements);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.blendFunc(gl.SRC_ALPHA, gl.DST_COLOR);
        // gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
        draw(gl, n, u_ViewMatrix, viewMatrix);
    }

    function keydown(event, gl, n, u_ViewMatrix, viewMatrix) {
        const keyCode = event.keyCode;
        if (keyCode === 87 /* w */ ||
            keyCode === 39) {
            g_eyeX += 0.01;
        } else if (keyCode === 83 /* s */ ||
            keyCode === 37) {
            g_eyeX -= 0.01;
        } else {
            return;
        }

        draw(gl, n, u_ViewMatrix, viewMatrix);

    }

    let g_eyeX = 0.20;
    let g_eyeY = 0.25;
    let g_eyeZ = 0.25;

    function draw(gl, n, u_ViewMatrix, viewMatrix) {
        viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, 0, 0, 0, 0, 1, 0);

        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    function initVertexBuffers(gl) {
        const vertices = new Float32Array([
            // Vertex coordinates and color(RGBA)
            0.0, 0.5, -0.4, 0.4, 1.0, 0.4, 0.4, // The back green one
            -0.5, -0.5, -0.4, 0.4, 1.0, 0.4, 0.4,
            0.5, -0.5, -0.4, 1.0, 0.4, 0.4, 0.4,

            0.5, 0.4, -0.2, 1.0, 0.4, 0.4, 0.4, // The middle yerrow one
            -0.5, 0.4, -0.2, 1.0, 1.0, 0.4, 0.4,
            0.0, -0.6, -0.2, 1.0, 1.0, 0.4, 0.4,

            0.0, 0.5, 0.0, 0.4, 0.4, 1.0, 0.4, // The front blue one 
            -0.5, -0.5, 0.0, 0.4, 0.4, 1.0, 0.4,
            0.5, -0.5, 0.0, 1.0, 0.4, 0.4, 0.4,
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

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 7, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3)
        gl.enableVertexAttribArray(a_Color);

        // Unbind the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return n;
    }

    return {
        main: main
    }
})();
