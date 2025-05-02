// Moduł AHP - Analiza Hierarchii Procesów
const AHP = {
    criteriaNames: [],
    optionNames: [],
    numCriteria: 0,
    numOptions: 0,
    criteriaComparisonMatrix: null,
    optionComparisonMatrices: null,
    criteriaPriorities: null,
    localOptionWeights: null,
    globalOptionWeights: null,
    RI: { 2: 0, 3: 0.52, 4: 0.89, 5: 1.11, 6: 1.25 },

    init: () => {
        console.log("Executing AHP.init()");
        Utils.hideElement('ahpResults');
        document.getElementById('ahpNumCriteria').value = '3';
    },

    setupInputs: () => {
        console.log("Setting up AHP inputs");
        AHP.numCriteria = parseInt(document.getElementById('ahpNumCriteria').value) || 3;
        
        if (AHP.numCriteria < 3 || AHP.numCriteria > 6) {
            Utils.displayResults('ahpResults', 'Liczba kryteriów musi być między 3 a 6', true);
            return;
        }
        
        // Przygotuj pola na nazwy kryteriów
        const criteriaContainer = document.getElementById('ahpCriteriaNames');
        criteriaContainer.innerHTML = '';
        criteriaContainer.className = 'input-group';
        
        const header = document.createElement('h3');
        header.textContent = 'Nazwy kryteriów';
        criteriaContainer.appendChild(header);
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            const inputRow = document.createElement('div');
            inputRow.className = 'input-row';
            
            const label = document.createElement('label');
            label.textContent = `Kryterium ${i+1}:`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `criteria-name-${i}`;
            input.placeholder = `Kryterium ${i+1}`;
            input.value = AHP.criteriaNames[i] || `Kryterium ${i+1}`;
            
            inputRow.appendChild(label);
            inputRow.appendChild(input);
            criteriaContainer.appendChild(inputRow);
        }
        
        // Dodaj przycisk do ustawienia liczby opcji
        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';
        
        const label = document.createElement('label');
        label.textContent = 'Liczba opcji (2-6):';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'ahpNumOptions';
        input.min = 2;
        input.max = 6;
        input.value = AHP.numOptions || 2;
        
        const button = document.createElement('button');
        button.textContent = 'Ustaw opcje';
        button.onclick = AHP.setupOptions;
        
        inputRow.appendChild(label);
        inputRow.appendChild(input);
        inputRow.appendChild(button);
        criteriaContainer.appendChild(inputRow);
        
        // Wyczyść matryce porównań i wyniki
        Utils.clearElement('ahpCriteriaComparisonMatrix');
        Utils.clearElement('ahpOptionNames');
        Utils.clearElement('ahpOptionsComparisonSection');
        Utils.hideElement('ahpResults');
        Utils.clearElement('ahpVisualization');
    },
    
    setupOptions: () => {
        console.log("Setting up AHP options");
        AHP.numOptions = parseInt(document.getElementById('ahpNumOptions').value) || 2;
        
        if (AHP.numOptions < 2 || AHP.numOptions > 6) {
            Utils.displayResults('ahpResults', 'Liczba opcji musi być między 2 a 6', true);
            return;
        }

        // Zapisz nazwy kryteriów
        AHP.criteriaNames = [];
        for (let i = 0; i < AHP.numCriteria; i++) {
            const input = document.getElementById(`criteria-name-${i}`);
            AHP.criteriaNames.push(input.value || `Kryterium ${i+1}`);
        }
        
        // Przygotuj macierz porównań dla kryteriów
        AHP.createCriteriaComparisonMatrix();
        
        // Przygotuj pola na nazwy opcji
        const optionsContainer = document.getElementById('ahpOptionNames');
        optionsContainer.innerHTML = '';
        optionsContainer.className = 'input-group';
        
        const header = document.createElement('h3');
        header.textContent = 'Nazwy opcji';
        optionsContainer.appendChild(header);
        
        for (let i = 0; i < AHP.numOptions; i++) {
            const inputRow = document.createElement('div');
            inputRow.className = 'input-row';
            
            const label = document.createElement('label');
            label.textContent = `Opcja ${i+1}:`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `option-name-${i}`;
            input.placeholder = `Opcja ${i+1}`;
            input.value = AHP.optionNames[i] || `Opcja ${i+1}`;
            
            inputRow.appendChild(label);
            inputRow.appendChild(input);
            optionsContainer.appendChild(inputRow);
        }
        
        const button = document.createElement('button');
        button.textContent = 'Utwórz macierze porównań';
        button.onclick = AHP.setupOptionComparisons;
        optionsContainer.appendChild(button);
    },
    
    createCriteriaComparisonMatrix: () => {
        const container = document.getElementById('ahpCriteriaComparisonMatrix');
        container.innerHTML = '';
        
        const header = document.createElement('h3');
        header.textContent = 'Porównanie ważności kryteriów';
        container.appendChild(header);
        
        // Utwórz tabelę porównań
        const table = document.createElement('table');
        table.className = 'comparison-matrix';
        
        // Nagłówki kolumn
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Pusta komórka w lewym górnym rogu
        headerRow.appendChild(document.createElement('th'));
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            const th = document.createElement('th');
            th.textContent = AHP.criteriaNames[i];
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Ciało tabeli
        const tbody = document.createElement('tbody');
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            const row = document.createElement('tr');
            
            // Nagłówek wiersza
            const th = document.createElement('th');
            th.textContent = AHP.criteriaNames[i];
            row.appendChild(th);
            
            for (let j = 0; j < AHP.numCriteria; j++) {
                const td = document.createElement('td');
                
                if (i === j) {
                    // Przekątna = 1
                    td.textContent = '1';
                } else if (i < j) {
                    // Górna część macierzy - wybór wartości
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
                    // Dolna część macierzy - odwrotność
                    td.id = `criteria-comp-value-${i}-${j}`;
                    td.textContent = '1';
                }
                
                row.appendChild(td);
            }
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
    },
    
    updateCriteriaComparisonValue: (i, j) => {
        // Pobierz wartość wybraną przez użytkownika
        const select = document.getElementById(`criteria-comp-${i}-${j}`);
        const value = parseFloat(select.value);
        
        // Ustaw odwrotność w komórce symetrycznej
        const reciprocalCell = document.getElementById(`criteria-comp-value-${j}-${i}`);
        reciprocalCell.textContent = (1 / value).toFixed(4);
    },
    
    setupOptionComparisons: () => {
        // Zapisz nazwy opcji
        AHP.optionNames = [];
        for (let i = 0; i < AHP.numOptions; i++) {
            const input = document.getElementById(`option-name-${i}`);
            AHP.optionNames.push(input.value || `Opcja ${i+1}`);
        }
        
        // Utwórz macierze porównań dla opcji w kontekście każdego kryterium
        const container = document.getElementById('ahpOptionsComparisonSection');
        container.innerHTML = '';
        
        const header = document.createElement('h3');
        header.textContent = 'Porównanie opcji w kontekście każdego kryterium';
        container.appendChild(header);
        
        // Utwórz zakładki dla kryteriów
        const tabs = document.createElement('div');
        tabs.className = 'comparison-tabs';
        
        // Dla każdego kryterium, utwórz zakładkę i macierz porównań
        for (let c = 0; c < AHP.numCriteria; c++) {
            const criteriaName = AHP.criteriaNames[c];
            
            // Kontener dla macierzy porównań dla danego kryterium
            const criteriaContainer = document.createElement('div');
            criteriaContainer.id = `comparison-for-criteria-${c}`;
            criteriaContainer.className = 'criteria-comparison-container';
            criteriaContainer.style.display = c === 0 ? 'block' : 'none';
            
            const criteriaHeader = document.createElement('h4');
            criteriaHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
            criteriaContainer.appendChild(criteriaHeader);
            
            // Utwórz tabelę porównań
            const table = document.createElement('table');
            table.className = 'comparison-matrix';
            
            // Nagłówki kolumn
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            // Pusta komórka w lewym górnym rogu
            headerRow.appendChild(document.createElement('th'));
            
            for (let i = 0; i < AHP.numOptions; i++) {
                const th = document.createElement('th');
                th.textContent = AHP.optionNames[i];
                headerRow.appendChild(th);
            }
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Ciało tabeli
            const tbody = document.createElement('tbody');
            
            for (let i = 0; i < AHP.numOptions; i++) {
                const row = document.createElement('tr');
                
                // Nagłówek wiersza
                const th = document.createElement('th');
                th.textContent = AHP.optionNames[i];
                row.appendChild(th);
                
                for (let j = 0; j < AHP.numOptions; j++) {
                    const td = document.createElement('td');
                    
                    if (i === j) {
                        // Przekątna = 1
                        td.textContent = '1';
                    } else if (i < j) {
                        // Górna część macierzy - wybór wartości
                        const select = document.createElement('select');
                        select.id = `option-comp-${c}-${i}-${j}`;
                        select.onchange = () => AHP.updateOptionComparisonValue(c, i, j);
                        
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
                        // Dolna część macierzy - odwrotność
                        td.id = `option-comp-value-${c}-${i}-${j}`;
                        td.textContent = '1';
                    }
                    
                    row.appendChild(td);
                }
                
                tbody.appendChild(row);
            }
            
            table.appendChild(tbody);
            criteriaContainer.appendChild(table);
            container.appendChild(criteriaContainer);
            
            // Dodaj przycisk zakładki
            const tabButton = document.createElement('button');
            tabButton.textContent = criteriaName;
            tabButton.className = c === 0 ? 'tab-button active' : 'tab-button';
            tabButton.onclick = () => {
                // Ukryj wszystkie kontenery
                for (let i = 0; i < AHP.numCriteria; i++) {
                    const cont = document.getElementById(`comparison-for-criteria-${i}`);
                    if (cont) {
                        cont.style.display = 'none';
                    }
                    
                    // Usuń aktywną klasę z przycisków
                    const buttons = tabs.getElementsByClassName('tab-button');
                    for (let j = 0; j < buttons.length; j++) {
                        buttons[j].className = 'tab-button';
                    }
                }
                
                // Pokaż wybrany kontener
                criteriaContainer.style.display = 'block';
                tabButton.className = 'tab-button active';
            };
            
            tabs.appendChild(tabButton);
        }
        
        // Dodaj zakładki przed kontenerami macierzy
        container.insertBefore(tabs, container.firstChild.nextSibling);
        
        // Dodaj przycisk obliczania
        const calculateButton = document.createElement('button');
        calculateButton.textContent = 'Oblicz wyniki AHP';
        calculateButton.onclick = AHP.calculate;
        calculateButton.className = 'calculate-button';
        container.appendChild(calculateButton);
    },
    
    updateOptionComparisonValue: (c, i, j) => {
        // Pobierz wartość wybraną przez użytkownika
        const select = document.getElementById(`option-comp-${c}-${i}-${j}`);
        const value = parseFloat(select.value);
        
        // Ustaw odwrotność w komórce symetrycznej
        const reciprocalCell = document.getElementById(`option-comp-value-${c}-${j}-${i}`);
        reciprocalCell.textContent = (1 / value).toFixed(4);
    },
    
    getMatrixFromInputs: (type, criteriaIndex = null) => {
        let matrix = [];
        
        if (type === 'criteria') {
            // Utwórz macierz porównań kryteriów
            for (let i = 0; i < AHP.numCriteria; i++) {
                let row = [];
                for (let j = 0; j < AHP.numCriteria; j++) {
                    if (i === j) {
                        // Przekątna = 1
                        row.push(1);
                    } else if (i < j) {
                        // Górna część macierzy - pobierz z selecta
                        const select = document.getElementById(`criteria-comp-${i}-${j}`);
                        row.push(parseFloat(select.value));
                    } else {
                        // Dolna część - pobierz z obliczonej odwrotności
                        const cell = document.getElementById(`criteria-comp-value-${i}-${j}`);
                        row.push(parseFloat(cell.textContent));
                    }
                }
                matrix.push(row);
            }
        } else if (type === 'options' && criteriaIndex !== null) {
            // Utwórz macierz porównań opcji dla danego kryterium
            for (let i = 0; i < AHP.numOptions; i++) {
                let row = [];
                for (let j = 0; j < AHP.numOptions; j++) {
                    if (i === j) {
                        // Przekątna = 1
                        row.push(1);
                    } else if (i < j) {
                        // Górna część macierzy - pobierz z selecta
                        const select = document.getElementById(`option-comp-${criteriaIndex}-${i}-${j}`);
                        row.push(parseFloat(select.value));
                    } else {
                        // Dolna część - pobierz z obliczonej odwrotności
                        const cell = document.getElementById(`option-comp-value-${criteriaIndex}-${i}-${j}`);
                        row.push(parseFloat(cell.textContent));
                    }
                }
                matrix.push(row);
            }
        }
        
        return matrix;
    },
    
    calculateEigenvector: (matrix) => {
        const n = matrix.length;
        
        // Używamy biblioteki math.js dla operacji macierzowych
        const mathMatrix = math.matrix(matrix);
        
        // Metoda przybliżona - mnożenie każdego wiersza i obliczenie pierwiastka n-tego stopnia
        let eigenvalues = [];
        
        for (let i = 0; i < n; i++) {
            let product = 1;
            for (let j = 0; j < n; j++) {
                product *= matrix[i][j];
            }
            eigenvalues.push(Math.pow(product, 1/n));
        }
        
        // Normalizacja wektora własnego
        const sum = eigenvalues.reduce((a, b) => a + b, 0);
        const normalizedEigenvalues = eigenvalues.map(value => value / sum);
        
        // Obliczanie współczynnika spójności (CR)
        // Najpierw obliczamy maksymalną wartość własną (lambda_max)
        let lambda_max = 0;
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += matrix[j][i];
            }
            lambda_max += sum * normalizedEigenvalues[i];
        }
        
        // Następnie obliczamy indeks spójności (CI)
        const CI = (lambda_max - n) / (n - 1);
        
        // Obliczamy współczynnik spójności (CR)
        const RI = AHP.RI[n] || 1.98;  // Używamy znanej wartości RI dla danego n
        const CR = CI / RI;
        
        return {
            eigenvalues: normalizedEigenvalues,
            lambda_max: lambda_max,
            CI: CI,
            CR: CR
        };
    },
    
    calculate: () => {
        try {
            // 1. Pobierz i zwaliduj macierz porównań kryteriów
            const criteriaMatrix = AHP.getMatrixFromInputs('criteria');
            const criteriaResult = AHP.calculateEigenvector(criteriaMatrix);
            AHP.criteriaPriorities = criteriaResult.eigenvalues;
            
            // Sprawdź CR dla kryteriów
            if (criteriaResult.CR > 0.1) {
                Utils.displayResults('ahpResults', 
                    `<div class="cr-warning">Uwaga: Współczynnik spójności (CR) dla porównań kryteriów wynosi ${criteriaResult.CR.toFixed(4)}, 
                    co przekracza zalecaną wartość 0.1. Rozważ ponowną ocenę porównań.</div>`, false);
                return;
            }
            
            // 2. Dla każdego kryterium, pobierz macierz porównań opcji
            AHP.localOptionWeights = [];  // Wagi lokalne opcji dla każdego kryterium
            
            let allConsistent = true;
            let inconsistentCriteria = [];
            
            for (let c = 0; c < AHP.numCriteria; c++) {
                const optionMatrix = AHP.getMatrixFromInputs('options', c);
                const optionResult = AHP.calculateEigenvector(optionMatrix);
                
                AHP.localOptionWeights.push(optionResult.eigenvalues);
                
                // Sprawdź CR dla opcji
                if (optionResult.CR > 0.1) {
                    allConsistent = false;
                    inconsistentCriteria.push({
                        name: AHP.criteriaNames[c],
                        cr: optionResult.CR
                    });
                }
            }
            
            // Jeśli którekolwiek z porównań jest niespójne, pokaż ostrzeżenie
            if (!allConsistent) {
                let warningHtml = `<div class="cr-warning">Uwaga: Współczynnik spójności (CR) dla porównań opcji 
                    przekracza zalecaną wartość 0.1 dla następujących kryteriów:<ul>`;
                
                for (const item of inconsistentCriteria) {
                    warningHtml += `<li>${item.name}: CR = ${item.cr.toFixed(4)}</li>`;
                }
                
                warningHtml += `</ul>Rozważ ponowną ocenę porównań.</div>`;
                Utils.displayResults('ahpResults', warningHtml, false);
                return;
            }
            
            // 3. Oblicz wagi globalne dla opcji
            AHP.globalOptionWeights = Array(AHP.numOptions).fill(0);
            
            for (let o = 0; o < AHP.numOptions; o++) {
                for (let c = 0; c < AHP.numCriteria; c++) {
                    AHP.globalOptionWeights[o] += AHP.localOptionWeights[c][o] * AHP.criteriaPriorities[c];
                }
            }
            
            // 4. Wyświetl wyniki
            AHP.displayResults();
            
            // 5. Wizualizuj wyniki
            AHP.visualizeResults();
            
        } catch (error) {
            console.error("Błąd w obliczeniach AHP:", error);
            Utils.displayResults('ahpResults', `Błąd w obliczeniach: ${error.message}`, true);
        }
    },
    
    displayResults: () => {
        const container = document.getElementById('ahpResults');
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Znajdź najlepszą opcję
        let bestOptionIndex = 0;
        for (let i = 1; i < AHP.numOptions; i++) {
            if (AHP.globalOptionWeights[i] > AHP.globalOptionWeights[bestOptionIndex]) {
                bestOptionIndex = i;
            }
        }
        
        // Główny wynik
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
        
        // Wagi kryteriów
        const criteriaWeights = document.createElement('div');
        criteriaWeights.className = 'results-table-container';
        
        const criteriaTitle = document.createElement('h4');
        criteriaTitle.textContent = 'Wagi kryteriów';
        criteriaWeights.appendChild(criteriaTitle);
        
        const criteriaTable = document.createElement('table');
        criteriaTable.className = 'results-table';
        
        // Nagłówek tabeli kryteriów
        const criteriaHeader = document.createElement('tr');
        criteriaHeader.innerHTML = '<th>Kryterium</th><th>Waga</th>';
        criteriaTable.appendChild(criteriaHeader);
        
        // Wiersze tabeli kryteriów
        for (let i = 0; i < AHP.numCriteria; i++) {
            const row = document.createElement('tr');
            const criteria = AHP.criteriaNames[i];
            const weight = AHP.criteriaPriorities[i];
            
            row.innerHTML = `<td>${criteria}</td><td>${(weight * 100).toFixed(2)}%</td>`;
            criteriaTable.appendChild(row);
        }
        
        criteriaWeights.appendChild(criteriaTable);
        container.appendChild(criteriaWeights);
        
        // Globalne wagi opcji
        const finalResults = document.createElement('div');
        finalResults.className = 'results-table-container final-results';
        
        const finalTitle = document.createElement('h4');
        finalTitle.textContent = 'Ranking opcji (wynik końcowy)';
        finalResults.appendChild(finalTitle);
        
        const finalTable = document.createElement('table');
        finalTable.className = 'results-table';
        
        // Nagłówek tabeli opcji
        const finalHeader = document.createElement('tr');
        finalHeader.innerHTML = '<th>Ranking</th><th>Opcja</th><th>Wynik</th>';
        finalTable.appendChild(finalHeader);
        
        // Posortowane indeksy opcji według wyniku
        const sortedIndices = Array.from({length: AHP.numOptions}, (_, i) => i)
            .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a]);
        
        // Wiersze tabeli opcji
        for (let i = 0; i < sortedIndices.length; i++) {
            const optionIndex = sortedIndices[i];
            const row = document.createElement('tr');
            row.className = optionIndex === bestOptionIndex ? 'best-option' : '';
            
            const option = AHP.optionNames[optionIndex];
            const score = AHP.globalOptionWeights[optionIndex];
            
            row.innerHTML = `<td>${i+1}</td><td>${option}</td><td class="final-score">${(score * 100).toFixed(2)}%</td>`;
            finalTable.appendChild(row);
        }
        
        finalResults.appendChild(finalTable);
        container.appendChild(finalResults);
        
        // Rozbicie wyników według kryteriów
        const breakdownResults = document.createElement('div');
        breakdownResults.className = 'results-table-container';
        
        const breakdownTitle = document.createElement('h4');
        breakdownTitle.textContent = 'Rozbicie wyników według kryteriów';
        breakdownResults.appendChild(breakdownTitle);
        
        const breakdownTable = document.createElement('table');
        breakdownTable.className = 'results-table results-breakdown';
        
        // Nagłówek tabeli rozbicia
        const breakdownHeader = document.createElement('tr');
        breakdownHeader.innerHTML = '<th>Opcja</th>';
        
        for (let c = 0; c < AHP.numCriteria; c++) {
            breakdownHeader.innerHTML += `<th title="Waga: ${(AHP.criteriaPriorities[c] * 100).toFixed(2)}%">${AHP.criteriaNames[c]}</th>`;
        }
        
        breakdownHeader.innerHTML += '<th>Wynik całkowity</th>';
        breakdownTable.appendChild(breakdownHeader);
        
        // Wiersze tabeli rozbicia
        for (let o = 0; o < AHP.numOptions; o++) {
            const row = document.createElement('tr');
            row.className = o === bestOptionIndex ? 'best-option' : '';
            
            let rowHtml = `<td>${AHP.optionNames[o]}</td>`;
            
            for (let c = 0; c < AHP.numCriteria; c++) {
                const localScore = AHP.localOptionWeights[c][o];
                const weightedScore = localScore * AHP.criteriaPriorities[c];
                const isLocalBest = AHP.localOptionWeights[c].indexOf(Math.max(...AHP.localOptionWeights[c])) === o;
                
                rowHtml += `<td class="${isLocalBest ? 'best-option-local' : ''}" 
                    title="Wynik lokalny: ${(localScore * 100).toFixed(2)}%, 
                    Po zważeniu: ${(weightedScore * 100).toFixed(2)}%">
                    ${(weightedScore * 100).toFixed(2)}%</td>`;
            }
            
            rowHtml += `<td class="final-score">${(AHP.globalOptionWeights[o] * 100).toFixed(2)}%</td>`;
            
            row.innerHTML = rowHtml;
            breakdownTable.appendChild(row);
        }
        
        breakdownResults.appendChild(breakdownTable);
        
        // Dodaj informację o kolorze
        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        colorInfo.textContent = 'Intensywność niebieskiego koloru odzwierciedla wynik opcji w danym kryterium';
        breakdownResults.appendChild(colorInfo);
        
        container.appendChild(breakdownResults);
    },
    
    visualizeResults: () => {
        const container = document.getElementById('ahpVisualization');
        container.innerHTML = '';
        
        // 1. Wykres słupkowy z wynikami końcowymi
        const overallData = [{
            x: AHP.optionNames,
            y: AHP.globalOptionWeights.map(v => v * 100),
            type: 'bar',
            marker: {
                color: AHP.optionNames.map((_, i) => {
                    const maxValue = Math.max(...AHP.globalOptionWeights);
                    return AHP.globalOptionWeights[i] === maxValue ? 'rgba(46, 139, 87, 0.8)' : 'rgba(70, 130, 180, 0.8)';
                })
            },
            text: AHP.globalOptionWeights.map(v => v.toFixed(4)),
            textposition: 'auto',
            hoverinfo: 'y+text',
            name: 'Wynik końcowy'
        }];
        
        const overallLayout = {
            title: 'Wyniki końcowe AHP',
            xaxis: { title: 'Opcje' },
            yaxis: { title: 'Wynik (%)' },
            margin: { t: 50, b: 100 },
            height: 400
        };
        
        Plotly.newPlot('ahpVisualization', overallData, overallLayout, { responsive: true });
        
        // 2. Wykres radarowy - porównanie opcji pod względem różnych kryteriów
        const radarContainer = document.createElement('div');
        radarContainer.id = 'radarChart';
        radarContainer.style.height = '500px';
        radarContainer.style.width = '100%';
        container.appendChild(radarContainer);
        
        const radarData = [];
        
        for (let o = 0; o < AHP.numOptions; o++) {
            const radarValues = [];
            for (let c = 0; c < AHP.numCriteria; c++) {
                radarValues.push(AHP.localOptionWeights[c][o] * 100);
            }
            
            // Zamknięcie wielokąta - powtórzenie pierwszej wartości na końcu
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
        
        // 3. Wizualizacja wkładu każdego kryterium do wyniku końcowego
        const contributionContainer = document.createElement('div');
        contributionContainer.id = 'contributionChart';
        contributionContainer.style.height = '500px';
        contributionContainer.style.width = '100%';
        container.appendChild(contributionContainer);
        
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
        
        // Wyemituj zdarzenie po zakończeniu wizualizacji
        document.dispatchEvent(new Event('calculation-complete'));
    }
} 