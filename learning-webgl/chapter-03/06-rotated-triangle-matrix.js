var RotatedTriangleMatrix = (function () {
  const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        uniform mat4 u_xformMatrix;
        void main() {
            gl_Position = u_xformMatrix * a_Position;
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

    const u_xformMatrix = gl.getUniformLocation(gl.program, "u_xformMatrix");
    if (!u_xformMatrix) {
      console.log("Failed to get the u_xformMatrix");
      return;
    }

    const radian = Math.PI * (ANGLE / 180);
    const cosB = Math.cos(radian);
    const sinB = Math.sin(radian);
    const xformMatrix = new Float32Array([
      cosB, sinB, 0.0, 0.0, -sinB, cosB, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0
    ]);

    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);

    gl.clearColor(0.0, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }

  function initVertexBuffers(gl) {
    var vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
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