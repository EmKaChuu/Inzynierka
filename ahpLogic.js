// Moduł AHP - Logika Obliczeniowa
// Ten plik będzie zawierał funkcje odpowiedzialne za obliczenia w module AHP.

// Globalny obiekt AHP jest zdefiniowany w ahp.js i tutaj jest rozszerzany.

AHP.calculatePriorities = function(matrix) {
    const n = matrix.length;
    if (n === 0) return []; // Zabezpieczenie przed pustą macierzą
    const priorities = Array(n).fill(0);
    
    // Metoda średniej geometrycznej
    for (let i = 0; i < n; i++) {
        let product = 1;
        for (let j = 0; j < n; j++) {
            // Dodatkowe sprawdzenie, czy element macierzy jest poprawną liczbą
            if (typeof matrix[i][j] !== 'number' || isNaN(matrix[i][j]) || matrix[i][j] <= 0) {
                Logger.log(`[AHP Logic] Invalid value in matrix at [${i}][${j}]: ${matrix[i][j]}. Defaulting to 1 for product calculation.`);
                product *= 1; // Użyj neutralnej wartości, aby uniknąć NaN/Infinity
            } else {
                product *= matrix[i][j];
            }
        }
        priorities[i] = Math.pow(product, 1/n);
    }
    
    // Normalizacja
    const sum = priorities.reduce((a, b) => a + b, 0);
    if (sum === 0) { // Jeśli suma jest 0 (np. wszystkie produkty były 0 lub macierz była 1x1 z wartością 0)
        Logger.log("[AHP Logic] Sum of priorities is 0. Returning equal weights or empty array.");
        return n > 0 ? Array(n).fill(1/n) : []; // Równe wagi lub pusta tablica
    }

    for (let i = 0; i < n; i++) {
        priorities[i] /= sum;
    }
    
    return priorities;
};

AHP.calculateEigenvector = function(matrix) {
    const n = matrix.length;
    if (n === 0) {
        return { lambda_max: 0, CI: 0, CR: 0, priorities: [] };
    }
    
    // Oblicz wektor priorytetów
    const priorities = this.calculatePriorities(matrix); // Używamy this.calculatePriorities
    
    // Oblicz λ_max (główną wartość własną)
    let lambda_max = 0;
    
    // Zabezpieczenie przed dzieleniem przez zero jeśli priorytety są zerowe
    let validPriorities = true;
    for(let p = 0; p < priorities.length; p++){
        if(priorities[p] === 0){
            validPriorities = false;
            break;
        }
    }

    if (validPriorities && n > 0) {
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                 // Dodatkowe sprawdzenie, czy element macierzy jest poprawną liczbą
                if (typeof matrix[i][j] !== 'number' || isNaN(matrix[i][j])) {
                     Logger.log(`[AHP Logic] Invalid value in matrix at [${i}][${j}] during eigenvector calculation: ${matrix[i][j]}. Skipping for sum.`);
                } else {
                    sum += matrix[i][j] * priorities[j];
                }
            }
            lambda_max += sum / priorities[i];
        }
        lambda_max /= n;
    } else {
        lambda_max = n; // Jeśli priorytety są zerowe lub n=0, λ_max = n, aby CI było 0
         Logger.log("[AHP Logic] Invalid priorities or n=0 during eigenvector calculation. Setting lambda_max = n.");
    }
    
    // Oblicz indeks spójności (CI)
    // CI = (lambda_max - n) / (n - 1) dla n > 1
    const CI = (n > 1) ? (lambda_max - n) / (n - 1) : 0;
    
    // Oblicz współczynnik spójności (CR)
    const RI_value = this.RI[n] || (n > 1 ? 1.98 * (n - 2) / n + 0.0000001 : 0.0000001) ; // Dodano zabezpieczenie dla RI i małą stałą, aby uniknąć dzielenia przez 0
    const CR = RI_value === 0 ? 0 : CI / RI_value;
    
    return { lambda_max, CI, CR, priorities };
};

AHP.calculate = function() {
    Logger.log("Performing AHP calculations (from ahpLogic.js)...");
    
    this.saveCurrentComparisonData(); // Używamy this.saveCurrentComparisonData
    
    try {
        if (!this.criteriaComparisonMatrix || !this.optionComparisonMatrices) {
            Utils.displayResults('ahpResults', 'Błąd: Brak danych do obliczeń. Proszę wprowadzić wszystkie porównania.', true);
            return;
        }
        
        this.criteriaPriorities = this.calculatePriorities(this.criteriaComparisonMatrix);
        Logger.log("Criteria priorities:", JSON.parse(JSON.stringify(this.criteriaPriorities)));
        
        this.localOptionWeights = [];
        for (let c = 0; c < this.numCriteria; c++) {
            if (this.optionComparisonMatrices[c] && this.optionComparisonMatrices[c].length > 0) { // Sprawdzenie czy macierz opcji istnieje i nie jest pusta
                this.localOptionWeights[c] = this.calculatePriorities(this.optionComparisonMatrices[c]);
            } else {
                Logger.log(`[AHP Logic] Option matrix for criterion ${c} is missing or empty. Defaulting to equal weights.`);
                this.localOptionWeights[c] = this.numOptions > 0 ? Array(this.numOptions).fill(1 / this.numOptions) : [];
            }
        }
        Logger.log("Local option weights:", JSON.parse(JSON.stringify(this.localOptionWeights)));
        
        this.globalOptionWeights = Array(this.numOptions).fill(0);
        if (this.numOptions > 0 && this.numCriteria > 0 && this.criteriaPriorities && this.localOptionWeights) { // Dodatkowe zabezpieczenia
            for (let o = 0; o < this.numOptions; o++) {
                for (let c = 0; c < this.numCriteria; c++) {
                    if (this.criteriaPriorities[c] !== undefined && this.localOptionWeights[c] && this.localOptionWeights[c][o] !== undefined) {
                        this.globalOptionWeights[o] += this.criteriaPriorities[c] * this.localOptionWeights[c][o];
                    } else {
                        Logger.log(`[AHP Logic] Missing data for global weight calculation: Option ${o}, Criterion ${c}`);
                    }
                }
            }
        }
        Logger.log("Global option weights:", JSON.parse(JSON.stringify(this.globalOptionWeights)));
        
        this.displayResults(); // Używamy this.displayResults (które jest teraz w ahpUI.js)
    } catch (error) {
        Logger.log("ERROR: Error during AHP calculation (in ahpLogic.js):", error, error.stack);
        Utils.displayResults('ahpResults', `Błąd podczas obliczeń: ${error.message}. Sprawdź konsolę (F12) po więcej szczegółów.`, true);
    }
};
