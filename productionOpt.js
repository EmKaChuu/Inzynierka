// Moduł ProductionOpt - Optymalizacja produkcji
const ProductionOpt = {
    numVars: 2,
    productNames: [],
    constraints: [],
    solution: null,
    
    init: () => {
        console.log("Executing ProductionOpt.init()");
        
        // Domyślne wartości
        ProductionOpt.numVars = 2;
        ProductionOpt.productNames = ['Produkt A', 'Produkt B'];
        ProductionOpt.constraints = [];
        
        // Wyczyść poprzednie wyniki
        Utils.clearElement('productionOptResults');
        Utils.clearElement('productionOptVisualization');
        Utils.hideElement('productionOptSummary');
        
        // Przygotuj interfejs
        document.getElementById('numVars').value = ProductionOpt.numVars;
        document.getElementById('productNames').value = ProductionOpt.productNames.join(', ');
        
        // Utwórz formularz funkcji celu
        ProductionOpt.updateObjectiveFunction();
        
        // Wyczyść ograniczenia
        document.getElementById('constraints').innerHTML = '';
    },
    
    updateObjectiveFunction: () => {
        const numVars = parseInt(document.getElementById('numVars').value);
        
        if (isNaN(numVars) || numVars < 1 || numVars > 10) {
            Utils.displayError('Liczba zmiennych musi być między 1 a 10.');
            return;
        }
        
        ProductionOpt.numVars = numVars;
        
        // Dopasuj listę nazw produktów
        while (ProductionOpt.productNames.length < numVars) {
            ProductionOpt.productNames.push(`Produkt ${String.fromCharCode(65 + ProductionOpt.productNames.length)}`);
        }
        if (ProductionOpt.productNames.length > numVars) {
            ProductionOpt.productNames = ProductionOpt.productNames.slice(0, numVars);
        }
        
        // Aktualizuj pole z nazwami produktów
        document.getElementById('productNames').value = ProductionOpt.productNames.join(', ');
        
        // Wygeneruj formularz funkcji celu
        const container = document.getElementById('objectiveFunction');
        container.innerHTML = '';
        
        const objFunction = document.createElement('div');
        objFunction.className = 'objective-function-container';
        
        // Dodaj zmienne do funkcji celu
        for (let i = 0; i < numVars; i++) {
            // Container dla współczynnika i zmiennej
            const termContainer = document.createElement('div');
            termContainer.className = 'obj-term';
            
            // Input dla współczynnika
            const coefInput = document.createElement('input');
            coefInput.type = 'number';
            coefInput.id = `obj-coef-${i}`;
            coefInput.className = 'obj-coefficient';
            coefInput.value = '1';
            coefInput.step = '0.1';
            
            // Label dla zmiennej
            const varLabel = document.createElement('span');
            varLabel.className = 'obj-variable';
            varLabel.textContent = ProductionOpt.productNames[i];
            
            // Operator "+" między zmiennymi (oprócz ostatniej)
            const plusOperator = document.createElement('span');
            plusOperator.className = 'obj-operator';
            plusOperator.textContent = i < numVars - 1 ? ' + ' : '';
            
            termContainer.appendChild(coefInput);
            termContainer.appendChild(varLabel);
            termContainer.appendChild(plusOperator);
            
            objFunction.appendChild(termContainer);
        }
        
        container.appendChild(objFunction);
        
        // Wyczyść istniejące ograniczenia, ponieważ zmieniła się liczba zmiennych
        ProductionOpt.constraints = [];
        document.getElementById('constraints').innerHTML = '';
    },
    
    applyProductNames: () => {
        const namesInput = document.getElementById('productNames').value;
        const names = namesInput.split(',').map(name => name.trim());
        
        if (names.length < ProductionOpt.numVars) {
            Utils.displayError(`Podaj co najmniej ${ProductionOpt.numVars} nazw produktów oddzielonych przecinkami.`);
            return;
        }
        
        // Aktualizuj nazwy produktów
        ProductionOpt.productNames = names.slice(0, ProductionOpt.numVars);
        
        // Zaktualizuj etykiety w funkcji celu
        for (let i = 0; i < ProductionOpt.numVars; i++) {
            const varLabels = document.querySelectorAll('.obj-variable');
            if (varLabels[i]) {
                varLabels[i].textContent = ProductionOpt.productNames[i];
            }
        }
        
        // Zaktualizuj istniejące ograniczenia
        const constraints = document.querySelectorAll('.constraint-container');
        for (const constraint of constraints) {
            const inputs = constraint.querySelectorAll('input[id^="constraint-coef-"]');
            const labels = constraint.querySelectorAll('.constraint-var-label');
            
            for (let i = 0; i < inputs.length && i < ProductionOpt.numVars; i++) {
                if (labels[i]) {
                    labels[i].textContent = ProductionOpt.productNames[i];
                }
            }
        }
    },
    
    addConstraint: () => {
        const constraintsContainer = document.getElementById('constraints');
        const constraintId = ProductionOpt.constraints.length;
        
        // Utwórz nowy kontener dla ograniczenia
        const constraintContainer = document.createElement('div');
        constraintContainer.className = 'constraint-container';
        constraintContainer.id = `constraint-${constraintId}`;
        
        // Nagłówek ograniczenia z przyciskiem usuwania
        const constraintHeader = document.createElement('div');
        constraintHeader.className = 'constraint-header';
        
        const constraintTitle = document.createElement('span');
        constraintTitle.textContent = `Ograniczenie ${constraintId + 1}`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'small-button';
        removeButton.textContent = 'Usuń';
        removeButton.onclick = () => ProductionOpt.removeConstraint(constraintId);
        
        constraintHeader.appendChild(constraintTitle);
        constraintHeader.appendChild(removeButton);
        constraintContainer.appendChild(constraintHeader);
        
        // Opis ograniczenia
        const constraintInputRow = document.createElement('div');
        constraintInputRow.className = 'constraint-inputs';
        constraintInputRow.style.display = 'flex';
        constraintInputRow.style.alignItems = 'center';
        constraintInputRow.style.flexWrap = 'wrap';
        constraintInputRow.style.gap = '10px';
        
        // Dodaj współczynniki dla każdej zmiennej
        for (let i = 0; i < ProductionOpt.numVars; i++) {
            const termContainer = document.createElement('div');
            termContainer.style.display = 'flex';
            termContainer.style.alignItems = 'center';
            
            const coefInput = document.createElement('input');
            coefInput.type = 'number';
            coefInput.className = 'constraint-input';
            coefInput.id = `constraint-coef-${constraintId}-${i}`;
            coefInput.value = '1';
            coefInput.step = '0.1';
            coefInput.style.width = '70px';
            
            const varLabel = document.createElement('span');
            varLabel.className = 'constraint-var-label';
            varLabel.textContent = ProductionOpt.productNames[i];
            varLabel.style.marginLeft = '5px';
            
            // Operator "+" między zmiennymi (oprócz ostatniej)
            const plusOperator = document.createElement('span');
            plusOperator.className = 'constraint-operator';
            plusOperator.textContent = i < ProductionOpt.numVars - 1 ? ' + ' : '';
            plusOperator.style.margin = '0 5px';
            
            termContainer.appendChild(coefInput);
            termContainer.appendChild(varLabel);
            termContainer.appendChild(plusOperator);
            
            constraintInputRow.appendChild(termContainer);
        }
        
        // Dodaj operator porównania
        const operatorSelect = document.createElement('select');
        operatorSelect.className = 'constraint-operator-select';
        operatorSelect.id = `constraint-operator-${constraintId}`;
        
        const operators = ['<=', '=', '>='];
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            option.textContent = op;
            operatorSelect.appendChild(option);
        });
        
        // Dodaj prawą stronę nierówności
        const rhsInput = document.createElement('input');
        rhsInput.type = 'number';
        rhsInput.className = 'constraint-rhs';
        rhsInput.id = `constraint-rhs-${constraintId}`;
        rhsInput.value = '10';
        rhsInput.step = '0.1';
        rhsInput.style.width = '100px';
        
        // Dodaj pole opisu ograniczenia
        const descriptionInput = document.createElement('input');
        descriptionInput.type = 'text';
        descriptionInput.className = 'constraint-description';
        descriptionInput.id = `constraint-description-${constraintId}`;
        descriptionInput.placeholder = 'Opis ograniczenia (opcjonalnie)';
        descriptionInput.style.width = '100%';
        descriptionInput.style.marginTop = '10px';
        
        constraintInputRow.appendChild(operatorSelect);
        constraintInputRow.appendChild(rhsInput);
        constraintContainer.appendChild(constraintInputRow);
        constraintContainer.appendChild(descriptionInput);
        
        // Dodaj ograniczenie do kontenera
        constraintsContainer.appendChild(constraintContainer);
        
        // Zapisz nowe ograniczenie
        ProductionOpt.constraints.push({
            id: constraintId,
            active: true
        });
    },
    
    removeConstraint: (constraintId) => {
        // Usuń kontener ograniczenia z DOM
        const constraintContainer = document.getElementById(`constraint-${constraintId}`);
        if (constraintContainer) {
            constraintContainer.parentNode.removeChild(constraintContainer);
        }
        
        // Oznacz ograniczenie jako nieaktywne
        const constraint = ProductionOpt.constraints.find(c => c.id === constraintId);
        if (constraint) {
            constraint.active = false;
        }
        
        // Przenumeruj pozostałe aktywne ograniczenia
        let activeIndex = 1;
        for (const constraint of ProductionOpt.constraints) {
            if (constraint.active) {
                const header = document.querySelector(`#constraint-${constraint.id} .constraint-header span`);
                if (header) {
                    header.textContent = `Ograniczenie ${activeIndex++}`;
                }
            }
        }
    },
    
    calculate: () => {
        try {
            // Wyczyść poprzednie wyniki
            Utils.clearElement('productionOptResults');
            Utils.clearElement('productionOptVisualization');
            Utils.hideElement('productionOptSummary');
            
            // Pobierz typ optymalizacji
            const optimizationType = document.getElementById('optimizationType').value;
            
            // Utwórz model optymalizacji
            const model = {
                optimize: 'objective',
                opType: optimizationType,
                constraints: {},
                variables: {}
            };
            
            // Dodaj zmienne do modelu
            for (let i = 0; i < ProductionOpt.numVars; i++) {
                const varName = `x${i}`;
                model.variables[varName] = {
                    objective: parseFloat(document.getElementById(`obj-coef-${i}`).value) || 0
                };
                
                // Dodaj ograniczenie nieujemności
                model.variables[varName][`nonNegative_${i}`] = 1;
                model.constraints[`nonNegative_${i}`] = { min: 0 };
            }
            
            // Dodaj ograniczenia z formularza
            let constraintIndex = 0;
            
            for (const constraint of ProductionOpt.constraints) {
                if (!constraint.active) continue;
                
                const constraintKey = `constraint_${constraintIndex++}`;
                const operator = document.getElementById(`constraint-operator-${constraint.id}`).value;
                const rhsValue = parseFloat(document.getElementById(`constraint-rhs-${constraint.id}`).value) || 0;
                
                // Pobierz opis ograniczenia
                const description = document.getElementById(`constraint-description-${constraint.id}`).value || constraintKey;
                
                // W zależności od operatora, ustaw min/max/equal
                if (operator === '<=') {
                    model.constraints[constraintKey] = { max: rhsValue };
                } else if (operator === '>=') {
                    model.constraints[constraintKey] = { min: rhsValue };
                } else if (operator === '=') {
                    model.constraints[constraintKey] = { equal: rhsValue };
                }
                
                // Dodaj współczynniki dla każdej zmiennej
                for (let i = 0; i < ProductionOpt.numVars; i++) {
                    const coef = parseFloat(document.getElementById(`constraint-coef-${constraint.id}-${i}`).value) || 0;
                    if (coef !== 0) {
                        model.variables[`x${i}`][constraintKey] = coef;
                    }
                }
                
                // Zapisz opis ograniczenia
                model.constraints[constraintKey].description = description;
            }
            
            console.log("Optimization model:", model);
            
            // Rozwiąż problem
            const solution = solver.Solve(model);
            console.log("Solution:", solution);
            
            ProductionOpt.solution = {
                model: model,
                result: solution,
                optimizationType: optimizationType
            };
            
            // Wyświetl wyniki
            ProductionOpt.displayResults();
            
            // Wizualizuj wyniki
            ProductionOpt.visualizeResults();
            
        } catch (error) {
            console.error("Error during optimization:", error);
            Utils.displayResults('productionOptResults', `Błąd w trakcie optymalizacji: ${error.message}`, true);
        }
    },
    
    displayResults: () => {
        if (!ProductionOpt.solution) {
            return;
        }
        
        const solution = ProductionOpt.solution.result;
        const model = ProductionOpt.solution.model;
        const optimizationType = ProductionOpt.solution.optimizationType;
        
        // Pokaż podsumowanie
        const summaryContainer = document.getElementById('productionOptSummary');
        const summaryContent = document.getElementById('productionOptSummaryContent');
        
        summaryContainer.style.display = 'block';
        
        // Sprawdź, czy znaleziono rozwiązanie
        if (!solution.feasible) {
            summaryContent.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <div class="error-content">
                        <h4>Brak rozwiązania wykonalnego</h4>
                        <p>Nie znaleziono rozwiązania spełniającego wszystkie ograniczenia. 
                        Spróbuj zmodyfikować ograniczenia lub funkcję celu.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Podsumowanie wyników
        const optType = optimizationType === 'max' ? 'maksymalizacji' : 'minimalizacji';
        const resultType = optimizationType === 'max' ? 'Maksymalny zysk' : 'Minimalny koszt';
        
        let summaryHtml = `
            <p><strong>Status:</strong> Znaleziono rozwiązanie optymalne</p>
            <p><strong>${resultType}:</strong> ${solution.result.toFixed(2)}</p>
            <p><strong>Optymalne ilości produkcji:</strong></p>
            <ul>
        `;
        
        for (let i = 0; i < ProductionOpt.numVars; i++) {
            const varName = `x${i}`;
            const value = solution[varName] || 0;
            summaryHtml += `<li>${ProductionOpt.productNames[i]}: ${value.toFixed(2)}</li>`;
        }
        
        summaryHtml += `</ul>`;
        
        summaryContent.innerHTML = summaryHtml;
        
        // Szczegółowe wyniki
        const resultsContainer = document.getElementById('productionOptResults');
        resultsContainer.innerHTML = '';
        
        // Tabela wyników
        const resultsTable = document.createElement('table');
        resultsTable.className = 'optimization-results-table';
        
        // Nagłówek tabeli
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Zmienna</th>
            <th>Nazwa</th>
            <th>Wartość</th>
            <th>Współczynnik w funkcji celu</th>
            <th>Wkład do wyniku</th>
        `;
        resultsTable.appendChild(headerRow);
        
        // Wiersze tabeli z wynikami
        for (let i = 0; i < ProductionOpt.numVars; i++) {
            const varName = `x${i}`;
            const value = solution[varName] || 0;
            const objective = model.variables[varName].objective || 0;
            const contribution = value * objective;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${varName}</td>
                <td>${ProductionOpt.productNames[i]}</td>
                <td class="optimal-value">${value.toFixed(2)}</td>
                <td>${objective.toFixed(2)}</td>
                <td>${contribution.toFixed(2)}</td>
            `;
            resultsTable.appendChild(row);
        }
        
        // Podsumowanie wyniku
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="4" style="text-align: right;"><strong>Wartość funkcji celu:</strong></td>
            <td class="optimal-value"><strong>${solution.result.toFixed(2)}</strong></td>
        `;
        resultsTable.appendChild(totalRow);
        
        resultsContainer.appendChild(resultsTable);
        
        // Tabela z ograniczeniami
        const constraintsHeader = document.createElement('h4');
        constraintsHeader.textContent = 'Wykorzystanie ograniczeń';
        constraintsHeader.style.marginTop = '20px';
        resultsContainer.appendChild(constraintsHeader);
        
        const constraintsTable = document.createElement('table');
        constraintsTable.className = 'optimization-results-table';
        
        // Nagłówek tabeli ograniczeń
        const constraintsHeaderRow = document.createElement('tr');
        constraintsHeaderRow.innerHTML = `
            <th>Ograniczenie</th>
            <th>Typ</th>
            <th>Wartość ograniczenia</th>
            <th>Wykorzystanie</th>
            <th>Status</th>
        `;
        constraintsTable.appendChild(constraintsHeaderRow);
        
        // Wiersze z ograniczeniami
        let constraintIndex = 0;
        
        for (const constraint of ProductionOpt.constraints) {
            if (!constraint.active) continue;
            
            const constraintKey = `constraint_${constraintIndex++}`;
            
            // Pobierz dane o ograniczeniu
            const constraintData = model.constraints[constraintKey];
            if (!constraintData) continue;
            
            let type = 'równość';
            let value = constraintData.equal;
            
            if (constraintData.min !== undefined && constraintData.max === undefined) {
                type = '≥';
                value = constraintData.min;
            } else if (constraintData.max !== undefined && constraintData.min === undefined) {
                type = '≤';
                value = constraintData.max;
            }
            
            // Oblicz wartość lewej strony ograniczenia
            let leftSideValue = 0;
            for (let i = 0; i < ProductionOpt.numVars; i++) {
                const varName = `x${i}`;
                const coef = model.variables[varName][constraintKey] || 0;
                const varValue = solution[varName] || 0;
                leftSideValue += coef * varValue;
            }
            
            // Określ status ograniczenia
            let status = 'nieaktywne';
            let utilization = 0;
            
            if (type === '≤') {
                utilization = (leftSideValue / value) * 100;
                if (Math.abs(leftSideValue - value) < 0.001) {
                    status = 'aktywne (wiążące)';
                }
            } else if (type === '≥') {
                utilization = (value > 0) ? (leftSideValue / value) * 100 : 0;
                if (Math.abs(leftSideValue - value) < 0.001) {
                    status = 'aktywne (wiążące)';
                }
            } else {
                utilization = 100;
                status = 'aktywne (równość)';
            }
            
            // Ograniczenie nazwy jeśli jest zbyt długa
            const description = constraintData.description || constraintKey;
            const shortDesc = description.length > 30 ? 
                description.substring(0, 27) + '...' : description;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td title="${description}">${shortDesc}</td>
                <td>${type}</td>
                <td>${value.toFixed(2)}</td>
                <td>${leftSideValue.toFixed(2)} (${utilization.toFixed(2)}%)</td>
                <td>${status}</td>
            `;
            constraintsTable.appendChild(row);
        }
        
        resultsContainer.appendChild(constraintsTable);
    },
    
    visualizeResults: () => {
        if (!ProductionOpt.solution || !ProductionOpt.solution.result.feasible) {
            return;
        }
        
        const solution = ProductionOpt.solution.result;
        const model = ProductionOpt.solution.model;
        const optimizationType = ProductionOpt.solution.optimizationType;
        
        const container = document.getElementById('productionOptVisualization');
        container.innerHTML = '';
        
        // Wykres słupkowy z wynikami
        const barData = [{
            x: ProductionOpt.productNames,
            y: Array.from({length: ProductionOpt.numVars}, (_, i) => solution[`x${i}`] || 0),
            type: 'bar',
            marker: {
                color: 'rgba(70, 130, 180, 0.7)',
                line: {
                    color: 'rgba(70, 130, 180, 1.0)',
                    width: 1
                }
            },
            text: Array.from({length: ProductionOpt.numVars}, (_, i) => (solution[`x${i}`] || 0).toFixed(2)),
            textposition: 'auto'
        }];
        
        const barLayout = {
            title: 'Optymalne ilości produkcji',
            xaxis: { title: 'Produkty' },
            yaxis: { title: 'Ilość' },
            margin: { t: 50, b: 80 }
        };
        
        Plotly.newPlot('productionOptVisualization', barData, barLayout, { responsive: true });
        
        // Dodaj drugi wykres z wkładem do wyniku
        const contributionContainer = document.createElement('div');
        contributionContainer.id = 'contributionChart';
        contributionContainer.style.height = '400px';
        contributionContainer.style.width = '100%';
        contributionContainer.style.marginTop = '30px';
        container.appendChild(contributionContainer);
        
        const contributionData = [];
        const productContributions = [];
        
        for (let i = 0; i < ProductionOpt.numVars; i++) {
            const varName = `x${i}`;
            const value = solution[varName] || 0;
            const objective = model.variables[varName].objective || 0;
            const contribution = value * objective;
            
            productContributions.push({
                product: ProductionOpt.productNames[i],
                contribution: contribution
            });
        }
        
        // Sortuj produkty według wkładu
        productContributions.sort((a, b) => b.contribution - a.contribution);
        
        const contributionX = productContributions.map(p => p.product);
        const contributionY = productContributions.map(p => p.contribution);
        
        contributionData.push({
            x: contributionX,
            y: contributionY,
            type: 'bar',
            marker: {
                color: 'rgba(46, 139, 87, 0.7)',
                line: {
                    color: 'rgba(46, 139, 87, 1.0)',
                    width: 1
                }
            },
            text: contributionY.map(c => c.toFixed(2)),
            textposition: 'auto'
        });
        
        const contributionTitle = optimizationType === 'max' ? 
            'Wkład do całkowitego zysku' : 'Udział w całkowitym koszcie';
        
        const contributionLayout = {
            title: contributionTitle,
            xaxis: { title: 'Produkty' },
            yaxis: { title: optimizationType === 'max' ? 'Zysk' : 'Koszt' },
            margin: { t: 50, b: 80 }
        };
        
        Plotly.newPlot('contributionChart', contributionData, contributionLayout, { responsive: true });
        
        // Wykres wykorzystania ograniczeń
        const constraintsContainer = document.createElement('div');
        constraintsContainer.id = 'constraintsChart';
        constraintsContainer.style.height = '400px';
        constraintsContainer.style.width = '100%';
        constraintsContainer.style.marginTop = '30px';
        container.appendChild(constraintsContainer);
        
        const constraintData = [];
        const constraintNames = [];
        const constraintUtilizations = [];
        
        let constraintIndex = 0;
        
        for (const constraint of ProductionOpt.constraints) {
            if (!constraint.active) continue;
            
            const constraintKey = `constraint_${constraintIndex++}`;
            
            // Pobierz dane o ograniczeniu
            const constraintData = model.constraints[constraintKey];
            if (!constraintData) continue;
            
            let type = 'równość';
            let value = constraintData.equal;
            
            if (constraintData.min !== undefined && constraintData.max === undefined) {
                type = '≥';
                value = constraintData.min;
            } else if (constraintData.max !== undefined && constraintData.min === undefined) {
                type = '≤';
                value = constraintData.max;
            }
            
            // Oblicz wartość lewej strony ograniczenia
            let leftSideValue = 0;
            for (let i = 0; i < ProductionOpt.numVars; i++) {
                const varName = `x${i}`;
                const coef = model.variables[varName][constraintKey] || 0;
                const varValue = solution[varName] || 0;
                leftSideValue += coef * varValue;
            }
            
            // Oblicz wykorzystanie ograniczenia
            let utilization = 0;
            if (type === '≤') {
                utilization = (leftSideValue / value) * 100;
            } else if (type === '≥') {
                utilization = (value > 0) ? (leftSideValue / value) * 100 : 100;
            } else {
                utilization = 100;
            }
            
            // Ogranicz wykorzystanie do 100% dla wizualizacji
            utilization = Math.min(utilization, 100);
            
            // Użyj opisu ograniczenia lub domyślnej nazwy
            const description = constraintData.description || constraintKey;
            constraintNames.push(description);
            constraintUtilizations.push(utilization);
        }
        
        constraintData.push({
            x: constraintUtilizations,
            y: constraintNames,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: constraintUtilizations.map(u => 
                    u >= 99.9 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(70, 130, 180, 0.7)'
                ),
                line: {
                    color: constraintUtilizations.map(u => 
                        u >= 99.9 ? 'rgba(220, 53, 69, 1.0)' : 'rgba(70, 130, 180, 1.0)'
                    ),
                    width: 1
                }
            },
            text: constraintUtilizations.map(u => u.toFixed(2) + '%'),
            textposition: 'auto'
        });
        
        const constraintLayout = {
            title: 'Wykorzystanie ograniczeń',
            xaxis: { 
                title: 'Wykorzystanie (%)',
                range: [0, 100]
            },
            yaxis: { 
                title: 'Ograniczenia',
                automargin: true
            },
            margin: { t: 50, r: 20, b: 80, l: 200 }
        };
        
        Plotly.newPlot('constraintsChart', constraintData, constraintLayout, { responsive: true });
        
        // Wyemituj zdarzenie po zakończeniu wizualizacji
        document.dispatchEvent(new Event('calculation-complete'));
    }
}; 