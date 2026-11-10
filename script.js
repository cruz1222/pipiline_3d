// ==============================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y CENTRO DE PANTALLA
// ==============================================================================
const canvas = document.getElementById('lienzo3D');
const ctx = canvas.getContext('2d');
const CENTRO_X = canvas.width / 2;
const CENTRO_Y = canvas.height / 2;

// ==============================================================================
// 2. TEMAS 3.1 & 3.2: GEOMETRÍA TRIDIMENSIONAL (MODELO LOCAL DE CUBO 3D)
// ==============================================================================
// Catálogo de figuras: cada una tiene su lista de vértices y su matriz de conectividad
// (aristas = pares de índices de vértices). Todas están centradas en (0,0,0).
const figuras = {
    // Cubo original: 8 vértices, 12 aristas
    cubo: {
        nombre: 'Cubo',
        vertices: [
            {x: -80, y: -80, z: -80}, // V0: Inferior Trasero Izq
            {x:  80, y: -80, z: -80}, // V1: Inferior Trasero Der
            {x:  80, y:  80, z: -80}, // V2: Superior Trasero Der
            {x: -80, y:  80, z: -80}, // V3: Superior Trasero Izq
            {x: -80, y: -80, z:  80}, // V4: Inferior Frontal Izq
            {x:  80, y: -80, z:  80}, // V5: Inferior Frontal Der
            {x:  80, y:  80, z:  80}, // V6: Superior Frontal Der
            {x: -80, y:  80, z:  80}  // V7: Superior Frontal Izq
        ],
        aristas: [
            [0, 1], [1, 2], [2, 3], [3, 0],   // Cara trasera
            [4, 5], [5, 6], [6, 7], [7, 4],   // Cara frontal
            [0, 4], [1, 5], [2, 6], [3, 7]    // Longitudinales
        ]
    },

    // OPCIÓN A: Pirámide de base cuadrada: 5 vértices, 8 aristas
    piramide: {
        nombre: 'Pirámide de base cuadrada',
        vertices: [
            {x: -80, y: -80, z: -80}, // V0: Base trasera izq
            {x:  80, y: -80, z: -80}, // V1: Base trasera der
            {x:  80, y: -80, z:  80}, // V2: Base frontal der
            {x: -80, y: -80, z:  80}, // V3: Base frontal izq
            {x:   0, y:  80, z:   0}  // V4: Ápice
        ],
        aristas: [
            [0, 1], [1, 2], [2, 3], [3, 0],   // 4 aristas de la base
            [0, 4], [1, 4], [2, 4], [3, 4]    // 4 aristas laterales al ápice
        ]
    },

    // OPCIÓN B: Prisma triangular: 6 vértices, 9 aristas
    // (triángulo en el plano XY extruido a lo largo de Z; centroide en el origen)
    prisma: {
        nombre: 'Prisma triangular',
        vertices: [
            {x: -80, y: -55, z: -80}, // V0: Triángulo trasero izq
            {x:  80, y: -55, z: -80}, // V1: Triángulo trasero der
            {x:   0, y: 110, z: -80}, // V2: Triángulo trasero superior
            {x: -80, y: -55, z:  80}, // V3: Triángulo frontal izq
            {x:  80, y: -55, z:  80}, // V4: Triángulo frontal der
            {x:   0, y: 110, z:  80}  // V5: Triángulo frontal superior
        ],
        aristas: [
            [0, 1], [1, 2], [2, 0],           // Triángulo trasero
            [3, 4], [4, 5], [5, 3],           // Triángulo frontal
            [0, 3], [1, 4], [2, 5]            // Aristas longitudinales
        ]
    },

    // OPCIÓN C: Octaedro: 6 vértices, 12 aristas
    octaedro: {
        nombre: 'Octaedro',
        vertices: [
            {x:  110, y:    0, z:    0}, // V0: +X
            {x: -110, y:    0, z:    0}, // V1: -X
            {x:    0, y:  110, z:    0}, // V2: +Y (polo superior)
            {x:    0, y: -110, z:    0}, // V3: -Y (polo inferior)
            {x:    0, y:    0, z:  110}, // V4: +Z
            {x:    0, y:    0, z: -110}  // V5: -Z
        ],
        aristas: [
            [0, 2], [0, 3], [0, 4], [0, 5],   // +X con los 4 vértices de otros ejes
            [1, 2], [1, 3], [1, 4], [1, 5],   // -X con los 4 vértices de otros ejes
            [2, 4], [2, 5], [3, 4], [3, 5]    // Ecuador en el plano Z/Y
        ]
    }
};

