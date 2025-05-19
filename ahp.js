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
    isInitialising: false, // Dodano flagę inicjalizacji
    
    // Funkcja tworząca macierz jednostkową o podanym rozmiarze
    createIdentityMatrix: (size) => {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = [];
            for (let j = 0; j < size; j++) {
                matrix[i][j] = (i === j) ? 1 : 0;
            }
        }
        return matrix;
    },

    init: () => {
        Logger.log("Executing AHP.init()");
        Utils.hideElement('ahpResults');
        Utils.clearElement('ahpVisualization');
        AHP.isInitialising = true;
        
        const currentNumCriteria = parseInt(document.getElementById('ahpNumCriteria').value) || 3;
        const currentNumOptions = parseInt(document.getElementById('ahpNumOptions').value) || 3;

        // Sprawdź, czy liczba kryteriów lub opcji się zmieniła, lub czy dane nie zostały jeszcze zainicjowane
        const dimensionsChanged = AHP.numCriteria !== currentNumCriteria || AHP.numOptions !== currentNumOptions;
        const notInitialized = !AHP.criteriaComparisonMatrix || !AHP.optionComparisonMatrices;

        AHP.numCriteria = currentNumCriteria;
        AHP.numOptions = currentNumOptions;
        
        // Inicjalizacja nazw kryteriów - tylko jeśli puste lub zmieniła się liczba
        if (!AHP.criteriaNames || AHP.criteriaNames.length !== AHP.numCriteria) {
            const oldNames = AHP.criteriaNames || [];
            AHP.criteriaNames = Array(AHP.numCriteria).fill('').map((_, i) => {
                return (i < oldNames.length && oldNames[i] && !oldNames[i].startsWith('Kryterium ')) ? oldNames[i] : `Kryterium ${i+1}`;
            });
        }
        
        // Inicjalizacja nazw opcji - tylko jeśli puste lub zmieniła się liczba
        if (!AHP.optionNames || AHP.optionNames.length !== AHP.numOptions) {
            const oldNames = AHP.optionNames || [];
            AHP.optionNames = Array(AHP.numOptions).fill('').map((_, i) => {
                return (i < oldNames.length && oldNames[i] && !oldNames[i].startsWith('Opcja ')) ? oldNames[i] : `Opcja ${i+1}`;
            });
        }
        
        // Inicjalizacja macierzy porównań kryteriów - tylko jeśli nie istnieje, lub zmieniły się wymiary
        if (notInitialized || dimensionsChanged || !AHP.criteriaComparisonMatrix[0] || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria || AHP.criteriaComparisonMatrix[0].length !== AHP.numCriteria ) {
            Logger.log("[AHP Init] Re-initializing criteriaComparisonMatrix due to dimension change or first init.");
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        } else {
            Logger.log("[AHP Init] Preserving existing criteriaComparisonMatrix.");
        }
        
        // Inicjalizacja macierzy porównań opcji - tylko jeśli nie istnieje, lub zmieniły się wymiary
        if (notInitialized || dimensionsChanged || AHP.optionComparisonMatrices.length !== AHP.numCriteria) {
            Logger.log("[AHP Init] Re-initializing optionComparisonMatrices structure due to dimension change or first init.");
            AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill().map(() => 
                Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1))
            );
        } else {
            // Jeśli liczba kryteriów jest taka sama, sprawdź każdą podmacierz opcji
            Logger.log("[AHP Init] Preserving main structure of optionComparisonMatrices. Verifying sub-matrices.");
            for (let c = 0; c < AHP.numCriteria; c++) {
                if (!AHP.optionComparisonMatrices[c] || AHP.optionComparisonMatrices[c].length !== AHP.numOptions || 
                    (AHP.numOptions > 0 && (!AHP.optionComparisonMatrices[c][0] || AHP.optionComparisonMatrices[c][0].length !== AHP.numOptions))) {
                    Logger.log(`[AHP Init] Re-initializing optionComparisonMatrices[${c}] for options.`);
                    AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill().map(() => Array(AHP.numOptions).fill(1));
                }
            }
        }
        
        AHP.setupInterfaceButtons();
        
        // Dodanie nasłuchiwania zmian w polach liczby kryteriów dla dynamicznej aktualizacji
        const numCriteriaInput = document.getElementById('ahpNumCriteria');
        
        // Usuwamy istniejących listenerów, jeśli były dodane wcześniej
        const oldCriteriaInput = numCriteriaInput.cloneNode(true);
        numCriteriaInput.parentNode.replaceChild(oldCriteriaInput, numCriteriaInput);
        
        // Dodajemy nowe listenery do obu zdarzeń
        oldCriteriaInput.addEventListener('input', AHP.setupInputs);
        oldCriteriaInput.addEventListener('change', AHP.setupInputs);
        
        // Również dodajemy listenery do pola liczby opcji, jeśli zostało już dodane przez App.initialize()
        if (document.getElementById('ahpNumOptions')) {
            // Dodanie listenerów do pola numOptions odbywa się w script.js podczas tworzenia pola
            // Jeśli mielibyśmy tworzyć je tutaj, byłoby to zduplikowane
            Logger.log("NumOptions field already exists, skipping event listener setup (should be done in App.initialize)");
        }
        
        // Dodanie nasłuchiwania zmian w polu liczby opcji
        const numOptionsInput = document.getElementById('ahpNumOptions');
        if (numOptionsInput) {
            // Usuwamy istniejących listenerów, jeśli były dodane wcześniej, dla spójności
            const oldOptionsInput = numOptionsInput.cloneNode(true);
            numOptionsInput.parentNode.replaceChild(oldOptionsInput, numOptionsInput);
            
            // Dodajemy nowe listenery
            oldOptionsInput.addEventListener('input', AHP.setupInputs); 
            oldOptionsInput.addEventListener('change', AHP.setupInputs);
            Logger.log("Event listeners for 'ahpNumOptions' set up in AHP.init to call AHP.setupInputs().");
        } else {
            Logger.log("ERROR: 'ahpNumOptions' input field not found during AHP.init(). Cannot set listeners.");
        }
        
        // Automatyczne tworzenie interfejsu bez konieczności klikania przycisków
        AHP.setupInputs();
        // AHP.calculate(); // To wywołanie pozostaje usunięte/zakomentowane

        AHP.isInitialising = false; // Zresetuj flagę inicjalizacji po zakończeniu setupInputs
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
        Logger.log("Setting up AHP inputs for mode: " + AHP.interfaceMode);
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
            const newNames = [];
            
            // Zachowaj istniejące nazwy lub utwórz nowe
            for (let i = 0; i < AHP.numCriteria; i++) {
                if (i < oldNames.length && oldNames[i] && !oldNames[i].startsWith('Kryterium ')) {
                    // Zachowaj niestandardową nazwę
                    newNames.push(oldNames[i]);
                } else if (i < oldNames.length && oldNames[i]) {
                    // Zastąp domyślną nazwę nową domyślną
                    newNames.push(`Kryterium ${i+1}`);
                } else {
                    // Dodaj nową domyślną nazwę
                    newNames.push(`Kryterium ${i+1}`);
                }
            }
            
            AHP.criteriaNames = newNames;
        }
        
        // Tworzenie pól formularza dla nazw kryteriów
        for (let i = 0; i < AHP.numCriteria; i++) {
            const inputRow = document.createElement('div');
            inputRow.className = 'input-row';
            
            const label = document.createElement('label');
            label.textContent = `Kryterium ${i+1}:`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `criteria-name-${i}`;
            input.placeholder = `Kryterium ${i+1}`;
            
            // Ustaw wartość zgodnie z modelem danych tylko dla niestandardowych nazw
            if (AHP.criteriaNames[i] && !AHP.criteriaNames[i].startsWith('Kryterium ')) {
                input.value = AHP.criteriaNames[i];
            } else {
                input.value = '';  // Puste pole dla nazw domyślnych
            }
            
            // Zmodyfikowana obsługa onchange
            input.onchange = () => {
                // Aktualizuj model tylko jeśli pole nie jest puste
                if (input.value.trim() !== '') {
                    AHP.criteriaNames[i] = input.value;
                } else {
                    // Jeśli pole jest puste, przywróć domyślną nazwę w modelu
                    AHP.criteriaNames[i] = `Kryterium ${i+1}`;
                }
                
                // Aktualizuj interfejs porównań bez wpływania na nawę
                AHP.updateComparisonInterface();
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
        AHP.updateComparisonInterface();
        if (!AHP.isInitialising) { // Wykonaj obliczenia tylko jeśli nie jesteśmy w trakcie inicjalizacji
            AHP.calculate();
        }
        
        // Przygotuj pola na nazwy opcji
        AHP.setupOptions();
    },

    // Nowa funkcja do aktualizacji interfejsu porównań bez wpływania na nawę
    updateComparisonInterface: () => {
        if (AHP.interfaceMode === 'matrix') {
            AHP.createCriteriaComparisonMatrix();
            AHP.createMatrixOptionComparisons();
        } else if (AHP.interfaceMode === 'simplified') {
            AHP.createSimplifiedInterface();
        }
    },

    setupOptions: (skipComparisonSetup = false) => {
        Logger.log("Setting up AHP options");
        
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
        for (let i = 0; i < AHP.numCriteria; i++) {
            const input = document.getElementById(`criteria-name-${i}`);
            if (input && input.value.trim() !== '') {
                AHP.criteriaNames[i] = input.value;
            } else if (AHP.criteriaNames[i] && AHP.criteriaNames[i].startsWith('Kryterium ')) {
                AHP.criteriaNames[i] = `Kryterium ${i+1}`;
            }
        }
        
        // Zachowaj istniejące nazwy opcji i dodaj nowe, jeśli potrzeba
        if (!AHP.optionNames) {
            AHP.optionNames = [];
        }
        
        // Tymczasowa kopia starych nazw
        const oldOptionNames = [...AHP.optionNames];
        
        // Inicjalizacja nowej tablicy nazw
        const newOptionNames = [];
        
        // Zachowaj istniejące nazwy lub utwórz nowe
        for (let i = 0; i < AHP.numOptions; i++) {
            if (i < oldOptionNames.length && oldOptionNames[i] && !oldOptionNames[i].startsWith('Opcja ')) {
                // Zachowaj niestandardową nazwę
                newOptionNames.push(oldOptionNames[i]);
            } else if (i < oldOptionNames.length && oldOptionNames[i]) {
                // Zastąp domyślną nazwę nową domyślną
                newOptionNames.push(`Opcja ${i+1}`);
            } else {
                // Dodaj nową domyślną nazwę
                newOptionNames.push(`Opcja ${i+1}`);
            }
        }
        
        AHP.optionNames = newOptionNames;
        
        // Przygotuj pola na nazwy opcji
        const optionsContainer = document.querySelector('#ahpOptionNames .options-inputs-container');
        if (!optionsContainer) {
            Logger.log("ERROR: Container for option names not found in AHP.setupOptions"); // Zmieniono z console.error
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
            
            // Ustaw wartość zgodnie z modelem danych tylko dla niestandardowych nazw
            if (AHP.optionNames[i] && !AHP.optionNames[i].startsWith('Opcja ')) {
                input.value = AHP.optionNames[i];
            } else {
                input.value = '';  // Puste pole dla nazw domyślnych
            }
            
            // Zmodyfikowana obsługa onchange
            input.onchange = () => {
                // Aktualizuj model tylko jeśli pole nie jest puste
                if (input.value.trim() !== '') {
                    AHP.optionNames[i] = input.value;
                } else {
                    // Jeśli pole jest puste, przywróć domyślną nazwę w modelu
                    AHP.optionNames[i] = `Opcja ${i+1}`;
                }
                
                // Aktualizacja interfejsu porównań
                AHP.updateComparisonInterface();
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
            // AHP.createSimplifiedInterface(); // This line is now handled by the function in ahpUI.js
        }
    },
    

    
   
    
    updateCriteriaComparisonValue: (i, j) => {
        // Pobierz wartość wybraną przez użytkownika
        const select = document.getElementById(`criteria-comp-${i}-${j}`);
        const value = parseFloat(select.value);
        
        Logger.log(`Updating criteria comparison ${i},${j} to ${value}`);
        
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
        Logger.log("Updated criteria matrix:", JSON.parse(JSON.stringify(AHP.criteriaComparisonMatrix))); // Added stringify for better logging
        
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
            AHP.createSimplifiedInterface(); // This function is now in ahpUI.js
        }
    },
    

    
    updateOptionComparisonValue: (c, i, j) => {
        // Pobierz wartość wybraną przez użytkownika
        const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
        const value = parseFloat(select.value);
        
        Logger.log(`Updating option comparison for criterion ${c}, options ${i},${j} to ${value}`);
        
        // Zapisz wartość w macierzy porównań
        AHP.optionComparisonMatrices[c][i][j] = value;
        AHP.optionComparisonMatrices[c][j][i] = 1 / value;
        
        // Dla debugowania
        Logger.log(`Updated option matrix for criterion ${c}:`, JSON.parse(JSON.stringify(AHP.optionComparisonMatrices[c]))); // Added stringify
        
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
        Logger.log(`Updating simplified option comparison for criterion ${c}, options ${i},${j} to ${value}`);
        
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
        Logger.log(`Updated option matrix for criterion ${c}:`, JSON.parse(JSON.stringify(AHP.optionComparisonMatrices[c]))); // Added stringify
        
        // Synchronizuj tylko wartości, bez wpływania na stan nawy
        if (AHP.interfaceMode === 'matrix') {
            const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
            const reciprocalCell = document.getElementById(`options-comp-value-${c}-${j}-${i}`);
            
            if (select) select.value = value;
            if (reciprocalCell) reciprocalCell.textContent = (1 / value).toFixed(4);
        }
        
        if (AHP.calculationTimeout) {
            clearTimeout(AHP.calculationTimeout);
        }
        
        AHP.calculationTimeout = setTimeout(() => {
            AHP.calculate();
        }, 500);
    },
    
    saveCurrentComparisonData: () => {
        Logger.log("[AHP DEBUG] Attempting to save current comparison data. Mode: " + AHP.interfaceMode);
        try {
            // Zapisz porównania kryteriów
            if (AHP.criteriaComparisonMatrix === null || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
                 Logger.log("WARN: [AHP DEBUG] Save: Criteria matrix is null or has incorrect row count. Re-initializing.");
                 AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill(null).map(() => Array(AHP.numCriteria).fill(1));
            } else {
                AHP.criteriaComparisonMatrix.forEach((row, rowIndex) => {
                    if (!row || row.length !== AHP.numCriteria) {
                        Logger.log(`WARN: [AHP DEBUG] Save: Criteria matrix row ${rowIndex} is invalid. Re-initializing row.`);
                        AHP.criteriaComparisonMatrix[rowIndex] = Array(AHP.numCriteria).fill(1);
                    }
                });
            }


            if (AHP.interfaceMode === 'matrix') {
            for (let i = 0; i < AHP.numCriteria; i++) {
                    for (let j = i + 1; j < AHP.numCriteria; j++) {
                        const inputElement = document.getElementById(`criteria-matrix-${i}-${j}`); // Zmieniono z select na inputElement i ID
                        if (inputElement && inputElement.value !== undefined) { // Sprawdzanie inputElement zamiast select
                            const value = parseFloat(inputElement.value);
                            if (!isNaN(value) && value > 0 && value <=9 && value >= 1/9) { // Dodano walidację zakresu wartości
                                AHP.criteriaComparisonMatrix[i][j] = value;
                                AHP.criteriaComparisonMatrix[j][i] = 1 / value;
                            } else {
                                Logger.log(`[AHP Save] Invalid value or out of range for criteria-matrix-${i}-${j}: ${inputElement.value}. Defaulting to 1.`);
                                AHP.criteriaComparisonMatrix[i][j] = 1; // Domyślna wartość przy błędzie
                                AHP.criteriaComparisonMatrix[j][i] = 1;
                            }
                        } else { // Domyślna wartość, jeśli element nie istnieje lub nie ma wartości
                            Logger.log(`[AHP Save] Input element criteria-matrix-${i}-${j} not found or has no value. Defaulting to 1.`);
                            AHP.criteriaComparisonMatrix[i][j] = 1;
                            AHP.criteriaComparisonMatrix[j][i] = 1;
                        }
                    }
                }
            } else if (AHP.interfaceMode === 'simplified') {
                for (let i = 0; i < AHP.numCriteria; i++) {
                    for (let j = i + 1; j < AHP.numCriteria; j++) {
                        const valuesToTest = AHP.comparisonValues;
                        let found = false;
                        for (let k_val = 0; k_val < valuesToTest.length; k_val++) {
                            const radio = document.getElementById(`criteria-comp-${i}-${j}-${k_val}`);
                            if (radio && radio.checked) {
                                AHP.criteriaComparisonMatrix[i][j] = valuesToTest[k_val];
                                AHP.criteriaComparisonMatrix[j][i] = 1 / valuesToTest[k_val];
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                                // Pozostaw domyślną wartość 1 (ustawioną podczas inicjalizacji)
                                // console.warn(`[AHP DEBUG] Save (Simplified): No radio checked for options-comp-${c}-${i}-${j}. Defaulting to 1.`);
                            AHP.criteriaComparisonMatrix[i][j] = 1;
                            AHP.criteriaComparisonMatrix[j][i] = 1;
                        }
                    }
                }
            }
            // Ustawienie przekątnych na 1 dla macierzy kryteriów
            for (let i = 0; i < AHP.numCriteria; i++) {
                if (AHP.criteriaComparisonMatrix[i]) { // Upewnij się, że wiersz istnieje
                   AHP.criteriaComparisonMatrix[i][i] = 1;
                }
            }
            Logger.log("[AHP DEBUG] Saved criteria matrix:", JSON.parse(JSON.stringify(AHP.criteriaComparisonMatrix)));

            // --- Zapisz porównania opcji ---

            // Krok 1: Upewnij się, że główna tablica AHP.optionComparisonMatrices (tablica macierzy) ma właściwą długość
            if (!AHP.optionComparisonMatrices || AHP.optionComparisonMatrices.length !== AHP.numCriteria) {
                Logger.log(`WARN: [AHP DEBUG] Save: Re-initializing AHP.optionComparisonMatrices array structure for ${AHP.numCriteria} criteria.`);
                AHP.optionComparisonMatrices = Array(AHP.numCriteria).fill(null); // Wypełnij nullami, poszczególne macierze będą tworzone poniżej
            }
            
            // Pętla po każdym kryterium do zapisu macierzy opcji
                for (let c = 0; c < AHP.numCriteria; c++) {
                // Krok 2: Rygorystyczna inicjalizacja AHP.optionComparisonMatrices[c] (pojedynczej macierzy) dla bieżącego kryterium
                // Sprawdź, czy sub-macierz istnieje, ma poprawną liczbę wierszy, i czy każdy wiersz ma poprawną liczbę kolumn.
                let needsReinitialization = false;
                if (!AHP.optionComparisonMatrices[c] || AHP.optionComparisonMatrices[c].length !== AHP.numOptions) {
                    needsReinitialization = true;
                } else if (AHP.numOptions > 0) {
                    for (let r = 0; r < AHP.numOptions; r++) {
                        if (!AHP.optionComparisonMatrices[c][r] || AHP.optionComparisonMatrices[c][r].length !== AHP.numOptions) {
                            needsReinitialization = true;
                            break;
                        }
                    }
                } else if (AHP.numOptions === 0 && AHP.optionComparisonMatrices[c].length > 0) { // Jeśli nie ma być opcji, a macierz nie jest pusta
                    needsReinitialization = true;
                }


                if (needsReinitialization) {
                    Logger.log(`WARN: [AHP DEBUG] Save (Mode: ${AHP.interfaceMode}): Initializing/resetting AHP.optionComparisonMatrices[${c}] for ${AHP.numOptions} options.`);
                    if (AHP.numOptions > 0) {
                        AHP.optionComparisonMatrices[c] = Array(AHP.numOptions).fill(null).map(() => Array(AHP.numOptions).fill(1));
                    } else {
                        AHP.optionComparisonMatrices[c] = []; // Pusta macierz, jeśli nie ma opcji
                    }
                }

                // Zapis danych dla AHP.optionComparisonMatrices[c]
                if (AHP.numOptions > 0) { // Kontynuuj tylko jeśli są jakieś opcje do przetworzenia
                    if (AHP.interfaceMode === 'matrix') {
                    for (let i = 0; i < AHP.numOptions; i++) {
                        for (let j = i + 1; j < AHP.numOptions; j++) {
                            const select = document.getElementById(`options-comp-${c}-${i}-${j}`);
                                if (select && select.value !== undefined) {
                                const value = parseFloat(select.value);
                                    if(!isNaN(value)) {
                                AHP.optionComparisonMatrices[c][i][j] = value;
                                AHP.optionComparisonMatrices[c][j][i] = 1 / value;
                                    } else {
                                        AHP.optionComparisonMatrices[c][i][j] = 1; // Default on NaN
                                        AHP.optionComparisonMatrices[c][j][i] = 1;
                            }
                                } else {
                                    // Pozostaw domyślną wartość 1 (ustawioną podczas inicjalizacji)
                                    Logger.log(`WARN: [AHP DEBUG] Save (Matrix): Select element options-comp-${c}-${i}-${j} not found or has no value. Defaulting to 1.`);
                                     AHP.optionComparisonMatrices[c][i][j] = 1;
                                     AHP.optionComparisonMatrices[c][j][i] = 1;
                        }
                    }
                }
            } else if (AHP.interfaceMode === 'simplified') {
                    for (let i = 0; i < AHP.numOptions; i++) {
                        for (let j = i + 1; j < AHP.numOptions; j++) {
                                const valuesToTest = AHP.comparisonValues;
                            let found = false;
                                for (let k_val = 0; k_val < valuesToTest.length; k_val++) {
                                    const radio = document.getElementById(`options-comp-${c}-${i}-${j}-${k_val}`);
                                if (radio && radio.checked) {
                                        AHP.optionComparisonMatrices[c][i][j] = valuesToTest[k_val];
                                        AHP.optionComparisonMatrices[c][j][i] = 1 / valuesToTest[k_val];
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                    // Pozostaw domyślną wartość 1 (ustawioną podczas inicjalizacji)
                                    // console.warn(`[AHP DEBUG] Save (Simplified): No radio checked for options-comp-${c}-${i}-${j}. Defaulting to 1.`);
                                AHP.optionComparisonMatrices[c][i][j] = 1;
                                AHP.optionComparisonMatrices[c][j][i] = 1;
                            }
                        }
                    }
                }
                    // Ustawienie przekątnych na 1 dla macierzy opcji
                    for (let i = 0; i < AHP.numOptions; i++) {
                        if (AHP.optionComparisonMatrices[c] && AHP.optionComparisonMatrices[c][i]) { // Upewnij się, że wiersz istnieje
                           AHP.optionComparisonMatrices[c][i][i] = 1;
                        }
                    }
                }
            } // koniec pętli po 'c'

            Logger.log("[AHP DEBUG] Saved option matrices AFTER potential update:", JSON.parse(JSON.stringify(AHP.optionComparisonMatrices)));
            if (AHP.numCriteria > 0 && AHP.numOptions > 1 && AHP.optionComparisonMatrices && AHP.optionComparisonMatrices[0] && AHP.optionComparisonMatrices[0][0] && AHP.optionComparisonMatrices[0][0][1] !== undefined) {
                Logger.log("[AHP DEBUG] Sample value AHP.optionComparisonMatrices[0][0][1] after save:", AHP.optionComparisonMatrices[0][0][1]);
            } else {
                Logger.log("[AHP DEBUG] AHP.optionComparisonMatrices[0][0][1] does not exist or is undefined after save (numCriteria/numOptions too small or matrices not initialized).");
            }

        } catch (error) {
            Logger.log("ERROR: [AHP DEBUG] Error during saving comparison data:", error);
            Logger.log("ERROR STACK: [AHP DEBUG]", error.stack); // Dodatkowo logowanie stack trace
        }
    },
    
   
    
    updateSimplifiedComparisonValue: (i, j, value) => {
        Logger.log(`Updating simplified criteria comparison for criteria ${i},${j} to ${value}`);
        
        // Upewnij się, że macierz istnieje
        if (!AHP.criteriaComparisonMatrix || AHP.criteriaComparisonMatrix.length !== AHP.numCriteria) {
            AHP.criteriaComparisonMatrix = Array(AHP.numCriteria).fill().map(() => Array(AHP.numCriteria).fill(1));
        }
        
        // Zapisz wartość w macierzy porównań
        AHP.criteriaComparisonMatrix[i][j] = value;
        AHP.criteriaComparisonMatrix[j][i] = 1 / value;
        
        // Dla debugowania
        Logger.log(`Updated criteria matrix:`, JSON.parse(JSON.stringify(AHP.criteriaComparisonMatrix))); // Added stringify
        
        // Synchronizuj tylko wartości, bez wpływania na stan nawy
        if (AHP.interfaceMode === 'matrix') {
            const select = document.getElementById(`criteria-comp-${i}-${j}`);
            const reciprocalCell = document.getElementById(`criteria-comp-value-${j}-${i}`);
            
            if (select) select.value = value;
            if (reciprocalCell) reciprocalCell.textContent = (1 / value).toFixed(4);
        }
        
        if (AHP.calculationTimeout) {
            clearTimeout(AHP.calculationTimeout);
        }
        
        AHP.calculationTimeout = setTimeout(() => {
            AHP.calculate();
        }, 500);
    },
    
    
    
    // Funkcja pobierająca macierz z interfejsu
    getMatrixFromInputs: (type, criterionIndex) => {
        if (type === 'criteria') {
            return AHP.criteriaComparisonMatrix;
        } else if (type === 'options') {
            return AHP.optionComparisonMatrices[criterionIndex];
        }
        return null;
    },
    
    // Funkcja wyświetlająca wyniki
   
    
    // Nowa właściwość do śledzenia czy wizualizacja powinna być uruchomiona po załadowaniu Plotly
    shouldVisualizeResults: false,
    
   


   
    // Upewnij się, że obiekt AHP kończy się przecinkiem, jeśli to nie ostatnie definicje
}; // Zamknięcie obiektu AHP
