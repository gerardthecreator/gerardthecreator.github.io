// ==========================================================================
// Base de Datos Química Definitiva con Límites de Valencia y Octetos Expandidos
// ==========================================================================
const periodicData = {
    "H": {
        name: "Hidrógeno",
        atomicNumber: 1,
        valenceElectrons: 1,
        electronConfig: "1s¹",
        electronegativity: 2.20,
        maxBonds: 1,       // Sigue estrictamente la regla del dueto (máximo 2 electrones en capa)
        canExpand: false
    },
    "He": {
        name: "Helio",
        atomicNumber: 2,
        valenceElectrons: 2,
        electronConfig: "1s²",
        electronegativity: 0.00, // Gas noble, inerte
        maxBonds: 0,
        canExpand: false
    },
    "C": {
        name: "Carbono",
        atomicNumber: 6,
        valenceElectrons: 4,
        electronConfig: "[He] 2s² 2p²",
        electronegativity: 2.55,
        maxBonds: 4,       // Regla del octeto estricta en el periodo 2 (máximo 4 enlaces)
        canExpand: false
    },
    "N": {
        name: "Nitrógeno",
        atomicNumber: 7,
        valenceElectrons: 5,
        electronConfig: "[He] 2s² 2p³",
        electronegativity: 3.04,
        maxBonds: 4,       // Puede formar hasta 4 enlaces (ej: ion amonio NH4+) pero NO expande octeto
        canExpand: false
    },
    "O": {
        name: "Oxígeno",
        atomicNumber: 8,
        valenceElectrons: 6,
        electronConfig: "[He] 2s² 2p⁴",
        electronegativity: 3.44,
        maxBonds: 2,       // Típicamente 2 enlaces, no expande por estar en el periodo 2
        canExpand: false
    },
    "F": {
        name: "Flúor",
        atomicNumber: 9,
        valenceElectrons: 7,
        electronConfig: "[He] 2s² 2p⁵",
        electronegativity: 3.98,
        maxBonds: 1,       // Elemento más electronegativo, monovalente terminal
        canExpand: false
    },
    "Ne": {
        name: "Neón",
        atomicNumber: 10,
        valenceElectrons: 8,
        electronConfig: "[He] 2s² 2p⁶",
        electronegativity: 0.00,
        maxBonds: 0,
        canExpand: false
    },
    "Na": {
        name: "Sodio",
        atomicNumber: 11,
        valenceElectrons: 1,
        electronConfig: "[Ne] 3s¹",
        electronegativity: 0.93,
        maxBonds: 1,       // Metal alcalino, cede su electrón fácilmente
        canExpand: false
    },
    "Mg": {
        name: "Magnesio",
        atomicNumber: 12,
        valenceElectrons: 2,
        electronConfig: "[Ne] 3s²",
        electronegativity: 1.31,
        maxBonds: 2,
        canExpand: false
    },
    "Al": {
        name: "Aluminio",
        atomicNumber: 13,
        valenceElectrons: 3,
        electronConfig: "[Ne] 3s² 3p¹",
        electronegativity: 1.61,
        maxBonds: 3,
        canExpand: false
    },
    "Si": {
        name: "Silicio",
        atomicNumber: 14,
        valenceElectrons: 4,
        electronConfig: "[Ne] 3s² 3p²",
        electronegativity: 1.90,
        maxBonds: 4,
        canExpand: false
    },
    "P": {
        name: "Fósforo",
        atomicNumber: 15,
        valenceElectrons: 5,
        electronConfig: "[Ne] 3s² 3p³",
        electronegativity: 2.19,
        maxBonds: 5,       // Capacidad de octeto expandido (Periodo 3, orbitales d vacíos)
        canExpand: true
    },
    "S": {
        name: "Azufre",
        atomicNumber: 16,
        valenceElectrons: 6,
        electronConfig: "[Ne] 3s² 3p⁴",
        electronegativity: 2.58,
        maxBonds: 6,       // Capacidad de octeto expandido hasta 6 enlaces (ej: SO4^2-)
        canExpand: true
    },
    "Cl": {
        name: "Cloro",
        atomicNumber: 17,
        valenceElectrons: 7,
        electronConfig: "[Ne] 3s² 3p⁵",
        electronegativity: 3.16,
        maxBonds: 7,       // Capacidad de octeto expandido hasta 7 enlaces (ej: ClO4^-)
        canExpand: true
    },
    "Ar": {
        name: "Argón",
        atomicNumber: 18,
        valenceElectrons: 8,
        electronConfig: "[Ne] 3s² 3p⁶",
        electronegativity: 0.00,
        maxBonds: 0,
        canExpand: false
    },
    "K": {
        name: "Potasio",
        atomicNumber: 19,
        valenceElectrons: 1,
        electronConfig: "[Ar] 4s¹",
        electronegativity: 0.82,
        maxBonds: 1,
        canExpand: false
    },
    "Ca": {
        name: "Calcio",
        atomicNumber: 20,
        valenceElectrons: 2,
        electronConfig: "[Ar] 4s²",
        electronegativity: 1.00,
        maxBonds: 2,
        canExpand: false
    }
};

// ==========================================================================
// Función de Estabilización Inicial para Evitar Código Crudo en Pantalla móvil
// ==========================================================================
function fixMathJaxViewer(text) {
    const viewer = document.getElementById("mathjaxFormula");
    if (!viewer) return;
    
    if (window.MathJax && window.MathJax.typesetPromise) {
        viewer.innerHTML = `$$\\text{${text}}$$`;
        window.MathJax.typesetPromise([viewer]).catch((err) => console.log("MathJax init log:", err));
    } else {
        // Respaldo elegante en tipografía Serif pura mientras la red móvil procesa la librería
        viewer.innerHTML = `<span style="font-family: 'Playfair Display', serif; font-style: italic; color: #7f8c8d; font-size: 1.1rem;">${text}</span>`;
    }
}

// Escuchar la carga del DOM para limpiar el marcador de posición (placeholder)
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        fixMathJaxViewer("Selecciona elementos para comenzar");
    }, 120);
});
