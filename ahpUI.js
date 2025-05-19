// Moduł AHP - Funkcje Interfejsu Użytkownika
// Ten plik będzie zawierał funkcje odpowiedzialne za generowanie
// i zarządzanie interfejsem użytkownika modułu AHP.

// Globalny obiekt AHP jest zdefiniowany w ahp.js i tutaj jest rozszerzany.

AHP.createSimplifiedInterface = () => {
    Logger.log("[AHP DEBUG] Creating simplified interface for AHP"); 

    Logger.log("Current options: numCriteria =", AHP.numCriteria, "numOptions =", AHP.numOptions);
    Logger.log("Criteria names:", AHP.criteriaNames);
    Logger.log("Option names:", AHP.optionNames);
    
    const criteriaContainer = document.getElementById('ahpCriteriaComparisonMatrix');
    criteriaContainer.innerHTML = '';
    
    const criteriaHeader = document.createElement('h3');
    criteriaHeader.textContent = 'Porównanie ważności kryteriów';
    criteriaContainer.appendChild(criteriaHeader);
    
    const criteriaDescription = document.createElement('p');
    criteriaDescription.className = 'comparison-description';
    criteriaDescription.textContent = 'Zaznacz, które kryterium jest ważniejsze i w jakim stopniu:';
    criteriaContainer.appendChild(criteriaDescription);
    
    if (!AHP.criteriaComparisonMatrix || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
        Logger.log("Initializing criteria comparison matrix in createSimplifiedInterface"); 
        AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
    }
    
    for (let i = 0; i < AHP.numCriteria; i++) {
        for (let j = i + 1; j < AHP.numCriteria; j++) {
            const comparisonRow = document.createElement('div');
            comparisonRow.className = 'simplified-comparison-row';
            
            const leftCriterion = document.createElement('div');
            leftCriterion.className = 'criterion left-criterion';
            leftCriterion.textContent = AHP.criteriaNames[i];
            
            const scaleContainer = document.createElement('div');
            scaleContainer.className = 'scale-container';
            
            const scaleLabels = document.createElement('div');
            scaleLabels.className = 'scale-labels';
            scaleLabels.innerHTML = '<span>9</span><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
            
            const scaleOptions = document.createElement('div');
            scaleOptions.className = 'scale-options';
            
            const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
            
            for (let k = 0; k < values.length; k++) {
                const option = document.createElement('input');
                option.type = 'radio';
                option.name = `criteria-comp-${i}-${j}`;
                option.id = `criteria-comp-${i}-${j}-${k}`;
                option.value = values[k];
                option.setAttribute('data-i', i);
                option.setAttribute('data-j', j);
                option.setAttribute('data-k', k);
                
                const currentValue = AHP.criteriaComparisonMatrix[i][j];
                if ((k === 8 && currentValue === 1) || 
                    (k < 8 && Math.abs(values[k] - currentValue) < 0.001) || 
                    (k > 8 && Math.abs(values[k] - currentValue) < 0.001)) { 
                    option.checked = true;
                }
                
                option.onchange = () => {
                    const idx = parseInt(option.getAttribute('data-k'));
                    const value = values[idx];
                    AHP.updateSimplifiedComparisonValue(i, j, value);
                };
                
                scaleOptions.appendChild(option);
            }
            
            const rightCriterion = document.createElement('div');
            rightCriterion.className = 'criterion right-criterion';
            rightCriterion.textContent = AHP.criteriaNames[j];
            
            comparisonRow.appendChild(leftCriterion);
            scaleContainer.appendChild(scaleLabels);
            scaleContainer.appendChild(scaleOptions);
            comparisonRow.appendChild(scaleContainer);
            comparisonRow.appendChild(rightCriterion);
            criteriaContainer.appendChild(comparisonRow);
        }
    }
    
    const container = document.getElementById('ahpOptionsComparisonSection');
    container.innerHTML = '';
    
    const header = document.createElement('h3');
    header.textContent = 'Porównanie opcji w kontekście każdego kryterium';
    container.appendChild(header);
    
    const optionDescription = document.createElement('p');
    optionDescription.className = 'comparison-description';
    optionDescription.textContent = 'Zaznacz, która opcja jest lepsza i w jakim stopniu:';
    container.appendChild(optionDescription);
    
    if (!AHP.optionComparisonMatrices) {
        Logger.log("Initializing option comparison matrices from scratch in createSimplifiedInterface");
        AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
            Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
        );
    } else if (AHP.optionComparisonMatrices.length !== AHP.numCriteria) {
        Logger.log("Adjusting option comparison matrices size for criteria from", AHP.optionComparisonMatrices.length, "to", AHP.numCriteria, "in createSimplifiedInterface");
        const oldMatrices = [...AHP.optionComparisonMatrices];
        AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
            Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
        );
        for (let c = 0; c < Math.min(AHP.numCriteria, oldMatrices.length); c++) {
            if (oldMatrices[c]) {
                for (let i = 0; i < Math.min(AHP.numOptions, oldMatrices[c].length); i++) {
                    if (oldMatrices[c][i]) {
                        for (let j = 0; j < Math.min(AHP.numOptions, oldMatrices[c][i].length); j++) {
                            AHP.optionComparisonMatrices[c][i][j] = oldMatrices[c][i][j];
                        }
                    }
                }
            }
        }
    }
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-panels-container';
    
    for (let c = 0; c < AHP.numCriteria; c++) {
        const criteriaName = AHP.criteriaNames[c];
        const optionPanel = document.createElement('div');
        optionPanel.className = 'criterion-panel'; 
        
        const optionPanelHeader = document.createElement('h4');
        optionPanelHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
        optionPanel.appendChild(optionPanelHeader);
        
        if (!AHP.optionComparisonMatrices[c] || AHP.optionComparisonMatrices[c].length !== AHP.numOptions) {
            Logger.log(`Initializing option matrix for criterion ${c} in createSimplifiedInterface`);
            AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
        }
        
        for (let i = 0; i < AHP.numOptions; i++) {
            for (let j = i + 1; j < AHP.numOptions; j++) {
                const comparisonRow = document.createElement('div');
                comparisonRow.className = 'simplified-comparison-row';
                
                const leftOption = document.createElement('div');
                leftOption.className = 'criterion left-criterion'; 
                leftOption.textContent = AHP.optionNames[i];
                
                const scaleContainer = document.createElement('div');
                scaleContainer.className = 'scale-container';
                
                const scaleLabels = document.createElement('div');
                scaleLabels.className = 'scale-labels';
                scaleLabels.innerHTML = '<span>9</span><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
                
                const scaleOptions = document.createElement('div');
                scaleOptions.className = 'scale-options';
                
                const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
                
                for (let k = 0; k < values.length; k++) {
                    const option = document.createElement('input');
                    option.type = 'radio';
                    option.name = `options-comp-${c}-${i}-${j}`;
                    option.id = `options-comp-${c}-${i}-${j}-${k}`;
                    option.value = values[k];
                    option.setAttribute('data-c', c);
                    option.setAttribute('data-i', i);
                    option.setAttribute('data-j', j);
                    option.setAttribute('data-k', k);
                    
                    let currentValue = 1; 
                    if (AHP.optionComparisonMatrices && 
                        AHP.optionComparisonMatrices[c] && 
                        AHP.optionComparisonMatrices[c][i] && 
                        AHP.optionComparisonMatrices[c][i][j] !== undefined) {
                        currentValue = AHP.optionComparisonMatrices[c][i][j];
                    }
                    Logger.log(`[AHP DEBUG UI Simplified] For options c=${c}, i=${i}, j=${j}: Reading AHP.optionComparisonMatrices[${c}][${i}][${j}] = ${currentValue} to set radio button.`);
                    
                    if ((k === 8 && currentValue === 1) || 
                        (k < 8 && Math.abs(values[k] - currentValue) < 0.001) || 
                        (k > 8 && Math.abs(values[k] - currentValue) < 0.001)) { 
                        option.checked = true;
                    }
                    
                    option.onchange = () => {
                        const criterion = parseInt(option.getAttribute('data-c'));
                        const optI = parseInt(option.getAttribute('data-i'));
                        const optJ = parseInt(option.getAttribute('data-j'));
                        const idx = parseInt(option.getAttribute('data-k'));
                        const value = values[idx];
                        AHP.updateSimplifiedOptionComparisonValue(criterion, optI, optJ, value);
                    };
                    scaleOptions.appendChild(option);
                }
                
                const rightOption = document.createElement('div');
                rightOption.className = 'criterion right-criterion'; 
                rightOption.textContent = AHP.optionNames[j];
                
                comparisonRow.appendChild(leftOption);
                scaleContainer.appendChild(scaleLabels);
                scaleContainer.appendChild(scaleOptions);
                comparisonRow.appendChild(scaleContainer);
                comparisonRow.appendChild(rightOption);
                optionPanel.appendChild(comparisonRow);
            }
        }
        optionsContainer.appendChild(optionPanel);
    }
    container.appendChild(optionsContainer);
};

