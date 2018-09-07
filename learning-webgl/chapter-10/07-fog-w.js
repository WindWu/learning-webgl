const FogW = (function () {
    const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_MvpMatrix;
        varying vec4 v_Color;
        varying float v_Distance;
        void main() {
            gl_Position = u_MvpMatrix * a_Position;
            v_Color = a_Color;
            v_Distance = gl_Position.w;
        }
        `;
    const FSHADER_SOURCE = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        uniform vec3 u_FogColor;
        uniform vec2 u_FogDistance;
        varying vec4 v_Color;
        varying float v_Distance;
        void main() {
            float fogFactor = clamp((u_FogDistance.y - v_Distance) / (u_FogDistance.y - u_FogDistance.x), 0.0, 1.0);
            vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);
            gl_FragColor = vec4(color, v_Color.a);
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

        // Color of Fog
        const fogColor = new Float32Array([0.137, 0.231, 0.423]);
        // Distance of fog [where fog starts, where fog completely covers object]
        const fogDistance = new Float32Array([55, 80]);
        // Position of eye point (world coordinates)
        const eye = new Float32Array([25, 65, 35, 1.0]);

        // Get the storage locations of uniform variables
        const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
        const u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
        const u_FogDistance = gl.getUniformLocation(gl.program, 'u_FogDistance');

        if (!u_MvpMatrix || !u_FogColor || !u_FogDistance) {
            console.log(
                'Failed to get the storage location of uniform variable'
            );
            return;
        }
        // Pass fog color, distances, and eye point to uniform variable
        gl.uniform3fv(u_FogColor, fogColor); // Colors
        gl.uniform2fv(u_FogDistance, fogDistance); // Starting point and end point

        // Set clear color and enable hidden surface removal
        gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0); // Color of Fog
        gl.enable(gl.DEPTH_TEST);

        // Pass the model matrix to u_ModelMatrix
        var modelMatrix = new Matrix4();
        modelMatrix.setScale(10, 10, 10);

        // Pass the model view projection matrix to u_MvpMatrix
        var mvpMatrix = new Matrix4();
        mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 1000);
        mvpMatrix.lookAt(eye[0], eye[1], eye[2], 0, 2, 0, 0, 1, 0);
        mvpMatrix.multiply(modelMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        document.onkeydown = function (ev) {
            keydown(ev, gl, n, u_FogDistance, fogDistance);
        };

        // Clear color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Draw
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

        var modelViewMatrix = new Matrix4();
        modelViewMatrix.setLookAt(eye[0], eye[1], eye[2], 0, 2, 0, 0, 1, 0);
        modelViewMatrix.multiply(modelMatrix);
        modelViewMatrix.multiplyVector4(new Vector4([1, 1, 1, 1]));
        mvpMatrix.multiplyVector4(new Vector4([1, 1, 1, 1]));
        modelViewMatrix.multiplyVector4(new Vector4([-1, 1, 1, 1]));
        mvpMatrix.multiplyVector4(new Vector4([-1, 1, 1, 1]));
    }

    function keydown(ev, gl, n, u_FogDistance, fogDist) {
        switch (ev.keyCode) {
            case 38: // Up arrow key -> Increase the maximum distance of fog
                fogDist[1] += 1;
                break;
            case 40: // Down arrow key -> Decrease the maximum distance of fog
                if (fogDist[1] > fogDist[0]) fogDist[1] -= 1;
                break;
            default:
                return;
        }
        gl.uniform2fv(u_FogDistance, fogDist); // Pass the distance of fog
        // Clear color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Draw
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
            0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, // v0-v1-v2-v3 front
            0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, // v0-v3-v4-v5 right
            1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, // v0-v5-v6-v1 up
            1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, // v1-v6-v7-v2 left
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v7-v4-v3-v2 down
            0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0 // v4-v7-v6-v5 back
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
