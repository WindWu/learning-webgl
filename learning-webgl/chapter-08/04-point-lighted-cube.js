const PointLightedCube = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        attribute vec4 a_Normal;
        uniform mat4 u_MvpMatrix;
        uniform mat4 u_ModelMatrix;
        uniform mat4 u_NormalMatrix;
        uniform vec3 u_LightColor;
        uniform vec3 u_LightPosition;
        uniform vec3 u_AmbientLight;
        varying vec4 v_Color;
        void main() {
        gl_Position = u_MvpMatrix * a_Position;
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        vec4 vertexPosition = u_ModelMatrix * a_Position;
        vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;
        vec3 ambient = u_AmbientLight * vec3(a_Color);
        v_Color = vec4(diffuse + ambient, a_Color.a);
        }
        `
    const FSHADER_SOURCE =
        `
        #ifdef GL_ES
        precision mediump float;
        #endif
        varying vec4 v_Color;
        void main() {
        gl_FragColor = v_Color;
        }
        `

    function main() {
        const canvas = document.getElementById('webgl')
        const gl = getWebGLContext(canvas)
        if (!gl) {
            console.log('Failed to get the rendering context for WebGL')
            return
        }

        if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
            console.log('Failed to initialize shaders')
            return
        }

        const n = initVertexBuffers(gl)
        if (n < 0) {
            console.log('Failed to set the positions of the vertices')
            return
        }

        const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
        const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix')
        const u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor')
        const u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition')
        const u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight')

        if (!u_MvpMatrix ||
            !u_ModelMatrix ||
            !u_NormalMatrix ||
            !u_LightColor ||
            !u_LightPosition ||
            !u_AmbientLight
        ) {
            console.log('Failed to set the storage location!')
            return
        }

        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0)
        gl.uniform3f(u_LightPosition, 0.0, 3.0, 3.0)
        gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2)

        const modelMatrix = new Matrix4()
        modelMatrix.setRotate(90, 0, 1, 0)
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)

        const mvpMatrix = new Matrix4()
        const aspect = canvas.width / canvas.height
        mvpMatrix.setPerspective(30, aspect, 1, 100)
        mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0)
        mvpMatrix.multiply(modelMatrix)
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)

        const normalMatrix = new Matrix4()
        // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
        normalMatrix.setInverseOf(modelMatrix)
        normalMatrix.transpose()
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements)

        gl.clearColor(0.0, 0.8, 0.8, 1.0)
        gl.enable(gl.DEPTH_TEST)

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0)
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
        var vertices = new Float32Array([ // Vertex coordinates
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
        ]);

        /*
        var colors = new Float32Array([ // Colors
        0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, // v0-v1-v2-v3 front(blue)
        0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, // v0-v3-v4-v5 right(green)
        1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, // v0-v5-v6-v1 up(red)
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, // v1-v6-v7-v2 left
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v7-v4-v3-v2 down
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0 // v4-v7-v6-v5 back
        ]);
        */
        var colors = new Float32Array([ // Colors
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v1-v2-v3 front
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v3-v4-v5 right
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v5-v6-v1 up
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v1-v6-v7-v2 left
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v7-v4-v3-v2 down
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0 // v4-v7-v6-v5 back
        ]);

        var normals = new Float32Array([ // Normal
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
        ]);

        var indices = new Uint8Array([ // Indices of the vertices
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // up
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // down
            20, 21, 22, 20, 22, 23 // back
        ]);

        // Write the vertex coordinates and color to the buffer object
        if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) {
            return -1
        }

        if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color')) {
            return -1
        }

        if (!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')) {
            return -1
        }

        // Create a buffer object
        const indexBuffer = gl.createBuffer()
        if (!indexBuffer) {
            return -1
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

        return indices.length
    }

    function initArrayBuffer(gl, data, size, type, attribue) {
        const buffer = gl.createBuffer()
        if (!buffer) {
            console.log('Failed to create Buffer')
            return false
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

        const a_attribute = gl.getAttribLocation(gl.program, attribue)
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ', attribue)
            return false
        }

        gl.vertexAttribPointer(a_attribute, size, type, false, 0, 0)
        gl.enableVertexAttribArray(a_attribute)

        return true
    }

    return {
        main: main
    }
})()
