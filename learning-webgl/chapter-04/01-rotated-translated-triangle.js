const RotatedTranslatedTriangle = (function () {
  const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        uniform mat4 u_ModelMatrix;
        void main() {
            gl_Position = u_ModelMatrix * a_Position;
        }
        `;
  const FSHADER_SOURCE = `
        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
        `;

  const ANGLE = 90;

  function main() {
    const canvas = document.getElementById("webgl");
    const gl = getWebGLContext(canvas);
    if (!gl) {
      console.log("Failed to get the rendering context for WebGL");
      return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log("Failed to initialize shaders");
      return;
    }

    const n = initVertexBuffers(gl);
    if (n < 0) {
      console.log("Failed to set the positions of the vertices");
      return;
    }

    const u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
      console.log("Failed to get the u_ModelMatrix");
      return;
    }
    const angle = 60;
    const tX = 0.5;
    const modelMatrix = new Matrix4();

    // modelMatrix.setRotate(angle, 0, 0, 1);
    // modelMatrix.translate(tX, 0.0, 0.0);
    modelMatrix.setTranslate(tX, 0.0, 0.0);
    modelMatrix.rotate(angle, 0, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.clearColor(0.0, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }

  function initVertexBuffers(gl) {
    var vertices = new Float32Array([0, 0.3, -0.3, -0.3, 0.3, -0.3]);
    var n = 3;
    var vertexBuffer = new gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create the buffer object");
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
      console.log("Failed to get the storage location of a_Position");
      return;
    }

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(a_Position);

    return n;
  }

  return {
    main: main
  };
})();