AHP.createCriteriaComparisonMatrix = () => {
    const container = document.getElementById('ahpCriteriaComparisonMatrix');
    container.innerHTML = '';
    
    const header = document.createElement('h3');
    header.textContent = 'Porównanie ważności kryteriów';
    container.appendChild(header);
    
    const table = document.createElement('table');
    table.className = 'comparison-matrix';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    
    for (let i = 0; i < AHP.numCriteria; i++) {
        const th = document.createElement('th');
        th.textContent = AHP.criteriaNames[i];
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    for (let i = 0; i < AHP.numCriteria; i++) {
        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = AHP.criteriaNames[i];
        row.appendChild(th);
        
        for (let j = 0; j < AHP.numCriteria; j++) {
            const td = document.createElement('td');
            if (i === j) {
                td.textContent = '1';
            } else if (i < j) {
                const select = document.createElement('select');
                select.id = `criteria-comp-${i}-${j}`;
                select.onchange = () => AHP.updateCriteriaComparisonValue(i, j);
                
                const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
                const labels = ["9", "8", "7", "6", "5", "4", "3", "2", "1", "1/2", "1/3", "1/4", "1/5", "1/6", "1/7", "1/8", "1/9"];
                
                for (let k = 0; k < values.length; k++) {
                    const option = document.createElement('option');
                    option.value = values[k];
                    option.textContent = labels[k];
                    if (values[k] === 1) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
                td.appendChild(select);
            } else {
                td.id = `criteria-comp-value-${i}-${j}`;
                td.textContent = '1';
            }
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
};

AHP.createMatrixOptionComparisons = () => {
    const container = document.getElementById('ahpOptionsComparisonSection');
    container.innerHTML = '';
    
    const header = document.createElement('h3');
    header.textContent = 'Porównanie opcji w kontekście każdego kryterium';
    container.appendChild(header);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-panels-container';
    
    for (let c = 0; c < AHP.numCriteria; c++) {
        const criteriaName = AHP.criteriaNames[c];
        const optionPanel = document.createElement('div');
        optionPanel.className = 'unified-panel option-panel';
        
        const criteriaHeader = document.createElement('h4');
        criteriaHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
        optionPanel.appendChild(criteriaHeader);
        
        const table = document.createElement('table');
        table.className = 'comparison-matrix';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th'));
        
        for (let o = 0; o < AHP.numOptions; o++) {
            const th = document.createElement('th');
            th.textContent = AHP.optionNames[o];
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        for (let i = 0; i < AHP.numOptions; i++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = AHP.optionNames[i];
            row.appendChild(th);
            
            for (let j = 0; j < AHP.numOptions; j++) {
                const td = document.createElement('td');
                if (i === j) {
                    td.textContent = '1';
                } else if (i < j) {
                    const select = document.createElement('select');
                    select.id = `options-comp-${c}-${i}-${j}`;
                    select.onchange = () => AHP.updateOptionComparisonValue(c, i, j);
                    
                    const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
                    const labels = ["9", "8", "7", "6", "5", "4", "3", "2", "1", "1/2", "1/3", "1/4", "1/5", "1/6", "1/7", "1/8", "1/9"];
                    
                    for (let k_loop = 0; k_loop < values.length; k_loop++) {
                        const option = document.createElement('option');
                        option.value = values[k_loop];
                        option.textContent = labels[k_loop];
                        
                        let matrixValue = 1; 
                        if (AHP.optionComparisonMatrices && AHP.optionComparisonMatrices[c] && 
                            AHP.optionComparisonMatrices[c][i] && AHP.optionComparisonMatrices[c][i][j] !== undefined) {
                            matrixValue = AHP.optionComparisonMatrices[c][i][j];
                        }
                        Logger.log(`[AHP DEBUG UI Matrix] For options c=${c}, i=${i}, j=${j}: Reading AHP.optionComparisonMatrices[${c}][${i}][${j}] = ${matrixValue} to set select option. Comparing with ${values[k_loop]}.`);

                        if (Math.abs(values[k_loop] - matrixValue) < 0.001) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    }
                    td.appendChild(select);
                } else {
                    td.id = `options-comp-value-${c}-${i}-${j}`;
                    td.textContent = (1 / AHP.optionComparisonMatrices[c][j][i]).toFixed(4);
                }
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        optionPanel.appendChild(table);
        optionsContainer.appendChild(optionPanel);
    }
    container.appendChild(optionsContainer);
};

AHP.clearCurrentInterface = () => {
    Utils.clearElement('ahpCriteriaComparisonMatrix');
    Utils.clearElement('ahpOptionsComparisonSection');
    Utils.hideElement('ahpResults');
    Utils.clearElement('ahpVisualization');
};

AHP.displayResults = () => {
    const container = document.getElementById('ahpResults');
    container.innerHTML = '';
    container.style.display = 'block';
    
    let bestOptionIndex = 0;
    for (let i = 1; i < AHP.numOptions; i++) {
        if (AHP.globalOptionWeights[i] > AHP.globalOptionWeights[bestOptionIndex]) {
            bestOptionIndex = i;
        }
    }
    
    const mainResult = document.createElement('div');
    mainResult.className = 'main-result';
    
    const resultTitle = document.createElement('h3');
    resultTitle.textContent = 'Wynik analizy AHP';
    mainResult.appendChild(resultTitle);
    
    const bestOptionDisplay = document.createElement('div');
    bestOptionDisplay.className = 'best-option-display';
    
    const bestOptionLabel = document.createElement('div');
    bestOptionLabel.className = 'best-option-label';
    bestOptionLabel.textContent = 'Najlepsza opcja:';
    
    const bestOptionName = document.createElement('div');
    bestOptionName.className = 'best-option-name';
    bestOptionName.textContent = AHP.optionNames[bestOptionIndex];
    
    const bestOptionScore = document.createElement('div');
    bestOptionScore.className = 'best-option-score';
    bestOptionScore.textContent = (AHP.globalOptionWeights[bestOptionIndex] * 100).toFixed(2) + '%';
    
    bestOptionDisplay.appendChild(bestOptionLabel);
    bestOptionDisplay.appendChild(bestOptionName);
    bestOptionDisplay.appendChild(bestOptionScore);
    
    mainResult.appendChild(bestOptionDisplay);
    container.appendChild(mainResult);
    
    const diagnosticsSection = document.createElement('div');
    diagnosticsSection.className = 'diagnostics-section';
    
    const diagnosticsTitle = document.createElement('h4');
    diagnosticsTitle.textContent = 'Diagnostyka spójności macierzy porównań';
    diagnosticsSection.appendChild(diagnosticsTitle);
    
    const criteriaResult = AHP.calculateEigenvector(AHP.criteriaComparisonMatrix);
    
    const diagnosticsInfo = document.createElement('div');
    diagnosticsInfo.className = 'diagnostics-info';
    
    let allConsistent = true;
    
    const criteriaCR = document.createElement('div');
    criteriaCR.className = criteriaResult.CR <= 0.1 ? 'cr-ok' : 'cr-warning';
    
    let criteriaStatusText = criteriaResult.CR <= 0.1 ? 
        `<strong>Kryteria:</strong> Spójne ✓` : 
        `<strong>Kryteria:</strong> Niespójne ⚠️`;
    
    criteriaCR.innerHTML = criteriaStatusText;
    
    if (criteriaResult.CR > 0.1) {
        allConsistent = false;
    }
    
    diagnosticsInfo.appendChild(criteriaCR);
    
    for (let c = 0; c < AHP.numCriteria; c++) {
        const optionMatrix = AHP.getMatrixFromInputs('options', c);
        const optionResult = AHP.calculateEigenvector(optionMatrix);
        
        const optionCR = document.createElement('div');
        optionCR.className = optionResult.CR <= 0.1 ? 'cr-ok' : 'cr-warning';
        
        let optionStatus = optionResult.CR <= 0.1 ? 
            `<strong>Opcje dla "${AHP.criteriaNames[c]}":</strong> Spójne ✓` : 
            `<strong>Opcje dla "${AHP.criteriaNames[c]}":</strong> Niespójne ⚠️`;
        
        optionCR.innerHTML = optionStatus;
        
        if (optionResult.CR > 0.1) {
            allConsistent = false;
        }
        
        diagnosticsInfo.appendChild(optionCR);
    }
    
    const overallConsistency = document.createElement('div');
    overallConsistency.className = allConsistent ? 'cr-ok' : 'cr-warning';
    overallConsistency.innerHTML = allConsistent ? 
        '<strong>Wszystkie macierze są spójne.</strong> Wyniki są wiarygodne.' : 
        '<strong>Niektóre macierze są niespójne.</strong> Wyniki mogą być mniej wiarygodne.';
    
    diagnosticsInfo.insertBefore(overallConsistency, diagnosticsInfo.firstChild);
    
    diagnosticsSection.appendChild(diagnosticsInfo);
    container.appendChild(diagnosticsSection);
    
    const criteriaWeights = document.createElement('div');
    criteriaWeights.className = 'results-table-container';
    
    const criteriaTitle = document.createElement('h4');
    criteriaTitle.textContent = 'Wagi kryteriów';
    criteriaWeights.appendChild(criteriaTitle);
    
    const criteriaTable = document.createElement('table');
    criteriaTable.className = 'results-table';
    
    const criteriaHeader = document.createElement('tr');
    criteriaHeader.innerHTML = '<th>Kryterium</th><th>Waga</th><th>Waga (%)</th>';
    criteriaTable.appendChild(criteriaHeader);
    
    for (let i = 0; i < AHP.numCriteria; i++) {
        const row = document.createElement('tr');
        const criteria = AHP.criteriaNames[i];
        const weight = AHP.criteriaPriorities[i];
        
        row.innerHTML = `<td>${criteria}</td>
                        <td>${weight.toFixed(4)}</td>
                        <td>${(weight * 100).toFixed(2)}%</td>`;
        criteriaTable.appendChild(row);
    }
    
    criteriaWeights.appendChild(criteriaTable);
    container.appendChild(criteriaWeights);
    
    const finalResults = document.createElement('div');
    finalResults.className = 'results-table-container final-results';
    
    const finalTitle = document.createElement('h4');
    finalTitle.textContent = 'Ranking opcji (wynik końcowy)';
    finalResults.appendChild(finalTitle);
    
    const finalTable = document.createElement('table');
    finalTable.className = 'results-table';
    
    const finalHeader = document.createElement('tr');
    finalHeader.innerHTML = '<th>Ranking</th><th>Opcja</th><th>Wynik</th><th>Wynik (%)</th>';
    finalTable.appendChild(finalHeader);
    
    const sortedIndices = Array.from({length: AHP.numOptions}, (_, i) => i)
        .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a]);
    
    for (let i = 0; i < sortedIndices.length; i++) {
        const optionIndex = sortedIndices[i];
        const row = document.createElement('tr');
        row.className = optionIndex === bestOptionIndex ? 'best-option' : '';
        
        const option = AHP.optionNames[optionIndex];
        const score = AHP.globalOptionWeights[optionIndex];
        
        row.innerHTML = `<td>${i+1}</td>
                        <td>${option}</td>
                        <td>${score.toFixed(4)}</td>
                        <td class="final-score">${(score * 100).toFixed(2)}%</td>`;
        finalTable.appendChild(row);
    }
    
    finalResults.appendChild(finalTable);
    container.appendChild(finalResults);
    
    const breakdownResults = document.createElement('div');
    breakdownResults.className = 'results-table-container';
    
    const breakdownTitle = document.createElement('h4');
    breakdownTitle.textContent = 'Rozbicie wyników według kryteriów';
    breakdownResults.appendChild(breakdownTitle);
    
    const breakdownTable = document.createElement('table');
    breakdownTable.className = 'results-table results-breakdown';
    
    const breakdownHeader = document.createElement('tr');
    breakdownHeader.innerHTML = '<th>Opcja</th>';
    
    for (let c = 0; c < AHP.numCriteria; c++) {
        breakdownHeader.innerHTML += `<th title="Waga: ${(AHP.criteriaPriorities[c] * 100).toFixed(2)}%">${AHP.criteriaNames[c]}</th>`;
    }
    
    breakdownHeader.innerHTML += '<th>Wynik całkowity</th>';
    breakdownTable.appendChild(breakdownHeader);
    
    for (let o = 0; o < AHP.numOptions; o++) {
        const row = document.createElement('tr');
        row.className = o === bestOptionIndex ? 'best-option' : '';
        
        row.innerHTML = `<td>${AHP.optionNames[o]}</td>`;
        
        for (let c = 0; c < AHP.numCriteria; c++) {
            const localScore = AHP.localOptionWeights[c][o];
            const weightedScore = localScore * AHP.criteriaPriorities[c];
            const isLocalBest = AHP.localOptionWeights[c].indexOf(Math.max(...AHP.localOptionWeights[c])) === o;
            
            const cellClass = isLocalBest ? 'best-option-local' : '';
            const cellTitle = `Wynik lokalny: ${(localScore * 100).toFixed(2)}%, Po zważeniu: ${(weightedScore * 100).toFixed(2)}%`;
            
            const cell = document.createElement('td');
            cell.className = cellClass;
            cell.title = cellTitle;
            cell.textContent = (weightedScore * 100).toFixed(2) + '%';
            
            row.appendChild(cell);
        }
        
        const finalScoreCell = document.createElement('td');
        finalScoreCell.className = 'final-score';
        finalScoreCell.textContent = (AHP.globalOptionWeights[o] * 100).toFixed(2) + '%';
        row.appendChild(finalScoreCell);
        
        breakdownTable.appendChild(row);
    }
    
    breakdownResults.appendChild(breakdownTable);
    
    const colorInfo = document.createElement('div');
    colorInfo.className = 'color-info';
    colorInfo.textContent = 'Intensywność niebieskiego koloru odzwierciedla wynik opcji w danym kryterium';
    breakdownResults.appendChild(colorInfo);
    
    container.appendChild(breakdownResults);
    
    const detailedSection = document.createElement('div');
    detailedSection.className = 'detailed-results';
    
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Pokaż szczegółowe dane obliczeniowe';
    toggleButton.className = 'toggle-details-button';
    toggleButton.onclick = () => {
        const details = document.getElementById('detailed-data');
        if (details.style.display === 'none') {
            details.style.display = 'block';
            toggleButton.textContent = 'Ukryj szczegółowe dane obliczeniowe';
        } else {
            details.style.display = 'none';
            toggleButton.textContent = 'Pokaż szczegółowe dane obliczeniowe';
        }
    };
    
    detailedSection.appendChild(toggleButton);
    
    const detailedData = document.createElement('div');
    detailedData.id = 'detailed-data';
    detailedData.style.display = 'none';
    
    let detailedDiagnosticsHTML = '<h4>Szczegółowe parametry spójności</h4>';
    detailedDiagnosticsHTML += '<table class="results-table">';
    detailedDiagnosticsHTML += `<tr>
        <th>Macierz</th>
        <th>λ<sub>max</sub></th>
        <th>CI</th>
        <th>RI</th>
        <th>CR</th>
        <th>Status</th>
    </tr>`;
    
    let criteriaStatus = criteriaResult.CR <= 0.1 ? 'Spójne ✓' : 'Niespójne ⚠️';
    detailedDiagnosticsHTML += `<tr>
        <td>Kryteria</td>
        <td>${criteriaResult.lambda_max.toFixed(4)}</td>
        <td>${criteriaResult.CI.toFixed(4)}</td>
        <td>${AHP.RI[AHP.numCriteria] || 0}</td>
        <td>${criteriaResult.CR.toFixed(4)}</td>
        <td class="${criteriaResult.CR <= 0.1 ? 'cr-ok' : 'cr-warning'}">${criteriaStatus}</td>
    </tr>`;
    
    for (let c = 0; c < AHP.numCriteria; c++) {
        const optionMatrix = AHP.getMatrixFromInputs('options', c);
        const optionResult = AHP.calculateEigenvector(optionMatrix);
        
        let optionStatus = optionResult.CR <= 0.1 ? 'Spójne ✓' : 'Niespójne ⚠️';
        detailedDiagnosticsHTML += `<tr>
            <td>Opcje dla "${AHP.criteriaNames[c]}"</td>
            <td>${optionResult.lambda_max.toFixed(4)}</td>
            <td>${optionResult.CI.toFixed(4)}</td>
            <td>${AHP.RI[AHP.numOptions] || 0}</td>
            <td>${optionResult.CR.toFixed(4)}</td>
            <td class="${optionResult.CR <= 0.1 ? 'cr-ok' : 'cr-warning'}">${optionStatus}</td>
        </tr>`;
    }
    
    detailedDiagnosticsHTML += '</table>';
    
    let detailedHTML = detailedDiagnosticsHTML + '<h4>Macierz porównań kryteriów</h4>';
    detailedHTML += '<table class="results-table">';
    detailedHTML += '<tr><th></th>';
    
    for (let i = 0; i < AHP.numCriteria; i++) {
        detailedHTML += `<th>${AHP.criteriaNames[i]}</th>`;
    }
    detailedHTML += '<th>Wektor własny</th></tr>';
    
    for (let i = 0; i < AHP.numCriteria; i++) {
        detailedHTML += `<tr><th>${AHP.criteriaNames[i]}</th>`;
        for (let j = 0; j < AHP.numCriteria; j++) {
            detailedHTML += `<td>${AHP.criteriaComparisonMatrix[i][j].toFixed(4)}</td>`;
        }
        detailedHTML += `<td>${AHP.criteriaPriorities[i].toFixed(4)}</td></tr>`;
    }
    detailedHTML += '</table>';
    
    for (let c = 0; c < AHP.numCriteria; c++) {
        detailedHTML += `<h4>Macierz porównań opcji dla kryterium "${AHP.criteriaNames[c]}"</h4>`;
        detailedHTML += '<table class="results-table">';
        detailedHTML += '<tr><th></th>';
        
        for (let i = 0; i < AHP.numOptions; i++) {
            detailedHTML += `<th>${AHP.optionNames[i]}</th>`;
        }
        detailedHTML += '<th>Wektor własny</th></tr>';
        
        for (let i = 0; i < AHP.numOptions; i++) {
            detailedHTML += `<tr><th>${AHP.optionNames[i]}</th>`;
            for (let j = 0; j < AHP.numOptions; j++) {
                detailedHTML += `<td>${AHP.optionComparisonMatrices[c][i][j].toFixed(4)}</td>`;
            }
            detailedHTML += `<td>${AHP.localOptionWeights[c][i].toFixed(4)}</td></tr>`;
        }
        detailedHTML += '</table>';
    }
    
    detailedData.innerHTML = detailedHTML;
    detailedSection.appendChild(detailedData);
    
    container.appendChild(detailedSection);

    const downloadButtonsContainer = document.createElement('div');
    downloadButtonsContainer.className = 'download-buttons-container';
    
    const downloadCSVButton = document.createElement('button');
    downloadCSVButton.textContent = 'Pobierz Wynik CSV';
    downloadCSVButton.className = 'download-button csv-button';
    downloadCSVButton.onclick = AHP.downloadResultsCSV;
    
    const downloadJSONButton = document.createElement('button');
    downloadJSONButton.textContent = 'Pobierz Wynik JSON';
    downloadJSONButton.className = 'download-button json-button';
    downloadJSONButton.onclick = AHP.downloadResultsJSON;
    
    const downloadTXTButton = document.createElement('button');
    downloadTXTButton.textContent = 'Pobierz Wynik TXT';
    downloadTXTButton.className = 'download-button txt-button';
    downloadTXTButton.onclick = AHP.downloadResultsTXT;
    
    downloadButtonsContainer.appendChild(downloadCSVButton);
    downloadButtonsContainer.appendChild(downloadJSONButton);
    downloadButtonsContainer.appendChild(downloadTXTButton);
    container.appendChild(downloadButtonsContainer);
    
    AHP.visualizeResults();
};

AHP.visualizeResults = () => {
    const container = document.getElementById('ahpVisualization');
    container.innerHTML = '';
    
    if (typeof Plotly === 'undefined') {
        Logger.log('Biblioteka Plotly nie jest dostępna. Oczekiwanie na załadowanie...');
        AHP.shouldVisualizeResults = true;
        
        const loadingInfo = document.createElement('div');
        loadingInfo.className = 'plotly-loading-info';
        loadingInfo.innerHTML = `
            <p><i class="fas fa-spinner fa-spin"></i> Ładowanie biblioteki wykresów...</p>
            <p>Jeśli wykresy nie pojawiają się, odśwież stronę.</p>
        `;
        container.appendChild(loadingInfo);
        return; 
    }
    
    const radarContainer = document.createElement('div');
    radarContainer.id = 'radarChart';
    radarContainer.style.height = '500px';
    radarContainer.style.width = '100%';
    container.appendChild(radarContainer);
    
    try {
        const radarData = [];
        for (let o = 0; o < AHP.numOptions; o++) {
            const radarValues = [];
            for (let c = 0; c < AHP.numCriteria; c++) {
                radarValues.push(AHP.localOptionWeights[c][o] * 100);
            }
            radarValues.push(radarValues[0]);
            const criteriaNames = [...AHP.criteriaNames];
            criteriaNames.push(criteriaNames[0]);
            
            radarData.push({
                type: 'scatterpolar',
                r: radarValues,
                theta: criteriaNames,
                fill: 'toself',
                name: AHP.optionNames[o]
            });
        }
        
        const radarLayout = {
            title: 'Porównanie opcji pod względem poszczególnych kryteriów',
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 100]
                }
            },
            margin: { t: 50, b: 50 },
            showlegend: true
        };
        Plotly.newPlot('radarChart', radarData, radarLayout, { responsive: true });
    } catch (error) {
        Logger.log("ERROR: Błąd podczas tworzenia wykresu radarowego:", error);
        const errorInfo = document.createElement('div');
        errorInfo.className = 'error-message';
        errorInfo.textContent = "Nie udało się wygenerować wykresu radarowego. Błąd: " + error.message;
        radarContainer.appendChild(errorInfo);
    }
    
    const contributionContainer = document.createElement('div');
    contributionContainer.id = 'contributionChart';
    contributionContainer.style.height = '500px';
    contributionContainer.style.width = '100%';
    container.appendChild(contributionContainer);
    
    try {
        const contributionData = [];
        for (let o = 0; o < AHP.numOptions; o++) {
            const contributions = [];
            for (let c = 0; c < AHP.numCriteria; c++) {
                contributions.push(AHP.localOptionWeights[c][o] * AHP.criteriaPriorities[c] * 100);
            }
            contributionData.push({
                x: contributions,
                y: AHP.criteriaNames,
                name: AHP.optionNames[o],
                type: 'bar',
                orientation: 'h'
            });
        }
        const contributionLayout = {
            title: 'Wkład każdego kryterium do wyniku końcowego',
            barmode: 'group',
            margin: { l: 150, r: 50, t: 50, b: 50 },
            showlegend: true
        };
        Plotly.newPlot('contributionChart', contributionData, contributionLayout, { responsive: true });
    } catch (error) {
        Logger.log("ERROR: Błąd podczas tworzenia wykresu wkładu kryteriów:", error);
        const errorInfo = document.createElement('div');
        errorInfo.className = 'error-message';
        errorInfo.textContent = "Nie udało się wygenerować wykresu wkładu kryteriów. Błąd: " + error.message;
        contributionContainer.appendChild(errorInfo);
    }
    
    const barContainer = document.createElement('div');
    barContainer.id = 'barChart';
    barContainer.style.height = '400px';
    barContainer.style.width = '100%';
    container.appendChild(barContainer);
    
    try {
        const sortedIndices = Array.from({length: AHP.numOptions}, (_, i) => i)
            .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a]);
        
        const optionNames = sortedIndices.map(idx => AHP.optionNames[idx]);
        const optionScores = sortedIndices.map(idx => AHP.globalOptionWeights[idx] * 100);
        
        const barData = [{
            x: optionNames,
            y: optionScores,
            type: 'bar',
            marker: {
                color: 'rgba(120, 94, 69, 0.8)'
            }
        }];
        const barLayout = {
            title: 'Wynik końcowy analizy AHP',
            yaxis: {
                title: 'Waga globalna (%)',
                range: [0, Math.max(...optionScores) * 1.1]
            },
            margin: { t: 50, b: 100 }
        };
        Plotly.newPlot('barChart', barData, barLayout, { responsive: true });
    } catch (error) {
        Logger.log("ERROR: Błąd podczas tworzenia wykresu słupkowego:", error);
        const errorInfo = document.createElement('div');
        errorInfo.className = 'error-message';
        errorInfo.textContent = "Nie udało się wygenerować wykresu słupkowego. Błąd: " + error.message;
        barContainer.appendChild(errorInfo);
    }
    
    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-container';
    
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Eksportuj dane dla analizy w Pythonie';
    exportButton.className = 'export-button';
    exportButton.onclick = AHP.exportToPython; // Ta funkcja też jest w tym pliku
    
    exportContainer.appendChild(exportButton);
    container.appendChild(exportContainer);
    
    document.dispatchEvent(new Event('calculation-complete'));
};

