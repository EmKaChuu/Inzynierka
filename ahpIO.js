// Moduł AHP - Funkcje Importu/Eksportu Danych dla Linków
// Ten plik będzie zawierał funkcje AHP.exportDataForLink i AHP.importDataFromLinkString

if (typeof AHP === 'undefined') {
    console.error("AHP object is not defined. Make sure ahp.js is loaded before ahpIO.js");
    // Można by rzucić błąd lub zdefiniować pusty obiekt AHP, aby uniknąć dalszych błędów,
    // ale lepiej upewnić się, że kolejność ładowania skryptów jest poprawna.
    // var AHP = {}; 
}

AHP.exportDataForLink = function() {
    Logger.log("[AHP IO] Exporting data for link...");
    try {
        const data = {
            v: 2, // Wersja formatu danych, aby umożliwić przyszłe zmiany
            nc: AHP.numCriteria,
            no: AHP.numOptions,
            cn: AHP.criteriaNames.map(name => name || ""), // Nazwy kryteriów
            on: AHP.optionNames.map(name => name || ""),   // Nazwy opcji
            // Macierz porównań kryteriów (serializacja)
            ccm: AHP.criteriaComparisonMatrix ? AHP.criteriaComparisonMatrix.map(row => row.join(',')).join('|') : "",
            // Macierze porównań opcji (serializacja)
            ocm: AHP.optionComparisonMatrices ? AHP.optionComparisonMatrices.map(matrix => 
                matrix.map(row => row.join(',')).join('|')
            ).join(';') : "",
            im: AHP.interfaceMode || 'simplified' // Dodajemy tryb interfejsu
        };

        // Walidacja podstawowych danych
        if (typeof data.nc !== 'number' || data.nc <= 0 || 
            typeof data.no !== 'number' || data.no <= 0) {
            Logger.log("[AHP IO] Export failed: Invalid number of criteria or options.", data.nc, data.no);
            Utils.showToast("Błąd eksportu danych AHP: nieprawidłowa liczba kryteriów lub opcji.", true);
            return null;
        }

        // Serializacja nazw kryteriów i opcji
        const criteriaNamesString = data.cn.join('§');
        const optionNamesString = data.on.join('§');

        // Serializacja macierzy porównań kryteriów
        let criteriaMatrixString = "";
        if (AHP.criteriaComparisonMatrix && AHP.criteriaComparisonMatrix.length === data.nc) {
            criteriaMatrixString = AHP.criteriaComparisonMatrix
                .map(row => row.map(val => Number(val).toPrecision(5)).join('§'))
                .join('~');
        } else {
            Logger.log("[AHP IO] Export warning: Criteria comparison matrix is missing or has incorrect dimensions.");
            // Utwórz pustą macierz, jeśli brakuje
             criteriaMatrixString = Array(data.nc).fill(Array(data.nc).fill(1).join('§')).join('~');
        }

        // Serializacja macierzy porównań opcji względem kryteriów
        let optionMatricesString = "";
        if (AHP.optionComparisonMatrices && AHP.optionComparisonMatrices.length === data.nc) {
            optionMatricesString = AHP.optionComparisonMatrices
                .map(matrix => {
                    if (matrix.length === data.no) {
                        return matrix.map(row => row.map(val => Number(val).toPrecision(5)).join('§')).join('~');
                    }
                    Logger.log("[AHP IO] Export warning: An option comparison matrix has incorrect dimensions. Creating empty.");
                    return Array(data.no).fill(Array(data.no).fill(1).join('§')).join('~'); // Pusta macierz dla tego kryterium
                })
                .join('|'); // Separator między macierzami dla różnych kryteriów
        } else {
            Logger.log("[AHP IO] Export warning: Option comparison matrices are missing or have incorrect dimensions for criteria count.");
            // Utwórz puste macierze, jeśli brakuje
            optionMatricesString = Array(data.nc).fill(Array(data.no).fill(Array(data.no).fill(1).join('§')).join('~')).join('|');
        }
        
        const linkData = [
            `v${data.v}`,
            data.nc,
            data.no,
            criteriaNamesString,
            optionNamesString,
            criteriaMatrixString,
            optionMatricesString,
            data.im
        ].join('--AHP--');
        
        Logger.log("[AHP IO] Exported data string (first 100 chars):", linkData.substring(0,100));
        return linkData;

    } catch (error) {
        Logger.log("[AHP IO] Error during AHP data export for link:", error, error.stack);
        Utils.showToast("Wystąpił błąd podczas przygotowywania danych AHP do udostępnienia.", true);
        return null;
    }
};

