const MultiJointModelSegments = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute vec4 a_Normal;
        uniform mat4 u_MvpMatrix;
        uniform mat4 u_NormalMatrix;
        varying vec4 v_Color;
        void main() {
            gl_Position = u_MvpMatrix * a_Position;
            vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));
            vec4 color = vec4(1.0, 0.4, 0.0, 1.0);
            vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
            float nDotL = max(dot(lightDirection, normal), 0.0);
            vec3 diffuse = color.rgb * nDotL + vec3(0.1);
            v_Color = vec4(diffuse, color.a);
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
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        if (!u_MvpMatrix || !u_NormalMatrix) {
            console.log('Failed to get the storage location');
            return;
        }

        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.error('Failedto get the storage location of a_Position attribute');
        }

        // Calculate the view projection matrix
        const viewProjMatrix = new Matrix4();
        viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
        viewProjMatrix.lookAt(20.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        // Register the event handler to be called when keys are pressed
        document.onkeydown = (event) => {
            keydown(event, gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
        };

        draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw the robot arm
    }

    let ANGLE_STEP = 3.0; // The increments of rotation angle (degrees)
    let g_arm1Angle = 90.0; // The rotation angle of arm1 (degrees)
    let g_joint1Angle = 45.0; // The rotation angle of joint1 (degrees)
    let g_joint2Angle = 0.0;
    let g_joint3Angle = 0.0;

    function keydown(event, gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
        switch (event.keyCode) {
            case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
                if (g_joint1Angle < 135.0) g_joint1Angle += ANGLE_STEP;
                break;
            case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
                if (g_joint1Angle > -135.0) g_joint1Angle -= ANGLE_STEP;
                break;
            case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
                g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
                break;
            case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
                g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
                break;
            case 90: // 'ｚ'key -> the positive rotation of joint2
                g_joint2Angle = (g_joint2Angle + ANGLE_STEP) % 360;
                break;
            case 88: // 'x'key -> the negative rotation of joint2
                g_joint2Angle = (g_joint2Angle - ANGLE_STEP) % 360;
                break;
            case 86: // 'v'key -> the positive rotation of joint3
                if (g_joint3Angle < 60.0) g_joint3Angle = (g_joint3Angle + ANGLE_STEP) % 360;
                break;
            case 67: // 'c'key -> the nagative rotation of joint3
                if (g_joint3Angle > -60.0) g_joint3Angle = (g_joint3Angle - ANGLE_STEP) % 360;
                break;
            default:
                return; // Skip drawing at no effective action
        }
        // Draw the robot arm
        draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
    }

    let g_baseBuffer = null; // Buffer object for a base
    let g_arm1Buffer = null; // Buffer object for arm1
    let g_arm2Buffer = null; // Buffer object for arm2
    let g_palmBuffer = null; // Buffer object for a palm
    let g_fingerBuffer = null; // Buffer object for fingers


    function initVertexBuffers(gl) {
        // Vertex coordinate (prepare coordinates of cuboids for all segments)
        const vertices_base = new Float32Array([ // Base(10x2x10)
            5.0, 2.0, 5.0, -5.0, 2.0, 5.0, -5.0, 0.0, 5.0, 5.0, 0.0, 5.0, // v0-v1-v2-v3 front
            5.0, 2.0, 5.0, 5.0, 0.0, 5.0, 5.0, 0.0, -5.0, 5.0, 2.0, -5.0, // v0-v3-v4-v5 right
            5.0, 2.0, 5.0, 5.0, 2.0, -5.0, -5.0, 2.0, -5.0, -5.0, 2.0, 5.0, // v0-v5-v6-v1 up
            -5.0, 2.0, 5.0, -5.0, 2.0, -5.0, -5.0, 0.0, -5.0, -5.0, 0.0, 5.0, // v1-v6-v7-v2 left
            -5.0, 0.0, -5.0, 5.0, 0.0, -5.0, 5.0, 0.0, 5.0, -5.0, 0.0, 5.0, // v7-v4-v3-v2 down
            5.0, 0.0, -5.0, -5.0, 0.0, -5.0, -5.0, 2.0, -5.0, 5.0, 2.0, -5.0 // v4-v7-v6-v5 back
        ]);

        const vertices_arm1 = new Float32Array([ // Arm1(3x10x3)
            1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5, 0.0, 1.5, 1.5, 0.0, 1.5, // v0-v1-v2-v3 front
            1.5, 10.0, 1.5, 1.5, 0.0, 1.5, 1.5, 0.0, -1.5, 1.5, 10.0, -1.5, // v0-v3-v4-v5 right
            1.5, 10.0, 1.5, 1.5, 10.0, -1.5, -1.5, 10.0, -1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
            -1.5, 10.0, 1.5, -1.5, 10.0, -1.5, -1.5, 0.0, -1.5, -1.5, 0.0, 1.5, // v1-v6-v7-v2 left
            -1.5, 0.0, -1.5, 1.5, 0.0, -1.5, 1.5, 0.0, 1.5, -1.5, 0.0, 1.5, // v7-v4-v3-v2 down
            1.5, 0.0, -1.5, -1.5, 0.0, -1.5, -1.5, 10.0, -1.5, 1.5, 10.0, -1.5 // v4-v7-v6-v5 back
        ]);

        const vertices_arm2 = new Float32Array([ // Arm2(4x10x4)
            2.0, 10.0, 2.0, -2.0, 10.0, 2.0, -2.0, 0.0, 2.0, 2.0, 0.0, 2.0, // v0-v1-v2-v3 front
            2.0, 10.0, 2.0, 2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 10.0, -2.0, // v0-v3-v4-v5 right
            2.0, 10.0, 2.0, 2.0, 10.0, -2.0, -2.0, 10.0, -2.0, -2.0, 10.0, 2.0, // v0-v5-v6-v1 up
            -2.0, 10.0, 2.0, -2.0, 10.0, -2.0, -2.0, 0.0, -2.0, -2.0, 0.0, 2.0, // v1-v6-v7-v2 left
            -2.0, 0.0, -2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0, // v7-v4-v3-v2 down
            2.0, 0.0, -2.0, -2.0, 0.0, -2.0, -2.0, 10.0, -2.0, 2.0, 10.0, -2.0 // v4-v7-v6-v5 back
        ]);

        const vertices_palm = new Float32Array([ // Palm(2x2x6)
            1.0, 2.0, 3.0, -1.0, 2.0, 3.0, -1.0, 0.0, 3.0, 1.0, 0.0, 3.0, // v0-v1-v2-v3 front
            1.0, 2.0, 3.0, 1.0, 0.0, 3.0, 1.0, 0.0, -3.0, 1.0, 2.0, -3.0, // v0-v3-v4-v5 right
            1.0, 2.0, 3.0, 1.0, 2.0, -3.0, -1.0, 2.0, -3.0, -1.0, 2.0, 3.0, // v0-v5-v6-v1 up
            -1.0, 2.0, 3.0, -1.0, 2.0, -3.0, -1.0, 0.0, -3.0, -1.0, 0.0, 3.0, // v1-v6-v7-v2 left
            -1.0, 0.0, -3.0, 1.0, 0.0, -3.0, 1.0, 0.0, 3.0, -1.0, 0.0, 3.0, // v7-v4-v3-v2 down
            1.0, 0.0, -3.0, -1.0, 0.0, -3.0, -1.0, 2.0, -3.0, 1.0, 2.0, -3.0 // v4-v7-v6-v5 back
        ]);

        const vertices_finger = new Float32Array([ // Fingers(1x2x1)
            0.5, 2.0, 0.5, -0.5, 2.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, // v0-v1-v2-v3 front
            0.5, 2.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 2.0, -0.5, // v0-v3-v4-v5 right
            0.5, 2.0, 0.5, 0.5, 2.0, -0.5, -0.5, 2.0, -0.5, -0.5, 2.0, 0.5, // v0-v5-v6-v1 up
            -0.5, 2.0, 0.5, -0.5, 2.0, -0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
            -0.5, 0.0, -0.5, 0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
            0.5, 0.0, -0.5, -0.5, 0.0, -0.5, -0.5, 2.0, -0.5, 0.5, 2.0, -0.5 // v4-v7-v6-v5 back
        ]);

        // Normal
        const normals = new Float32Array([
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
        ]);

        // Indices of the vertices
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // up
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // down
            20, 21, 22, 20, 22, 23 // back
        ]);

        // Write coords to buffers, but don't assign to attribute variables
        g_baseBuffer = initArrayBufferForLaterUse(gl, vertices_base, 3, gl.FLOAT);
        g_arm1Buffer = initArrayBufferForLaterUse(gl, vertices_arm1, 3, gl.FLOAT);
        g_arm2Buffer = initArrayBufferForLaterUse(gl, vertices_arm2, 3, gl.FLOAT);
        g_palmBuffer = initArrayBufferForLaterUse(gl, vertices_palm, 3, gl.FLOAT);
        g_fingerBuffer = initArrayBufferForLaterUse(gl, vertices_finger, 3, gl.FLOAT);
        if (!g_baseBuffer || !g_arm1Buffer || !g_arm2Buffer || !g_palmBuffer || !g_fingerBuffer) {
            return -1;
        }

        // Write normals to a buffer, assign it to a_Normal and enable it
        if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

        // Write the indices to the buffer object
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        return indices.length;
    }

    function initArrayBufferForLaterUse(gl, data, num, type) {
        const buffer = gl.createBuffer(); // Create a buffer object
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return null;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        // Store the necessary information to assign the object to the attribute variable later
        buffer.num = num;
        buffer.type = type;

        return buffer;
    }

    function initArrayBuffer(gl, attribute, data, num, type) {
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
        // Enable the assignment of the buffer object to the attribute variable
        gl.enableVertexAttribArray(a_attribute);

        return true;
    }

    // Coordinate transformation matrix
    let g_modelMatrix = new Matrix4();

    function draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
        // Clear color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw a base
        let baseHeight = 2.0;
        g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
        drawSegment(gl, n, g_baseBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

        // Arm1
        let arm1Length = 10.0;
        g_modelMatrix.translate(0.0, baseHeight, 0.0); // Move onto the base
        g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0); // Rotate around the y-axis
        drawSegment(gl, n, g_arm1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw

        // Arm2
        let arm2Length = 10.0;
        g_modelMatrix.translate(0.0, arm1Length, 0.0); // Move to joint1
        g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0); // Rotate around the z-axis
        drawSegment(gl, n, g_arm2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw

        // A palm
        let palmLength = 2.0;
        g_modelMatrix.translate(0.0, arm2Length, 0.0); // Move to palm
        g_modelMatrix.rotate(g_joint2Angle, 0.0, 1.0, 0.0); // Rotate around the y-axis
        drawSegment(gl, n, g_palmBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw

        // Move to the center of the tip of the palm
        g_modelMatrix.translate(0.0, palmLength, 0.0);

        // Draw finger1
        pushMatrix(g_modelMatrix);

        g_modelMatrix.translate(0.0, 0.0, 2.0);
        g_modelMatrix.rotate(g_joint3Angle, 1.0, 0.0, 0.0); // Rotate around the x-axis
        drawSegment(gl, n, g_fingerBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

        g_modelMatrix = popMatrix();

        // Draw finger2
        g_modelMatrix.translate(0.0, 0.0, -2.0);
        g_modelMatrix.rotate(-g_joint3Angle, 1.0, 0.0, 0.0); // Rotate around the x-axis
        drawSegment(gl, n, g_fingerBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
    }

    const g_matrixStack = []; // Array for storing a matrix
    function pushMatrix(m) { // Store the specified matrix to the array
        const m2 = new Matrix4(m);
        g_matrixStack.push(m2);
    }

    function popMatrix() { // Retrieve the matrix from the array
        return g_matrixStack.pop();
    }

    const g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals
    const g_mvpMatrix = new Matrix4();

    // Draw the cube
    function drawSegment(gl, n, buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Calculate the model view project matrix and pass it to u_MvpMatrix
        g_mvpMatrix.set(viewProjMatrix);
        g_mvpMatrix.multiply(g_modelMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
        // Calculate the normal transformation matrix and pass it to u_NormalMatrix
        g_normalMatrix.setInverseOf(g_modelMatrix);
        g_normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
        // Draw
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }

    return {
        main: main
    }
})();
