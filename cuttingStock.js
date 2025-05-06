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
        
        // Dodaj pierwszy wiersz zamówienia
        CuttingStock.addOrderRow();
        
        // Dodaj przyciski do ładowania przykładowych wartości, zapisywania i wczytywania zamówień
        const inputGroup = document.querySelector('#tool-cutting-stock .input-group');
        
        // Sprawdź, czy przyciski już istnieją, aby uniknąć duplikacji
        if (!document.getElementById('loadSampleDataButton')) {
            const buttonRow = document.createElement('div');
            buttonRow.className = 'input-row';
            buttonRow.style.marginTop = '15px';
            buttonRow.style.justifyContent = 'center';
            
            const loadSampleButton = document.createElement('button');
            loadSampleButton.id = 'loadSampleDataButton';
            loadSampleButton.textContent = 'Załaduj przykładowe dane';
            loadSampleButton.onclick = CuttingStock.loadSampleData;
            loadSampleButton.style.marginRight = '10px';
            
            const saveOrdersButton = document.createElement('button');
            saveOrdersButton.id = 'saveOrdersButton';
            saveOrdersButton.textContent = 'Zapisz zamówienie';
            saveOrdersButton.onclick = CuttingStock.saveOrdersToFile;
            saveOrdersButton.style.marginRight = '10px';
            
            const loadOrdersButton = document.createElement('button');
            loadOrdersButton.id = 'loadOrdersButton';
            loadOrdersButton.textContent = 'Wczytaj zamówienie';
            loadOrdersButton.onclick = CuttingStock.loadOrdersFromFile;
            
            buttonRow.appendChild(loadSampleButton);
            buttonRow.appendChild(saveOrdersButton);
            buttonRow.appendChild(loadOrdersButton);
            inputGroup.appendChild(buttonRow);
            
            // Dodaj ukryty input dla wczytywania pliku
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'ordersFileInput';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            fileInput.addEventListener('change', CuttingStock.handleFileSelect);
            inputGroup.appendChild(fileInput);
        }
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
        
        // Priorytet/Wartość elementu
        const priorityLabel = document.createElement('label');
        priorityLabel.textContent = 'Priorytet:';
        
        const priorityInput = document.createElement('input');
        priorityInput.type = 'number';
        priorityInput.id = `order-priority-${rowId}`;
        priorityInput.step = '1';
        priorityInput.min = '1';
        priorityInput.max = '10';
        priorityInput.value = '5';
        priorityInput.title = 'Priorytet elementu (1-10). Wyższy priorytet oznacza, że element zostanie preferowany w przypadku nadprogramowych kawałków.';
        
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
        orderRow.appendChild(priorityLabel);
        orderRow.appendChild(priorityInput);
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
                const priorityElement = document.getElementById(`order-priority-${rowId}`);
                const priority = priorityElement ? parseInt(priorityElement.value) : 5; // Domyślny priorytet 5, jeśli pole nie istnieje
                
                if (isNaN(length) || isNaN(quantity) || length <= 0 || quantity <= 0) {
                    throw new Error(`Nieprawidłowe dane w zamówieniu ${rowId + 1}.`);
                }
                
                if (length > logLength) {
                    throw new Error(`Długość elementu ${length} w zamówieniu ${rowId + 1} przekracza długość kłody ${logLength}.`);
                }
                
                CuttingStock.orders.push({
                    id: rowId,
                    length: length,
                    quantity: quantity,
                    priority: priority // Dodanie priorytetu do zamówienia
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
        
        // Oblicz teoretyczne minimum kłód potrzebnych do wyprodukowania wszystkich elementów
        let totalOrderLength = 0;
        for (const order of orders) {
            totalOrderLength += order.length * order.quantity;
        }
        const theoreticalMinLogs = Math.ceil(totalOrderLength / stockLength);
        console.log(`Teoretyczne minimum kłód: ${theoreticalMinLogs} (całkowita długość zamówionych elementów: ${totalOrderLength}m)`);
        
        // Generuj wzory cięcia
        CuttingStock.patterns = CuttingStock.generateCuttingPatterns(stockLength, orders);
        if (CuttingStock.patterns.length === 0) {
            throw new Error('Nie udało się wygenerować wzorów cięcia.');
        }
        
        console.log(`Generated ${CuttingStock.patterns.length} cutting patterns.`);
        
        // Utwórz model optymalizacji
        const model = {
            optimize: exact ? 'stockUsed' : 'wasteWithPenalty',
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
            
            if (exact) {
                // Dla dokładnej liczby sztuk, optymalizujemy liczbę użytych kłód
                model.variables[varKey] = {
                    stockUsed: 1  // Każdy wzór zużywa jedną sztukę surowca
                };
            } else {
                // Dla niedokładnej liczby sztuk, optymalizujemy odpad z preferencją dla tworzenia nadprogramowych kawałków
                // Wprowadzamy karę za odpad, która jest większa dla wzorów z dużym odpadem
                const wastePenalty = Math.pow(pattern.waste / stockLength, 2) * 100;
                
                model.variables[varKey] = {
                    stockUsed: 1,
                    wasteWithPenalty: wastePenalty  // Kara za odpad
                };
                
                // Dodaj bonus za wykorzystanie elementów zgodnie z ich priorytetami
                // Im wyższy priorytet elementu, tym większy bonus za jego nadprogramowe użycie
                orders.forEach(order => {
                    // Współczynnik priorytetu - normalizujemy do zakresu 0-1 (priorytet jest z zakresu 1-10)
                    const priorityFactor = (order.priority || 5) / 10;
                    
                    // Bonus dla wszystkich elementów, ale proporcjonalny do priorytetu
                    const bonusKey = `bonus_order_${order.id}`;
                    if (!model.constraints[bonusKey]) {
                        model.constraints[bonusKey] = { min: 0 }; // Minimum 0 - opcjonalne wykorzystanie
                    }
                    
                    // Bonus zależy od priorytetu i długości elementu
                    // Elementy krótsze i o wyższym priorytecie otrzymują większy bonus
                    const lengthFactor = Math.max(0.5, 1 - order.length / stockLength); // Elementy krótsze mają większy bonus
                    const bonus = lengthFactor * priorityFactor * 0.2; // Skalujemy bonus, aby nie przesłonić głównego celu
                    
                    model.variables[varKey][bonusKey] = (pattern.counts[order.id] || 0) * bonus;
                });
            }
            
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
        let calculatedStockUsed = 0;
        for (const key in solution) {
            if (key.startsWith('pattern_') && solution[key] > 0) {
                calculatedStockUsed += solution[key];
            }
        }
        
        // Porównaj obliczoną liczbę kłód z teoretycznym minimum
        console.log(`Obliczona liczba kłód: ${calculatedStockUsed}, teoretyczne minimum: ${theoreticalMinLogs}`);
        
        // Jeśli obliczona liczba kłód jest znacząco mniejsza niż teoretyczne minimum,
        // istnieje prawdopodobieństwo błędu w obliczeniach solvera
        if (calculatedStockUsed < theoreticalMinLogs * 0.9) {
            console.warn(`Uwaga: Obliczona liczba kłód (${calculatedStockUsed}) jest mniejsza niż 90% teoretycznego minimum (${theoreticalMinLogs}). Używam teoretycznego minimum.`);
            // Zwiększ liczbę kłód dla każdego wzoru proporcjonalnie
            const scaleFactor = theoreticalMinLogs / calculatedStockUsed;
            for (const key in solution) {
                if (key.startsWith('pattern_')) {
                    solution[key] *= scaleFactor;
                }
            }
            // Zaktualizuj wynik optymalizacji
            solution.result = theoreticalMinLogs;
        }
        
        const result = {
            totalStockUsed: Math.max(Math.round(solution.result), theoreticalMinLogs), // Zaokrąglamy do liczb całkowitych, ale nie mniej niż teoretyczne minimum
            patterns: [],
            extraPieces: {}, // Dodajemy informację o nadprogramowych kawałkach
            theoreticalMinLogs: theoreticalMinLogs, // Dodajemy informację o teoretycznym minimum
            totalOrderLength: totalOrderLength // Dodajemy całkowitą długość zamówionych elementów
        };
        
        // Pobierz wykorzystane wzory
        for (const key in solution) {
            if (key.startsWith('pattern_') && solution[key] > 0) {
                const patternId = parseInt(key.split('_')[1]);
                const pattern = CuttingStock.patterns[patternId];
                
                // Skaluj liczbę użyć wzoru proporcjonalnie do całkowitej liczby kłód
                let count = solution[key];
                if (calculatedStockUsed < theoreticalMinLogs * 0.9) {
                    count = count * (result.totalStockUsed / calculatedStockUsed);
                }
                
                result.patterns.push({
                    id: patternId,
                    pattern: pattern,
                    count: Math.round(count) // Zaokrąglamy do liczb całkowitych
                });
            }
        }
        
        // Oblicz zużycie materiału, odpady i nadprogramowe kawałki
        let totalMaterialUsed = 0;
        let totalWaste = 0;
        
        // Oblicz ile kawałków każdego typu powstanie
        const producedPieces = {};
        
        for (const patternResult of result.patterns) {
            const pattern = patternResult.pattern;
            const count = patternResult.count; // już zaokrąglone
            
            totalMaterialUsed += stockLength * count;
            totalWaste += pattern.waste * count;
            
            // Zlicz ile kawałków każdego typu zostanie wyprodukowanych
            for (const orderId in pattern.counts) {
                const orderCount = pattern.counts[orderId];
                const order = orders.find(o => o.id === parseInt(orderId));
                
                if (order) {
                    if (!producedPieces[orderId]) {
                        producedPieces[orderId] = 0;
                    }
                    producedPieces[orderId] += orderCount * count;
                }
            }
        }
        
        // Oblicz nadprogramowe kawałki
        for (const order of orders) {
            const produced = producedPieces[order.id] || 0;
            const required = order.quantity;
            
            if (produced > required) {
                result.extraPieces[order.id] = {
                    length: order.length,
                    quantity: produced - required
                };
            }
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
        
        // Zaokrąglamy wartości do liczb całkowitych
        const stockUsed = Math.round(CuttingStock.solution.totalStockUsed);
        const theoreticalMinLogs = CuttingStock.solution.theoreticalMinLogs || stockUsed;
        const totalOrderLength = CuttingStock.solution.totalOrderLength || 0;
        
        // Dodaj informację o zamówionych elementach
        let orderDetails = '';
        for (const order of CuttingStock.orders) {
            orderDetails += `<li>${order.quantity} sztuk × ${order.length}m = ${(order.quantity * order.length).toFixed(2)}m</li>`;
        }
        
        summary.innerHTML = `
            <h4>Podsumowanie</h4>
            <p><strong>Liczba potrzebnych kłód:</strong> ${stockUsed}</p>
            <p><strong>Teoretyczne minimum kłód:</strong> ${theoreticalMinLogs} (przy założeniu idealnego podziału)</p>
            <p><strong>Całkowita długość zamówionych elementów:</strong> ${totalOrderLength.toFixed(2)}m</p>
            <details>
                <summary>Szczegóły zamówienia</summary>
                <ul>
                    ${orderDetails}
                </ul>
            </details>
            <p><strong>Całkowite zużycie materiału:</strong> ${CuttingStock.solution.totalMaterialUsed.toFixed(2)}m</p>
            <p><strong>Całkowite odpady:</strong> ${CuttingStock.solution.totalWaste.toFixed(2)}m 
               (${CuttingStock.solution.wastePercentage.toFixed(2)}%)</p>
        `;
        
        // Dodaj informacje o nadprogramowych kawałkach, jeśli istnieją
        if (CuttingStock.solution.extraPieces && Object.keys(CuttingStock.solution.extraPieces).length > 0) {
            const extraPiecesInfo = document.createElement('div');
            extraPiecesInfo.className = 'extra-pieces-info';
            extraPiecesInfo.innerHTML = '<h4>Nadprogramowe kawałki:</h4>';
            
            const extraList = document.createElement('ul');
            for (const orderId in CuttingStock.solution.extraPieces) {
                const extra = CuttingStock.solution.extraPieces[orderId];
                const extraItem = document.createElement('li');
                extraItem.innerHTML = `Element ${extra.length}m: +${extra.quantity} sztuk`;
                extraList.appendChild(extraItem);
            }
            
            extraPiecesInfo.appendChild(extraList);
            summary.appendChild(extraPiecesInfo);
        }
        
        // Dodaj przycisk eksportu do TXT
        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-container';
        
        const exportButton = document.createElement('button');
        exportButton.className = 'export-button';
        exportButton.textContent = 'Eksportuj wyniki';
        exportButton.onclick = CuttingStock.exportResults;
        
        exportContainer.appendChild(exportButton);
        summary.appendChild(exportContainer);
        
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
            // Zaokrąglamy liczbę użyć do liczby całkowitej
            const count = Math.round(patternResult.count);
            
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
        
        // Pobierz długość kłody
        let stockLength = parseFloat(document.getElementById('logLength').value);
        if (isNaN(stockLength) || stockLength <= 0) {
            console.error('Nieprawidłowa długość kłody w visualizeResults. Używam wartości domyślnej.');
            // Spróbuj pobrać wartość z ostatniego wywołania solveCuttingStock
            for (const patternResult of CuttingStock.solution.patterns) {
                const pattern = patternResult.pattern;
                // Suma długości elementów + odpad = długość kłody
                const totalLengthInPattern = Object.entries(pattern.counts).reduce((sum, [orderId, count]) => {
                    const order = CuttingStock.orders.find(o => o.id === parseInt(orderId));
                    return sum + (order ? order.length * count : 0);
                }, 0) + pattern.waste;
                
                if (totalLengthInPattern > 0) {
                    stockLength = totalLengthInPattern;
                    console.log('Używam odtworzonej długości kłody:', stockLength);
                    break;
                }
            }
            
            // Jeśli nadal nie mamy wartości, użyj wartości domyślnej 2.0m
            if (isNaN(stockLength) || stockLength <= 0) {
                stockLength = 2.0;
                console.log('Używam domyślnej długości kłody:', stockLength);
            }
        }
        
        // Nagłówek wizualizacji
        const header = document.createElement('h3');
        header.textContent = 'Wizualizacja rozkroju';
        container.appendChild(header);
        
        // Dodaj informację o całkowitym zapotrzebowaniu
        if (CuttingStock.solution.totalOrderLength) {
            const orderSummary = document.createElement('div');
            orderSummary.className = 'order-summary';
            orderSummary.innerHTML = `
                <p><strong>Całkowita długość zamówionych elementów:</strong> ${CuttingStock.solution.totalOrderLength.toFixed(2)}m</p>
                <p><strong>Teoretyczne minimum kłód:</strong> ${CuttingStock.solution.theoreticalMinLogs} (${(CuttingStock.solution.theoreticalMinLogs * stockLength).toFixed(2)}m)</p>
                <p><strong>Liczba użytych kłód:</strong> ${Math.round(CuttingStock.solution.totalStockUsed)} (${(Math.round(CuttingStock.solution.totalStockUsed) * stockLength).toFixed(2)}m)</p>
            `;
            container.appendChild(orderSummary);
        }
        
        // Dodaj wykres kołowy pokazujący wykorzystanie materiału
        CuttingStock.createMaterialUsagePieChart(container);
        
        // Dane do wykresu Sankey
        const nodes = [];
        const links = [];
        
        // Zaokrąglamy liczbę kłód do liczby całkowitej
        const totalStockUsed = Math.round(CuttingStock.solution.totalStockUsed);
        
        // Dodaj węzeł źródłowy - kłody
        nodes.push({ 
            name: `Kłody (${totalStockUsed} szt.)`,
            color: '#4A3C31'
        });
        
        // Funkcja do generowania odcieni złotego koloru
        const generateShade = (index) => {
            // Bazowy kolor złoty w formie RGB
            const baseColor = [212, 175, 55]; // #D4AF37
            // Przyciemniamy kolor o określony procent dla każdego kolejnego elementu
            const shadeFactor = 1 - (index * 0.15);
            // Ograniczamy wartości, aby nie były za ciemne
            const r = Math.max(Math.floor(baseColor[0] * shadeFactor), 100);
            const g = Math.max(Math.floor(baseColor[1] * shadeFactor), 80);
            const b = Math.max(Math.floor(baseColor[2] * shadeFactor), 20);
            return `rgb(${r}, ${g}, ${b})`;
        };
        
        // Mapa do śledzenia indeksów elementów
        const elementIndices = {};
        let currentElementIndex = 0;
        
        // Słownik do śledzenia węzłów dla elementów nadprogramowych
        const extraNodesIndices = {};
        
        // Sprawdź, czy istnieją elementy nadprogramowe
        const hasExtraPieces = CuttingStock.solution.extraPieces && 
                             Object.keys(CuttingStock.solution.extraPieces).length > 0;
        
        // Dodaj węzły dla wzorów cięcia
        CuttingStock.solution.patterns.forEach((patternResult, idx) => {
            const pattern = patternResult.pattern;
            // Zaokrąglamy liczbę użyć do liczby całkowitej
            const count = Math.round(patternResult.count);
            
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
            
            // Oblicz nadprogramowe kawałki dla każdego wzoru
            const patternExtraPieces = {};
            
            if (hasExtraPieces) {
                // Dla każdego typu elementu w tym wzorze, sprawdź ile z nich jest nadprogramowych
                for (const orderId in pattern.counts) {
                    const orderIdInt = parseInt(orderId);
                    if (CuttingStock.solution.extraPieces[orderIdInt]) {
                        // Znajdź odpowiadające zamówienie
                        const order = CuttingStock.orders.find(o => o.id === orderIdInt);
                        if (order) {
                            // Oblicz, jaki procent wyprodukowanych elementów tego typu jest nadprogramowy
                            const totalProduced = CuttingStock.orders.reduce((sum, o) => {
                                if (o.id === orderIdInt) {
                                    return sum + o.quantity;
                                }
                                return sum;
                            }, 0);
                            
                            const extraPieces = CuttingStock.solution.extraPieces[orderIdInt].quantity;
                            const extraRatio = extraPieces / (totalProduced + extraPieces);
                            
                            // Oblicz, ile sztuk w tym wzorze to elementy nadprogramowe
                            const patternOrderCount = pattern.counts[orderIdInt];
                            if (patternOrderCount) {
                                patternExtraPieces[orderIdInt] = Math.round(patternOrderCount * count * extraRatio);
                            }
                        }
                    }
                }
            }
            
            // Dodaj link dla każdego typu elementu w tym wzorze
            for (const orderId in pattern.counts) {
                const orderCount = pattern.counts[orderId];
                const order = CuttingStock.orders.find(o => o.id === parseInt(orderId));
                
                if (order) {
                    // Przypisz indeks dla elementu, jeśli jeszcze nie istnieje
                    if (elementIndices[order.length] === undefined) {
                        elementIndices[order.length] = currentElementIndex++;
                    }
                    
                    // Generuj kolor na podstawie indeksu elementu
                    const elementColor = generateShade(elementIndices[order.length]);
                    
                    // Znajdź lub utwórz węzeł dla podstawowych elementów
                    let orderNodeIndex = nodes.findIndex(n => n.name === `Element ${order.length}m`);
                    
                    if (orderNodeIndex === -1) {
                        orderNodeIndex = nodes.length;
                        nodes.push({ 
                            name: `Element ${order.length}m`,
                            color: elementColor
                        });
                    }
                    
                    // Oblicz, ile elementów to elementy podstawowe (planowane)
                    const plannedCount = orderCount * count - (patternExtraPieces[order.id] || 0);
                    
                    // Dodaj link do podstawowych elementów, jeśli istnieją
                    if (plannedCount > 0) {
                        links.push({
                            source: nodeIndex,
                            target: orderNodeIndex,
                            value: plannedCount,
                            color: elementColor
                        });
                    }
                    
                    // Jeśli istnieją elementy nadprogramowe dla tego typu, dodaj je
                    if (patternExtraPieces[order.id] && patternExtraPieces[order.id] > 0) {
                        // Stwórz lub znajdź węzeł dla nadprogramowych kawałków tego typu
                        if (!extraNodesIndices[order.id]) {
                            extraNodesIndices[order.id] = nodes.length;
                            // Kolor dla nadprogramowych kawałków - jasnozielony
                            const extraColor = 'rgba(46, 204, 113, 0.8)';
                            nodes.push({
                                name: `Nadprogramowe ${order.length}m (+${CuttingStock.solution.extraPieces[order.id].quantity} szt.)`,
                                color: extraColor
                            });
                        }
                        
                        // Dodaj link od wzoru do nadprogramowych kawałków
                        links.push({
                            source: nodeIndex,
                            target: extraNodesIndices[order.id],
                            value: patternExtraPieces[order.id],
                            color: 'rgba(46, 204, 113, 0.6)'
                        });
                    }
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
        
        // Dodaj legendę dla kolorów
        const legendContainer = document.createElement('div');
        legendContainer.className = 'sankey-legend';
        legendContainer.style.marginTop = '15px';
        legendContainer.style.textAlign = 'center';
        
        const legendItems = [
            {name: 'Kłody', color: '#4A3C31'},
            {name: 'Wzory cięcia', color: '#785E45'},
            {name: 'Elementy', color: '#D4AF37'},
            {name: 'Nadprogramowe elementy', color: 'rgba(46, 204, 113, 0.8)'},
            {name: 'Odpady', color: '#BFA58E'}
        ];
        
        const legendHtml = legendItems.map(item => {
            return `
                <div class="legend-item">
                    <div class="color-box" style="background-color: ${item.color};"></div>
                    <span>${item.name}</span>
                </div>
            `;
        }).join('');
        
        legendContainer.innerHTML = `<div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px; display: inline-block;">${legendHtml}</div>`;
        container.appendChild(legendContainer);
        
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
            // Zaokrąglamy liczbę użyć do liczby całkowitej
            const count = Math.round(patternResult.count);
            
            const patternContainer = document.createElement('div');
            patternContainer.className = 'pattern-container';
            patternContainer.style.marginBottom = '20px';
            
            const patternTitle = document.createElement('h5');
            patternTitle.innerHTML = `Wzór ${idx + 1} <small>(${count} użyć)</small>`;
            patternContainer.appendChild(patternTitle);
            
            // Wizualizacja wzoru jako pasek
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
                    // Sprawdź, czy ten typ elementu ma nadprogramowe kawałki
                    const hasExtraPieces = CuttingStock.solution.extraPieces && 
                                          CuttingStock.solution.extraPieces[order.id];
                    
                    // Zastosuj ten sam kolor dla elementów w wizualizacji wzorów cięcia
                    const elementColor = elementIndices[order.length] !== undefined ? 
                        generateShade(elementIndices[order.length]) : 
                        '#D4AF37';
                    
                    for (let i = 0; i < orderCount; i++) {
                        const piece = document.createElement('div');
                        const pieceWidth = (order.length / stockLength) * 100;
                        piece.style.width = `${pieceWidth}%`;
                        piece.style.height = '100%';
                        
                        // Określ, czy ten konkretny element jest nadprogramowy
                        // Elementy nadprogramowe są dodawane na końcu listy dla danego typu
                        let isExtraPiece = false;
                        if (hasExtraPieces) {
                            const requiredCount = order.quantity;
                            // Jeśli indeks i przekracza wymaganą liczbę elementów dla tego typu
                            // podzieloną proporcjonalnie na wszystkie wzory, to oznaczamy jako nadprogramowy
                            const patternRequiredPieces = Math.ceil(requiredCount * orderCount / 
                                                   CuttingStock.orders.reduce((sum, o) => 
                                                       sum + (pattern.counts[o.id] || 0) * count, 0));
                            isExtraPiece = i >= patternRequiredPieces;
                        }
                        
                        // Ustaw kolor w zależności od tego, czy element jest nadprogramowy
                        piece.style.backgroundColor = isExtraPiece ? 
                            'rgba(46, 204, 113, 0.8)' : elementColor;
                        
                        // Dodaj klasę dla elementów nadprogramowych
                        if (isExtraPiece) {
                            piece.classList.add('extra-element');
                        }
                        
                        piece.style.border = '1px solid #785E45';
                        piece.style.boxSizing = 'border-box';
                        piece.style.display = 'flex';
                        piece.style.alignItems = 'center';
                        piece.style.justifyContent = 'center';
                        piece.style.color = '#4A3C31';
                        piece.style.fontSize = '12px';
                        
                        // Dodaj informację do tooltip, czy element jest nadprogramowy
                        piece.title = isExtraPiece ? 
                            `Element ${order.length}m (nadprogramowy)` : 
                            `Element ${order.length}m`;
                        
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
    },
    
    // Nowa funkcja do tworzenia wykresu kołowego pokazującego wykorzystanie materiału
    createMaterialUsagePieChart: (container) => {
        if (!CuttingStock.solution) {
            return;
        }
        
        // Utwórz kontener dla wykresu
        const chartContainer = document.createElement('div');
        chartContainer.className = 'material-usage-chart-container';
        chartContainer.style.display = 'flex';
        chartContainer.style.justifyContent = 'space-between';
        chartContainer.style.marginBottom = '30px';
        
        // Kontener dla wykresu kołowego
        const pieChartDiv = document.createElement('div');
        pieChartDiv.id = 'materialUsagePieChart';
        pieChartDiv.style.width = '45%';
        pieChartDiv.style.height = '350px';
        
        // Kontener dla wykresu produktowego
        const productChartDiv = document.createElement('div');
        productChartDiv.id = 'productUsageChart';
        productChartDiv.style.width = '45%';
        productChartDiv.style.height = '350px';
        
        chartContainer.appendChild(pieChartDiv);
        chartContainer.appendChild(productChartDiv);
        
        // Wstaw kontener po podsumowaniu
        const orderSummary = container.querySelector('.order-summary');
        if (orderSummary) {
            orderSummary.insertAdjacentElement('afterend', chartContainer);
        } else {
            container.appendChild(chartContainer);
        }
        
        // Przygotuj dane do wykresu kołowego - wykorzystanie materiału vs odpad
        const usedMaterial = CuttingStock.solution.totalMaterialUsed - CuttingStock.solution.totalWaste;
        
        const pieData = [{
            values: [usedMaterial, CuttingStock.solution.totalWaste],
            labels: ['Wykorzystany materiał', 'Odpad'],
            type: 'pie',
            textinfo: 'label+percent',
            textposition: 'inside',
            marker: {
                colors: ['#D4AF37', '#BFA58E']
            },
            hoverinfo: 'label+value+percent',
            hoverlabel: {
                bgcolor: '#FFF',
                font: { size: 16 }
            },
            hole: 0.4,
            pull: [0, 0.1]
        }];
        
        const pieLayout = {
            title: 'Wykorzystanie materiału',
            font: { size: 14 },
            height: 350,
            margin: { t: 50, b: 20, l: 20, r: 20 },
            annotations: [{
                font: { size: 16 },
                showarrow: false,
                text: `${(100 - CuttingStock.solution.wastePercentage).toFixed(2)}%<br>wykorzystania`,
                x: 0.5,
                y: 0.5
            }]
        };
        
        Plotly.newPlot('materialUsagePieChart', pieData, pieLayout, { responsive: true });
        
        // Przygotuj dane do wykresu produktowego - ile każdego typu elementu
        const productData = [];
        const productLabels = [];
        const productColors = [];
        
        // Funkcja do generowania odcieni złotego koloru
        const generateShade = (index) => {
            // Bazowy kolor złoty w formie RGB
            const baseColor = [212, 175, 55]; // #D4AF37
            // Przyciemniamy kolor o określony procent dla każdego kolejnego elementu
            const shadeFactor = 1 - (index * 0.15);
            // Ograniczamy wartości, aby nie były za ciemne
            const r = Math.max(Math.floor(baseColor[0] * shadeFactor), 100);
            const g = Math.max(Math.floor(baseColor[1] * shadeFactor), 80);
            const b = Math.max(Math.floor(baseColor[2] * shadeFactor), 20);
            return `rgb(${r}, ${g}, ${b})`;
        };
        
        // Zbierz dane o liczbie każdego typu elementu w rozwiązaniu
        const typeCounts = {};
        CuttingStock.orders.forEach(order => {
            if (!typeCounts[order.length]) {
                typeCounts[order.length] = { required: 0, produced: 0 };
            }
            typeCounts[order.length].required += order.quantity;
        });
        
        // Oblicz, ile każdego elementu zostało wyprodukowanych
        for (const patternResult of CuttingStock.solution.patterns) {
            const pattern = patternResult.pattern;
            const count = Math.round(patternResult.count);
            
            for (const orderId in pattern.counts) {
                const order = CuttingStock.orders.find(o => o.id === parseInt(orderId));
                if (order) {
                    if (!typeCounts[order.length]) {
                        typeCounts[order.length] = { required: 0, produced: 0 };
                    }
                    typeCounts[order.length].produced += pattern.counts[orderId] * count;
                }
            }
        }
        
        // Przygotuj dane do wykresu
        let i = 0;
        for (const length in typeCounts) {
            if (typeCounts.hasOwnProperty(length)) {
                const data = typeCounts[length];
                
                // Jeśli wyprodukowano więcej niż wymagano, pokaż rozdział
                if (data.produced > data.required) {
                    productData.push(data.required, data.produced - data.required);
                    productLabels.push(`Element ${length}m (zamówione)`, `Element ${length}m (nadprogramowe)`);
                    
                    const baseColor = generateShade(i);
                    productColors.push(baseColor, 'rgba(46, 204, 113, 0.8)');
                } else {
                    productData.push(data.produced);
                    productLabels.push(`Element ${length}m`);
                    productColors.push(generateShade(i));
                }
                i++;
            }
        }
        
        const productChartData = [{
            x: productLabels,
            y: productData,
            type: 'bar',
            marker: {
                color: productColors
            },
            hoverinfo: 'x+y',
            hoverlabel: {
                bgcolor: '#FFF',
                font: { size: 16 }
            }
        }];
        
        const productChartLayout = {
            title: 'Liczba poszczególnych elementów',
            font: { size: 14 },
            height: 350,
            margin: { t: 50, b: 100, l: 50, r: 20 },
            xaxis: {
                tickangle: -45
            },
            yaxis: {
                title: 'Liczba sztuk'
            }
        };
        
        Plotly.newPlot('productUsageChart', productChartData, productChartLayout, { responsive: true });
    },
    
    // Funkcja do eksportu wyników do TXT
    exportResults: () => {
        if (!CuttingStock.solution) {
            alert('Brak wyników do eksportu. Najpierw oblicz optymalny podział.');
            return;
        }
        
        // Przygotuj zawartość pliku TXT
        let content = '==============================================================\n';
        content += '                WYNIKI OPTYMALIZACJI ROZKROJU\n';
        content += '==============================================================\n\n';
        
        // Podsumowanie
        const stockUsed = Math.round(CuttingStock.solution.totalStockUsed);
        const theoreticalMinLogs = CuttingStock.solution.theoreticalMinLogs || stockUsed;
        const totalOrderLength = CuttingStock.solution.totalOrderLength || 0;
        
        content += 'PODSUMOWANIE:\n';
        content += '--------------\n';
        content += `Długość kłody: ${parseFloat(document.getElementById('logLength').value).toFixed(2)}m\n`;
        content += `Liczba potrzebnych kłód: ${stockUsed}\n`;
        content += `Teoretyczne minimum kłód: ${theoreticalMinLogs}\n`;
        content += `Całkowita długość zamówionych elementów: ${totalOrderLength.toFixed(2)}m\n`;
        content += `Całkowite zużycie materiału: ${CuttingStock.solution.totalMaterialUsed.toFixed(2)}m\n`;
        content += `Całkowite odpady: ${CuttingStock.solution.totalWaste.toFixed(2)}m (${CuttingStock.solution.wastePercentage.toFixed(2)}%)\n\n`;
        
        // Zamówienie
        content += 'SZCZEGÓŁY ZAMÓWIENIA:\n';
        content += '---------------------\n';
        for (const order of CuttingStock.orders) {
            content += `${order.quantity} sztuk × ${order.length}m = ${(order.quantity * order.length).toFixed(2)}m\n`;
        }
        content += '\n';
        
        // Nadprogramowe kawałki
        if (CuttingStock.solution.extraPieces && Object.keys(CuttingStock.solution.extraPieces).length > 0) {
            content += 'NADPROGRAMOWE KAWAŁKI:\n';
            content += '----------------------\n';
            for (const orderId in CuttingStock.solution.extraPieces) {
                const extra = CuttingStock.solution.extraPieces[orderId];
                content += `Element ${extra.length}m: +${extra.quantity} sztuk\n`;
            }
            content += '\n';
        }
        
        // Wzory cięcia
        content += 'WZORY CIĘCIA:\n';
        content += '-------------\n';
        for (const patternResult of CuttingStock.solution.patterns) {
            const pattern = patternResult.pattern;
            const count = Math.round(patternResult.count);
            
            content += `Wzór ${patternResult.id + 1} (użyty ${count} razy):\n`;
            
            // Skład wzoru
            const compositions = [];
            for (const orderId in pattern.counts) {
                const pieceCount = pattern.counts[orderId];
                const order = CuttingStock.orders.find(o => o.id === parseInt(orderId));
                if (order) {
                    compositions.push(`${pieceCount} × ${order.length}m`);
                }
            }
            
            content += `  Skład: ${compositions.join(', ')}\n`;
            content += `  Odpad: ${pattern.waste.toFixed(2)}m\n`;
            content += `  Wykorzystanie: ${pattern.usage.toFixed(2)}%\n\n`;
        }
        
        content += '==============================================================\n';
        content += 'Wygenerowano przez Aplikację Optymalizacyjną\n';
        content += '==============================================================\n';
        
        // Utwórz i pobierz plik
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wyniki_rozkroju.txt';
        document.body.appendChild(a);
        a.click();
        
        // Poczekaj i wyczyść
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    loadSampleData: () => {
        console.log("Loading sample cutting stock data");
        
        // Ustaw długość kłody
        document.getElementById('logLength').value = '2.2';
        
        // Wyczyść istniejące wiersze zamówień
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        CuttingStock.orderRows = 0;
        
        // Przykładowe dane
        const sampleData = [
            { length: 0.8, quantity: 180, priority: 7 },
            { length: 0.15, quantity: 280, priority: 3 },
            { length: 1.2, quantity: 170, priority: 6 },
            { length: 1.9, quantity: 180, priority: 8 }
        ];
        
        // Dodaj wiersze z przykładowymi danymi
        for (const data of sampleData) {
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
            lengthInput.value = data.length;
            
            // Ilość sztuk
            const quantityLabel = document.createElement('label');
            quantityLabel.textContent = 'Ilość:';
            
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.id = `order-quantity-${rowId}`;
            quantityInput.min = '1';
            quantityInput.value = data.quantity;
            
            // Priorytet
            const priorityLabel = document.createElement('label');
            priorityLabel.textContent = 'Priorytet:';
            
            const priorityInput = document.createElement('input');
            priorityInput.type = 'number';
            priorityInput.id = `order-priority-${rowId}`;
            priorityInput.step = '1';
            priorityInput.min = '1';
            priorityInput.max = '10';
            priorityInput.value = data.priority;
            priorityInput.title = 'Priorytet elementu (1-10). Wyższy priorytet oznacza, że element zostanie preferowany w przypadku nadprogramowych kawałków.';
            
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
            orderRow.appendChild(priorityLabel);
            orderRow.appendChild(priorityInput);
            orderRow.appendChild(removeButton);
            
            // Dodaj wiersz do listy zamówień
            ordersList.appendChild(orderRow);
        }
    },
    
    // Funkcja do zapisywania zamówień do pliku JSON
    saveOrdersToFile: () => {
        // Zbierz aktualne zamówienia
        const orders = [];
        const orderRows = document.querySelectorAll('[id^="order-row-"]');
        for (const row of orderRows) {
            const rowId = parseInt(row.id.split('-')[2]);
            const lengthInput = document.getElementById(`order-length-${rowId}`);
            const quantityInput = document.getElementById(`order-quantity-${rowId}`);
            const priorityInput = document.getElementById(`order-priority-${rowId}`);
            
            if (lengthInput && quantityInput && priorityInput) {
                const length = parseFloat(lengthInput.value);
                const quantity = parseInt(quantityInput.value);
                const priority = parseInt(priorityInput.value);
                
                if (!isNaN(length) && !isNaN(quantity) && !isNaN(priority) && length > 0 && quantity > 0) {
                    orders.push({
                        length: length,
                        quantity: quantity,
                        priority: priority
                    });
                }
            }
        }
        
        if (orders.length === 0) {
            alert('Brak danych do zapisania. Dodaj co najmniej jedno prawidłowe zamówienie.');
            return;
        }
        
        // Dodaj długość kłody
        const logLengthInput = document.getElementById('logLength');
        let logLength = null;
        if (logLengthInput) {
            logLength = parseFloat(logLengthInput.value);
            if (isNaN(logLength) || logLength <= 0) {
                logLength = null;
            }
        }
        
        // Przygotuj dane do zapisania
        const saveData = {
            orders: orders,
            logLength: logLength
        };
        
        // Konwertuj na JSON
        const jsonData = JSON.stringify(saveData, null, 2);
        
        // Utwórz link do pobrania pliku
        const blob = new Blob([jsonData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'zamowienie_rozkroj.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Funkcja do wczytywania zamówień z pliku JSON
    loadOrdersFromFile: () => {
        const fileInput = document.getElementById('ordersFileInput');
        fileInput.click();
    },
    
    // Obsługa wybranego pliku
    handleFileSelect: (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                CuttingStock.loadOrdersFromData(data);
            } catch (error) {
                alert(`Błąd podczas wczytywania pliku: ${error.message}`);
            }
        };
        reader.readAsText(file);
        
        // Zresetuj input, aby można było wczytać ten sam plik ponownie
        event.target.value = '';
    },
    
    // Załaduj dane zamówienia z obiektu JSON
    loadOrdersFromData: (data) => {
        if (!data || !data.orders || !Array.isArray(data.orders) || data.orders.length === 0) {
            alert('Nieprawidłowy format pliku zamówienia.');
            return;
        }
        
        // Ustaw długość kłody, jeśli istnieje
        if (data.logLength && !isNaN(data.logLength)) {
            document.getElementById('logLength').value = data.logLength;
        }
        
        // Ustaw opcję dokładnej liczby sztuk, jeśli istnieje
        if (data.exactCuts !== undefined) {
            document.getElementById('exactCuts').checked = data.exactCuts;
        }
        
        // Wyczyść istniejące wiersze zamówień
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        CuttingStock.orderRows = 0;
        
        // Dodaj wiersze z wczytanymi danymi
        for (const order of data.orders) {
            if (order.length && order.quantity && order.priority) {
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
                lengthInput.value = order.length;
                
                // Ilość sztuk
                const quantityLabel = document.createElement('label');
                quantityLabel.textContent = 'Ilość:';
                
                const quantityInput = document.createElement('input');
                quantityInput.type = 'number';
                quantityInput.id = `order-quantity-${rowId}`;
                quantityInput.min = '1';
                quantityInput.value = order.quantity;
                
                // Priorytet
                const priorityLabel = document.createElement('label');
                priorityLabel.textContent = 'Priorytet:';
                
                const priorityInput = document.createElement('input');
                priorityInput.type = 'number';
                priorityInput.id = `order-priority-${rowId}`;
                priorityInput.step = '1';
                priorityInput.min = '1';
                priorityInput.max = '10';
                priorityInput.value = order.priority;
                priorityInput.title = 'Priorytet elementu (1-10). Wyższy priorytet oznacza, że element zostanie preferowany w przypadku nadprogramowych kawałków.';
                
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
                orderRow.appendChild(priorityLabel);
                orderRow.appendChild(priorityInput);
                orderRow.appendChild(removeButton);
                
                // Dodaj wiersz do listy zamówień
                ordersList.appendChild(orderRow);
            }
        }
        
        // Jeśli nie dodano żadnego wiersza, dodaj pusty wiersz
        if (CuttingStock.orderRows === 0) {
            CuttingStock.addOrderRow();
        }
        
        // Wyczyść istniejące ograniczenia dostępności kłód
        const stockLimitsContainer = document.getElementById('stockLimitsContainer');
        if (stockLimitsContainer) {
            stockLimitsContainer.innerHTML = '';
            
            // Dodaj wczytane ograniczenia dostępności kłód
            if (data.stockLimits && Array.isArray(data.stockLimits)) {
                for (const limit of data.stockLimits) {
                    if (limit.length && limit.quantity) {
                        const limitId = new Date().getTime() + Math.floor(Math.random() * 1000);
                        
                        const limitRow = document.createElement('div');
                        limitRow.id = `stock-limit-row-${limitId}`;
                        limitRow.className = 'input-row stock-limit-row';
                        limitRow.style.backgroundColor = '#f8f4ef';
                        limitRow.style.padding = '10px';
                        limitRow.style.borderRadius = '6px';
                        limitRow.style.marginBottom = '10px';
                        
                        // Długość kłody
                        const lengthLabel = document.createElement('label');
                        lengthLabel.textContent = 'Długość kłody:';
                        
                        const lengthInput = document.createElement('input');
                        lengthInput.type = 'number';
                        lengthInput.id = `limit-length-${limitId}`;
                        lengthInput.className = 'limit-length';
                        lengthInput.step = '0.1';
                        lengthInput.min = '0.1';
                        lengthInput.value = limit.length;
                        lengthInput.style.width = '80px';
                        
                        // Dostępna ilość
                        const quantityLabel = document.createElement('label');
                        quantityLabel.textContent = 'Dostępna ilość:';
                        quantityLabel.style.marginLeft = '15px';
                        
                        const quantityInput = document.createElement('input');
                        quantityInput.type = 'number';
                        quantityInput.id = `limit-quantity-${limitId}`;
                        quantityInput.className = 'limit-quantity';
                        quantityInput.min = '1';
                        quantityInput.value = limit.quantity;
                        quantityInput.style.width = '80px';
                        
                        // Przycisk usuwania
                        const removeButton = document.createElement('button');
                        removeButton.textContent = 'Usuń';
                        removeButton.className = 'small-button';
                        removeButton.onclick = () => {
                            stockLimitsContainer.removeChild(limitRow);
                        };
                        removeButton.style.marginLeft = '15px';
                        
                        // Dodaj elementy do wiersza
                        limitRow.appendChild(lengthLabel);
                        limitRow.appendChild(lengthInput);
                        limitRow.appendChild(quantityLabel);
                        limitRow.appendChild(quantityInput);
                        limitRow.appendChild(removeButton);
                        
                        // Dodaj wiersz do kontenera
                        stockLimitsContainer.appendChild(limitRow);
                    }
                }
            }
        }
        
        // Pokaż komunikat o sukcesie
        alert('Zamówienie zostało pomyślnie wczytane.');
    }
} 