AHP.importDataFromLinkString = function(linkDataString) {
    Logger.log("[AHP IO] Importing data from link string (first 100 chars):", linkDataString.substring(0,100));
    try {
        const parts = linkDataString.split('--AHP--');
        if (parts.length < 7) { // Minimalna liczba części dla v1, v2 będzie miała 8
            throw new Error("Invalid AHP link data format: not enough parts.");
        }

        const version = parts[0].startsWith('v') ? parseInt(parts[0].substring(1)) : 1;
        let currentPart = 1;

        const numCriteria = parseInt(parts[currentPart++]);
        const numOptions = parseInt(parts[currentPart++]);

        if (isNaN(numCriteria) || numCriteria <= 0 || isNaN(numOptions) || numOptions <= 0) {
            throw new Error("Invalid AHP link data: nc or no is not a valid number.");
        }

        const criteriaNames = parts[currentPart++].split('§');
        const optionNames = parts[currentPart++].split('§');

        if (criteriaNames.length !== numCriteria || optionNames.length !== numOptions) {
            // Możemy próbować uzupełnić lub przyciąć, albo rzucić błąd
            // Na razie rzucimy błąd dla uproszczenia, ale można to uelastycznić
            Logger.warn("[AHP IO] Mismatch in names count. CN: ", criteriaNames.length, "vs", numCriteria, "ON: ", optionNames.length, "vs", numOptions);
            // throw new Error("Mismatch in the number of criteria/option names and their counts.");
        }

        const criteriaMatrixRows = parts[currentPart++].split('~');
        const criteriaComparisonMatrix = criteriaMatrixRows.map(rowStr => 
            rowStr.split('§').map(val => parseFloat(val))
        );

        const optionMatricesStrings = parts[currentPart++].split('|');
        const optionComparisonMatrices = optionMatricesStrings.map(matrixStr => 
            matrixStr.split('~').map(rowStr => 
                rowStr.split('§').map(val => parseFloat(val))
            )
        );
        
        let interfaceMode = 'simplified'; // Domyślnie dla v1
        if (version >= 2 && parts[currentPart]) {
            interfaceMode = parts[currentPart++];
        }

        // ----- Aktualizacja stanu AHP ----- 
        AHP.numCriteria = numCriteria;
        AHP.numOptions = numOptions;
        
        // Aktualizacja pól input dla liczby kryteriów i opcji
        const numCriteriaInput = document.getElementById('ahpNumCriteria');
        if (numCriteriaInput) numCriteriaInput.value = numCriteria;
        const numOptionsInput = document.getElementById('ahpNumOptions');
        if (numOptionsInput) numOptionsInput.value = numOptions;

        // Nazwy (upewnijmy się, że mają odpowiednią długość)
        AHP.criteriaNames = Array(numCriteria).fill("").map((_, i) => criteriaNames[i] || `Kryterium ${i+1}`);
        AHP.optionNames = Array(numOptions).fill("").map((_, i) => optionNames[i] || `Opcja ${i+1}`);

        // Macierze - tutaj kluczowe jest, aby struktura była poprawna
        if (criteriaComparisonMatrix.length === numCriteria && 
            criteriaComparisonMatrix.every(row => row.length === numCriteria)) {
            AHP.criteriaComparisonMatrix = criteriaComparisonMatrix;
        } else {
            Logger.error("[AHP IO] Import error: Criteria comparison matrix dimensions are incorrect. Reinitializing.");
            AHP.criteriaComparisonMatrix = AHP.createIdentityMatrix(numCriteria); // Reset do macierzy jednostkowej
            Utils.showToast("Błąd importu: Macierz kryteriów miała złe wymiary. Zresetowano.", true);
        }

        if (optionComparisonMatrices.length === numCriteria && 
            optionComparisonMatrices.every(matrix => matrix.length === numOptions && matrix.every(row => row.length === numOptions))) {
            AHP.optionComparisonMatrices = optionComparisonMatrices;
        } else {
            Logger.error("[AHP IO] Import error: Option comparison matrices dimensions are incorrect. Reinitializing.");
            AHP.optionComparisonMatrices = Array(numCriteria).fill(null).map(() => AHP.createIdentityMatrix(numOptions)); // Reset
            Utils.showToast("Błąd importu: Macierze opcji miały złe wymiary. Zresetowano.", true);
        }
        
        AHP.interfaceMode = interfaceMode;
        // Ustawienie aktywnego przycisku interfejsu
        if (AHP.interfaceMode === 'matrix') {
            document.getElementById('matrix-interface')?.classList.add('active');
            document.getElementById('simplified-interface')?.classList.remove('active');
        } else {
            document.getElementById('simplified-interface')?.classList.add('active');
            document.getElementById('matrix-interface')?.classList.remove('active');
        }

        Logger.log("[AHP IO] Data imported successfully. Triggering UI update.");

        // Po załadowaniu danych, musimy odświeżyć interfejs użytkownika
        // Wywołujemy AHP.setupInputs(), który powinien przebudować UI na podstawie nowych danych
        if (typeof AHP.setupInputs === 'function') {
            AHP.setupInputs(); 
        } else {
            Logger.error("[AHP IO] AHP.setupInputs is not a function. UI might not update correctly.");
        }
        // Dodatkowo, jeśli interfejs jest uproszczony, trzeba go wyrenderować.
        // W setupInputs powinno być wywołanie odpowiedniej funkcji renderującej
        // np. AHP.createSimplifiedInterface() lub AHP.createCriteriaComparisonMatrix() etc.
        // AHP.setupInputs powinien już to obsłużyć na podstawie AHP.interfaceMode

        Utils.showToast("Dane AHP zostały pomyślnie zaimportowane z linku!", false);
        return true;

    } catch (error) {
        Logger.log("[AHP IO] Error during AHP data import from link:", error, error.stack);
        Utils.showToast("Wystąpił błąd podczas importowania danych AHP z linku. Dane mogą być niekompletne lub uszkodzone.", true);
        // W przypadku błędu można zresetować AHP do stanu początkowego lub poinformować użytkownika
        // AHP.init(); // Można rozważyć reset, ale może to być zbyt drastyczne
        return false;
    }
}; 