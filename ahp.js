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
    RI: { 2: 0, 3: 0.52, 4: 0.89, 5: 1.11, 6: 1.25, 7: 1.35, 8: 1.40, 9: 1.45, 10: 1.49 },
    interfaceMode: 'simplified', // Nowy parametr - tryb interfejsu: 'matrix' lub 'simplified'

    init: () => {
        console.log("Executing AHP.init()");
        Utils.hideElement('ahpResults');
        document.getElementById('ahpNumCriteria').value = '3';
        
        // Inicjalizacja początkowa macierzy
        AHP.numCriteria = 3;
        AHP.numOptions = 2;
        AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
            Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
        );
        
        // Inicjalizacja nazw kryteriów i opcji
        AHP.criteriaNames = Array(AHP.numCriteria).fill().map((_, i) => `Kryterium ${i+1}`);
        AHP.optionNames = Array(AHP.numOptions).fill().map((_, i) => `Opcja ${i+1}`);
        
        // Dodanie przełącznika trybu interfejsu
        AHP.setupInterfaceSwitch();
        
        // Automatyczne tworzenie interfejsu bez konieczności klikania przycisków
        AHP.setupInputs();
    },
    
    setupInterfaceSwitch: () => {
        // Sprawdź, czy przełącznik już istnieje
        if (document.getElementById('ahp-interface-switch')) return;
        
        // Stwórz przełącznik trybu interfejsu
        const toolContainer = document.getElementById('tool-ahp');
        const h2Element = toolContainer.querySelector('h2');
        
        const switchContainer = document.createElement('div');
        switchContainer.className = 'interface-switch-container';
        switchContainer.id = 'ahp-interface-switch';
        switchContainer.innerHTML = `
            <div class="interface-switch">
                <label>Wybierz tryb interfejsu:</label>
                <div class="switch-options">
                    <button id="matrix-interface" class="switch-option ${AHP.interfaceMode === 'matrix' ? 'active' : ''}">Macierz porównań</button>
                    <button id="simplified-interface" class="switch-option ${AHP.interfaceMode === 'simplified' ? 'active' : ''}">Uproszczony</button>
                </div>
            </div>
        `;
        
        // Wstaw przełącznik po elemencie h2
        h2Element.parentNode.insertBefore(switchContainer, h2Element.nextSibling);
        
        // Dodaj obsługę zdarzeń
        document.getElementById('matrix-interface').addEventListener('click', () => {
            // Zapisz aktualny stan danych przed przełączeniem interfejsu
            AHP.saveCurrentComparisonData();
            
            // Zmień tryb interfejsu
            AHP.interfaceMode = 'matrix';
            document.getElementById('matrix-interface').classList.add('active');
            document.getElementById('simplified-interface').classList.remove('active');
            
            // Przebuduj interfejs
            AHP.clearCurrentInterface();
            AHP.setupInputs();
        });
        
        document.getElementById('simplified-interface').addEventListener('click', () => {
            // Zapisz aktualny stan danych przed przełączeniem interfejsu
            AHP.saveCurrentComparisonData();
            
            // Zmień tryb interfejsu
            AHP.interfaceMode = 'simplified';
            document.getElementById('simplified-interface').classList.add('active');
            document.getElementById('matrix-interface').classList.remove('active');
            
            // Przebuduj interfejs
            AHP.clearCurrentInterface();
            AHP.setupInputs();
        });
    },
    
    saveCurrentComparisonData: () => {
        console.log("Saving current comparison data from interface mode: " + AHP.interfaceMode);
        
        // Zachowujemy nazwy kryteriów
        AHP.criteriaNames = [];
        for (let i = 0; i < AHP.numCriteria; i++) {
            const input = document.getElementById(`criteria-name-${i}`);
            if (input) {
                AHP.criteriaNames.push(input.value || `Kryterium ${i+1}`);
            }
        }
        
        // Zachowujemy nazwy opcji
        AHP.optionNames = [];
        for (let i = 0; i < AHP.numOptions; i++) {
            const input = document.getElementById(`option-name-${i}`);
            if (input) {
                AHP.optionNames.push(input.value || `Opcja ${i+1}`);
            }
        }
        
        // Inicjalizacja macierzy, jeśli nie istnieją
        if (!AHP.criteriaComparisonMatrix) {
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        if (!AHP.optionComparisonMatrices) {
            AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
            );
        }
        
        // Zachowujemy dane porównań kryteriów w zależności od trybu interfejsu
        if (AHP.interfaceMode === 'matrix') {
            // Zapisz wartości z selektów
            for (let i = 0; i < AHP.numCriteria; i++) {
                for (let j = i + 1; j < AHP.numCriteria; j++) {
                    const select = document.getElementById(`criteria-comp-${i}-${j}`);
                    if (select) {
                        const value = parseFloat(select.value);
                        AHP.criteriaComparisonMatrix[i][j] = value;
                        AHP.criteriaComparisonMatrix[j][i] = 1 / value;
                    }
                }
            }
            
            // Zapisz wartości porównań opcji
            for (let c = 0; c < AHP.numCriteria; c++) {
                if (!AHP.optionComparisonMatrices[c]) {
                    AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
                }
                for (let i = 0; i < AHP.numOptions; i++) {
                    for (let j = i + 1; j < AHP.numOptions; j++) {
                        const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
                        if (select) {
                            const value = parseFloat(select.value);
                            AHP.optionComparisonMatrices[c][i][j] = value;
                            AHP.optionComparisonMatrices[c][j][i] = 1 / value;
                        }
                    }
                }
            }
        } else if (AHP.interfaceMode === 'simplified') {
            // W trybie uproszczonym macierze są aktualizowane na bieżąco przez zdarzenia onchange
            // ale sprawdzimy czy wszystkie pary kryteriów i opcji zostały wypełnione
            
            // Sprawdź wartości porównań kryteriów
            for (let i = 0; i < AHP.numCriteria; i++) {
                for (let j = i + 1; j < AHP.numCriteria; j++) {
                    const radios = document.querySelectorAll(`input[name="criteria-comp-${i}-${j}"]:checked`);
                    if (radios.length > 0) {
                        const value = parseFloat(radios[0].value);
                        AHP.criteriaComparisonMatrix[i][j] = value;
                        AHP.criteriaComparisonMatrix[j][i] = 1 / value;
                    }
                }
            }
            
            // Sprawdź wartości porównań opcji
            for (let c = 0; c < AHP.numCriteria; c++) {
                if (!AHP.optionComparisonMatrices[c]) {
                    AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
                }
                for (let i = 0; i < AHP.numOptions; i++) {
                    for (let j = i + 1; j < AHP.numOptions; j++) {
                        const radios = document.querySelectorAll(`input[name="options-comp-${c}-${i}-${j}"]:checked`);
                        if (radios.length > 0) {
                            const value = parseFloat(radios[0].value);
                            AHP.optionComparisonMatrices[c][i][j] = value;
                            AHP.optionComparisonMatrices[c][j][i] = 1 / value;
                        }
                    }
                }
            }
        }
        
        // Debug: Wypisz zapisane macierze
        console.log("Criteria comparison matrix:", AHP.criteriaComparisonMatrix);
        console.log("Option comparison matrices:", AHP.optionComparisonMatrices);
    },
    
    clearCurrentInterface: () => {
        Utils.clearElement('ahpCriteriaNames');
        Utils.clearElement('ahpCriteriaComparisonMatrix');
        Utils.clearElement('ahpOptionNames');
        Utils.clearElement('ahpOptionsComparisonSection');
        Utils.hideElement('ahpResults');
        Utils.clearElement('ahpVisualization');
    },

    setupInputs: () => {
        console.log("Setting up AHP inputs for mode: " + AHP.interfaceMode);
        AHP.numCriteria = parseInt(document.getElementById('ahpNumCriteria').value) || 3;
        
        if (AHP.numCriteria < 3 || AHP.numCriteria > 6) {
            Utils.displayResults('ahpResults', 'Liczba kryteriów musi być między 3 a 6', true);
            return;
        }
        
        // Przygotuj pola na nazwy kryteriów
        const criteriaContainer = document.getElementById('ahpCriteriaNames');
        criteriaContainer.innerHTML = '';
        criteriaContainer.className = 'input-group';
        
        const criteriaHeader = document.createElement('h3');
        criteriaHeader.textContent = 'Nazwy kryteriów';
        criteriaContainer.appendChild(criteriaHeader);
        
        // Inicjalizacja macierzy kryteriów, jeśli zmieniła się liczba
        if (!AHP.criteriaNames || AHP.criteriaNames.length !== AHP.numCriteria) {
            AHP.criteriaNames = Array(AHP.numCriteria).fill().map((_, i) => `Kryterium ${i+1}`);
        }
        
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
            // Dodajemy obsługę onchange, aby natychmiast aktualizować dane
            input.onchange = () => {
                AHP.criteriaNames[i] = input.value || `Kryterium ${i+1}`;
                // Aktualizuj interfejs porównań
                if (AHP.interfaceMode === 'matrix') {
                    AHP.createCriteriaComparisonMatrix();
                    AHP.createMatrixOptionComparisons();
                } else if (AHP.interfaceMode === 'simplified') {
                    AHP.createSimplifiedInterface();
                }
            };
            
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
        
        // Dodaj obsługę zmiany wartości pola - natychmiastowa aktualizacja
        input.onchange = () => {
            AHP.setupOptions();
        };
        // Dodaj też obsługę zdarzenia input, aby reagować natychmiast na zmiany wprowadzone przez użytkownika
        input.oninput = () => {
            AHP.setupOptions();
        };
        
        const button = document.createElement('button');
        button.textContent = 'Ustaw opcje';
        button.onclick = () => AHP.setupOptions();
        
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
        
        // Inicjalizacja macierzy porównań kryteriów, jeśli nie istnieje
        if (!AHP.criteriaComparisonMatrix || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        // Od razu wyświetl sekcje porównań kryteriów
        if (AHP.interfaceMode === 'matrix') {
            AHP.createCriteriaComparisonMatrix();
        } else if (AHP.interfaceMode === 'simplified') {
            AHP.createSimplifiedInterface();
        }
        
        // Przygotuj pola na nazwy opcji
        AHP.setupOptions();
    },
    
    setupOptions: (skipComparisonSetup = false) => {
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
            // Dodaj obsługę onchange
            input.onchange = () => {
                AHP.optionNames[i] = input.value || `Opcja ${i+1}`;
                // Aktualizacja interfejsu porównań
                if (AHP.interfaceMode === 'matrix') {
                    AHP.createMatrixOptionComparisons();
                } else if (AHP.interfaceMode === 'simplified') {
                    AHP.createSimplifiedInterface();
                }
            };
            
            inputRow.appendChild(label);
            inputRow.appendChild(input);
            optionsContainer.appendChild(inputRow);
        }
        
        // Aktualizuj nazwy opcji, jeśli są dostępne
        AHP.optionNames = [];
        for (let i = 0; i < AHP.numOptions; i++) {
            const input = document.getElementById(`option-name-${i}`);
            if (input) {
                AHP.optionNames.push(input.value || `Opcja ${i+1}`);
            } else {
                AHP.optionNames.push(`Opcja ${i+1}`);
            }
        }
        
        // Inicjalizacja macierzy porównań opcji
        // Zachowaj istniejące wartości, jeśli są dostępne
        let newOptionMatrices = Array(AHP.numCriteria).fill().map(() => 
            Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
        );
        
        // Kopiuj istniejące wartości
        if (AHP.optionComparisonMatrices) {
            for (let c = 0; c < AHP.numCriteria && c < AHP.optionComparisonMatrices.length; c++) {
                if (AHP.optionComparisonMatrices[c]) {
                    for (let i = 0; i < AHP.numOptions && i < AHP.optionComparisonMatrices[c].length; i++) {
                        if (AHP.optionComparisonMatrices[c][i]) {
                            for (let j = 0; j < AHP.numOptions && j < AHP.optionComparisonMatrices[c][i].length; j++) {
                                newOptionMatrices[c][i][j] = AHP.optionComparisonMatrices[c][i][j];
                            }
                        }
                    }
                }
            }
        }
        
        AHP.optionComparisonMatrices = newOptionMatrices;
        
        // Zawsze twórz interfejs porównań (skipComparisonSetup jest ignorowane)
        if (AHP.interfaceMode === 'matrix') {
            // Przygotuj macierz porównań dla kryteriów
            AHP.createCriteriaComparisonMatrix();
            
            // I interfejs porównań opcji
            AHP.createMatrixOptionComparisons();
        } else if (AHP.interfaceMode === 'simplified') {
            // Uproszczony interfejs zawiera już porównania kryteriów
            AHP.createSimplifiedInterface();
        }
    },
    
    createSimplifiedInterface: () => {
        console.log("Creating simplified interface for AHP");
        
        // Utwórz sekcję porównań kryteriów
        const criteriaContainer = document.getElementById('ahpCriteriaComparisonMatrix');
        criteriaContainer.innerHTML = '';
        
        const criteriaHeader = document.createElement('h3');
        criteriaHeader.textContent = 'Porównanie ważności kryteriów';
        criteriaContainer.appendChild(criteriaHeader);
        
        const criteriaDescription = document.createElement('p');
        criteriaDescription.className = 'comparison-description';
        criteriaDescription.textContent = 'Zaznacz, które kryterium jest ważniejsze i w jakim stopniu:';
        criteriaContainer.appendChild(criteriaDescription);
        
        // Inicjalizacja macierzy porównań, jeśli nie istnieje
        if (!AHP.criteriaComparisonMatrix || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
            console.log("Initializing criteria comparison matrix");
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        // Utwórz porównania dla wszystkich par kryteriów
        for (let i = 0; i < AHP.numCriteria; i++) {
            for (let j = i + 1; j < AHP.numCriteria; j++) {
                const comparisonRow = document.createElement('div');
                comparisonRow.className = 'simplified-comparison-row';
                
                // Lewe kryterium
                const leftCriterion = document.createElement('div');
                leftCriterion.className = 'criterion left-criterion';
                leftCriterion.textContent = AHP.criteriaNames[i];
                
                // Skala porównania
                const scaleContainer = document.createElement('div');
                scaleContainer.className = 'scale-container';
                
                // Etykiety skali
                const scaleLabels = document.createElement('div');
                scaleLabels.className = 'scale-labels';
                scaleLabels.innerHTML = '<span>9</span><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
                
                // Przyciski skali (radio)
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
                    
                    // Ustawienie domyślnej wartości na podstawie istniejącej macierzy
                    const currentValue = AHP.criteriaComparisonMatrix[i][j];
                    if ((k === 8 && currentValue === 1) || // Środkowa wartość (1)
                        (k < 8 && Math.abs(values[k] - currentValue) < 0.001) || // Lewe wartości
                        (k > 8 && Math.abs(values[k] - currentValue) < 0.001)) { // Prawe wartości
                        option.checked = true;
                    }
                    
                    option.onchange = () => {
                        // Pobierz indeks wybranej opcji
                        const idx = parseInt(option.getAttribute('data-k'));
                        const value = values[idx];
                        
                        // Aktualizuj wartość w macierzy porównań
                        AHP.updateSimplifiedComparisonValue(i, j, value);
                    };
                    
                    scaleOptions.appendChild(option);
                }
                
                // Prawe kryterium
                const rightCriterion = document.createElement('div');
                rightCriterion.className = 'criterion right-criterion';
                rightCriterion.textContent = AHP.criteriaNames[j];
                
                // Dodaj elementy do wiersza
                comparisonRow.appendChild(leftCriterion);
                
                scaleContainer.appendChild(scaleLabels);
                scaleContainer.appendChild(scaleOptions);
                comparisonRow.appendChild(scaleContainer);
                
                comparisonRow.appendChild(rightCriterion);
                
                // Dodaj wiersz do kontenera kryteriów
                criteriaContainer.appendChild(comparisonRow);
            }
        }
        
        // Teraz utwórz sekcję porównań opcji
        const container = document.getElementById('ahpOptionsComparisonSection');
        container.innerHTML = '';
        
        const header = document.createElement('h3');
        header.textContent = 'Porównanie opcji w kontekście każdego kryterium';
        container.appendChild(header);
        
        // Sprawdź, czy mamy odpowiednie struktury danych
        if (!AHP.optionComparisonMatrices || AHP.optionComparisonMatrices.length !== AHP.numCriteria) {
            console.log("Initializing option comparison matrices");
            AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
            );
        }
        
        // Kontener dla wszystkich paneli opcji
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-panels-container';
        
        // Dla każdego kryterium tworzymy panel porównań opcji
        for (let c = 0; c < AHP.numCriteria; c++) {
            const criteriaName = AHP.criteriaNames[c];
            
            const optionPanel = document.createElement('div');
            optionPanel.className = 'unified-panel option-panel';
            
            const optionPanelHeader = document.createElement('h4');
            optionPanelHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
            optionPanel.appendChild(optionPanelHeader);
            
            // Upewnij się, że mamy zainicjalizowaną macierz dla tego kryterium
            if (!AHP.optionComparisonMatrices[c] || AHP.optionComparisonMatrices[c].length !== AHP.numOptions) {
                AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
            }
            
            // Utwórz porównania dla wszystkich par opcji
            for (let i = 0; i < AHP.numOptions; i++) {
                for (let j = i + 1; j < AHP.numOptions; j++) {
                    const comparisonRow = document.createElement('div');
                    comparisonRow.className = 'simplified-comparison-row';
                    
                    // Lewa opcja
                    const leftOption = document.createElement('div');
                    leftOption.className = 'option left-option';
                    leftOption.textContent = AHP.optionNames[i];
                    
                    // Skala porównania
                    const scaleContainer = document.createElement('div');
                    scaleContainer.className = 'scale-container';
                    
                    // Etykiety skali
                    const scaleLabels = document.createElement('div');
                    scaleLabels.className = 'scale-labels';
                    scaleLabels.innerHTML = '<span>9</span><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
                    
                    // Przyciski skali (radio)
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
                        
                        // Ustawienie domyślnej wartości na podstawie istniejącej macierzy
                        const currentValue = AHP.optionComparisonMatrices[c][i][j];
                        if ((k === 8 && currentValue === 1) || // Środkowa wartość (1)
                            (k < 8 && Math.abs(values[k] - currentValue) < 0.001) || // Lewe wartości 
                            (k > 8 && Math.abs(values[k] - currentValue) < 0.001)) { // Prawe wartości
                            option.checked = true;
                        }
                        
                        option.onchange = () => {
                            // Pobierz dane z atrybutów
                            const criterion = parseInt(option.getAttribute('data-c'));
                            const optI = parseInt(option.getAttribute('data-i'));
                            const optJ = parseInt(option.getAttribute('data-j'));
                            const idx = parseInt(option.getAttribute('data-k'));
                            const value = values[idx];
                            
                            // Aktualizuj wartość w macierzy porównań
                            AHP.updateSimplifiedOptionComparisonValue(criterion, optI, optJ, value);
                        };
                        
                        scaleOptions.appendChild(option);
                    }
                    
                    // Prawa opcja
                    const rightOption = document.createElement('div');
                    rightOption.className = 'option right-option';
                    rightOption.textContent = AHP.optionNames[j];
                    
                    // Dodaj elementy do wiersza
                    comparisonRow.appendChild(leftOption);
                    
                    scaleContainer.appendChild(scaleLabels);
                    scaleContainer.appendChild(scaleOptions);
                    comparisonRow.appendChild(scaleContainer);
                    
                    comparisonRow.appendChild(rightOption);
                    
                    // Dodaj wiersz do kontenera
                    optionPanel.appendChild(comparisonRow);
                }
            }
            
            optionsContainer.appendChild(optionPanel);
        }
        
        container.appendChild(optionsContainer);
        
        // Dodaj przycisk do obliczania wyników
        const calculateButton = document.createElement('button');
        calculateButton.textContent = 'Oblicz wyniki AHP';
        calculateButton.onclick = AHP.calculate;
        calculateButton.className = 'calculate-button';
        container.appendChild(calculateButton);
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
        
        // Inicjalizacja macierzy porównań, jeśli nie istnieje
        if (!AHP.criteriaComparisonMatrix) {
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        // Aktualizuj macierz porównań
        AHP.criteriaComparisonMatrix[i][j] = value;
        AHP.criteriaComparisonMatrix[j][i] = 1 / value;
        
        // Ustaw odwrotność w komórce symetrycznej
        const reciprocalCell = document.getElementById(`criteria-comp-value-${j}-${i}`);
        reciprocalCell.textContent = (1 / value).toFixed(4);
        
        // Synchronizuj z uproszczonym interfejsem, jeśli istnieje
        if (AHP.interfaceMode === 'simplified') {
            const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
            let idx = values.findIndex(v => Math.abs(v - value) < 0.001);
            if (idx !== -1) {
                const radio = document.getElementById(`criteria-comp-${i}-${j}-${idx}`);
                if (radio) {
                    radio.checked = true;
                }
            }
        }
    },
    
    setupOptionComparisons: () => {
        // Zapisz nazwy opcji z formularza
        AHP.optionNames = [];
        for (let i = 0; i < AHP.numOptions; i++) {
            const input = document.getElementById(`option-name-${i}`);
            AHP.optionNames.push(input.value || `Opcja ${i+1}`);
        }
        
        // Inicjalizacja macierzy porównań opcji
        AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
            Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
        );
        
        // Wybierz odpowiednią metodę tworzenia interfejsu porównań
        if (AHP.interfaceMode === 'matrix') {
            AHP.createMatrixOptionComparisons();
        } else if (AHP.interfaceMode === 'simplified') {
            AHP.createSimplifiedInterface();
        }
    },
    
    createMatrixOptionComparisons: () => {
        // Utwórz macierze porównań dla opcji w kontekście każdego kryterium
        const container = document.getElementById('ahpOptionsComparisonSection');
        container.innerHTML = '';
        
        const header = document.createElement('h3');
        header.textContent = 'Porównanie opcji w kontekście każdego kryterium';
        container.appendChild(header);
        
        // Utwórz zakładki dla kryteriów
        const tabs = document.createElement('div');
        tabs.className = 'comparison-tabs';
        container.appendChild(tabs);
        
        for (let c = 0; c < AHP.numCriteria; c++) {
            const criteriaName = AHP.criteriaNames[c];
            
            // Kontener dla porównań opcji dla danego kryterium
            const criteriaContainer = document.createElement('div');
            criteriaContainer.id = `comparison-for-criteria-${c}`;
            criteriaContainer.className = 'criteria-comparison-container';
            criteriaContainer.style.display = c === 0 ? 'block' : 'none';
            
            const criteriaHeader = document.createElement('h4');
            criteriaHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
            criteriaContainer.appendChild(criteriaHeader);
            
            // Tabela porównań dla opcji
            const table = document.createElement('table');
            table.className = 'comparison-matrix';
            
            // Nagłówki kolumn
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            // Pusta komórka w lewym górnym rogu
            headerRow.appendChild(document.createElement('th'));
            
            for (let o = 0; o < AHP.numOptions; o++) {
                const th = document.createElement('th');
                th.textContent = AHP.optionNames[o];
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
                        select.id = `options-comp-${c}-${i}-${j}`;
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
                        td.id = `options-comp-value-${c}-${i}-${j}`;
                        td.textContent = '1';
                    }
                    
                    row.appendChild(td);
                }
                
                tbody.appendChild(row);
            }
            
            table.appendChild(tbody);
            criteriaContainer.appendChild(table);
            container.appendChild(criteriaContainer);
            
            // Przycisk zakładki
            const tabButton = document.createElement('button');
            tabButton.textContent = criteriaName;
            tabButton.onclick = () => {
                for (let i = 0; i < AHP.numCriteria; i++) {
                    const cont = document.getElementById(`comparison-for-criteria-${i}`);
                    cont.style.display = i === c ? 'block' : 'none';
                }
                 
                // Podświetlenie aktywnej zakładki
                const allTabs = tabs.querySelectorAll('button');
                allTabs.forEach(tab => tab.classList.remove('active'));
                tabButton.classList.add('active');
            };
            
            // Aktywuj pierwszą zakładkę
            if (c === 0) {
                tabButton.classList.add('active');
            }
            
            tabs.appendChild(tabButton);
        }
        
        // Dodaj przycisk do obliczania wyników
        const calculateButton = document.createElement('button');
        calculateButton.textContent = 'Oblicz wyniki AHP';
        calculateButton.onclick = AHP.calculate;
        calculateButton.className = 'calculate-button';
        container.appendChild(calculateButton);
    },
    
    updateOptionComparisonValue: (c, i, j) => {
        // Pobierz wartość wybraną przez użytkownika
        const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
        const value = parseFloat(select.value);
        
        // Zapisz wartość w macierzy porównań
        AHP.optionComparisonMatrices[c][i][j] = value;
        AHP.optionComparisonMatrices[c][j][i] = 1 / value;
        
        // Aktualizuj wyświetlaną odwrotność
        const reciprocalCell = document.getElementById(`options-comp-value-${c}-${j}-${i}`);
        if (reciprocalCell) {
            reciprocalCell.textContent = (1 / value).toFixed(4);
        }
        
        // Synchronizuj z uproszczonym interfejsem, jeśli istnieje
        if (AHP.interfaceMode === 'simplified') {
            const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
            let idx = values.findIndex(v => Math.abs(v - value) < 0.001);
            if (idx !== -1) {
                const radio = document.getElementById(`options-comp-${c}-${i}-${j}-${idx}`);
                if (radio) {
                    radio.checked = true;
                }
            }
        }
    },
    
    updateSimplifiedOptionComparisonValue: (c, i, j, value) => {
        // Zapisz wartość w macierzy porównań
        AHP.optionComparisonMatrices[c][i][j] = value;
        AHP.optionComparisonMatrices[c][j][i] = 1 / value;
        
        // Synchronizuj z macierzowym interfejsem, jeśli jest otwarty w innej karcie
        if (AHP.interfaceMode === 'matrix') {
            // Znajdź select i ustaw mu wartość
            const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
            if (select) {
                select.value = value;
                // Aktualizuj wyświetlaną odwrotność
                const reciprocalCell = document.getElementById(`options-comp-value-${c}-${j}-${i}`);
                if (reciprocalCell) {
                    reciprocalCell.textContent = (1 / value).toFixed(4);
                }
            }
        }
        
        // Automatycznie przelicz wyniki przy zmianie wartości
        // Ustawienie opóźnienia, aby nie przeliczać zbyt często przy wielu zmianach
        if (AHP.calculationTimeout) {
            clearTimeout(AHP.calculationTimeout);
        }
        
        AHP.calculationTimeout = setTimeout(() => {
            AHP.calculate();
        }, 500);
    },
    
    getMatrixFromInputs: (type, criteriaIdx = null) => {
        if (type === 'criteria') {
            return AHP.criteriaComparisonMatrix;
        } else if (type === 'options' && criteriaIdx !== null) {
            return AHP.optionComparisonMatrices[criteriaIdx];
            }
        return null;
    },
    
    calculateEigenvector: (matrix) => {
        const n = matrix.length;
        
        // Metoda przybliżona - mnożenie każdego wiersza i obliczenie pierwiastka n-tego stopnia
        let eigenvalues = [];
        
        // Obliczanie iloczynu elementów w każdym wierszu
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
        // Obliczamy wektor preferencji ważonej (weighted preference vector)
        let weightedPreferenceVector = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                weightedPreferenceVector[i] += matrix[i][j] * normalizedEigenvalues[j];
        }
        }
        
        // Dzielimy przez odpowiednie wartości z wektora własnego
        const consistencyVector = weightedPreferenceVector.map((val, idx) => 
            val / normalizedEigenvalues[idx]
        );
        
        // Obliczamy lambda_max jako średnią elementów wektora spójności
        const lambda_max = consistencyVector.reduce((a, b) => a + b, 0) / n;
        
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
            
            // Sprawdź CR dla kryteriów i wyświetl ostrzeżenie, ale nie przerywaj obliczeń
            let warningMessages = [];
            if (criteriaResult.CR > 0.1) {
                warningMessages.push(`<div class="cr-warning">Uwaga: Współczynnik spójności (CR) dla porównań kryteriów wynosi ${criteriaResult.CR.toFixed(4)}, 
                    co przekracza zalecaną wartość 0.1. Rozważ ponowną ocenę porównań.</div>`);
            }
            
            // 2. Dla każdego kryterium, pobierz macierz porównań opcji
            AHP.localOptionWeights = [];  // Wagi lokalne opcji dla każdego kryterium
            
            let inconsistentCriteria = [];
            
            for (let c = 0; c < AHP.numCriteria; c++) {
                const optionMatrix = AHP.getMatrixFromInputs('options', c);
                const optionResult = AHP.calculateEigenvector(optionMatrix);
                
                AHP.localOptionWeights.push(optionResult.eigenvalues);
                
                // Sprawdź CR dla opcji
                if (optionResult.CR > 0.1) {
                    inconsistentCriteria.push({
                        name: AHP.criteriaNames[c],
                        cr: optionResult.CR
                    });
                }
            }
            
            // Jeśli którekolwiek z porównań jest niespójne, pokaż ostrzeżenie, ale nie przerywaj obliczeń
            if (inconsistentCriteria.length > 0) {
                let warningHtml = `<div class="cr-warning">Uwaga: Współczynnik spójności (CR) dla porównań opcji 
                    przekracza zalecaną wartość 0.1 dla następujących kryteriów:<ul>`;
                
                for (const item of inconsistentCriteria) {
                    warningHtml += `<li>${item.name}: CR = ${item.cr.toFixed(4)}</li>`;
                }
                
                warningHtml += `</ul>Rozważ ponowną ocenę porównań.</div>`;
                warningMessages.push(warningHtml);
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
            
            // 6. Wyświetl ostrzeżenia (jeśli istnieją)
            if (warningMessages.length > 0) {
                const warningsContainer = document.createElement('div');
                warningsContainer.className = 'warnings-container';
                warningsContainer.innerHTML = warningMessages.join('');
                
                // Dodaj ostrzeżenia na górze wyników
                const resultsContainer = document.getElementById('ahpResults');
                resultsContainer.insertBefore(warningsContainer, resultsContainer.firstChild);
            }
            
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
        bestOptionScore.textContent = (AHP.globalOptionWeights[bestOptionIndex] * 100).toFixed(4) + '%';
        
        bestOptionDisplay.appendChild(bestOptionLabel);
        bestOptionDisplay.appendChild(bestOptionName);
        bestOptionDisplay.appendChild(bestOptionScore);
        
        mainResult.appendChild(bestOptionDisplay);
        container.appendChild(mainResult);
        
        // Diagnostyka macierzy - współczynniki spójności
        const diagnosticsSection = document.createElement('div');
        diagnosticsSection.className = 'diagnostics-section';
        
        const diagnosticsTitle = document.createElement('h4');
        diagnosticsTitle.textContent = 'Diagnostyka spójności macierzy porównań';
        diagnosticsSection.appendChild(diagnosticsTitle);
        
        // Wyliczamy współczynniki spójności
        const criteriaResult = AHP.calculateEigenvector(AHP.criteriaComparisonMatrix);
        
        const diagnosticsInfo = document.createElement('div');
        diagnosticsInfo.className = 'diagnostics-info';
        
        // Informacja o współczynniku spójności kryteriów
        const criteriaCR = document.createElement('div');
        criteriaCR.className = criteriaResult.CR <= 0.1 ? 'cr-ok' : 'cr-warning';
        criteriaCR.innerHTML = `<strong>Współczynnik spójności (CR) dla kryteriów:</strong> ${criteriaResult.CR.toFixed(4)} 
            ${criteriaResult.CR <= 0.1 ? '✓' : '⚠️'} 
            <br><small>λ<sub>max</sub> = ${criteriaResult.lambda_max.toFixed(4)}, 
            CI = ${criteriaResult.CI.toFixed(4)}, 
            RI = ${AHP.RI[AHP.numCriteria]}</small>`;
        
        diagnosticsInfo.appendChild(criteriaCR);
        
        // Informacje o współczynnikach spójności opcji
        for (let c = 0; c < AHP.numCriteria; c++) {
            const optionMatrix = AHP.getMatrixFromInputs('options', c);
            const optionResult = AHP.calculateEigenvector(optionMatrix);
            
            const optionCR = document.createElement('div');
            optionCR.className = optionResult.CR <= 0.1 ? 'cr-ok' : 'cr-warning';
            optionCR.innerHTML = `<strong>CR dla opcji względem "${AHP.criteriaNames[c]}":</strong> ${optionResult.CR.toFixed(4)} 
                ${optionResult.CR <= 0.1 ? '✓' : '⚠️'} 
                <br><small>λ<sub>max</sub> = ${optionResult.lambda_max.toFixed(4)}, 
                CI = ${optionResult.CI.toFixed(4)}, 
                RI = ${AHP.RI[AHP.numOptions]}</small>`;
            
            diagnosticsInfo.appendChild(optionCR);
        }
        
        diagnosticsSection.appendChild(diagnosticsInfo);
        container.appendChild(diagnosticsSection);
        
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
        criteriaHeader.innerHTML = '<th>Kryterium</th><th>Waga</th><th>Waga (%)</th>';
        criteriaTable.appendChild(criteriaHeader);
        
        // Wiersze tabeli kryteriów
        for (let i = 0; i < AHP.numCriteria; i++) {
            const row = document.createElement('tr');
            const criteria = AHP.criteriaNames[i];
            const weight = AHP.criteriaPriorities[i];
            
            row.innerHTML = `<td>${criteria}</td>
                            <td>${weight.toFixed(6)}</td>
                            <td>${(weight * 100).toFixed(4)}%</td>`;
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
        finalHeader.innerHTML = '<th>Ranking</th><th>Opcja</th><th>Wynik</th><th>Wynik (%)</th>';
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
            
            row.innerHTML = `<td>${i+1}</td>
                            <td>${option}</td>
                            <td>${score.toFixed(6)}</td>
                            <td class="final-score">${(score * 100).toFixed(4)}%</td>`;
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
            breakdownHeader.innerHTML += `<th title="Waga: ${(AHP.criteriaPriorities[c] * 100).toFixed(4)}%">${AHP.criteriaNames[c]}</th>`;
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
                    title="Wynik lokalny: ${(localScore * 100).toFixed(4)}%, 
                    Po zważeniu: ${(weightedScore * 100).toFixed(4)}%">
                    ${(weightedScore * 100).toFixed(4)}%</td>`;
            }
            
            rowHtml += `<td class="final-score">${(AHP.globalOptionWeights[o] * 100).toFixed(4)}%</td>`;
            
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
        
        // Dodatkowa sekcja: dokładna macierz porównań i wektory własne
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
        
        let detailedHTML = '<h4>Macierz porównań kryteriów</h4>';
        detailedHTML += '<table class="results-table">';
        detailedHTML += '<tr><th></th>';
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            detailedHTML += `<th>${AHP.criteriaNames[i]}</th>`;
        }
        detailedHTML += '<th>Wektor własny</th></tr>';
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            detailedHTML += `<tr><th>${AHP.criteriaNames[i]}</th>`;
            for (let j = 0; j < AHP.numCriteria; j++) {
                detailedHTML += `<td>${AHP.criteriaComparisonMatrix[i][j].toFixed(6)}</td>`;
            }
            detailedHTML += `<td>${AHP.criteriaPriorities[i].toFixed(6)}</td></tr>`;
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
                    detailedHTML += `<td>${AHP.optionComparisonMatrices[c][i][j].toFixed(6)}</td>`;
                }
                detailedHTML += `<td>${AHP.localOptionWeights[c][i].toFixed(6)}</td></tr>`;
            }
            detailedHTML += '</table>';
        }
        
        detailedData.innerHTML = detailedHTML;
        detailedSection.appendChild(detailedData);
        
        container.appendChild(detailedSection);

        // Dodanie przycisku pobierania wyników
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
        
        // Dodaj przycisk do eksportu danych do formatu Python
        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-container';
        
        const exportButton = document.createElement('button');
        exportButton.textContent = 'Eksportuj dane dla analizy w Pythonie';
        exportButton.className = 'export-button';
        exportButton.onclick = AHP.exportToPython;
        
        exportContainer.appendChild(exportButton);
        container.appendChild(exportContainer);
        
        // Wyemituj zdarzenie po zakończeniu wizualizacji
        document.dispatchEvent(new Event('calculation-complete'));
    },
    
    // Nowa funkcja do eksportu danych dla porównania z aplikacją referencyjną
    exportToPython: () => {
        // Tworzymy kod Pythona reprezentujący bieżące dane
        let pythonCode = `# Kod Pythona do analizy AHP z używając biblioteki ahpy lub innej\n\n`;
        pythonCode += `import numpy as np\nimport pandas as pd\n`;
        pythonCode += `# Możesz użyć biblioteki ahpy lub innej implementacji AHP\n\n`;
        
        // Nazwy kryteriów i opcji
        pythonCode += `# Nazwy kryteriów i opcji\n`;
        pythonCode += `criteria_names = ${JSON.stringify(AHP.criteriaNames)}\n`;
        pythonCode += `option_names = ${JSON.stringify(AHP.optionNames)}\n\n`;
        
        // Macierz porównań kryteriów
        pythonCode += `# Macierz porównań kryteriów\n`;
        pythonCode += `criteria_comparison_matrix = np.array([\n`;
        for (let i = 0; i < AHP.numCriteria; i++) {
            pythonCode += `    [${AHP.criteriaComparisonMatrix[i].join(', ')}],\n`;
        }
        pythonCode += `])\n\n`;
        
        // Macierze porównań opcji
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
        
        // Wyniki obliczeń
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
        
        // Najlepsza opcja
        let bestOptionIndex = 0;
        for (let i = 1; i < AHP.numOptions; i++) {
            if (AHP.globalOptionWeights[i] > AHP.globalOptionWeights[bestOptionIndex]) {
                bestOptionIndex = i;
            }
        }
        
        pythonCode += `# Najlepsza opcja: "${AHP.optionNames[bestOptionIndex]}" z wynikiem ${AHP.globalOptionWeights[bestOptionIndex]}\n`;
        
        // Stwórz element textarea z kodem
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
    },
    
    updateSimplifiedComparisonValue: (i, j, value) => {
        // W przypadku uproszczonego interfejsu wartości są od razu aktualizowane
        if (!AHP.criteriaComparisonMatrix) {
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        AHP.criteriaComparisonMatrix[i][j] = value;
        AHP.criteriaComparisonMatrix[j][i] = 1 / value;
        
        // Synchronizuj z macierzowym interfejsem, jeśli jest otwarty w innej karcie
        if (AHP.interfaceMode === 'matrix') {
            // Znajdź select i ustaw mu wartość
            const select = document.getElementById(`criteria-comp-${i}-${j}`);
            if (select) {
                select.value = value;
                // Aktualizuj wyświetlaną odwrotność
                const reciprocalCell = document.getElementById(`criteria-comp-value-${j}-${i}`);
                if (reciprocalCell) {
                    reciprocalCell.textContent = (1 / value).toFixed(4);
                }
            }
        }
        
        // Automatycznie przelicz wyniki przy zmianie wartości
        // Ustawienie opóźnienia, aby nie przeliczać zbyt często przy wielu zmianach
        if (AHP.calculationTimeout) {
            clearTimeout(AHP.calculationTimeout);
        }
        
        AHP.calculationTimeout = setTimeout(() => {
            AHP.calculate();
        }, 500);
    },

    // Funkcja obliczająca wyniki AHP
    calculate: () => {
        try {
            // 1. Pobierz i zwaliduj macierz porównań kryteriów
            const criteriaMatrix = AHP.getMatrixFromInputs('criteria');
            const criteriaResult = AHP.calculateEigenvector(criteriaMatrix);
            AHP.criteriaPriorities = criteriaResult.eigenvalues;
            
            // Sprawdź CR dla kryteriów i wyświetl ostrzeżenie, ale nie przerywaj obliczeń
            let warningMessages = [];
            if (criteriaResult.CR > 0.1) {
                warningMessages.push(`<div class="cr-warning">Uwaga: Współczynnik spójności (CR) dla porównań kryteriów wynosi ${criteriaResult.CR.toFixed(4)}, 
                    co przekracza zalecaną wartość 0.1. Rozważ ponowną ocenę porównań.</div>`);
            }
            
            // 2. Dla każdego kryterium, pobierz macierz porównań opcji
            AHP.localOptionWeights = [];  // Wagi lokalne opcji dla każdego kryterium
            
            let inconsistentCriteria = [];
            
            for (let c = 0; c < AHP.numCriteria; c++) {
                const optionMatrix = AHP.getMatrixFromInputs('options', c);
                const optionResult = AHP.calculateEigenvector(optionMatrix);
                
                AHP.localOptionWeights.push(optionResult.eigenvalues);
                
                // Sprawdź CR dla opcji
                if (optionResult.CR > 0.1) {
                    inconsistentCriteria.push({
                        name: AHP.criteriaNames[c],
                        cr: optionResult.CR
                    });
                }
            }
            
            // Jeśli którekolwiek z porównań jest niespójne, pokaż ostrzeżenie, ale nie przerywaj obliczeń
            if (inconsistentCriteria.length > 0) {
                let warningHtml = `<div class="cr-warning">Uwaga: Współczynnik spójności (CR) dla porównań opcji 
                    przekracza zalecaną wartość 0.1 dla następujących kryteriów:<ul>`;
                
                for (const item of inconsistentCriteria) {
                    warningHtml += `<li>${item.name}: CR = ${item.cr.toFixed(4)}</li>`;
                }
                
                warningHtml += `</ul>Rozważ ponowną ocenę porównań.</div>`;
                warningMessages.push(warningHtml);
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
            
            // 6. Wyświetl ostrzeżenia (jeśli istnieją)
            if (warningMessages.length > 0) {
                const warningsContainer = document.createElement('div');
                warningsContainer.className = 'warnings-container';
                warningsContainer.innerHTML = warningMessages.join('');
                
                // Dodaj ostrzeżenia na górze wyników
                const resultsContainer = document.getElementById('ahpResults');
                resultsContainer.insertBefore(warningsContainer, resultsContainer.firstChild);
            }
            
        } catch (error) {
            console.error("Błąd w obliczeniach AHP:", error);
            Utils.displayResults('ahpResults', `Błąd w obliczeniach: ${error.message}`, true);
        }
    },
    
    // Funkcja do pobierania wyników w formacie CSV
    downloadResultsCSV: () => {
        // Przygotuj dane
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Dodaj nagłówek z informacjami o analizie
        csvContent += "Wyniki analizy AHP\r\n\r\n";
        
        // Ranking opcji
        csvContent += "Ranking opcji (wynik końcowy)\r\n";
        csvContent += "Ranking,Opcja,Wynik,Wynik (%)\r\n";
        
        // Posortowane indeksy opcji według wyniku
        const sortedIndices = Array.from({length: AHP.numOptions}, (_, i) => i)
            .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a]);
        
        // Wiersze z wynikami opcji
        for (let i = 0; i < sortedIndices.length; i++) {
            const optionIndex = sortedIndices[i];
            const option = AHP.optionNames[optionIndex];
            const score = AHP.globalOptionWeights[optionIndex];
            
            csvContent += `${i+1},${option},${score.toFixed(6)},${(score * 100).toFixed(4)}%\r\n`;
        }
        
        // Dodaj pustą linię dla oddzielenia sekcji
        csvContent += "\r\n";
        
        // Wagi kryteriów
        csvContent += "Wagi kryteriów\r\n";
        csvContent += "Kryterium,Waga,Waga (%)\r\n";
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            const criteria = AHP.criteriaNames[i];
            const weight = AHP.criteriaPriorities[i];
            
            csvContent += `${criteria},${weight.toFixed(6)},${(weight * 100).toFixed(4)}%\r\n`;
        }
        
        // Dodaj pustą linię dla oddzielenia sekcji
        csvContent += "\r\n";
        
        // Rozbicie wyników według kryteriów
        csvContent += "Rozbicie wyników według kryteriów\r\n";
        csvContent += "Opcja";
        
        for (let c = 0; c < AHP.numCriteria; c++) {
            csvContent += `,${AHP.criteriaNames[c]}`;
        }
        
        csvContent += ",Wynik całkowity\r\n";
        
        for (let o = 0; o < AHP.numOptions; o++) {
            csvContent += `${AHP.optionNames[o]}`;
            
            for (let c = 0; c < AHP.numCriteria; c++) {
                const localScore = AHP.localOptionWeights[c][o];
                const weightedScore = localScore * AHP.criteriaPriorities[c];
                csvContent += `,${(weightedScore * 100).toFixed(4)}%`;
            }
            
            csvContent += `,${(AHP.globalOptionWeights[o] * 100).toFixed(4)}%\r\n`;
        }
        
        // Utwórz link do pobrania pliku
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "wyniki_ahp.csv");
        document.body.appendChild(link);
        
        // Kliknij link, aby rozpocząć pobieranie
        link.click();
        
        // Usuń link
        document.body.removeChild(link);
    },
    
    // Funkcja do pobierania wyników w formacie JSON
    downloadResultsJSON: () => {
        // Przygotuj obiekt z wynikami
        const results = {
            data: {
                criteria: {
                    names: AHP.criteriaNames,
                    priorities: AHP.criteriaPriorities.map(p => parseFloat(p.toFixed(6)))
                },
                options: {
                    names: AHP.optionNames,
                    globalWeights: AHP.globalOptionWeights.map(w => parseFloat(w.toFixed(6)))
                },
                localWeights: AHP.localOptionWeights.map(weights => 
                    weights.map(w => parseFloat(w.toFixed(6)))
                ),
                ranking: Array.from({length: AHP.numOptions}, (_, i) => i)
                    .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a])
                    .map(idx => ({
                        rankPosition: Array.from({length: AHP.numOptions}, (_, i) => i)
                            .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a])
                            .indexOf(idx) + 1,
                        optionIndex: idx,
                        optionName: AHP.optionNames[idx],
                        score: parseFloat(AHP.globalOptionWeights[idx].toFixed(6)),
                        scorePercent: parseFloat((AHP.globalOptionWeights[idx] * 100).toFixed(4))
                    }))
            },
            diagnostics: {
                criteriaMatrix: AHP.criteriaComparisonMatrix.map(row => 
                    row.map(v => parseFloat(v.toFixed(6)))
                ),
                optionMatrices: AHP.optionComparisonMatrices.map(matrix => 
                    matrix.map(row => row.map(v => parseFloat(v.toFixed(6))))
                )
            }
        };
        
        // Konwertuj obiekt na format JSON
        const jsonContent = "data:text/json;charset=utf-8," + 
            encodeURIComponent(JSON.stringify(results, null, 2));
        
        // Utwórz link do pobrania pliku
        const link = document.createElement("a");
        link.setAttribute("href", jsonContent);
        link.setAttribute("download", "wyniki_ahp.json");
        document.body.appendChild(link);
        
        // Kliknij link, aby rozpocząć pobieranie
        link.click();
        
        // Usuń link
        document.body.removeChild(link);
    },
    
    // Funkcja do pobierania wyników w formacie TXT
    downloadResultsTXT: () => {
        // Przygotuj zawartość pliku TXT
        let txtContent = "WYNIKI ANALIZY AHP\n";
        txtContent += "=================\n\n";
        
        // Najlepsza opcja
        let bestOptionIndex = 0;
        for (let i = 1; i < AHP.numOptions; i++) {
            if (AHP.globalOptionWeights[i] > AHP.globalOptionWeights[bestOptionIndex]) {
                bestOptionIndex = i;
            }
        }
        
        txtContent += "NAJLEPSZA OPCJA: " + AHP.optionNames[bestOptionIndex] + "\n";
        txtContent += "WYNIK: " + (AHP.globalOptionWeights[bestOptionIndex] * 100).toFixed(4) + "%\n\n";
        
        // Ranking opcji
        txtContent += "RANKING OPCJI (WYNIK KOŃCOWY)\n";
        txtContent += "-----------------------------\n";
        txtContent += "Ranking | Opcja | Wynik | Wynik (%)\n";
        
        // Posortowane indeksy opcji według wyniku
        const sortedIndices = Array.from({length: AHP.numOptions}, (_, i) => i)
            .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a]);
        
        // Wiersze z wynikami opcji
        for (let i = 0; i < sortedIndices.length; i++) {
            const optionIndex = sortedIndices[i];
            const option = AHP.optionNames[optionIndex];
            const score = AHP.globalOptionWeights[optionIndex];
            
            txtContent += `${i+1} | ${option} | ${score.toFixed(6)} | ${(score * 100).toFixed(4)}%\n`;
        }
        
        txtContent += "\n";
        
        // Wagi kryteriów
        txtContent += "WAGI KRYTERIÓW\n";
        txtContent += "--------------\n";
        txtContent += "Kryterium | Waga | Waga (%)\n";
        
        for (let i = 0; i < AHP.numCriteria; i++) {
            const criteria = AHP.criteriaNames[i];
            const weight = AHP.criteriaPriorities[i];
            
            txtContent += `${criteria} | ${weight.toFixed(6)} | ${(weight * 100).toFixed(4)}%\n`;
        }
        
        txtContent += "\n";
        
        // Rozbicie wyników według kryteriów
        txtContent += "ROZBICIE WYNIKÓW WEDŁUG KRYTERIÓW\n";
        txtContent += "---------------------------------\n";
        txtContent += "Opcja";
        
        for (let c = 0; c < AHP.numCriteria; c++) {
            txtContent += ` | ${AHP.criteriaNames[c]}`;
        }
        
        txtContent += " | Wynik całkowity\n";
        
        for (let o = 0; o < AHP.numOptions; o++) {
            txtContent += `${AHP.optionNames[o]}`;
            
            for (let c = 0; c < AHP.numCriteria; c++) {
                const localScore = AHP.localOptionWeights[c][o];
                const weightedScore = localScore * AHP.criteriaPriorities[c];
                txtContent += ` | ${(weightedScore * 100).toFixed(4)}%`;
            }
            
            txtContent += ` | ${(AHP.globalOptionWeights[o] * 100).toFixed(4)}%\n`;
        }
        
        // Utwórz link do pobrania pliku
        const txtBlob = new Blob([txtContent], { type: 'text/plain' });
        const txtUrl = URL.createObjectURL(txtBlob);
        
        const link = document.createElement("a");
        link.setAttribute("href", txtUrl);
        link.setAttribute("download", "wyniki_ahp.txt");
        document.body.appendChild(link);
        
        // Kliknij link, aby rozpocząć pobieranie
        link.click();
        
        // Usuń link i zwolnij URL
        document.body.removeChild(link);
        URL.revokeObjectURL(txtUrl);
    },
    
    // Funkcja pomocnicza do pokazywania kodu
    showCodeModal: (codeTitle, code) => {
        // Zamknij wcześniejsze modalne, jeśli istnieją
        const existingModal = document.getElementById('ahp-export-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Stwórz element modalny
        const exportModal = document.createElement('div');
        exportModal.id = 'ahp-export-modal';
        exportModal.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'close-button';
        closeButton.onclick = () => {
            exportModal.remove();
        };
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = codeTitle;
        
        const modalDescription = document.createElement('p');
        modalDescription.textContent = 'Poniższy kod zawiera wyniki analizy AHP:';
        
        const codeArea = document.createElement('pre');
        codeArea.className = 'code-area';
        codeArea.textContent = code;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.textContent = 'Kopiuj do schowka';
        copyButton.onclick = () => {
            navigator.clipboard.writeText(code)
                .then(() => {
                    copyButton.textContent = 'Skopiowano!';
                    setTimeout(() => {
                        copyButton.textContent = 'Kopiuj do schowka';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Błąd podczas kopiowania: ', err);
                    copyButton.textContent = 'Błąd kopiowania';
                });
        };
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalDescription);
        modalContent.appendChild(codeArea);
        modalContent.appendChild(copyButton);
        
        exportModal.appendChild(modalContent);
        document.body.appendChild(exportModal);
    }
} 