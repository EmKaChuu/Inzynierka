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
    comparisonValues: [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9], // Tablica wartości porównań

    init: () => {
        console.log("Executing AHP.init()");
        Utils.hideElement('ahpResults');
        
        // Inicjalizacja początkowa macierzy
        AHP.numCriteria = parseInt(document.getElementById('ahpNumCriteria').value) || 3;
        
        // Pobierz wartość numOptions z dodanego pola
        const optionsInput = document.getElementById('ahpNumOptions');
        AHP.numOptions = optionsInput ? parseInt(optionsInput.value) || 3 : 3; // Domyślna wartość 3
        
        // Inicjalizacja macierzy porównań
        AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
            Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
        );
        
        // Inicjalizacja nazw kryteriów i opcji
        AHP.criteriaNames = Array(AHP.numCriteria).fill().map((_, i) => `Kryterium ${i+1}`);
        AHP.optionNames = Array(AHP.numOptions).fill().map((_, i) => `Opcja ${i+1}`);
        
        // Ustawienie przycisków w interfejsie
        AHP.setupInterfaceButtons();
        
        // Dodanie nasłuchiwania zmian w polach liczby kryteriów dla dynamicznej aktualizacji
        const numCriteriaInput = document.getElementById('ahpNumCriteria');
        
        // Usuwamy istniejących listenerów, jeśli były dodane wcześniej
        const oldCriteriaInput = numCriteriaInput.cloneNode(true);
        numCriteriaInput.parentNode.replaceChild(oldCriteriaInput, numCriteriaInput);
        
        // Dodajemy nowe listenery do obu zdarzeń
        oldCriteriaInput.addEventListener('input', function() {
            AHP.setupInputs();
        });
        
        oldCriteriaInput.addEventListener('change', function() {
            AHP.setupInputs();
        });
        
        // Również dodajemy listenery do pola liczby opcji, jeśli zostało już dodane przez App.initialize()
        if (optionsInput) {
            // Dodanie listenerów do pola numOptions odbywa się w script.js podczas tworzenia pola
            // Jeśli mielibyśmy tworzyć je tutaj, byłoby to zduplikowane
            console.log("NumOptions field already exists, skipping event listener setup (should be done in App.initialize)");
        }
        
        // Automatyczne tworzenie interfejsu bez konieczności klikania przycisków
        AHP.setupInputs();
    },
    
    setupInterfaceButtons: () => {
        // Ustawienie przełącznika trybu interfejsu
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
        
        // Przycisk przykładowych danych jest ukryty, więc pomijamy dodawanie listenera
        // document.getElementById('python-test-button').addEventListener('click', AHP.loadPythonExampleData);
    },

    setupInputs: () => {
        console.log("Setting up AHP inputs for mode: " + AHP.interfaceMode);
        const newNumCriteria = parseInt(document.getElementById('ahpNumCriteria').value) || 3;
        
        if (newNumCriteria < 3 || newNumCriteria > 6) {
            Utils.displayResults('ahpResults', 'Liczba kryteriów musi być między 3 a 6', true);
            return;
        }
        
        // Zapisz bieżący stan danych przed zmianą liczby kryteriów
        if (AHP.numCriteria !== newNumCriteria) {
            AHP.saveCurrentComparisonData();
        }
        
        // Aktualizuj liczbę kryteriów
        AHP.numCriteria = newNumCriteria;
        
        // Przygotuj pola na nazwy kryteriów
        const criteriaContainer = document.querySelector('#ahpCriteriaNames .criteria-inputs-container');
        criteriaContainer.innerHTML = '';
        
        // Zachowaj istniejące nazwy kryteriów i dodaj nowe, jeśli potrzeba
        if (!AHP.criteriaNames || AHP.criteriaNames.length !== AHP.numCriteria) {
            // Tymczasowa kopia starych nazw
            const oldNames = AHP.criteriaNames || [];
            
            // Inicjalizacja nowej tablicy nazw
            AHP.criteriaNames = Array(AHP.numCriteria).fill().map((_, i) => {
                // Zachowaj istniejące nazwy, jeśli są dostępne
                if (i < oldNames.length) {
                    return oldNames[i];
                } else {
                    return `Kryterium ${i+1}`;
                }
            });
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
        
        // Wyczyść matryce porównań i wyniki
        Utils.clearElement('ahpCriteriaComparisonMatrix');
        Utils.clearElement('ahpOptionsComparisonSection');
        Utils.hideElement('ahpResults');
        Utils.clearElement('ahpVisualization');
        
        // Zachowaj istniejące wartości macierzy porównań kryteriów i dodaj nowe, jeśli potrzeba
        if (!AHP.criteriaComparisonMatrix || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
            // Tymczasowa kopia starej macierzy
            const oldMatrix = AHP.criteriaComparisonMatrix || [];
            
            // Inicjalizacja nowej macierzy
            const newMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
            
            // Kopiuj istniejące wartości
            for (let i = 0; i < AHP.numCriteria && i < oldMatrix.length; i++) {
                if (oldMatrix[i]) {
                    for (let j = 0; j < AHP.numCriteria && j < oldMatrix[i].length; j++) {
                        newMatrix[i][j] = oldMatrix[i][j];
                    }
                }
            }
            
            AHP.criteriaComparisonMatrix = newMatrix;
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
        
        // Pobierz wartość liczby opcji z pola, które jest teraz stałym elementem HTML
        const optionsInput = document.getElementById('ahpNumOptions');
        const newNumOptions = optionsInput ? parseInt(optionsInput.value) || 3 : 3;
        
        if (newNumOptions < 2 || newNumOptions > 6) {
            Utils.displayResults('ahpResults', 'Liczba opcji musi być między 2 a 6', true);
            return;
        }

        // Zapisz bieżący stan danych przed zmianą liczby opcji
        if (AHP.numOptions !== newNumOptions) {
            AHP.saveCurrentComparisonData();
        }
        
        // Aktualizuj liczbę opcji
        AHP.numOptions = newNumOptions;

        // Zapisz nazwy kryteriów
        AHP.criteriaNames = [];
        for (let i = 0; i < AHP.numCriteria; i++) {
            const input = document.getElementById(`criteria-name-${i}`);
            AHP.criteriaNames.push(input ? input.value || `Kryterium ${i+1}` : `Kryterium ${i+1}`);
        }
        
        // Zachowaj istniejące nazwy opcji i dodaj nowe, jeśli potrzeba
        // Upewnij się, że tablica optionNames istnieje
        if (!AHP.optionNames) {
            AHP.optionNames = [];
        }
        
        const oldOptionNames = [...AHP.optionNames];
        AHP.optionNames = Array(AHP.numOptions).fill().map((_, i) => {
            // Zachowaj istniejące nazwy, jeśli są dostępne
            if (i < oldOptionNames.length) {
                return oldOptionNames[i];
            } else {
                return `Opcja ${i+1}`;
            }
        });
        
        // Przygotuj pola na nazwy opcji
        const optionsContainer = document.querySelector('#ahpOptionNames .options-inputs-container');
        if (!optionsContainer) {
            console.error("Container for option names not found");
            return;
        }
        
        optionsContainer.innerHTML = '';
        
        // Dodajemy pola nazw opcji BEZ dodawania ponownie pola liczbowego
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

        console.log("Current options: numCriteria =", AHP.numCriteria, "numOptions =", AHP.numOptions);
        console.log("Criteria names:", AHP.criteriaNames);
        console.log("Option names:", AHP.optionNames);
        
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
        
        const optionDescription = document.createElement('p');
        optionDescription.className = 'comparison-description';
        optionDescription.textContent = 'Zaznacz, która opcja jest lepsza i w jakim stopniu:';
        container.appendChild(optionDescription);
        
        // Upewnij się, że mamy poprawnie zainicjalizowane struktury danych
        if (!AHP.optionComparisonMatrices) {
            console.log("Initializing option comparison matrices from scratch");
            AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
            );
        } else if (AHP.optionComparisonMatrices.length !== AHP.numCriteria) {
            console.log("Adjusting option comparison matrices size for criteria", AHP.optionComparisonMatrices.length, "to", AHP.numCriteria);
            // Tymczasowa kopia starych macierzy
            const oldMatrices = [...AHP.optionComparisonMatrices];
            
            // Utwórz nowe macierze o właściwym rozmiarze
            AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
            );
            
            // Skopiuj istniejące wartości
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
        
        // Kontener dla wszystkich paneli opcji
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-panels-container';
        
        // Dla każdego kryterium tworzymy panel porównań opcji
        for (let c = 0; c < AHP.numCriteria; c++) {
            const criteriaName = AHP.criteriaNames[c];
            
            const optionPanel = document.createElement('div');
            optionPanel.className = 'criterion-panel'; // Ta sama klasa dla paneli kryteriów i opcji
            
            const optionPanelHeader = document.createElement('h4');
            optionPanelHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
            optionPanel.appendChild(optionPanelHeader);
            
            // Upewnij się, że mamy zainicjalizowaną macierz dla tego kryterium
            if (!AHP.optionComparisonMatrices[c] || AHP.optionComparisonMatrices[c].length !== AHP.numOptions) {
                console.log(`Initializing option matrix for criterion ${c}`);
                AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
            }
            
            // Utwórz porównania dla wszystkich par opcji
            for (let i = 0; i < AHP.numOptions; i++) {
                for (let j = i + 1; j < AHP.numOptions; j++) {
                    const comparisonRow = document.createElement('div');
                    comparisonRow.className = 'simplified-comparison-row';
                    
                    // Lewa opcja
                    const leftOption = document.createElement('div');
                    leftOption.className = 'criterion left-criterion'; // Ta sama klasa dla spójności
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
                        let currentValue = 1;
                        if (AHP.optionComparisonMatrices[c] && 
                            AHP.optionComparisonMatrices[c][i] && 
                            AHP.optionComparisonMatrices[c][i][j] !== undefined) {
                            currentValue = AHP.optionComparisonMatrices[c][i][j];
                        }
                        
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
                    rightOption.className = 'criterion right-criterion'; // Ta sama klasa dla spójności
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
        
        console.log(`Updating criteria comparison ${i},${j} to ${value}`);
        
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
        
        // Dla debugowania
        console.log("Updated criteria matrix:", AHP.criteriaComparisonMatrix);
        
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
        
        // Kontener dla wszystkich paneli opcji
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-panels-container';
        
        // Dla każdego kryterium tworzymy panel porównań opcji
        for (let c = 0; c < AHP.numCriteria; c++) {
            const criteriaName = AHP.criteriaNames[c];
            
            const optionPanel = document.createElement('div');
            optionPanel.className = 'unified-panel option-panel';
            
            const criteriaHeader = document.createElement('h4');
            criteriaHeader.textContent = `Porównanie opcji pod względem: ${criteriaName}`;
            optionPanel.appendChild(criteriaHeader);
            
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
                            
                            // Ustaw aktualną wartość z macierzy porównań
                            if (Math.abs(values[k] - AHP.optionComparisonMatrices[c][i][j]) < 0.001) {
                                option.selected = true;
                            }
                            
                            select.appendChild(option);
                        }
                        
                        td.appendChild(select);
                    } else {
                        // Dolna część macierzy - odwrotność
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
    },
    
    updateOptionComparisonValue: (c, i, j) => {
        // Pobierz wartość wybraną przez użytkownika
        const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
        const value = parseFloat(select.value);
        
        console.log(`Updating option comparison for criterion ${c}, options ${i},${j} to ${value}`);
        
        // Zapisz wartość w macierzy porównań
        AHP.optionComparisonMatrices[c][i][j] = value;
        AHP.optionComparisonMatrices[c][j][i] = 1 / value;
        
        // Dla debugowania
        console.log(`Updated option matrix for criterion ${c}:`, AHP.optionComparisonMatrices[c]);
        
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
        console.log(`Updating simplified option comparison for criterion ${c}, options ${i},${j} to ${value}`);
        
        // Upewnij się, że macierz istnieje
        if (!AHP.optionComparisonMatrices) {
            AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
            );
        }
        
        // Upewnij się, że macierz dla danego kryterium istnieje
        if (!AHP.optionComparisonMatrices[c]) {
            AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
        }
        
        // Zapisz wartość w macierzy porównań
        AHP.optionComparisonMatrices[c][i][j] = value;
        AHP.optionComparisonMatrices[c][j][i] = 1 / value;
        
        // Dla debugowania
        console.log(`Updated option matrix for criterion ${c}:`, AHP.optionComparisonMatrices[c]);
        
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
    
    saveCurrentComparisonData: () => {
        console.log("Saving current comparison data");
        try {
            // Zapisz porównania kryteriów
            if (AHP.interfaceMode === 'matrix') {
                // Zapisz z interfejsu macierzowego
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
            } else if (AHP.interfaceMode === 'simplified') {
                // Zapisz z uproszczonego interfejsu (przyciski radio)
                for (let i = 0; i < AHP.numCriteria; i++) {
                    for (let j = i + 1; j < AHP.numCriteria; j++) {
                        const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
                        let found = false;
                        
                        for (let k = 0; k < values.length; k++) {
                            const radio = document.getElementById(`criteria-comp-${i}-${j}-${k}`);
                            if (radio && radio.checked) {
                                AHP.criteriaComparisonMatrix[i][j] = values[k];
                                AHP.criteriaComparisonMatrix[j][i] = 1 / values[k];
                                found = true;
                                break;
                            }
                        }
                        
                        if (!found) {
                            // Ustaw wartość domyślną, jeśli nic nie jest zaznaczone
                            AHP.criteriaComparisonMatrix[i][j] = 1;
                            AHP.criteriaComparisonMatrix[j][i] = 1;
                        }
                    }
                }
            }
            
            // Zapisz porównania opcji
            if (!AHP.optionComparisonMatrices || AHP.optionComparisonMatrices.length !== AHP.numCriteria) {
                AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                    Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
                );
            }
            
            if (AHP.interfaceMode === 'matrix') {
                // Zapisz z interfejsu macierzowego
                for (let c = 0; c < AHP.numCriteria; c++) {
                    for (let i = 0; i < AHP.numOptions; i++) {
                        for (let j = i + 1; j < AHP.numOptions; j++) {
                            const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
                            if (select) {
                                const value = parseFloat(select.value);
                                
                                // Sprawdź czy macierz istnieje
                                if (!AHP.optionComparisonMatrices[c]) {
                                    AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
                                }
                                
                                AHP.optionComparisonMatrices[c][i][j] = value;
                                AHP.optionComparisonMatrices[c][j][i] = 1 / value;
                            }
                        }
                    }
                }
            } else if (AHP.interfaceMode === 'simplified') {
                // Zapisz z uproszczonego interfejsu (przyciski radio)
                for (let c = 0; c < AHP.numCriteria; c++) {
                    for (let i = 0; i < AHP.numOptions; i++) {
                        for (let j = i + 1; j < AHP.numOptions; j++) {
                            const values = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8, 1/9];
                            let found = false;
                            
                            for (let k = 0; k < values.length; k++) {
                                const radio = document.getElementById(`options-comp-${c}-${i}-${j}-${k}`);
                                if (radio && radio.checked) {
                                    // Sprawdź czy macierz istnieje
                                    if (!AHP.optionComparisonMatrices[c]) {
                                        AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
                                    }
                                    
                                    AHP.optionComparisonMatrices[c][i][j] = values[k];
                                    AHP.optionComparisonMatrices[c][j][i] = 1 / values[k];
                                    found = true;
                                    break;
                                }
                            }
                            
                            if (!found) {
                                // Ustaw wartość domyślną, jeśli nic nie jest zaznaczone
                                AHP.optionComparisonMatrices[c][i][j] = 1;
                                AHP.optionComparisonMatrices[c][j][i] = 1;
                            }
                        }
                    }
                }
            }
            
            console.log("Saved criteria matrix:", AHP.criteriaComparisonMatrix);
            console.log("Saved option matrices:", AHP.optionComparisonMatrices);
        } catch (error) {
            console.error("Błąd podczas zapisywania danych porównań:", error);
        }
    },
    
    clearCurrentInterface: () => {
        // Wyczyść kontener porównań kryteriów
        Utils.clearElement('ahpCriteriaComparisonMatrix');
        
        // Wyczyść kontener porównań opcji
        Utils.clearElement('ahpOptionsComparisonSection');
        
        // Ukryj wyniki
        Utils.hideElement('ahpResults');
        
        // Wyczyść wizualizację
        Utils.clearElement('ahpVisualization');
    },
    
    updateSimplifiedComparisonValue: (i, j, value) => {
        console.log(`Updating simplified criteria comparison for criteria ${i},${j} to ${value}`);
        
        // Upewnij się, że macierz istnieje
        if (!AHP.criteriaComparisonMatrix || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        // Zapisz wartość w macierzy porównań
        AHP.criteriaComparisonMatrix[i][j] = value;
        AHP.criteriaComparisonMatrix[j][i] = 1 / value;
        
        // Dla debugowania
        console.log(`Updated criteria matrix:`, AHP.criteriaComparisonMatrix);
        
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
    
    // Funkcja wykonująca obliczenia AHP
    calculate: () => {
        console.log("Performing AHP calculations...");
        
        // Zapisz aktualny stan danych przed obliczeniami
        AHP.saveCurrentComparisonData();
        
        try {
            // Sprawdź czy wszystkie dane są gotowe
            if (!AHP.criteriaComparisonMatrix || !AHP.optionComparisonMatrices) {
                Utils.displayResults('ahpResults', 'Błąd: Brak danych do obliczeń. Proszę wprowadzić wszystkie porównania.', true);
                return;
            }
            
            // Oblicz priorytety dla kryteriów
            AHP.criteriaPriorities = AHP.calculatePriorities(AHP.criteriaComparisonMatrix);
            
            console.log("Criteria priorities:", AHP.criteriaPriorities);
            
            // Oblicz lokalne wagi dla opcji dla każdego kryterium
            AHP.localOptionWeights = [];
            for (let c = 0; c < AHP.numCriteria; c++) {
                if (AHP.optionComparisonMatrices[c]) {
                    AHP.localOptionWeights[c] = AHP.calculatePriorities(AHP.optionComparisonMatrices[c]);
                } else {
                    // Jeśli brakuje macierzy dla kryterium, utwórz równe wagi
                    AHP.localOptionWeights[c] = Array(AHP.numOptions).fill(1 / AHP.numOptions);
                }
            }
            
            console.log("Local option weights:", AHP.localOptionWeights);
            
            // Oblicz globalne wagi opcji
            AHP.globalOptionWeights = Array(AHP.numOptions).fill(0);
            
            for (let o = 0; o < AHP.numOptions; o++) {
                for (let c = 0; c < AHP.numCriteria; c++) {
                    AHP.globalOptionWeights[o] += AHP.criteriaPriorities[c] * AHP.localOptionWeights[c][o];
                }
            }
            
            console.log("Global option weights:", AHP.globalOptionWeights);
            
            // Przygotuj wyniki do wyświetlenia
            AHP.displayResults();
        } catch (error) {
            console.error("Error during AHP calculation:", error);
            Utils.displayResults('ahpResults', `Błąd podczas obliczeń: ${error.message}`, true);
        }
    },
    
    // Funkcja obliczająca priorytety na podstawie macierzy porównań
    calculatePriorities: (matrix) => {
        const n = matrix.length;
        const priorities = Array(n).fill(0);
        
        // Metoda średniej geometrycznej
        for (let i = 0; i < n; i++) {
            let product = 1;
            for (let j = 0; j < n; j++) {
                product *= matrix[i][j];
            }
            priorities[i] = Math.pow(product, 1/n);
        }
        
        // Normalizacja
        const sum = priorities.reduce((a, b) => a + b, 0);
        for (let i = 0; i < n; i++) {
            priorities[i] /= sum;
        }
        
        return priorities;
    },
    
    // Funkcja wyświetlająca wyniki
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
        
        // 1. Wykres radarowy - porównanie opcji pod względem różnych kryteriów
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
        
        // 2. Wizualizacja wkładu każdego kryterium do wyniku końcowego
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
    
    // Funkcja eksportująca wyniki do TXT
    downloadResultsTXT: () => {
        try {
            // Przygotuj zawartość pliku TXT
            let content = `WYNIKI ANALIZY AHP\n`;
            content += `=====================\n\n`;
            
            // Najlepsza opcja
            let bestOptionIndex = 0;
            for (let i = 1; i < AHP.numOptions; i++) {
                if (AHP.globalOptionWeights[i] > AHP.globalOptionWeights[bestOptionIndex]) {
                    bestOptionIndex = i;
                }
            }
            
            content += `NAJLEPSZA OPCJA: ${AHP.optionNames[bestOptionIndex]} (${(AHP.globalOptionWeights[bestOptionIndex] * 100).toFixed(2)}%)\n\n`;
            
            // Wagi kryteriów
            content += `WAGI KRYTERIÓW:\n`;
            content += `---------------\n`;
            
            for (let i = 0; i < AHP.numCriteria; i++) {
                content += `${AHP.criteriaNames[i]}: ${(AHP.criteriaPriorities[i] * 100).toFixed(2)}%\n`;
            }
            
            content += `\n`;
            
            // Ranking opcji
            content += `RANKING OPCJI:\n`;
            content += `-------------\n`;
            
            // Posortuj opcje według wyniku
            const sortedIndices = Array.from({length: AHP.numOptions}, (_, i) => i)
                .sort((a, b) => AHP.globalOptionWeights[b] - AHP.globalOptionWeights[a]);
            
            for (let i = 0; i < sortedIndices.length; i++) {
                const idx = sortedIndices[i];
                content += `${i+1}. ${AHP.optionNames[idx]}: ${(AHP.globalOptionWeights[idx] * 100).toFixed(2)}%\n`;
            }
            
            content += `\n`;
            
            // Rozbicie wyników według kryteriów
            content += `ROZBICIE WYNIKÓW WEDŁUG KRYTERIÓW:\n`;
            content += `--------------------------------\n`;
            
            // Nagłówek z nazwami kryteriów
            content += `Opcja\t`;
            for (let c = 0; c < AHP.numCriteria; c++) {
                content += `${AHP.criteriaNames[c]}\t`;
            }
            content += `Wynik całkowity\n`;
            
            // Dane dla każdej opcji
            for (let o = 0; o < AHP.numOptions; o++) {
                content += `${AHP.optionNames[o]}\t`;
                
                for (let c = 0; c < AHP.numCriteria; c++) {
                    const localScore = AHP.localOptionWeights[c][o];
                    const weightedScore = localScore * AHP.criteriaPriorities[c];
                    content += `${(weightedScore * 100).toFixed(2)}%\t`;
                }
                
                content += `${(AHP.globalOptionWeights[o] * 100).toFixed(2)}%\n`;
            }
            
            content += `\n`;
            content += `Wygenerowano: ${new Date().toLocaleString()}\n`;
            
            // Stwórz plik do pobrania
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `wyniki_ahp_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            
            // Wyczyść po sobie
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
            
        } catch (error) {
            console.error("Błąd podczas eksportu do TXT:", error);
            alert("Wystąpił błąd podczas eksportu wyników do pliku TXT.");
        }
    }
} 