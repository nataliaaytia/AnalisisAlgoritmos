const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let nodos = [];
let aristas = [];
let modo = "nodo";
let nodoSeleccionado = null;
let radio = 30;
let nodoHover = null;
let nodoActivo = null;

function generarColor() {
    const colores = [
        "#c8c29e",
        "#e99897",
        "#abcbd3",
        "#ffc98d",
        "#e1d3b6",
        "#c0a290",
        "#ffb284",
        "#2a9d8f",
        "#ff9f1c",
    ];
    return colores[Math.floor(Math.random() * colores.length)];
}

function cambiarModo(valor, boton) {

    modo = valor;
    nodoSeleccionado = null;
    nodoActivo = null;

    // Quitar activo de todos
    document.querySelectorAll(".modo-btn").forEach(btn => {
        btn.classList.remove("activo");
    });

    // Activar el clickeado
    boton.classList.add("activo");

    dibujar();
}

canvas.addEventListener("click", function (e) {

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodo = obtenerNodo(x, y);

    if (modo === "nodo") {

        nodoActivo = null;

        abrirModal("Nombre del nodo", function (nombre) {
            if (!nombre) return;

            nodos.push({ x, y, nombre });
            dibujar();
        });

        return;
    }

    if (modo === "arista") {

        if (!nodo) return;

        nodoActivo = nodo;
        dibujar();

        if (!nodoSeleccionado) {
            nodoSeleccionado = nodo;
            return;
        }

        const yaExiste = aristas.some(a =>
            a.desde === nodoSeleccionado &&
            a.hasta === nodo
        );

        if (yaExiste) {

            abrirModal("Advertencia", null, "text", false);
            document.getElementById("modal-error").textContent =
                "La arista ya existe.";

            nodoSeleccionado = null;
            nodoActivo = null;
            return;
        }

        abrirModal("Peso de la arista", function (peso) {

            if (isNaN(peso) || peso <= 0) {
                document.getElementById("modal-error").textContent =
                    "Ingrese un número válido.";
                return false;
            }

            aristas.push({
                desde: nodoSeleccionado,
                hasta: nodo,
                peso: parseFloat(peso),
                dirigida: document.getElementById("modal-dirigida-check").checked,
                color: generarColor()
            });

            nodoSeleccionado = null;
            nodoActivo = null;

            dibujar();

        }, "number", true, true);
    }

    if (modo === "borrar") {

        if (nodo) {

            // eliminar aristas conectadas
            aristas = aristas.filter(a =>
                a.desde !== nodo && a.hasta !== nodo
            );

            // eliminar nodo
            nodos = nodos.filter(n => n !== nodo);

            dibujar();
        }

        return;
    }

    if (modo === "editar") {

        if (!nodo) return;

        abrirModal("Nuevo nombre del nodo", function (nombre) {

            if (!nombre) return false;

            nodo.nombre = nombre;
            dibujar();

        });

        return;
    }
});


canvas.addEventListener("mousemove", function (e) {

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    nodoHover = obtenerNodo(x, y);
    canvas.style.cursor = nodoHover ? "pointer" : "default";

    dibujar();
});


function obtenerNodo(x, y) {
    return nodos.find(n =>
        Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < radio
    );
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    aristas.forEach(arista => dibujarArista(arista));
    nodos.forEach(nodo => dibujarNodo(nodo));
}

function dibujarNodo(nodo) {

    ctx.beginPath();
    ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);

    if (nodo !== nodoHover && nodo !== nodoActivo) {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "#d9825b";
        ctx.lineWidth = 3;
    }

    if (nodo === nodoHover && nodo !== nodoActivo) {

        const gradient = ctx.createLinearGradient(
            nodo.x - radio,
            nodo.y - radio,
            nodo.x + radio,
            nodo.y + radio
        );

        gradient.addColorStop(0, "#f6b38a");
        gradient.addColorStop(1, "#e27d4f");

        ctx.fillStyle = gradient;
        ctx.strokeStyle = "#d9825b";
        ctx.lineWidth = 3;
    }

    if (nodo === nodoActivo) {

        const gradient = ctx.createLinearGradient(
            nodo.x - radio,
            nodo.y - radio,
            nodo.x + radio,
            nodo.y + radio
        );

        gradient.addColorStop(0, "#e27d4f");
        gradient.addColorStop(1, "#c75f2f");

        ctx.fillStyle = gradient;
        ctx.strokeStyle = "#b54c1f";
        ctx.lineWidth = 3;
    }

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = nodo === nodoHover || nodo === nodoActivo ? "white" : "#d9825b";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nodo.nombre, nodo.x, nodo.y);
}

