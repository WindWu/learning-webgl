const Hud = (function () {
    const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_MvpMatrix;
        uniform bool u_Clicked;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_MvpMatrix * a_Position;
            if(u_Clicked) {
                v_Color = vec4(1.0, 0.0, 0.0, 1.0);
            } else {
                v_Color = a_Color;
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
        const hud = document.getElementById('hud');

        // Get the rendering context for WebGL
        const gl = getWebGLContext(canvas);
        if (!gl) {
            console.log('Failed to get the rendering context for WebGL');
            return;
        }

        const ctx = hud.getContext('2d');

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
        const u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
        if (!u_MvpMatrix || !u_Clicked) {
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

        gl.uniform1i(u_Clicked, 0);

        // Register the event handler
        const currentAngle = [0.0, 0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degree)
        hud.onmousedown = ev => {
            // Mouse is pressed
            const x = ev.clientX;
            const y = ev.clientY;
            // Start dragging if a moue is in <canvas>
            const rect = ev.target.getBoundingClientRect();
            const xInCanvas = x - rect.left;
            const yInCanvas = rect.bottom - y;
            const picked = check(
                gl,
                n,
                xInCanvas,
                yInCanvas,
                currentAngle,
                u_Clicked,
                viewProjMatrix,
                u_MvpMatrix
            );
            if (picked) {
                alert('The cube was seleted!');
            }
        };
        const tick = () => {
            // Start drawing
            animate(currentAngle);
            draw2d(ctx, currentAngle);
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

    function check(
        gl,
        n,
        x,
        y,
        currentAngle,
        u_Clicked,
        viewProjMatrix,
        u_MvpMatrix
    ) {
        let picked = false;
        gl.uniform1i(u_Clicked, 1); // Pass true to u_Clicked
        draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix); // Draw cube with red
        // Read pixel at the clicked position
        const pixels = new Uint8Array(4); // Array for storing the pixel value
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        if (pixels[0] == 255) {
            // The mouse in on cube if R(pixels[0]) is 255
            picked = true;
        }
        1;
        gl.uniform1i(u_Clicked, 0); // Pass false to u_Clicked(rewrite the cube)
        draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix); // Draw the cube

        return picked;
    }

    function draw2d(ctx, currentAngle) {
        ctx.clearRect(0, 0, 400, 400); // Clear <hud>
        // Draw triangle with white lines
        ctx.beginPath(); // Start drawing
        ctx.moveTo(120, 10);
        ctx.lineTo(200, 150);
        ctx.lineTo(40, 150);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)'; // Set white to color of lines
        ctx.stroke(); // Draw Triangle with white lines
        // Draw white letters
        ctx.font = '18px "Times New Roman"';
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Set white to the color of letters
        ctx.fillText('HUD: Head Up Display', 40, 180);
        ctx.fillText('Triangle is drawn by Canvas 2D API.', 40, 200);
        ctx.fillText('Cube is drawn by WebGL API.', 40, 220);
        const xAngle = Math.floor(currentAngle[0]);
        const yAngle = Math.floor(currentAngle[1]);
        const zAngle = Math.floor(currentAngle[2]);
        ctx.fillText(`Current Angle: ${xAngle}, ${yAngle}, ${zAngle}`, 40, 240);

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
