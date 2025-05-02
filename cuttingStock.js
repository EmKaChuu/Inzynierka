// Moduł CuttingStock - Rozwiązanie problemu rozkroju
const CuttingStock = {
    orderRows: 0,
    orders: [],
    patterns: [],
    solution: null,
    
    init: () => {
        console.log("Executing CuttingStock.init()");
        
        // Przygotuj interfejs
        CuttingStock.orderRows = 0;
        CuttingStock.orders = [];
        
        // Wyczyść poprzednie wyniki
        Utils.clearElement('cuttingStockResults');
        Utils.clearElement('cuttingStockVisualization');
        Utils.hideElement('cuttingStockLoadingIndicator');
        
        // Przygotuj listę zamówień
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        
        // Dodaj pierwsze zamówienie
        CuttingStock.addOrderRow();
    },
    
    addOrderRow: () => {
        const ordersList = document.getElementById('ordersList');
        const rowId = CuttingStock.orderRows++;
        
        const orderRow = document.createElement('div');
        orderRow.id = `order-row-${rowId}`;
        orderRow.className = 'input-row';
        
        // Etykieta zamówienia
        const orderLabel = document.createElement('span');
        orderLabel.textContent = `Zamówienie ${rowId + 1}:`;
        orderLabel.style.minWidth = '100px';
        
        // Długość elementu
        const lengthLabel = document.createElement('label');
        lengthLabel.textContent = 'Długość:';
        
        const lengthInput = document.createElement('input');
        lengthInput.type = 'number';
        lengthInput.id = `order-length-${rowId}`;
        lengthInput.step = '0.1';
        lengthInput.min = '0.1';
        lengthInput.placeholder = 'np. 1.2';
        
        // Ilość sztuk
        const quantityLabel = document.createElement('label');
        quantityLabel.textContent = 'Ilość:';
        
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.id = `order-quantity-${rowId}`;
        quantityInput.min = '1';
        quantityInput.placeholder = 'np. 10';
        
        // Przycisk usuwania
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Usuń';
        removeButton.className = 'small-button';
        removeButton.onclick = () => CuttingStock.removeOrderRow(rowId);
        
        // Dodaj elementy do wiersza
        orderRow.appendChild(orderLabel);
        orderRow.appendChild(lengthLabel);
        orderRow.appendChild(lengthInput);
        orderRow.appendChild(quantityLabel);
        orderRow.appendChild(quantityInput);
        orderRow.appendChild(removeButton);
        
        // Dodaj wiersz do listy zamówień
        ordersList.appendChild(orderRow);
    },
    
    removeOrderRow: (rowId) => {
        const row = document.getElementById(`order-row-${rowId}`);
        if (row) {
            row.parentNode.removeChild(row);
        }
    },
    
    calculate: () => {
        console.log("Executing CuttingStock.calculate()");
        
        try {
            // Wyczyść poprzednie wyniki
            Utils.clearElement('cuttingStockResults');
            Utils.clearElement('cuttingStockVisualization');
            
            // Pokaż wskaźnik ładowania
            Utils.showElement('cuttingStockLoadingIndicator');
            
            // Zbierz dane wejściowe
            const logLength = parseFloat(document.getElementById('logLength').value);
            if (isNaN(logLength) || logLength <= 0) {
                throw new Error('Nieprawidłowa długość kłody.');
            }
            
            // Zbierz zamówienia
            CuttingStock.orders = [];
            const orderRows = document.querySelectorAll('[id^="order-row-"]');
            for (const row of orderRows) {
                const rowId = parseInt(row.id.split('-')[2]);
                const length = parseFloat(document.getElementById(`order-length-${rowId}`).value);
                const quantity = parseInt(document.getElementById(`order-quantity-${rowId}`).value);
                
                if (isNaN(length) || isNaN(quantity) || length <= 0 || quantity <= 0) {
                    throw new Error(`Nieprawidłowe dane w zamówieniu ${rowId + 1}.`);
                }
                
                if (length > logLength) {
                    throw new Error(`Długość elementu ${length} w zamówieniu ${rowId + 1} przekracza długość kłody ${logLength}.`);
                }
                
                CuttingStock.orders.push({
                    id: rowId,
                    length: length,
                    quantity: quantity
                });
            }
            
            if (CuttingStock.orders.length === 0) {
                throw new Error('Brak zamówień. Dodaj co najmniej jedno zamówienie.');
            }
            
            // Sprawdź, czy wymagana jest dokładna liczba sztuk
            const exactCuts = document.getElementById('exactCuts').checked;
            
            // Rozwiąż problem rozkroju
            setTimeout(() => {
                try {
                    CuttingStock.solution = CuttingStock.solveCuttingStock(logLength, CuttingStock.orders, exactCuts);
                    CuttingStock.displayResults();
                    CuttingStock.visualizeResults();
                } catch (error) {
                    Utils.displayResults('cuttingStockResults', `Błąd podczas obliczania: ${error.message}`, true);
                } finally {
                    Utils.hideElement('cuttingStockLoadingIndicator');
                }
            }, 100); // Małe opóźnienie, aby interfejs mógł się odświeżyć
        } catch (error) {
            Utils.hideElement('cuttingStockLoadingIndicator');
            Utils.displayResults('cuttingStockResults', `Błąd: ${error.message}`, true);
        }
    },
    
    solveCuttingStock: (stockLength, orders, exact = false) => {
        console.log("Solving cutting stock problem:", { stockLength, orders, exact });
        
        // Generuj wzory cięcia
        CuttingStock.patterns = CuttingStock.generateCuttingPatterns(stockLength, orders);
        if (CuttingStock.patterns.length === 0) {
            throw new Error('Nie udało się wygenerować wzorów cięcia.');
        }
        
        console.log(`Generated ${CuttingStock.patterns.length} cutting patterns.`);
        
        // Utwórz model optymalizacji
        const model = {
            optimize: 'stockUsed',
            opType: 'min',
            constraints: {},
            variables: {}
        };
        
        // Ustaw ograniczenia zapotrzebowania na każdy element
        orders.forEach(order => {
            const orderKey = `order_${order.id}`;
            model.constraints[orderKey] = { min: order.quantity };
            if (exact) {
                model.constraints[orderKey].max = order.quantity;
            }
        });
        
        // Dodaj zmienne dla każdego wzoru cięcia
        CuttingStock.patterns.forEach((pattern, patternId) => {
            const varKey = `pattern_${patternId}`;
            model.variables[varKey] = {
                stockUsed: 1  // Każdy wzór zużywa jedną sztukę surowca
            };
            
            // Dodaj ile każdy element pojawia się we wzorze
            orders.forEach(order => {
                const orderKey = `order_${order.id}`;
                model.variables[varKey][orderKey] = pattern.counts[order.id] || 0;
            });
        });
        
        // Rozwiąż problem
        console.log("Solving model:", model);
        const solution = solver.Solve(model);
        console.log("Solution:", solution);
        
        if (!solution.feasible) {
            throw new Error('Nie znaleziono wykonalnego rozwiązania. Spróbuj zmienić parametry.');
        }
        
        // Przetwarzanie wyników
        const result = {
            totalStockUsed: solution.result,
            patterns: []
        };
        
        // Pobierz wykorzystane wzory
        for (const key in solution) {
            if (key.startsWith('pattern_') && solution[key] > 0) {
                const patternId = parseInt(key.split('_')[1]);
                const pattern = CuttingStock.patterns[patternId];
                
                result.patterns.push({
                    id: patternId,
                    pattern: pattern,
                    count: solution[key]
                });
            }
        }
        
        // Oblicz zużycie materiału i odpady
        let totalMaterialUsed = 0;
        let totalWaste = 0;
        
        for (const patternResult of result.patterns) {
            const pattern = patternResult.pattern;
            const count = patternResult.count;
            
            totalMaterialUsed += stockLength * count;
            totalWaste += pattern.waste * count;
        }
        
        result.totalMaterialUsed = totalMaterialUsed;
        result.totalWaste = totalWaste;
        result.wastePercentage = (totalWaste / totalMaterialUsed) * 100;
        
        return result;
    },
    
    generateCuttingPatterns: (stockLength, orders) => {
        // Sortowanie zamówień według długości (malejąco)
        const sortedOrders = [...orders].sort((a, b) => b.length - a.length);
        const patterns = [];
        
        // Funkcja do generowania wszystkich możliwych kombinacji elementów
        const generatePatterns = (remainingLength, currentPattern, startIndex) => {
            // Dodaj obecny wzór do listy
            if (currentPattern.length > 0) {
                // Oblicz zużycie i odpady
                let usedLength = 0;
                const counts = {};
                
                for (const itemId of currentPattern) {
                    const order = orders.find(o => o.id === itemId);
                    usedLength += order.length;
                    counts[itemId] = (counts[itemId] || 0) + 1;
                }
                
                const waste = stockLength - usedLength;
                
                // Dodaj wzór tylko jeśli jest unikalny
                const isUnique = !patterns.some(p => {
                    // Porównaj liczby poszczególnych elementów
                    for (const orderId in counts) {
                        if ((p.counts[orderId] || 0) !== counts[orderId]) {
                            return false;
                        }
                    }
                    for (const orderId in p.counts) {
                        if ((counts[orderId] || 0) !== p.counts[orderId]) {
                            return false;
                        }
                    }
                    return true;
                });
                
                if (isUnique) {
                    patterns.push({
                        items: [...currentPattern],
                        counts: {...counts},
                        waste: waste,
                        usage: (stockLength - waste) / stockLength * 100
                    });
                }
            }
            
            // Rekurencyjne generowanie wzorów
            for (let i = startIndex; i < sortedOrders.length; i++) {
                const order = sortedOrders[i];
                if (order.length <= remainingLength) {
                    currentPattern.push(order.id);
                    generatePatterns(remainingLength - order.length, currentPattern, i);
                    currentPattern.pop();
                }
            }
        };
        
        // Wygeneruj wszystkie możliwe wzory cięcia
        generatePatterns(stockLength, [], 0);
        
        return patterns;
    },
    
    displayResults: () => {
        if (!CuttingStock.solution) {
            return;
        }
        
        const container = document.getElementById('cuttingStockResults');
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Nagłówek wyników
        const header = document.createElement('h3');
        header.textContent = 'Wyniki optymalizacji rozkroju';
        container.appendChild(header);
        
        // Podsumowanie
        const summary = document.createElement('div');
        summary.className = 'results-summary';
        
        summary.innerHTML = `
            <h4>Podsumowanie</h4>
            <p><strong>Liczba potrzebnych kłód:</strong> ${CuttingStock.solution.totalStockUsed}</p>
            <p><strong>Całkowite zużycie materiału:</strong> ${CuttingStock.solution.totalMaterialUsed.toFixed(2)} m</p>
            <p><strong>Całkowite odpady:</strong> ${CuttingStock.solution.totalWaste.toFixed(2)} m 
               (${CuttingStock.solution.wastePercentage.toFixed(2)}%)</p>
        `;
        
        container.appendChild(summary);
        
        // Tabela użytych wzorów
        const patternsContainer = document.createElement('div');
        patternsContainer.className = 'results-detail';
        
        const patternsHeader = document.createElement('h4');
        patternsHeader.textContent = 'Wzory cięcia';
        patternsContainer.appendChild(patternsHeader);
        
        const patternsTable = document.createElement('table');
        patternsTable.className = 'results-table';
        
        // Nagłówek tabeli
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Wzór</th>
            <th>Liczba użyć</th>
            <th>Wykorzystanie</th>
            <th>Skład</th>
        `;
        patternsTable.appendChild(headerRow);
        
        // Dla każdego wzoru
        for (const patternResult of CuttingStock.solution.patterns) {
            const pattern = patternResult.pattern;
            const count = patternResult.count;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patternResult.id + 1}</td>
                <td>${count}</td>
                <td>${pattern.usage.toFixed(2)}%</td>
                <td>${CuttingStock.formatPatternComposition(pattern, CuttingStock.orders)}</td>
            `;
            
            patternsTable.appendChild(row);
        }
        
        patternsContainer.appendChild(patternsTable);
        container.appendChild(patternsContainer);
    },
    
    formatPatternComposition: (pattern, orders) => {
        const compositions = [];
        
        for (const orderId in pattern.counts) {
            const count = pattern.counts[orderId];
            const order = orders.find(o => o.id === parseInt(orderId));
            if (order) {
                compositions.push(`${count} × ${order.length}m`);
            }
        }
        
        return compositions.join(', ') + `, odpad: ${pattern.waste.toFixed(2)}m`;
    },
    
    visualizeResults: () => {
        if (!CuttingStock.solution) {
            return;
        }
        
        const container = document.getElementById('cuttingStockVisualization');
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Nagłówek wizualizacji
        const header = document.createElement('h3');
        header.textContent = 'Wizualizacja rozkroju';
        container.appendChild(header);
        
        // Dane do wykresu Sankey
        const nodes = [];
        const links = [];
        
        // Dodaj węzeł źródłowy - kłody
        nodes.push({ 
            name: `Kłody (${CuttingStock.solution.totalStockUsed} szt.)`,
            color: '#4A3C31'
        });
        
        // Dodaj węzły dla wzorów cięcia
        CuttingStock.solution.patterns.forEach((patternResult, idx) => {
            const pattern = patternResult.pattern;
            const count = patternResult.count;
            
            const nodeIndex = nodes.length;
            nodes.push({ 
                name: `Wzór ${idx + 1} (${count} szt.)`,
                color: '#785E45'
            });
            
            // Link od kłód do wzoru
            links.push({
                source: 0,
                target: nodeIndex,
                value: count,
                color: '#785E45'
            });
            
            // Dodaj link dla każdego typu elementu w tym wzorze
            for (const orderId in pattern.counts) {
                const orderCount = pattern.counts[orderId];
                const order = CuttingStock.orders.find(o => o.id === parseInt(orderId));
                
                if (order) {
                    let orderNodeIndex = nodes.findIndex(n => n.name === `Element ${order.length}m`);
                    
                    if (orderNodeIndex === -1) {
                        orderNodeIndex = nodes.length;
                        nodes.push({ 
                            name: `Element ${order.length}m`,
                            color: '#D4AF37'
                        });
                    }
                    
                    links.push({
                        source: nodeIndex,
                        target: orderNodeIndex,
                        value: orderCount * count,
                        color: '#D4AF37'
                    });
                }
            }
            
            // Link dla odpadów
            if (pattern.waste > 0.01) {
                let wasteNodeIndex = nodes.findIndex(n => n.name === 'Odpady');
                
                if (wasteNodeIndex === -1) {
                    wasteNodeIndex = nodes.length;
                    nodes.push({ 
                        name: 'Odpady',
                        color: '#BFA58E'
                    });
                }
                
                links.push({
                    source: nodeIndex,
                    target: wasteNodeIndex,
                    value: count * pattern.waste,
                    color: '#BFA58E'
                });
            }
        });
        
        // Utwórz kontener dla wykresu
        const sankeyDiv = document.createElement('div');
        sankeyDiv.id = 'sankeyChart';
        sankeyDiv.style.height = '600px';
        sankeyDiv.style.width = '100%';
        container.appendChild(sankeyDiv);
        
        // Dane do wykresu Sankey
        const data = {
            type: "sankey",
            orientation: "h",
            node: {
                pad: 15,
                thickness: 20,
                line: {
                    color: "black",
                    width: 0.5
                },
                label: nodes.map(n => n.name),
                color: nodes.map(n => n.color)
            },
            link: {
                source: links.map(l => l.source),
                target: links.map(l => l.target),
                value: links.map(l => l.value),
                color: links.map(l => l.color)
            }
        };
        
        const layout = {
            title: 'Schemat przepływu materiału',
            font: {
                size: 12
            },
            margin: {
                l: 30,
                r: 30,
                b: 30,
                t: 50
            }
        };
        
        Plotly.newPlot('sankeyChart', [data], layout, { responsive: true });
        
        // Dodaj również wizualizację wzorów cięcia
        const patternVisDiv = document.createElement('div');
        patternVisDiv.id = 'patternVisContainer';
        patternVisDiv.className = 'pattern-visualization-container';
        container.appendChild(patternVisDiv);
        
        const patternVisHeader = document.createElement('h4');
        patternVisHeader.textContent = 'Wizualizacja wzorów cięcia';
        patternVisDiv.appendChild(patternVisHeader);
        
        // Dla każdego wzoru utwórz wizualizację
        CuttingStock.solution.patterns.forEach((patternResult, idx) => {
            const pattern = patternResult.pattern;
            const count = patternResult.count;
            
            const patternContainer = document.createElement('div');
            patternContainer.className = 'pattern-container';
            patternContainer.style.marginBottom = '20px';
            
            const patternTitle = document.createElement('h5');
            patternTitle.innerHTML = `Wzór ${idx + 1} <small>(${count} użyć)</small>`;
            patternContainer.appendChild(patternTitle);
            
            // Wizualizacja wzoru jako pasek
            const stockLength = parseFloat(document.getElementById('logLength').value);
            const barContainer = document.createElement('div');
            barContainer.className = 'pattern-bar-container';
            barContainer.style.width = '100%';
            barContainer.style.height = '40px';
            barContainer.style.display = 'flex';
            barContainer.style.marginBottom = '10px';
            barContainer.style.border = '1px solid #4A3C31';
            
            // Dodaj elementy
            let usedLength = 0;
            for (const orderId in pattern.counts) {
                const orderCount = pattern.counts[orderId];
                const order = CuttingStock.orders.find(o => o.id === parseInt(orderId));
                
                if (order) {
                    for (let i = 0; i < orderCount; i++) {
                        const piece = document.createElement('div');
                        const pieceWidth = (order.length / stockLength) * 100;
                        piece.style.width = `${pieceWidth}%`;
                        piece.style.height = '100%';
                        piece.style.backgroundColor = '#D4AF37';
                        piece.style.border = '1px solid #785E45';
                        piece.style.boxSizing = 'border-box';
                        piece.style.display = 'flex';
                        piece.style.alignItems = 'center';
                        piece.style.justifyContent = 'center';
                        piece.style.color = '#4A3C31';
                        piece.style.fontSize = '12px';
                        piece.title = `Element ${order.length}m`;
                        
                        if (pieceWidth > 5) {
                            piece.textContent = order.length;
                        }
                        
                        barContainer.appendChild(piece);
                        usedLength += order.length;
                    }
                }
            }
            
            // Dodaj odpad
            if (pattern.waste > 0.01) {
                const waste = document.createElement('div');
                waste.style.width = `${(pattern.waste / stockLength) * 100}%`;
                waste.style.height = '100%';
                waste.style.backgroundColor = '#BFA58E';
                waste.style.display = 'flex';
                waste.style.alignItems = 'center';
                waste.style.justifyContent = 'center';
                waste.style.color = '#4A3C31';
                waste.style.fontSize = '12px';
                waste.title = `Odpad ${pattern.waste.toFixed(2)}m`;
                
                if ((pattern.waste / stockLength) * 100 > 5) {
                    waste.textContent = pattern.waste.toFixed(2);
                }
                
                barContainer.appendChild(waste);
            }
            
            patternContainer.appendChild(barContainer);
            
            // Informacje o wzorze
            const patternInfo = document.createElement('div');
            patternInfo.className = 'pattern-info';
            patternInfo.innerHTML = `
                <p>Wykorzystanie: ${pattern.usage.toFixed(2)}%, Odpad: ${pattern.waste.toFixed(2)}m</p>
                <p>Skład: ${CuttingStock.formatPatternComposition(pattern, CuttingStock.orders)}</p>
            `;
            patternContainer.appendChild(patternInfo);
            
            patternVisDiv.appendChild(patternContainer);
        });
        
        // Wyemituj zdarzenie po zakończeniu wizualizacji
        document.dispatchEvent(new Event('calculation-complete'));
    }
} 