// Figura activa (se reasignan al cambiar el selector)
let modeloCuboLocal = figuras.cubo.vertices;
let aristasCubo = figuras.cubo.aristas;

function cambiarFigura(clave) {
    const f = figuras[clave];
    modeloCuboLocal = f.vertices;
    aristasCubo = f.aristas;
    document.getElementById('infoFigura').innerText =
        f.nombre + ': ' + f.vertices.length + ' vértices, ' + f.aristas.length + ' aristas';
    renderizar();
}

// ==============================================================================
// 3. TEMA 3.3: PIPELINE DE TRANSFORMACIONES TRIDIMENSIONALES
// ==============================================================================
function transformarVertice3D(v, params) {
    let { tx, ty, tz, sx, sy, sz, rx, ry, rz, shxy, shxz } = params;

    // Convertir ángulos a radianes
    let radX = rx * Math.PI / 180;
    let radY = ry * Math.PI / 180;
    let radZ = rz * Math.PI / 180;

    // --- 3.3.2 ESCALAMIENTO (S) ---
    let x1 = v.x * sx;
    let y1 = v.y * sy;
    let z1 = v.z * sz;

    // --- 3.3.4 SESGADO / SHEAR (Sh) ---
    let x2 = x1 + (shxy * y1) + (shxz * z1);
    let y2 = y1;
    let z2 = z1;

    // --- 3.3.3 ROTACIÓN EN EJE X (Pitch) ---
    let x3 = x2;
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

    // --- 3.3.3 ROTACIÓN EN EJE Y (Yaw) ---
    let x4 = x3 * Math.cos(radY) + z3 * Math.sin(radY);
    let y4 = y3;
    let z4 = -x3 * Math.sin(radY) + z3 * Math.cos(radY);

    // --- 3.3.3 ROTACIÓN EN EJE Z (Roll) ---
    let x5 = x4 * Math.cos(radZ) - y4 * Math.sin(radZ);
    let y5 = x4 * Math.sin(radZ) + y4 * Math.cos(radZ);
    let z5 = z4;

    // --- 3.3.1 TRASLACIÓN (T) ---
    let xFinal = x5 + tx;
    let yFinal = y5 + ty;
    let zFinal = z5 + tz;

    return { x: xFinal, y: yFinal, z: zFinal };
}

// ==============================================================================
// 4. TEMA 3.1: PROYECCIÓN PERSPECTIVA (3D A PANTALLA 2D)
// ==============================================================================
function proyectar3Da2D(v3d) {
    const distanciaCamara = 500;
    
    let zAjustado = v3d.z + distanciaCamara;
    if (zAjustado < 1) zAjustado = 1;

    // Factor de escala por perspectiva (división entre Z)
    let factorProyeccion = distanciaCamara / zAjustado;

    // Mapeo a píxeles en el lienzo
    let x2d = CENTRO_X + (v3d.x * factorProyeccion);
    let y2d = CENTRO_Y - (v3d.y * factorProyeccion); // Inversión en eje Y

    return { x: x2d, y: y2d, factor: factorProyeccion };
}