AHP.exportToPython = () => {
    let pythonCode = `# Kod Pythona do analizy AHP z używając biblioteki ahpy lub innej\n\n`;
    pythonCode += `import numpy as np\nimport pandas as pd\n`;
    pythonCode += `# Możesz użyć biblioteki ahpy lub innej implementacji AHP\n\n`;
    pythonCode += `# Nazwy kryteriów i opcji\n`;
    pythonCode += `criteria_names = ${JSON.stringify(AHP.criteriaNames)}\n`;
    pythonCode += `option_names = ${JSON.stringify(AHP.optionNames)}\n\n`;
    pythonCode += `# Macierz porównań kryteriów\n`;
    pythonCode += `criteria_comparison_matrix = np.array([\n`;
    for (let i = 0; i < AHP.numCriteria; i++) {
        pythonCode += `    [${AHP.criteriaComparisonMatrix[i].join(', ')}],\n`;
    }
    pythonCode += `])\n\n`;
    pythonCode += `# Macierze porównań opcji dla każdego kryterium\n`;
    pythonCode += `option_comparison_matrices = []\n`;
    for (let c = 0; c < AHP.numCriteria; c++) {
        pythonCode += `\n# Porównania opcji dla kryterium: ${AHP.criteriaNames[c]}\n`;
        pythonCode += `matrix_${c} = np.array([\n`;
        for (let i = 0; i < AHP.numOptions; i++) {
            pythonCode += `    [${AHP.optionComparisonMatrices[c][i].join(', ')}],\n`;
        }
        pythonCode += `])\n`;
        pythonCode += `option_comparison_matrices.append(matrix_${c})\n`;
    }
    pythonCode += `\n# Wyliczone wartości\n`;
    pythonCode += `# Wagi kryteriów:\n`;
    pythonCode += `expected_criteria_weights = [${AHP.criteriaPriorities.join(', ')}]\n\n`;
    pythonCode += `# Lokalne wagi opcji dla każdego kryterium:\n`;
    for (let c = 0; c < AHP.numCriteria; c++) {
        pythonCode += `# Dla kryterium ${AHP.criteriaNames[c]}\n`;
        pythonCode += `expected_local_weights_${c} = [${AHP.localOptionWeights[c].join(', ')}]\n`;
    }
    pythonCode += `\n# Globalne wagi opcji (wynik końcowy):\n`;
    pythonCode += `expected_global_weights = [${AHP.globalOptionWeights.join(', ')}]\n\n`;
    let bestOptionIndex = 0;
    for (let i = 1; i < AHP.numOptions; i++) {
        if (AHP.globalOptionWeights[i] > AHP.globalOptionWeights[bestOptionIndex]) {
            bestOptionIndex = i;
        }
    }
    pythonCode += `# Najlepsza opcja: \'\'\'${AHP.optionNames[bestOptionIndex]}\'\'\' z wynikiem ${AHP.globalOptionWeights[bestOptionIndex]}\n`;
    
    const exportModal = document.createElement('div');
    exportModal.className = 'export-modal';
    const modalContent = document.createElement('div');
    modalContent.className = 'export-modal-content';
    const closeButton = document.createElement('span');
    closeButton.className = 'close-modal';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.body.removeChild(exportModal);
    };
    const modalHeader = document.createElement('h4');
    modalHeader.textContent = 'Kod Pythona dla analizy porównawczej';
    const modalDescription = document.createElement('p');
    modalDescription.textContent = 'Skopiuj poniższy kod do skryptu Pythona, aby porównać wyniki z aplikacją referencyjną:';
    const codeArea = document.createElement('textarea');
    codeArea.className = 'python-code-area';
    codeArea.value = pythonCode;
    codeArea.readOnly = true;
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Kopiuj kod';
    copyButton.className = 'copy-code-button';
    copyButton.onclick = () => {
        codeArea.select();
        document.execCommand('copy');
        copyButton.textContent = 'Skopiowano!';
        setTimeout(() => {
            copyButton.textContent = 'Kopiuj kod';
        }, 2000);
    };
    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalDescription);
    modalContent.appendChild(codeArea);
    modalContent.appendChild(copyButton);
    exportModal.appendChild(modalContent);
    document.body.appendChild(exportModal);
};
