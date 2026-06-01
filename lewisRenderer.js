// ==========================================================================
// Renderizador Gráfico Científico Bidimensional con Soporte para Sales Iónicas (Parte 1)
// ==========================================================================
const lewisRenderer = {
    // Limpia por completo el lienzo de dibujo volviendo al estado inicial
    clearCanvas: function() {
        const canvas = document.getElementById("lewisCanvas");
        if (!canvas) return;
        canvas.innerHTML = '<p class="placeholder-text">La estructura de Lewis aparecerá aquí</p>';
    },

    // Orquesta la creación de los nodos en la pantalla táctil móvil
    render: function(elementCounts, combinationResult) {
        const canvas = document.getElementById("lewisCanvas");
        if (!canvas) return;

        canvas.innerHTML = "";

        // Frenar el dibujo inmediato si el motor reporta una combinación imposible
        if (!combinationResult.possible) {
            canvas.innerHTML = `
                <div style="text-align: center; color: #c0392b; font-family: 'Lora', serif; padding: 15px;">
                    <p style="font-weight: bold; font-size: 1.05rem;">⚠️ Estructura Inestable</p>
                    <p style="font-size: 0.85rem; margin-top: 4px; line-height: 1.3;">No se puede graficar. Modifica la carga o los elementos para alcanzar estabilidad.</p>
                </div>
            `;
            return;
        }

        // Crear contenedor interno limpio
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        canvas.appendChild(wrapper);

        const canvasWidth = canvas.clientWidth || 300;
        const canvasHeight = canvas.clientHeight || 180;
        const midY = canvasHeight / 2;

        // ==========================================================================
        // CASO ESPECIAL: RENDERIZADO DUAL PARA SALES IÓNICAS (Ej: CaCO3)
        // ==========================================================================
        let isSal = combinationResult.isSalIonica;
        let startAnionX = 0; // Desplazamiento horizontal del bloque de la derecha
        let usableWidthForAnion = canvasWidth;

        if (isSal) {
            const metal = combinationResult.metalCation;
            
            // 1. Dibujar el Catión Metálico (ej: Ca) a la izquierda de la pantalla
            const metalNode = document.createElement("div");
            metalNode.className = "lewis-node";
            metalNode.innerText = metal.symbol;
            metalNode.style.left = "20px";
            metalNode.style.top = `${midY - 25}px`;
            wrapper.appendChild(metalNode);

            // Agregar el superíndice de carga al Metal (ej: 2+)
            const metalCharge = document.createElement("div");
            metalCharge.innerText = `${metal.charge > 1 ? metal.charge : ""}+`;
            metalCharge.style = "position: absolute; left: 65px; top: " + (midY - 32) + "px; font-family: 'Playfair Display', serif; font-weight: bold; font-size: 0.95rem; color: #27ae60;";
            wrapper.appendChild(metalCharge);

            // Ajustar el área de la derecha para que los corchetes encierren solo al no-metal
            startAnionX = 85;
            usableWidthForAnion = canvasWidth - startAnionX;

            // 2. Dibujar Corchete Izquierdo del Anión
            const bracketLeft = document.createElement("div");
            bracketLeft.style = `position: absolute; left: ${startAnionX}px; top: 12px; bottom: 12px; width: 10px; border-left: 3px solid #2c3e50; border-top: 3px solid #2c3e50; border-bottom: 3px solid #2c3e50; border-radius: 4px 0 0 4px; pointer-events: none;`;
            wrapper.appendChild(bracketLeft);

            // 3. Dibujar Corchete Derecho del Anión
            const bracketRight = document.createElement("div");
            bracketRight.style = `position: absolute; right: 28px; top: 12px; bottom: 12px; width: 10px; border-right: 3px solid #2c3e50; border-top: 3px solid #2c3e50; border-bottom: 3px solid #2c3e50; border-radius: 0 4px 4px 0; pointer-events: none;`;
            wrapper.appendChild(bracketRight);

            // 4. Dibujar Carga del Anión arriba a la derecha (ej: 2-)
            const chargeDisplay = document.createElement("div");
            chargeDisplay.innerText = `${metal.charge > 1 ? metal.charge : ""}-`;
            chargeDisplay.style = "position: absolute; right: 8px; top: 6px; font-family: 'Playfair Display', serif; font-weight: bold; font-size: 1.1rem; color: #c0392b;";
            wrapper.appendChild(chargeDisplay);
        }

        // ==========================================================================
        // CASO TRADICIONAL: CORCHETES PARA IONES POLIATÓMICOS SIMPLES (Sin Metal)
        // ==========================================================================
        if (combinationResult.isIon && !isSal) {
            const bracketLeft = document.createElement("div");
            bracketLeft.style = "position: absolute; left: 8px; top: 8px; bottom: 8px; width: 12px; border-left: 3px solid #2c3e50; border-top: 3px solid #2c3e50; border-bottom: 3px solid #2c3e50; border-radius: 4px 0 0 4px; pointer-events: none;";
            wrapper.appendChild(bracketLeft);

            const bracketRight = document.createElement("div");
            bracketRight.style = "position: absolute; right: 28px; top: 8px; bottom: 8px; width: 12px; border-right: 3px solid #2c3e50; border-top: 3px solid #2c3e50; border-bottom: 3px solid #2c3e50; border-radius: 0 4px 4px 0; pointer-events: none;";
            wrapper.appendChild(bracketRight);

            const chargeDisplay = document.createElement("div");
            const absCharge = Math.abs(combinationResult.charge);
            const sign = combinationResult.charge > 0 ? "+" : "-";
            chargeDisplay.innerText = `${absCharge === 1 ? "" : absCharge}${sign}`;
            chargeDisplay.style = "position: absolute; right: 8px; top: 4px; font-family: 'Playfair Display', serif; font-weight: bold; font-size: 1.1rem; color: #c0392b;";
            wrapper.appendChild(chargeDisplay);
        }

        const centralData = combinationResult.centralAtom;
        const peripheralList = combinationResult.peripheralAtoms || [];

        if (peripheralList.length === 0 && centralData) {
            this.drawSingleAtom(wrapper, centralData.symbol);
            return;
        }

        // Delegar las posiciones en cruz escaladas para sales a la Parte 2
        this.drawComplexStructure(wrapper, canvasWidth, canvasHeight, startAnionX, usableWidthForAnion, centralData, peripheralList, elementCounts);
    },
    // ==========================================================================
    // 3. GEOMETRÍA EN CRUZ AJUSTADA PARA SALES E HIDRÓGENOS EXTERNOS
    // ==========================================================================
    drawComplexStructure: function(wrapper, canvasWidth, canvasHeight, startAnionX, usableWidthForAnion, centralData, peripheralList, elementCounts) {
        // Centro geométrico adaptativo para el bloque no metálico
        const midX = startAnionX + (usableWidthForAnion / 2);
        const midY = canvasHeight / 2;

        const centralPos = { left: `${midX - 25}px`, top: `${midY - 25}px` };
        const offset = 55; // Separación de los periféricos respecto al centro

        // Coordenadas fijas para la distribución simétrica en cruz
        const targetPositions = [
            { left: `${midX - 25 - offset}px`, top: `${midY - 25}px`, type: "izquierda" },
            { left: `${midX - 25 + offset}px`, top: `${midY - 25}px`, type: "derecha" },
            { left: `${midX - 25}px`, top: `${midY - 25 - offset}px`, type: "arriba" },
            { left: `${midX - 25}px`, top: `${midY - 25 + offset}px`, type: "abajo" }
        ];

        // A) Dibujar el Átomo Central del anión (ej: Carbono)
        const centralNode = document.createElement("div");
        centralNode.className = "lewis-node";
        centralNode.innerText = centralData.symbol;
        centralNode.style.left = centralPos.left;
        centralNode.style.top = centralPos.top;
        wrapper.appendChild(centralNode);

        // Pintar electrones libres del centro si el motor lo indica
        if (centralData.freeElectrons > 0) {
            const dot = document.createElement("div");
            dot.className = "lewis-dot";
            dot.style = "top: -6px; left: 22px;";
            centralNode.appendChild(dot);
        }

        const isCO3 = elementCounts["C"] === 1 && elementCounts["O"] === 3;
        const isCO2 = elementCounts["C"] === 1 && elementCounts["O"] === 2;

        // B) Dibujar los Átomos Periféricos y sus Enlaces Correspondientes
        peripheralList.forEach((atom, index) => {
            if (index >= targetPositions.length) return; // Límite de 4 direcciones cardinales
            
            const pos = targetPositions[index];

            // Crear el nodo del átomo periférico (ej: Oxígeno)
            const pNode = document.createElement("div");
            pNode.className = "lewis-node";
            pNode.innerText = atom.symbol;
            pNode.style.left = pos.left;
            pNode.style.top = pos.top;
            wrapper.appendChild(pNode);

            // Calcular líneas de enlace al átomo central
            const lineLeft = pos.type === "izquierda" ? (midX - offset + 20) : (midX + 20);
            const lineTop = pos.type === "arriba" ? (midY - offset + 20) : (midY + 20);
            const size = offset - 40;

            if (atom.bondsToCentral === 2 || isCO2 || (isCO3 && index === 1)) {
                // Doble enlace paralelo perfecto
                const line1 = document.createElement("div"); line1.className = "lewis-line";
                const line2 = document.createElement("div"); line2.className = "lewis-line";

                if (pos.type === "izquierda" || pos.type === "derecha") {
                    line1.style = `left: ${lineLeft}px; top: ${midY - 4}px; width: ${size}px;`;
                    line2.style = `left: ${lineLeft}px; top: ${midY + 2}px; width: ${size}px;`;
                } else {
                    line1.style = `left: ${midX - 4}px; top: ${lineTop}px; width: 2px; height: ${size}px;`;
                    line2.style = `left: ${midX + 2}px; top: ${lineTop}px; width: 2px; height: ${size}px;`;
                }
                wrapper.appendChild(line1); wrapper.appendChild(line2);
            } else {
                // Enlace simple tradicional
                const line = document.createElement("div"); line.className = "lewis-line";
                if (pos.type === "izquierda" || pos.type === "derecha") {
                    line.style = `left: ${lineLeft}px; top: ${midY - 1}px; width: ${size}px;`;
                } else {
                    line.style = `left: ${midX - 1}px; top: ${lineTop}px; width: 2px; height: ${size}px;`;
                }
                wrapper.appendChild(line);
            }

            // Extensión de Hidrógenos (Para Oxoácidos si aplica)
            if (atom.attachedHydrogen) {
                const hNode = document.createElement("div");
                hNode.className = "lewis-node";
                hNode.innerText = "H";

                const hLine = document.createElement("div");
                hLine.className = "lewis-line";

                const hOffset = 40;
                const pPosX = midX + (pos.type === "izquierda" ? -offset : (pos.type === "derecha" ? offset : 0)) - 25;
                const pPosY = midY + (pos.type === "arriba" ? -offset : (pos.type === "abajo" ? offset : 0)) - 25;

                if (pos.type === "izquierda") {
                    hNode.style.left = `${pPosX - hOffset}px`; hNode.style.top = `${pPosY}px`;
                    hLine.style = `left: ${pPosX - hOffset + 45}px; top: ${midY - 1}px; width: ${hOffset - 40 + 15}px;`;
                } else if (pos.type === "derecha") {
                    hNode.style.left = `${pPosX + hOffset}px`; hNode.style.top = `${pPosY}px`;
                    hLine.style = `left: ${pPosX + 45}px; top: ${midY - 1}px; width: ${hOffset - 40 + 15}px;`;
                } else if (pos.type === "arriba") {
                    hNode.style.left = `${pPosX}px`; hNode.style.top = `${pPosY - hOffset}px`;
                    hLine.style = `left: ${midX - 1}px; top: ${pPosY - hOffset + 45}px; width: 2px; height: ${hOffset - 40 + 15}px;`;
                } else if (pos.type === "abajo") {
                    hNode.style.left = `${pPosX}px`; hNode.style.top = `${pPosY + hOffset}px`;
                    hLine.style = `left: ${midX - 1}px; top: ${pPosY + 45}px; width: 2px; height: ${hOffset - 40 + 15}px;`;
                }
                wrapper.appendChild(hNode); wrapper.appendChild(hLine);
            }

            // D) RENDERIZADO CIENTÍFICO DE ELECTRONES LIBRES
            let actualFreeCount = atom.freeElectrons;
            if (isCO3 && index === 1) actualFreeCount = 4; // Ajuste forzado para el oxígeno del doble enlace
            this.drawExactPairs(pNode, pos.type, actualFreeCount, atom.attachedHydrogen);
        });
    },

    // Distribuye los pares de puntos de forma exacta según la carga formal calculada
    drawExactPairs: function(node, positionType, electronCount, hasHydrogen) {
        const allPairs = {
            arriba: [
                { t: "-6px", l: "19px" }, { t: "-6px", l: "26px" },
                { t: "22px", l: "-6px" }, { t: "29px", l: "-6px" },
                { t: "22px", l: "52px" }, { t: "29px", l: "52px" }
            ],
            abajo: [
                { t: "52px", l: "19px" }, { t: "52px", l: "26px" },
                { t: "22px", l: "-6px" }, { t: "29px", l: "-6px" },
                { t: "22px", l: "52px" }, { t: "29px", l: "52px" }
            ],
            izquierda: [
                { t: "-6px", l: "19px" }, { t: "-6px", l: "26px" },
                { t: "52px", l: "19px" }, { t: "52px", l: "26px" },
                { t: "22px", l: "-6px" }, { t: "29px", l: "-6px" }
            ],
            derecha: [
                { t: "-6px", l: "19px" }, { t: "-6px", l: "26px" },
                { t: "52px", l: "19px" }, { t: "52px", l: "26px" },
                { t: "22px", l: "52px" }, { t: "29px", l: "52px" }
            ]
        };

        let targetCoords = allPairs[positionType];
        if (hasHydrogen) targetCoords = targetCoords.slice(0, 4);

        const dotsToDraw = electronCount === 4 ? 4 : Math.min(electronCount, targetCoords.length);

        for (let i = 0; i < dotsToDraw; i++) {
            const dot = document.createElement("div");
            dot.className = "lewis-dot";
            dot.style.top = targetCoords[i].t;
            dot.style.left = targetCoords[i].l;
            node.appendChild(dot);
        }
    },

    // Dibuja un átomo puro solitario de forma segura
    drawSingleAtom: function(container, symbol) {
        const stringSymbol = Array.isArray(symbol) ? symbol : symbol;
        const data = periodicData[stringSymbol];
        if (!data) return;
        
        const valElectrons = data.valenceElectrons;
        const node = document.createElement("div");
        node.className = "lewis-node";
        node.innerText = stringSymbol;
        node.style.left = "calc(50% - 25px)";
        node.style.top = "calc(50% - 25px)";
        container.appendChild(node);

        const positions = [
            { top: "-8px", left: "22px" }, { top: "22px", left: "52px" },
            { top: "52px", left: "22px" }, { top: "22px", left: "-8px" },
            { top: "-8px", left: "28px" }, { top: "28px", left: "52px" },
            { top: "52px", left: "28px" }, { top: "28px", left: "-8px" }
        ];

        for (let i = 0; i < valElectrons; i++) {
            if (i >= positions.length) break;
            const dot = document.createElement("div");
            dot.className = "lewis-dot";
            dot.style.top = positions[i].top;
            dot.style.left = positions[i].left;
            node.appendChild(dot);
        }
    }
};
