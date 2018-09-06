const PickFace = (function () {
    const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        attribute float a_Face;
        uniform mat4 u_MvpMatrix;
        uniform int u_PickedFace;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_MvpMatrix * a_Position;
            int face = int(a_Face);
            vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;
            if(u_PickedFace == 0) {
                v_Color = vec4(color, a_Face/255.0);
            } else {
                v_Color = vec4(color, a_Color.a);
            }
        }
        `;
    const FSHADER_SOURCE = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        varying vec4 v_Color;
        void main() {
            gl_FragColor = v_Color;
        }
        `;

    var ANGLE_STEP = 20.0; // Rotation angle (degrees/second)

    function main() {
        // Retrieve <canvas> element
        const canvas = document.getElementById('webgl');

        // Get the rendering context for WebGL
        const gl = getWebGLContext(canvas);
        if (!gl) {
            console.log('Failed to get the rendering context for WebGL');
            return;
        }

        // Initialize shaders
        if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
            console.log('Failed to intialize shaders.');
            return;
        }

        // Set the vertex information
        const n = initVertexBuffers(gl);
        if (n < 0) {
            console.log('Failed to set the vertex information');
            return;
        }

        // Set the clear color and enable the depth test
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        // Get the storage locations of uniform variables
        const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
        const u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
        if (!u_MvpMatrix || !u_PickedFace) {
            console.log(
                'Failed to get the storage location of uniform variable'
            );
            return;
        }

        // Calculate the view projection matrix
        const viewProjMatrix = new Matrix4();
        viewProjMatrix.setPerspective(
            30.0,
            canvas.width / canvas.height,
            1.0,
            100.0
        );
        viewProjMatrix.lookAt(0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        gl.uniform1i(u_PickedFace, -1);

        // Register the event handler
        const currentAngle = [0.0, 0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degree)
        canvas.onmousedown = ev => {
            // Mouse is pressed
            const x = ev.clientX;
            const y = ev.clientY;
            // Start dragging if a moue is in <canvas>
            const rect = ev.target.getBoundingClientRect();
            const xInCanvas = x - rect.left;
            const yInCanvas = rect.bottom - y;
            const face = checkFace(
                gl,
                n,
                xInCanvas,
                yInCanvas,
                currentAngle,
                u_PickedFace,
                viewProjMatrix,
                u_MvpMatrix
            );

            gl.uniform1i(u_PickedFace, face);
            draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
        };
        const tick = () => {
            // Start drawing
            animate(currentAngle);
            draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
            requestAnimationFrame(tick, canvas);
        };
        tick();
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
        // prettier-ignore
        const vertices = new Float32Array([
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
        ]);

        // prettier-ignore
        const faces = new Uint8Array([ // Faces
            1, 1, 1, 1, // v0-v1-v2-v3 front
            2, 2, 2, 2, // v0-v3-v4-v5 right
            3, 3, 3, 3, // v0-v5-v6-v1 up
            4, 4, 4, 4, // v1-v6-v7-v2 left
            5, 5, 5, 5, // v7-v4-v3-v2 down
            6, 6, 6, 6, // v4-v7-v6-v5 back
        ]);

        // prettier-ignore
        const colors = new Float32Array([
            0.2, 0.58, 0.82, 0.2, 0.58, 0.82, 0.2, 0.58, 0.82, 0.2, 0.58, 0.82, // v0-v1-v2-v3 front
            0.5, 0.41, 0.69, 0.5, 0.41, 0.69, 0.5, 0.41, 0.69, 0.5, 0.41, 0.69, // v0-v3-v4-v5 right
            0.0, 0.32, 0.61, 0.0, 0.32, 0.61, 0.0, 0.32, 0.61, 0.0, 0.32, 0.61, // v0-v5-v6-v1 up
            0.78, 0.69, 0.84, 0.78, 0.69, 0.84, 0.78, 0.69, 0.84, 0.78, 0.69, 0.84, // v1-v6-v7-v2 left
            0.32, 0.18, 0.56, 0.32, 0.18, 0.56, 0.32, 0.18, 0.56, 0.32, 0.18, 0.56, // v7-v4-v3-v2 down
            0.73, 0.82, 0.93, 0.73, 0.82, 0.93, 0.73, 0.82, 0.93, 0.73, 0.82, 0.93, // v4-v7-v6-v5 back
        ]);

        // Indices of the vertices
        // prettier-ignore
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // up
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // down
            20, 21, 22, 20, 22, 23 // back
        ]);

        // Write vertex information to buffer object
        if (!initArrayBuffer(gl, vertices, gl.FLOAT, 3, 'a_Position')) {
            return -1;
        } // Coordinate Information
        if (!initArrayBuffer(gl, colors, gl.FLOAT, 3, 'a_Color')) {
            return -1;
        } // Color Information

        if (!initArrayBuffer(gl, faces, gl.UNSIGNED_BYTE, 1, 'a_Face')) {
            return -1
        }; // Surface Information

        // Create a buffer object
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            return -1;
        }
        // Write the indices to the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        return indices.length;
    }

    function checkFace(
        gl,
        n,
        x,
        y,
        currentAngle,
        u_PickedFace,
        viewProjMatrix,
        u_MvpMatrix
    ) {
        let pixels = new Uint8Array(4); // Array for storing the pixel value
        gl.uniform1i(u_PickedFace, 0); // Draw by writing surface number into alpha value
        draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
        // Read the pixel value of the clicked position. pixels[3] is the surface number
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        return pixels[3];
    }

    let g_MvpMatrix = new Matrix4(); // Model view projection matrix
    function draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix) {
        // Caliculate The model view projection matrix and pass it to u_MvpMatrix
        g_MvpMatrix.set(viewProjMatrix);
        g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis
        g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis
        g_MvpMatrix.rotate(currentAngle[2], 0.0, 0.0, 1.0); // Rotation around z-axis

        gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear buffers
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0); // Draw the cube
    }

    let last = Date.now(); // Last time that this function was called
    function animate(angle) {
        var now = Date.now(); // Calculate the elapsed time
        var elapsed = now - last;
        last = now;
        // Update the current rotation angle (adjusted by the elapsed time)
        angle[0] += (ANGLE_STEP * elapsed) / 1000.0;
        angle[1] += (ANGLE_STEP * elapsed) / 2000.0;
        angle[2] += (ANGLE_STEP * elapsed) / 3000.0;

        angle[0] %= 360;
        angle[1] %= 360;
        angle[2] %= 360;
    }

    function initArrayBuffer(gl, data, type, num, attribute) {
        // Create a buffer object
        const buffer = gl.createBuffer();
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return false;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        // Assign the buffer object to the attribute variable
        const a_attribute = gl.getAttribLocation(gl.program, attribute);
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ' + attribute);
            return false;
        }
        gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
        // Enable the assignment to a_attribute variable
        gl.enableVertexAttribArray(a_attribute);

        return true;
    }

    return {
        main: main,
    };
})();
