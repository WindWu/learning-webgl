var ColoredPoints = (function () {
    const VSHADER_SOURCE =
        `
        attribute vec4 a_Position;
        attribute float a_PointSize;
        void main() {
            gl_Position = a_Position;
            gl_PointSize = a_PointSize;
        }
        `;
    const FSHADER_SOURCE =
        `
        precision mediump float;
        uniform vec4 u_FragColor;
        void main() {
            gl_FragColor = u_FragColor;
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

        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return;
        }

        const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
        if (a_PointSize < 0) {
            console.log('Failed to get the storage location of a_PointSize');
            return;
        }

        const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
        if (!u_FragColor) {
            console.log('Failed to get the storage location of u_FragColor');
            return;
        }

        gl.clearColor(0.0, 0.8, 0.8, 1.0);
        gl.vertexAttrib1f(a_PointSize, 10);
        gl.clear(gl.COLOR_BUFFER_BIT);

        canvas.onmousedown = function (event) {
            click(event, gl, canvas, a_Position, u_FragColor);
        }

        var g_Points = [];
        var g_colors = [];

        function click(event, gl, canvas, a_Position, u_FragColor) {
            // cursor position in client
            var clientX = event.clientX;
            var clientY = event.clientY;
            var rect = event.target.getBoundingClientRect();

            // cursor position in canvas
            var canvasX = clientX - rect.left;
            var canvasY = clientY - rect.top;

            // webgl origin in canvas
            var glOriginX = canvas.width / 2;
            var glOriginY = canvas.height / 2;

            // cursor position in webgl    
            var x = canvasX - glOriginX;
            var y = -(canvasY - glOriginY);

            // converter to webgl coordinates
            x = x / (canvas.width / 2);
            y = y / (canvas.height / 2)

            g_Points.push([x, y]);

            if (x >= 0.0 && y >= 0.0) {
                g_colors.push([1.0, 0, 0, 1.0]);
            } else if (x < 0.0 && y > 0.0) {
                g_colors.push([0.0, 1.0, 0.0, 1.0]);
            } else if (x < 0.0 && y < 0.0) {
                g_colors.push([0.0, 0.0, 1.0, 1.0]);
            } else {
                g_colors.push([1.0, 1.0, 1.0, 1.0]);
            }

            gl.clear(gl.COLOR_BUFFER_BIT);

            var len = g_Points.length;
            for (var i = 0; i < len; i++) {
                const xy = g_Points[i];
                const rgba = g_colors[i];
                gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
                gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
                gl.drawArrays(gl.POINTS, 0, 1);
            }
        }
    }

    return {
        main: main
    }
})();