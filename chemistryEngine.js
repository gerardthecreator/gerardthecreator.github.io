// ==========================================================================
// Motor Químico Científico Pro - Filtro Cuántico Estricto para Periodo 2 (Parte 1)
// ==========================================================================
const chemistryEngine = {
    validateCombination: function(elementCounts, userSelectedCharge) {
        if (!elementCounts || Object.keys(elementCounts).length === 0) {
            return { possible: false, statusText: "Esperando elementos...", explanation: "Elige una carga, un subíndice y toca un elemento para comenzar." };
        }

        // 1. Filtrar y limpiar átomos activos
        const activeCounts = {};
        let totalAtoms = 0;
        for (const el in elementCounts) {
            if (elementCounts[el] > 0) {
                activeCounts[el] = elementCounts[el];
                totalAtoms += elementCounts[el];
            }
        }

        if (totalAtoms === 0) return { possible: false, statusText: "Esperando elementos...", explanation: "Selecciona elementos." };

        const formulaText = this.generateFormulaText(activeCounts);
        const uniqueElements = Object.keys(activeCounts);

        // Caso de un único átomo solitario neutro
        if (uniqueElements.length === 1 && totalAtoms === 1) {
            const singleSymbol = uniqueElements;
            const data = periodicData[singleSymbol];
            const breakdownList = [{ atom: singleSymbol, valence: data.valenceElectrons, free: data.valenceElectrons, bonds: 0, fc: 0 }];
            return {
                possible: true, isIon: false, isSalIonica: false, charge: 0, formula: formulaText, htmlFormula: this.generateHTMLFormula(activeCounts, 0),
                centralAtom: { symbol: singleSymbol, bonds: 0, freeElectrons: data.valenceElectrons, formalCharge: 0 },
                peripheralAtoms: [], breakdown: breakdownList,
                statusText: `Átomo de ${data.name}`,
                explanation: `Elemento libre aislado. Posee <strong>${data.valenceElectrons}</strong> electrones de valencia nativos.`
            };
        }

        // ==========================================================================
        // REGLA MAESTRA DE DETECCIÓN DE METALES Y SALES IÓNICAS
        // ==========================================================================
        let metalSymbol = null;
        let nonMetalsCount = 0;
        for (const el in activeCounts) {
            if (periodicData[el].electronegativity < 1.7 && el !== "H") {
                metalSymbol = el;
            } else {
                nonMetalsCount += activeCounts[el];
            }
        }

        // Si hay un metal combinado con no-metales, procesamos automáticamente como SAL IÓNICA
        if (metalSymbol && nonMetalsCount > 0) {
            return this.processSalIonica(activeCounts, formulaText, metalSymbol);
        }

        // --- CONTINUACIÓN COVALENTE TRADICIONAL ---
        const sortedSymbols = Object.keys(activeCounts).sort((a, b) => {
            if (periodicData[b].maxBonds !== periodicData[a].maxBonds) return periodicData[b].maxBonds - periodicData[a].maxBonds;
            return periodicData[a].electronegativity - periodicData[b].electronegativity;
        });
        const centralAtom = sortedSymbols[0];

        let totalValenceElectrons = 0;
        let octetNeededSum = 0;
        for (const el in activeCounts) {
            totalValenceElectrons += periodicData[el].valenceElectrons * activeCounts[el];
            octetNeededSum += (periodicData[el].maxBonds === 1 ? 2 : 8) * activeCounts[el];
        }

        const systemElectrons = totalValenceElectrons - userSelectedCharge;
        if (systemElectrons % 2 !== 0) {
            return { possible: false, formula: formulaText, htmlFormula: this.generateHTMLFormula(activeCounts, userSelectedCharge), statusText: "Estructura Imposible", explanation: "Número impar de electrones totales." };
        }

        return this.optimizeNonMetalStructure(activeCounts, formulaText, centralAtom, totalValenceElectrons, octetNeededSum, systemElectrons, userSelectedCharge);
    },
    // 5. RESOLUCIÓN DE SALES IÓNICAS CON RESTRICCIÓN CUÁNTICA DEL PERIODO 2
    processSalIonica: function(activeCounts, formulaText, metalSymbol) {
        const metalData = periodicData[metalSymbol];
        const metalCount = activeCounts[metalSymbol];
        
        const totalPositiveCharge = metalData.valenceElectrons * metalCount;
        const equivalentNegativeCharge = -totalPositiveCharge; 

        const anionCounts = {};
        for (const el in activeCounts) {
            if (el !== metalSymbol) anionCounts[el] = activeCounts[el];
        }

        const sortedAnionSymbols = Object.keys(anionCounts).sort((a, b) => periodicData[b].maxBonds - periodicData[a].maxBonds);
        const centralAtom = sortedAnionSymbols[0];

        let anionValenceElectrons = 0;
        let anionOctetNeeded = 0;
        for (const el in anionCounts) {
            anionValenceElectrons += periodicData[el].valenceElectrons * anionCounts[el];
            anionOctetNeeded += (periodicData[el].maxBonds === 1 ? 2 : 8) * anionCounts[el];
        }

        const systemElectrons = anionValenceElectrons + totalPositiveCharge;

        // --- FILTRO CUÁNTICO DE CONTROL PARA EL PERIODO 2 ---
        const necessarySharedElectrons = anionOctetNeeded - systemElectrons;
        const theoreticalBondsNeeded = necessarySharedElectrons / 2;

        // El Carbono o Nitrógeno no tienen orbitales d vacíos: máximo 4 enlaces totales
        if (!periodicData[centralAtom].canExpand && theoreticalBondsNeeded > periodicData[centralAtom].maxBonds) {
            return {
                possible: false, formula: formulaText, htmlFormula: this.generateHTMLFormula(activeCounts, 0),
                statusText: "Estructura Inestable",
                explanation: `La especie $${formulaText}$ **NO PUEDE EXISTIR**. El átomo central de ${centralAtom} pertenece al Periodo 2 y carece de orbitales $d$ vacíos. No puede alojar más de 8 electrones en su capa (máximo 4 enlaces), pero esta combinación iónica exigiría ${theoreticalBondsNeeded} enlaces para estabilizarse.`
            };
        }

        const peripheralSymbols = [];
        for (const el in anionCounts) {
            if (el !== centralAtom) {
                for (let i = 0; i < anionCounts[el]; i++) peripheralSymbols.push(el);
            } else {
                for (let i = 1; i < anionCounts[el]; i++) peripheralSymbols.push(el);
            }
        }

        const peripheralAtomsBlueprint = peripheralSymbols.map(symbol => {
            return { symbol: symbol, bondsToCentral: 1, freeElectrons: 6, attachedHydrogen: false, formalCharge: -1 };
        });

        let assignedPeriphery = peripheralAtomsBlueprint.length * 8;
        let centralFreeElectrons = Math.max(0, systemElectrons - assignedPeriphery);
        if (centralAtom === "C" || centralAtom === "N" || centralAtom === "S" || centralAtom === "Cl") centralFreeElectrons = 0;

        let centralBondsCount = peripheralAtomsBlueprint.length;
        let centralValenceNative = periodicData[centralAtom].valenceElectrons;
        let centralFormalCharge = centralValenceNative - centralFreeElectrons - centralBondsCount;

        for (let i = 0; i < peripheralAtomsBlueprint.length && centralFormalCharge > 0; i++) {
            const atom = peripheralAtomsBlueprint[i];
            if (atom.symbol === "O" || atom.symbol === "S") {
                atom.bondsToCentral = 2;
                atom.freeElectrons = 4;
                atom.formalCharge = 0;
                centralBondsCount += 1;
                centralFormalCharge = centralValenceNative - centralFreeElectrons - centralBondsCount;
            }
        }

        const htmlFormula = this.generateHTMLFormula(activeCounts, 0);

        const breakdownList = [
            { atom: metalSymbol + ` (Catión ${totalPositiveCharge}+)`, valence: metalData.valenceElectrons, free: 0, bonds: `0 (Iónico)`, fc: totalPositiveCharge },
            { atom: centralAtom + " (Centro Anión)", valence: centralValenceNative, free: centralFreeElectrons, bonds: centralBondsCount, fc: centralFormalCharge }
        ];
        peripheralAtomsBlueprint.forEach((atom, idx) => {
            breakdownList.push({ atom: `${atom.symbol} (Nº ${idx + 1})`, valence: periodicData[atom.symbol].valenceElectrons, free: atom.freeElectrons, bonds: atom.bondsToCentral, fc: atom.formalCharge });
        });

        return {
            possible: true, isIon: false, isSalIonica: true, charge: 0,
            metalCation: { symbol: metalSymbol, count: metalCount, charge: totalPositiveCharge },
            formula: formulaText, htmlFormula: htmlFormula,
            statusText: "Sal Oxisal Iónica Estable",
            centralAtom: { symbol: centralAtom, bonds: centralBondsCount, freeElectrons: centralFreeElectrons, formalCharge: centralFormalCharge },
            peripheralAtoms: peripheralAtomsBlueprint, breakdown: breakdownList,
            explanation: `¡Enlace Iónico Detectado! El metal ${metalSymbol} cede sus electrones formando el catión <strong>${metalSymbol}<sup>${totalPositiveCharge > 1 ? totalPositiveCharge : ''}+</sup></strong>. El bloque no metálico se estabiliza como el anión poliatómico con carga <strong>${Math.abs(equivalentNegativeCharge)}-</strong>.`
        };
    },
    // 6. OPTIMIZACIÓN TRADICIONAL PARA COMPUESTOS COVALENTES NO METÁLICOS
    optimizeNonMetalStructure: function(activeCounts, formulaText, centralAtom, totalValenceElectrons, octetNeededSum, systemElectrons, userSelectedCharge) {
        const isOxoacid = activeCounts["H"] > 0 && activeCounts["O"] > 0 && centralAtom !== "O" && centralAtom !== "H";
        const peripheralSymbols = [];
        let hydrogensToAttach = isOxoacid ? activeCounts["H"] : 0;

        for (const el in activeCounts) {
            if (el !== centralAtom && el !== "H") {
                for (let i = 0; i < activeCounts[el]; i++) {
                    let hasHydrogen = hydrogensToAttach > 0;
                    if (hasHydrogen) hydrogensToAttach--;
                    peripheralSymbols.push({ symbol: el, bondsToCentral: 1, freeElectrons: hasHydrogen ? 4 : 6, attachedHydrogen: hasHydrogen, formalCharge: 0 });
                }
            } else if (el === centralAtom && activeCounts[el] > 1) {
                for (let i = 1; i < activeCounts[el]; i++) {
                    peripheralSymbols.push({ symbol: el, bondsToCentral: 1, freeElectrons: 4, attachedHydrogen: false, formalCharge: 0 });
                }
            }
        }

        if (!isOxoacid && activeCounts["H"] > 0) {
            for (let i = 0; i < activeCounts["H"]; i++) {
                peripheralSymbols.push({ symbol: "H", bondsToCentral: 1, freeElectrons: 0, attachedHydrogen: false, formalCharge: 0 });
            }
        }

        let centralBondsCount = peripheralSymbols.length;
        let centralFreeElectrons = 0;
        if (centralAtom === "C" || centralAtom === "N") {
            let assignedPeriphery = 0;
            peripheralSymbols.forEach(atom => assignedPeriphery += (atom.bondsToCentral * 2) + atom.freeElectrons);
            centralFreeElectrons = Math.max(0, systemElectrons - assignedPeriphery);
        }

        let centralValenceNative = periodicData[centralAtom].valenceElectrons;
        let centralFormalCharge = centralValenceNative - centralFreeElectrons - centralBondsCount;

        for (let i = 0; i < peripheralSymbols.length && centralFormalCharge > 0; i++) {
            const atom = peripheralSymbols[i];
            if (atom.symbol === "O" && !atom.attachedHydrogen && periodicData[centralAtom].canExpand && centralBondsCount < periodicData[centralAtom].maxBonds) {
                atom.bondsToCentral = 2; atom.freeElectrons = 4; centralBondsCount += 1;
                centralFormalCharge = centralValenceNative - centralFreeElectrons - centralBondsCount;
            }
        }

        if (!periodicData[centralAtom].canExpand) {
            let totalSharedRequired = octetNeededSum - systemElectrons;
            let targetBondsCount = totalSharedRequired / 2;
            
            // FILTRO ADICIONAL COVALENTE: Rechazar si viola el octeto estricto en el Periodo 2
            if (targetBondsCount > periodicData[centralAtom].maxBonds) {
                return {
                    possible: false, formula: formulaText, htmlFormula: this.generateHTMLFormula(activeCounts, userSelectedCharge),
                    statusText: "Estructura Inestable",
                    explanation: `La molécula covalente $${formulaText}$ es inestable. Rompe la regla del octeto estricta del átomo de ${centralAtom} al intentar forzar enlaces por encima de su capacidad orbital de periodo 2.`
                };
            }

            for (let i = 0; i < peripheralSymbols.length && centralBondsCount < targetBondsCount && centralBondsCount < periodicData[centralAtom].maxBonds; i++) {
                const atom = peripheralSymbols[i];
                if (atom.symbol === "O" || atom.symbol === "S") {
                    atom.bondsToCentral = 2; atom.freeElectrons = 4; centralBondsCount += 1;
                }
            }
            centralFormalCharge = centralValenceNative - centralFreeElectrons - centralBondsCount;
        }

        peripheralSymbols.forEach(atom => {
            let valence = periodicData[atom.symbol].valenceElectrons;
            let shared = atom.bondsToCentral + (atom.attachedHydrogen ? 1 : 0);
            atom.formalCharge = valence - atom.freeElectrons - shared;
        });

        const isIon = userSelectedCharge !== 0;
        const htmlFormula = this.generateHTMLFormula(activeCounts, userSelectedCharge);

        const breakdownList = [{ atom: centralAtom + " (Centro)", valence: centralValenceNative, free: centralFreeElectrons, bonds: centralBondsCount, fc: centralFormalCharge }];
        peripheralSymbols.forEach((atom, idx) => {
            breakdownList.push({ atom: `${atom.symbol} (Nº ${idx + 1})${atom.attachedHydrogen ? '-H' : ''}`, valence: periodicData[atom.symbol].valenceElectrons, free: atom.freeElectrons, bonds: atom.bondsToCentral + (atom.attachedHydrogen ? 1 : 0), fc: atom.formalCharge });
        });

        return {
            possible: true, isIon: isIon, isSalIonica: false, charge: userSelectedCharge, formula: this.generateTeXFormula(formulaText, userSelectedCharge), htmlFormula: htmlFormula,
            centralAtom: { symbol: centralAtom, bonds: centralBondsCount, freeElectrons: centralFreeElectrons, formalCharge: centralFormalCharge },
            peripheralAtoms: peripheralSymbols, breakdown: breakdownList,
            explanation: `Estructura calculada mediante <strong>Cargas Formales</strong>. El átomo de ${centralAtom} queda al centro con carga formal de ${centralFormalCharge}.`
        };
    },

    // FUNCIONES COMPLEMENTARIAS DE FORMATEO CIENTÍFICO
    generateFormulaText: function(counts) {
        let formula = "";
        const sorted = Object.keys(counts).sort((a, b) => periodicData[a].electronegativity - periodicData[b].electronegativity);
        sorted.forEach(el => { formula += counts[el] > 1 ? `${el}_{${counts[el]}}` : el; });
        return formula;
    },

    generateTeXFormula: function(baseFormula, charge) {
        if (charge === 0) return baseFormula;
        return `${baseFormula}^{${charge > 0 ? charge + '+' : Math.abs(charge) + '-'}}`;
    },

    generateHTMLFormula: function(counts, charge) {
        let html = "";
        const sorted = Object.keys(counts).sort((a, b) => periodicData[a].electronegativity - periodicData[b].electronegativity);
        sorted.forEach(el => { html += counts[el] > 1 ? `${el}<sub>${counts[el]}</sub>` : el; });
        if (charge !== 0) html += `<sup>${charge > 0 ? charge + '+' : Math.abs(charge) + '-'}</sup>`;
        return html;
    }
};
