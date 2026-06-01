// ==========================================================================
// Controlador Principal (Orquestador por Cantidades, Carga Manual y Modal)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. ESTADO INTERNO DE LA APLICACIÓN
    let currentElementCounts = {};
    let actionHistory = [];
    let activeSubscript = 1;
    let activeNetCharge = 0; // Carga manual elegida por el usuario (-4 a +4)
    let lastCalculatedResult = null; // Almacena el último desglose del motor químico

    // 2. REFERENCIAS A ELEMENTOS DEL DOM
    const keyboardContainer = document.getElementById("elementKeyboard");
    const formulaViewer = document.getElementById("mathjaxFormula");
    const statusIndicator = document.getElementById("statusIndicator");
    const explanationText = document.getElementById("explanationText");
    
    const btnUndo = document.getElementById("btnUndo");
    const btnClear = document.getElementById("btnClear");
    const btnShowFormalCharges = document.getElementById("btnShowFormalCharges"); // Botón Pedagógico

    // Selectores de Subíndice
    const btnSubMinus = document.getElementById("btnSubMinus");
    const btnSubPlus = document.getElementById("btnSubPlus");
    const currentSubscriptDisplay = document.getElementById("currentSubscript");

    // Selectores de Carga Neta
    const btnChargeMinus = document.getElementById("btnChargeMinus");
    const btnChargePlus = document.getElementById("btnChargePlus");
    const currentChargeDisplay = document.getElementById("currentChargeValue");

    // Elementos de la Ventana Modal
    const formalChargeModal = document.getElementById("formalChargeModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const modalTableBody = document.getElementById("modalTableBody");

    // ==========================================================================
    // 3. INICIALIZACIÓN DEL TECLADO QUÍMICO COMPACTO
    // ==========================================================================
    function initKeyboard() {
        if (!keyboardContainer) return;
        keyboardContainer.innerHTML = "";

        Object.keys(periodicData).forEach(symbol => {
            const element = periodicData[symbol];
            
            const button = document.createElement("button");
            button.className = "key-element";
            button.setAttribute("data-symbol", symbol);
            
            button.innerHTML = `
                <span class="key-symbol">${symbol}</span>
                <span class="key-electrons">${element.valenceElectrons}e⁻</span>
            `;

            // Capturar pulsación táctil móvil
            button.addEventListener("click", () => {
                addElementWithSubscript(symbol, activeSubscript);
            });

            keyboardContainer.appendChild(button);
        });
    }

    // ==========================================================================
    // 4. GESTIÓN DE SELECTORES (SUBÍNDICES Y CARGAS)
    // ==========================================================================
    function increaseSubscript() {
        if (activeSubscript < 12) {
            activeSubscript++;
            currentSubscriptDisplay.innerText = activeSubscript;
        }
    }

    function decreaseSubscript() {
        if (activeSubscript > 1) {
            activeSubscript--;
            currentSubscriptDisplay.innerText = activeSubscript;
        }
    }

    function increaseCharge() {
        if (activeNetCharge < 4) {
            activeNetCharge++;
            currentChargeDisplay.innerText = activeNetCharge > 0 ? "+" + activeNetCharge : activeNetCharge;
            updateApp();
        }
    }

    function decreaseCharge() {
        if (activeNetCharge > -4) {
            activeNetCharge--;
            currentChargeDisplay.innerText = activeNetCharge;
            updateApp();
        }
    }

    // ==========================================================================
    // 5. LÓGICA DE AGREGADO Y CONTROL DE HISTORIAL
    // ==========================================================================
    function addElementWithSubscript(symbol, count) {
        let currentTotalAtoms = 0;
        for (const el in currentElementCounts) {
            currentTotalAtoms += currentElementCounts[el];
        }

        // Límite físico en cruz para evitar encimamientos en la pantalla
        if (currentTotalAtoms + count > 16) {
            alert("El límite total es de 16 átomos para mantener la nitidez en el lienzo.");
            return;
        }

        // Respaldar estado en el historial para permitir "Deshacer"
        actionHistory.push(JSON.stringify({
            counts: currentElementCounts,
            charge: activeNetCharge
        }));

        currentElementCounts[symbol] = (currentElementCounts[symbol] || 0) + count;
        
        // Resetear subíndice base a 1 tras añadir un elemento
        activeSubscript = 1;
        currentSubscriptDisplay.innerText = activeSubscript;

        updateApp();
    }
    function undoLastAction() {
        if (actionHistory.length > 0) {
            const previousState = JSON.parse(actionHistory.pop());
            currentElementCounts = previousState.counts;
            activeNetCharge = previousState.charge;

            currentChargeDisplay.innerText = activeNetCharge > 0 ? "+" + activeNetCharge : activeNetCharge;
            updateApp();
        }
    }

    function clearAll() {
        actionHistory = [];
        currentElementCounts = {};
        activeSubscript = 1;
        activeNetCharge = 0;
        currentSubscriptDisplay.innerText = activeSubscript;
        currentChargeDisplay.innerText = activeNetCharge;
        updateApp();
    }

    // ==========================================================================
    // 6. LÓGICA DE CONTROL DE LA VENTANA MODAL (POP-UP)
    // ==========================================================================
    function openFormalModal() {
        if (!lastCalculatedResult || !lastCalculatedResult.breakdown) return;

        // Construcción dinámica de la tabla Serif con las restas moleculares
        let tableHTML = `
            <table class="formal-table">
                <thead>
                    <tr>
                        <th>Átomo</th>
                        <th>Val.</th>
                        <th>Lib.</th>
                        <th>Enl.</th>
                        <th>CF*</th>
                    </tr>
                </thead>
                <tbody>
        `;

        lastCalculatedResult.breakdown.forEach(row => {
            // Aplicar colores según la carga sea neutra o activa
            const badgeClass = row.fc === 0 ? "charge-zero" : "charge-active";
            const fcFormatted = row.fc > 0 ? "+" + row.fc : row.fc;

            tableHTML += `
                <tr>
                    <td><strong>${row.atom}</strong></td>
                    <td>${row.valence}</td>
                    <td>${row.free}</td>
                    <td>${row.bonds}</td>
                    <td><span class="badge-charge ${badgeClass}">${fcFormatted}</span></td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        
        // Inyectar la tabla dentro del contenedor modal y activar la capa visible
        modalTableBody.innerHTML = tableHTML;
        formalChargeModal.classList.add("active");
    }

    function closeFormalModal() {
        formalChargeModal.classList.remove("active");
    }

    // ==========================================================================
    // 7. ACTUALIZACIÓN GRÁFICA GENERAL Y SINCRONIZACIÓN
    // ==========================================================================
    function updateApp() {
        btnUndo.disabled = actionHistory.length === 0;

        // Mandar los datos al motor matemático de cargas formales
        const result = chemistryEngine.validateCombination(currentElementCounts, activeNetCharge);
        lastCalculatedResult = result; // Respaldar para el modal

        // Habilitar o deshabilitar el botón de desglose según el éxito químico de la combinación
        const hasElements = Object.keys(currentElementCounts).length > 0;
        btnShowFormalCharges.disabled = !result.possible || !hasElements;

        if (result.htmlFormula) {
            // Inyección híbrida en HTML plano (Evita códigos crudos o undefined al instante)
            formulaViewer.innerHTML = result.htmlFormula;
            
            statusIndicator.className = "status-indicator " + 
                (result.possible ? "status-possible" : "status-impossible");
            statusIndicator.innerText = result.statusText;
            explanationText.innerHTML = result.explanation;

            // Refinamiento de MathJax asíncrono
            if (window.MathJax && window.MathJax.typesetPromise) {
                formulaViewer.innerHTML = `\\[ ${result.formula} \\]`;
                window.MathJax.typesetPromise([formulaViewer]).catch((err) => {
                    formulaViewer.innerHTML = result.htmlFormula;
                });
            }
        } else {
            // Estado base inicial
            formulaViewer.innerHTML = `<span style="font-style: italic; color: #7f8c8d;">Selecciona elementos para comenzar</span>`;
            statusIndicator.className = "status-indicator";
            statusIndicator.innerText = "Esperando elementos...";
            explanationText.innerHTML = "Configura la carga global deseada, elige un subíndice y toca un elemento para iniciar.";
        }

        // Invocar el módulo gráfico de Lewis en cruz
        if (Object.keys(currentElementCounts).length === 0) {
            lewisRenderer.clearCanvas();
        } else {
            lewisRenderer.render(currentElementCounts, result);
        }
    }

    // ==========================================================================
    // 8. ASIGNACIÓN DE EVENTOS TÁCTILES FINAL
    // ==========================================================================
    btnSubPlus.addEventListener("click", increaseSubscript);
    btnSubMinus.addEventListener("click", decreaseSubscript);
    btnChargePlus.addEventListener("click", increaseCharge);
    btnChargeMinus.addEventListener("click", decreaseCharge);
    btnUndo.addEventListener("click", undoLastAction);
    btnClear.addEventListener("click", clearAll);
    
    // Eventos de apertura y cierre del Pop-up
    btnShowFormalCharges.addEventListener("click", openFormalModal);
    btnCloseModal.addEventListener("click", closeFormalModal);

    // Encender el teclado táctil
    initKeyboard();
});
