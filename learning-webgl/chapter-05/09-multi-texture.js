const MultiTexture = (function () {
  const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec2 a_TexCoord;
        varying vec2 v_TexCoord;
        void main() {
            gl_Position = a_Position;
            v_TexCoord = a_TexCoord;
        }
        `;
  const FSHADER_SOURCE = `
        precision mediump float;
        uniform sampler2D u_Sampler0;
        uniform sampler2D u_Sampler1;
        varying vec2 v_TexCoord;
        void main() {
            vec4 color0 = texture2D(u_Sampler0, v_TexCoord);
            vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
            gl_FragColor = color0 * color1;
        }
        `;

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

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.8, 0.8, 1.0);

    if (!initTextures(gl, n)) {
      console.log("Failed to initialize the texture");
      return;
    }
  }

  function initVertexBuffers(gl) {
    const verticesTexCoords = new Float32Array([-0.5,
      0.5,
      0.0,
      1.0, -0.5, -0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      1.0,
      1.0,
      0.5, -0.5,
      1.0,
      0.0
    ]);
    const n = 4;
    const vertexTexCoordBuffer = new gl.createBuffer();
    if (!vertexTexCoordBuffer) {
      console.log("Failed to create the buffer object");
      return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

    const a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
      console.log("Failed to get the storage location of a_Position");
      return -1;
    }

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);

    const a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
    if (a_TexCoord < 0) {
      console.log("Failed to get the storage location of a_TexCoord");
      return -1;
    }

    gl.vertexAttribPointer(
      a_TexCoord,
      2,
      gl.FLOAT,
      false,
      FSIZE * 4,
      FSIZE * 2
    );
    gl.enableVertexAttribArray(a_TexCoord);
    return n;
  }

  function initTextures(gl, n) {
    const texture0 = gl.createTexture();
    if (!texture0) {
      console.log("Failed to create Texture 0");
      return false;
    }

    const texture1 = gl.createTexture();
    if (!texture1) {
      console.log("Failed to create Texture 1");
      return false;
    }


    const u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
    if (u_Sampler0 < 0) {
      console.log("Failed to get the location of u_Sampler0");
      return false;
    }

    const u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
    if (u_Sampler1 < 0) {
      console.log("Failed to get the location of u_Sampler1");
      return false;
    }

    const image0 = new Image();
    image0.onload = () => {
      loadTexture(gl, n, texture0, u_Sampler0, image0, 0);
    };

    image0.src = "../resources/sky.jpg";

    const image1 = new Image();
    image1.onload = () => {
      loadTexture(gl, n, texture1, u_Sampler1, image1, 1);
    };

    image1.src = "../resources/circle.gif";

  }

  let g_texUnit0 = false;
  let g_texUnit1 = true;

  function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    if (texUnit === 0) {
      // Enable texture unit0
      gl.activeTexture(gl.TEXTURE0);
      g_texUnit0 = true;
    } else {
      gl.activeTexture(gl.TEXTURE1);
      g_texUnit1 = true;
    }
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler, texUnit);

    gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>

    if (g_texUnit0 && g_texUnit1) {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
    }
  }

  return {
    main: main
  };
})();