function dibujarArista(arista) {

    const desde = arista.desde;
    const hasta = arista.hasta;

    if (desde === hasta) {

        const loopRadius = 30;
        const loopX = desde.x;
        const loopY = desde.y - 50;

        ctx.beginPath();
        ctx.strokeStyle = arista.color;
        ctx.lineWidth = 2;
        ctx.arc(loopX, loopY, loopRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Peso
        ctx.fillStyle = arista.color;
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(arista.peso, loopX, loopY - loopRadius - 10);

        if (arista.dirigida) {

            const angle = 0;
            const arrowX = loopX + loopRadius;
            const arrowY = loopY;

            dibujarFlecha(arrowX, arrowY, Math.PI / 2, arista.color);
        }

        return;
    }

    let offset = 0;

    const existeInversa = aristas.some(a =>
        a.desde === hasta &&
        a.hasta === desde &&
        a !== arista
    );

    if (existeInversa) offset = 40;

    const dx = hasta.x - desde.x;
    const dy = hasta.y - desde.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const normX = dx / dist;
    const normY = dy / dist;

    const startX = desde.x + normX * radio;
    const startY = desde.y + normY * radio;
    const endX = hasta.x - normX * radio;
    const endY = hasta.y - normY * radio;

    const controlX = (startX + endX) / 2 - normY * offset;
    const controlY = (startY + endY) / 2 + normX * offset;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.strokeStyle = arista.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Peso
    ctx.fillStyle = arista.color;
    ctx.font = "bold 18px Arial";
    ctx.fillText(arista.peso, controlX, controlY);

    // Flecha
    if (arista.dirigida) {

        const angle = Math.atan2(endY - controlY, endX - controlX);
        dibujarFlecha(endX, endY, angle, arista.color);
    }
}

function dibujarFlecha(x, y, angle, color) {

    const size = 12;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
        x - size * Math.cos(angle - Math.PI / 6),
        y - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x - size * Math.cos(angle + Math.PI / 6),
        y - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}
function limpiarGrafo() {
    nodos = [];
    aristas = [];
    nodoSeleccionado = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
let modalCallback = null;
function abrirModal(titulo, callback = null, tipo = "text", mostrarInput = true, mostrarDirigida = false) {

    document.getElementById("modal-title").textContent = titulo;

    const input = document.getElementById("modal-input");
    const error = document.getElementById("modal-error");
    const dirigidaLabel = document.getElementById("modal-dirigida");
    const dirigidaCheck = document.getElementById("modal-dirigida-check");

    input.value = "";
    input.type = tipo;
    error.textContent = "";

    input.style.display = mostrarInput ? "block" : "none";

    dirigidaLabel.style.display = mostrarDirigida ? "block" : "none";
    dirigidaCheck.checked = false;

    document.getElementById("modal").classList.add("active");

    modalCallback = callback;
}

function cerrarModal() {
    document.getElementById("modal").classList.remove("active");
}
function confirmarModal() {

    const input = document.getElementById("modal-input");
    const valor = input.value.trim();

    // Si el input está visible, validamos
    if (input.style.display !== "none") {

        if (valor === "") {
            document.getElementById("modal-error").textContent = "El campo no puede estar vacío.";
            return;
        }

        if (modalCallback) {
            const resultado = modalCallback(valor);
            if (resultado === false) return;
        }
    }

    cerrarModal();
}

function animarNodo() {
    let animando = true;

    function frame() {
        animando = false;

        nodos.forEach(n => {
            if (n.scale < 1) {
                n.scale += 0.08;
                animando = true;
            }
        });

        dibujar();

        if (animando) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function generarMatriz() {

    if (nodos.length === 0) return;

    const container = document.getElementById("matriz-container");
    container.innerHTML = "";

    const n = nodos.length;

    let matriz = Array.from({ length: n }, () =>
        Array(n).fill(0)
    );

    aristas.forEach(arista => {

        const i = nodos.indexOf(arista.desde);
        const j = nodos.indexOf(arista.hasta);

        matriz[i][j] += arista.peso;

        if (!arista.dirigida) {
            matriz[j][i] += arista.peso;
        }
    });

    const tabla = document.createElement("table");

    let sumColumnas = Array(n).fill(0);
    let countColumnas = Array(n).fill(0);

    const header = document.createElement("tr");
    header.appendChild(document.createElement("th"));

    nodos.forEach(nodo => {
        const th = document.createElement("th");
        th.textContent = nodo.nombre;
        header.appendChild(th);
    });

    header.appendChild(Object.assign(document.createElement("th"), { textContent: "Suma Fila" }));
    header.appendChild(Object.assign(document.createElement("th"), { textContent: "Count" }));

    tabla.appendChild(header);

    matriz.forEach((fila, i) => {

        const tr = document.createElement("tr");

        const th = document.createElement("th");
        th.textContent = nodos[i].nombre;
        tr.appendChild(th);

        let sumaFila = 0;
        let countFila = 0;

        fila.forEach((valor, j) => {

            const td = document.createElement("td");
            td.textContent = valor === 0 ? "" : valor;
            td.classList.add("matriz-cell");
            tr.appendChild(td);

            sumaFila += valor;

            if (valor !== 0) {
                countFila++;
                countColumnas[j]++;
            }

            sumColumnas[j] += valor;
        });

        const tdSum = document.createElement("td");
        tdSum.textContent = sumaFila;
        tdSum.classList.add("suma-cell");
        tr.appendChild(tdSum);

        const tdCount = document.createElement("td");
        tdCount.textContent = countFila;
        tdCount.classList.add("count-cell");
        tr.appendChild(tdCount);

        tabla.appendChild(tr);
    });

    const trSumCol = document.createElement("tr");
    trSumCol.appendChild(Object.assign(document.createElement("th"), { textContent: "Suma Col" }));

    sumColumnas.forEach(valor => {
        const td = document.createElement("td");
        td.textContent = valor;
        td.classList.add("suma-cell");
        trSumCol.appendChild(td);
    });

    trSumCol.appendChild(document.createElement("td"));
    trSumCol.appendChild(document.createElement("td"));

    tabla.appendChild(trSumCol);

    const trCountCol = document.createElement("tr");
    trCountCol.appendChild(Object.assign(document.createElement("th"), { textContent: "Count Col" }));

    countColumnas.forEach(valor => {
        const td = document.createElement("td");
        td.textContent = valor;
        td.classList.add("count-cell");
        trCountCol.appendChild(td);
    });

    trCountCol.appendChild(document.createElement("td"));
    trCountCol.appendChild(document.createElement("td"));

    tabla.appendChild(trCountCol);

    container.appendChild(tabla);
}

function abrirHelp() {
    document.getElementById("help-modal").classList.add("active");
}

function cerrarHelp() {
    document.getElementById("help-modal").classList.remove("active");
}