// ==============================================================================
// 5. BUCLE DE RENDERIZADO EN TIEMPO REAL
// ==============================================================================
function renderizar() {
    // 1. Obtener parámetros del panel
    const params = {
        tx: parseFloat(document.getElementById('tx').value),
        ty: parseFloat(document.getElementById('ty').value),
        tz: parseFloat(document.getElementById('tz').value),
        sx: parseFloat(document.getElementById('sx').value),
        sy: parseFloat(document.getElementById('sy').value),
        sz: parseFloat(document.getElementById('sz').value),
        rx: parseFloat(document.getElementById('rx').value),
        ry: parseFloat(document.getElementById('ry').value),
        rz: parseFloat(document.getElementById('rz').value),
        shxy: parseFloat(document.getElementById('shxy').value),
        shxz: parseFloat(document.getElementById('shxz').value)
    };

    // 2. Actualizar indicadores numéricos
    document.getElementById('valTx').innerText = params.tx;
    document.getElementById('valTy').innerText = params.ty;
    document.getElementById('valTz').innerText = params.tz;
    document.getElementById('valSx').innerText = params.sx.toFixed(1);
    document.getElementById('valSy').innerText = params.sy.toFixed(1);
    document.getElementById('valSz').innerText = params.sz.toFixed(1);
    document.getElementById('valRx').innerText = params.rx + '°';
    document.getElementById('valRy').innerText = Math.round(params.ry) + '°';
    document.getElementById('valRz').innerText = params.rz + '°';
    document.getElementById('valShXY').innerText = params.shxy.toFixed(1);
    document.getElementById('valShXZ').innerText = params.shxz.toFixed(1);

    // 3. Limpiar lienzo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 4. Dibujar ejes cartesianos de guía
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CENTRO_X, 0); ctx.lineTo(CENTRO_X, canvas.height);
    ctx.moveTo(0, CENTRO_Y); ctx.lineTo(canvas.width, CENTRO_Y);
    ctx.stroke();

    // 5. Aplicar transformaciones 3D
    let verticesTransformados = modeloCuboLocal.map(v => transformarVertice3D(v, params));

    // 6. Proyectar a coordenadas 2D
    let vertices2D = verticesTransformados.map(proyectar3Da2D);

    // 7. Renderizar aristas: degradado de color según profundidad y grosor según escala
    //    (factor > 1 = vértice cercano a la cámara; factor < 1 = lejano)
    for (let arista of aristasCubo) {
        let p1 = vertices2D[arista[0]];
        let p2 = vertices2D[arista[1]];
        let grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, colorPorProfundidad(p1.factor));
        grad.addColorStop(1, colorPorProfundidad(p2.factor));
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1, 3 * ((p1.factor + p2.factor) / 2));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // 8. Renderizar vértices: color ámbar/dorado, radio proporcional a la perspectiva
    for (let p of vertices2D) {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2, 4.5 * p.factor), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// Paleta propia: violeta (lejos) -> magenta/rosa (cerca)
function colorPorProfundidad(factor) {
    let t = Math.min(1, Math.max(0, (factor - 0.6) / 0.9)); // normaliza ~[0,1]
    let hue = 260 + t * 80;                                  // 260 (violeta) a 340 (rosa)
    let luz = 55 + t * 15;
    return 'hsl(' + hue + ', 90%, ' + luz + '%)';
}

// ==============================================================================
// RETO: AUTO-ROTACIÓN CONTINUA SOBRE EL EJE Y (YAW) CON requestAnimationFrame
// ==============================================================================
const sliderRy = document.getElementById('ry');
const btnAuto = document.getElementById('btnAutoRotar');
const VELOCIDAD_GRADOS_POR_SEG = 60;
let autoRotando = false;
let anguloY = parseFloat(sliderRy.value);
let tiempoPrevio = 0;

function animar(tiempoActual) {
    if (!autoRotando) return;
    let dt = (tiempoActual - tiempoPrevio) / 1000;
    tiempoPrevio = tiempoActual;
    anguloY += VELOCIDAD_GRADOS_POR_SEG * dt;
    if (anguloY > 180) anguloY -= 360;       // el deslizador va de -180 a 180
    sliderRy.value = anguloY;
    renderizar();
    requestAnimationFrame(animar);
}

btnAuto.addEventListener('click', () => {
    autoRotando = !autoRotando;
    btnAuto.classList.toggle('activo', autoRotando);
    btnAuto.innerText = autoRotando ? '⏸ Detener auto-rotación' : '▶ Auto-rotación (Yaw)';
    if (autoRotando) {
        anguloY = parseFloat(sliderRy.value);
        tiempoPrevio = performance.now();
        requestAnimationFrame(animar);
    }
});

// Si el usuario mueve el deslizador Yaw manualmente, se sincroniza el ángulo interno
sliderRy.addEventListener('input', () => { anguloY = parseFloat(sliderRy.value); });

// Selector de figura
document.getElementById('selectorFigura').addEventListener('change', e => cambiarFigura(e.target.value));

// Escuchar cambios en los deslizadores para refrescar en tiempo real
document.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', renderizar);
});

// Ejecución inicial
cambiarFigura('cubo');
