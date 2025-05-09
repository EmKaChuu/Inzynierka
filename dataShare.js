// Moduł DataShare - Generowanie i importowanie kodów z danymi
const DataShare = {
    // Funkcja do generowania kodu z danymi z aktualnie aktywnego modułu
    generateShareCode: () => {
        console.log("Generowanie kodu udostępniania dla aktywnego modułu");
        
        let moduleData = {};
        let moduleName = "";
        
        // Określ aktywny moduł i zbierz odpowiednie dane
        switch(App.currentTool) {
            case 'ahp':
                moduleName = "AHP";
                
                // Upewnij się, że zapisywane są aktualne dane z interfejsu
                // Zapisz bieżący stan macierzy porównań
                AHP.saveCurrentComparisonData();
                
                // Przefiltruj tylko istotne dane, bez nadmiarowych informacji
                moduleData = {
                    criteriaNames: AHP.criteriaNames,
                    optionNames: AHP.optionNames,
                    numCriteria: AHP.numCriteria,
                    numOptions: AHP.numOptions,
                    // Zachowaj pełne macierze porównań, aby uniknąć utraty danych
                    criteriaComparisonMatrix: AHP.criteriaComparisonMatrix,
                    optionComparisonMatrices: AHP.optionComparisonMatrices,
                    interfaceMode: AHP.interfaceMode
                };
                break;
                
            case 'cutting-stock':
                moduleName = "CS";
                
                // Zbierz dane zamówień w skompresowanej formie
                const logLength = parseFloat(document.getElementById('logLength').value) || 0;
                const exactCuts = document.getElementById('exactCuts').checked;
                
                // Zbierz dane zamówień w kompaktowej formie - tylko długość i ilość
                const orders = [];
                document.querySelectorAll('[id^="order-row-"]').forEach(row => {
                    const rowId = parseInt(row.id.split('-')[2]);
                    const length = parseFloat(document.getElementById(`order-length-${rowId}`).value) || 0;
                    const quantity = parseInt(document.getElementById(`order-quantity-${rowId}`).value) || 0;
                    
                    if (!isNaN(length) && !isNaN(quantity) && length > 0 && quantity > 0) {
                        orders.push([length, quantity]);
                    }
                });
                
                moduleData = {
                    l: logLength,
                    e: exactCuts,
                    o: orders
                };
                break;
                
            case 'production-opt':
                moduleName = "PO";
                
                // Aktualizuj dane produktów i zasobów
                ProductionOpt.collectProductData();
                ProductionOpt.collectResourceData();
                
                // Zbierz aktywne produkty w bardziej kompaktowej formie
                const products = ProductionOpt.products
                    .filter(p => p && p.active)
                    .map(p => ({
                        n: p.name,
                        p: p.profit,
                        r: p.resourceUsage
                    }));
                
                // Zbierz aktywne zasoby w bardziej kompaktowej formie
                const resources = ProductionOpt.resources
                    .filter(r => r && r.active)
                    .map(r => ({
                        n: r.name,
                        a: r.amount
                    }));
                
                moduleData = {
                    p: products,
                    r: resources
                };
                break;
                
            default:
                // Nieprawidłowy moduł
                Utils.displayResults('shareCodeResult', 'Błąd: Nieprawidłowy moduł', true);
                return null;
        }
        
        // Dodaj informację o module w kompaktowej formie
        const shareData = {
            m: moduleName,
            d: moduleData
        };
        
        // Konwertuj dane do JSON, a następnie do base64
        try {
            // Usunięcie białych znaków z JSON dla dalszej kompresji
            const jsonData = JSON.stringify(shareData, null, 0);
            let base64Data = btoa(encodeURIComponent(jsonData));
            
            // Skompresuj kod do krótszej formy
            base64Data = base64Data
                .replace(/\+/g, '-')  // Zamień + na -
                .replace(/\//g, '_')  // Zamień / na _
                .replace(/=+$/, '');  // Usuń = na końcu
                
            return base64Data;
        } catch (error) {
            console.error("Błąd podczas generowania kodu:", error);
            return null;
        }
    },
    
    // Funkcja do generowania URL z danymi (nowa funkcja)
    generateShareUrl: () => {
        const shareCode = DataShare.generateShareCode();
        if (!shareCode) {
            Utils.displayResults('shareCodeResult', 'Błąd: Nie udało się wygenerować linku.', true);
            return null;
        }
        
        // Utwórz URL z aktualnego adresu i kodem jako fragment
        const currentUrl = window.location.href.split('#')[0]; // Usuń istniejący fragment, jeśli istnieje
        return `${currentUrl}#${shareCode}`;
    },
    
    // Nowa funkcja do generowania URL z danymi i flagą do automatycznego uruchomienia obliczeń
    generateResultsShareUrl: () => {
        // Pobierz kod udostępniania z danymi
        let shareCode = DataShare.generateShareCode();
        if (!shareCode) {
            Utils.displayResults('shareCodeResult', 'Błąd: Nie udało się wygenerować linku z wynikami.', true);
            return null;
        }
        
        // Dodaj flagę by uruchomić obliczenia po załadowaniu
        if (App.currentTool === 'ahp') {
            // Dodaj prefiks 'calc_' do kodu, aby oznaczyć, że po załadowaniu należy wykonać obliczenia
            shareCode = `calc_${shareCode}`;
        }
        
        // Utwórz URL z aktualnego adresu i kodem jako fragment
        const currentUrl = window.location.href.split('#')[0];
        return `${currentUrl}#${shareCode}`;
    },
    
    // Funkcja do importowania danych z kodu
    importFromShareCode: (shareCode) => {
        console.log("Importowanie danych z kodu");
        
        if (!shareCode) {
            Utils.displayResults('shareCodeResult', 'Błąd: Brak kodu do zaimportowania', true);
            return false;
        }
        
        try {
            // Przywróć oryginalne znaki base64
            shareCode = shareCode
                .replace(/-/g, '+')  // Zamień - na +
                .replace(/_/g, '/'); // Zamień _ na /
                
            // Dodaj padding jeśli potrzebny
            while (shareCode.length % 4) {
                shareCode += '=';
            }
            
            // Dodaj funkcję tworzenia macierzy jednostkowej, jeśli nie istnieje w AHP
            if (!AHP.createIdentityMatrix) {
                AHP.createIdentityMatrix = (size) => {
                    const matrix = [];
                    for (let i = 0; i < size; i++) {
                        matrix[i] = [];
                        for (let j = 0; j < size; j++) {
                            matrix[i][j] = (i === j) ? 1 : 0;
                        }
                    }
                    return matrix;
                };
            }
            
            // Dekoduj base64 i parsuj JSON
            const jsonData = decodeURIComponent(atob(shareCode));
            const shareData = JSON.parse(jsonData);
            
            if (!shareData || !shareData.m || !shareData.d) {
                throw new Error("Nieprawidłowy format danych");
            }
            
            // W zależności od modułu, importuj odpowiednie dane
            switch(shareData.m) {
                case "AHP":
                    // Przełącz na moduł AHP, jeśli nie jest aktywny
                    if (App.currentTool !== 'ahp') {
                        App.switchToTool('ahp');
                    }
                    
                    // Rozwijamy skompresowane dane do pełnej struktury
                    const ahpData = {
                        criteriaNames: shareData.d.criteriaNames,
                        optionNames: shareData.d.optionNames,
                        numCriteria: shareData.d.numCriteria,
                        numOptions: shareData.d.numOptions,
                        interfaceMode: shareData.d.interfaceMode
                    };
                    
                    // Jeśli zapisano macierz kryteriów w skompresowanej formie, rozwiń ją
                    if (shareData.d.criteriaMatrix) {
                        ahpData.criteriaComparisonMatrix = AHP.createIdentityMatrix(ahpData.numCriteria + 1);
                        
                        // Wypełnij dolny trójkąt macierzy
                        shareData.d.criteriaMatrix.forEach((row, i) => {
                            row.forEach((value, j) => {
                                ahpData.criteriaComparisonMatrix[i+1][j] = value;
                                // Wypełnij symetryczny element w górnym trójkącie
                                if (i !== j) {
                                    ahpData.criteriaComparisonMatrix[j][i+1] = 1/value;
                                }
                            });
                        });
                    } else if (shareData.d.criteriaComparisonMatrix) {
                        // Używamy pełnej macierzy, jeśli została zapisana w starej formie
                        ahpData.criteriaComparisonMatrix = shareData.d.criteriaComparisonMatrix;
                    }
                    
                    // Rozwiń macierze opcji
                    if (shareData.d.optionMatrices) {
                        ahpData.optionComparisonMatrices = [];
                        
                        shareData.d.optionMatrices.forEach(compressedMatrix => {
                            const fullMatrix = AHP.createIdentityMatrix(ahpData.numOptions + 1);
                            
                            // Wypełnij dolny trójkąt macierzy
                            compressedMatrix.forEach((row, i) => {
                                row.forEach((value, j) => {
                                    fullMatrix[i+1][j] = value;
                                    // Wypełnij symetryczny element w górnym trójkącie
                                    if (i !== j) {
                                        fullMatrix[j][i+1] = 1/value;
                                    }
                                });
                            });
                            
                            ahpData.optionComparisonMatrices.push(fullMatrix);
                        });
                    } else if (shareData.d.optionComparisonMatrices) {
                        // Używamy pełnych macierzy, jeśli zostały zapisane w starej formie
                        ahpData.optionComparisonMatrices = shareData.d.optionComparisonMatrices;
                    }
                    
                    // Importuj dane AHP
                    return DataShare.importAhpData(ahpData);
                    
                case "CS":
                    // Przełącz na moduł rozkroju, jeśli nie jest aktywny
                    if (App.currentTool !== 'cutting-stock') {
                        App.switchToTool('cutting-stock');
                    }
                    
                    // Rozwiń skompresowane dane
                    const csData = {
                        logLength: shareData.d.l,
                        exactCuts: shareData.d.e,
                        orders: shareData.d.o.map((order, index) => ({
                            id: index,
                            length: order[0],
                            quantity: order[1]
                        }))
                    };
                    
                    // Importuj dane problemu rozkroju
                    return DataShare.importCuttingStockData(csData);
                    
                case "PO":
                    // Przełącz na moduł optymalizacji produkcji, jeśli nie jest aktywny
                    if (App.currentTool !== 'production-opt') {
                        App.switchToTool('production-opt');
                    }
                    
                    // Rozwiń skompresowane dane
                    const poData = {
                        products: shareData.d.p.map(p => ({
                            name: p.n,
                            profit: p.p,
                            resourceUsage: p.r
                        })),
                        resources: shareData.d.r.map(r => ({
                            name: r.n,
                            amount: r.a
                        }))
                    };
                    
                    // Importuj dane optymalizacji produkcji
                    return DataShare.importProductionOptData(poData);
                
                // Obsługa starszych formatów kodów
                case "CuttingStock":
                    if (App.currentTool !== 'cutting-stock') {
                        App.switchToTool('cutting-stock');
                    }
                    return DataShare.importCuttingStockData(shareData.d);
                    
                case "ProductionOpt":
                    if (App.currentTool !== 'production-opt') {
                        App.switchToTool('production-opt');
                    }
                    return DataShare.importProductionOptData(shareData.d);
                    
                default:
                    throw new Error(`Nieobsługiwany moduł: ${shareData.m}`);
            }
        } catch (error) {
            console.error("Błąd podczas importowania danych:", error);
            Utils.displayResults('shareCodeResult', `Błąd: ${error.message}`, true);
            return false;
        }
    },
    
    // Funkcja importująca dane AHP
    importAhpData: (data) => {
        if (!data || !data.criteriaNames || !data.optionNames) {
            Utils.displayResults('shareCodeResult', 'Błąd: Nieprawidłowe dane AHP', true);
            return false;
        }
        
        try {
            // Przypisz dane do modułu AHP
            AHP.criteriaNames = data.criteriaNames;
            AHP.optionNames = data.optionNames;
            AHP.numCriteria = data.numCriteria;
            AHP.numOptions = data.numOptions;
            AHP.criteriaComparisonMatrix = data.criteriaComparisonMatrix;
            AHP.optionComparisonMatrices = data.optionComparisonMatrices;
            
            if (data.interfaceMode) {
                AHP.interfaceMode = data.interfaceMode;
            }
            
            // Aktualizuj pola formularza
            document.getElementById('ahpNumCriteria').value = AHP.numCriteria;
            
            const optionsInput = document.getElementById('ahpNumOptions');
            if (optionsInput) {
                optionsInput.value = AHP.numOptions;
            }
            
            // Zresetuj i zainicjalizuj interfejs
            AHP.setupInputs();
            
            // Przełącz tryb interfejsu, jeśli określony
            if (data.interfaceMode === 'matrix') {
                document.getElementById('matrix-interface').click();
            } else if (data.interfaceMode === 'simplified') {
                document.getElementById('simplified-interface').click();
            }
            
            Utils.displayResults('shareCodeResult', 'Dane AHP zostały pomyślnie zaimportowane', false);
            return true;
        } catch (error) {
            console.error("Błąd podczas importowania danych AHP:", error);
            Utils.displayResults('shareCodeResult', `Błąd: ${error.message}`, true);
            return false;
        }
    },
    
    // Funkcja importująca dane problemu rozkroju
    importCuttingStockData: (data) => {
        if (!data || !data.orders || !data.logLength) {
            Utils.displayResults('shareCodeResult', 'Błąd: Nieprawidłowe dane problemu rozkroju', true);
            return false;
        }
        
        try {
            // Zainicjuj czysty interfejs
            CuttingStock.init();
            
            // Ustaw długość kłody
            document.getElementById('logLength').value = data.logLength;
            
            // Ustaw opcję dokładnych cięć
            document.getElementById('exactCuts').checked = data.exactCuts;
            
            // Usuń istniejące wiersze zamówień (oprócz pierwszego)
            document.querySelectorAll('[id^="order-row-"]').forEach(row => {
                if (row.id !== 'order-row-0') {  // Zachowaj pierwszy wiersz
                    row.parentNode.removeChild(row);
                }
            });
            
            // Dodaj importowane zamówienia
            const ordersList = document.getElementById('ordersList');
            ordersList.innerHTML = '';  // Wyczyść wszystkie wiersze
            
            data.orders.forEach((order, index) => {
                const rowId = index;
                CuttingStock.orderRows = Math.max(CuttingStock.orderRows, rowId + 1);
                
                const orderRow = document.createElement('div');
                orderRow.id = `order-row-${rowId}`;
                orderRow.className = 'input-row order-row';
                
                // Etykieta zamówienia
                const orderLabel = document.createElement('span');
                orderLabel.textContent = `Zamówienie ${rowId + 1}:`;
                orderLabel.style.minWidth = '100px';
                orderLabel.className = 'order-label';
                
                // Długość elementu
                const lengthContainer = document.createElement('div');
                lengthContainer.className = 'input-field-container';
                
                const lengthLabel = document.createElement('label');
                lengthLabel.textContent = 'Długość:';
                lengthLabel.htmlFor = `order-length-${rowId}`;
                
                const lengthInput = document.createElement('input');
                lengthInput.type = 'number';
                lengthInput.id = `order-length-${rowId}`;
                lengthInput.step = '0.1';
                lengthInput.min = '0.1';
                lengthInput.placeholder = 'np. 1.2';
                lengthInput.value = order.length;
                
                lengthContainer.appendChild(lengthLabel);
                lengthContainer.appendChild(lengthInput);
                
                // Ilość sztuk
                const quantityContainer = document.createElement('div');
                quantityContainer.className = 'input-field-container';
                
                const quantityLabel = document.createElement('label');
                quantityLabel.textContent = 'Ilość:';
                quantityLabel.htmlFor = `order-quantity-${rowId}`;
                
                const quantityInput = document.createElement('input');
                quantityInput.type = 'number';
                quantityInput.id = `order-quantity-${rowId}`;
                quantityInput.min = '1';
                quantityInput.placeholder = 'np. 10';
                quantityInput.value = order.quantity;
                
                quantityContainer.appendChild(quantityLabel);
                quantityContainer.appendChild(quantityInput);
                
                // Przycisk usuwania
                const removeButton = document.createElement('button');
                removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
                removeButton.className = 'small-button';
                removeButton.onclick = () => CuttingStock.removeOrderRow(rowId);
                removeButton.title = 'Usuń to zamówienie';
                
                // Dodaj elementy do wiersza
                orderRow.appendChild(orderLabel);
                orderRow.appendChild(lengthContainer);
                orderRow.appendChild(quantityContainer);
                orderRow.appendChild(removeButton);
                
                // Dodaj wiersz do listy zamówień
                ordersList.appendChild(orderRow);
            });
            
            CuttingStock.orders = data.orders;
            
            Utils.displayResults('shareCodeResult', 'Dane problemu rozkroju zostały pomyślnie zaimportowane', false);
            return true;
        } catch (error) {
            console.error("Błąd podczas importowania danych problemu rozkroju:", error);
            Utils.displayResults('shareCodeResult', `Błąd: ${error.message}`, true);
            return false;
        }
    },
    
    // Funkcja importująca dane optymalizacji produkcji
    importProductionOptData: (data) => {
        if (!data || !data.products || !data.resources) {
            Utils.displayResults('shareCodeResult', 'Błąd: Nieprawidłowe dane optymalizacji produkcji', true);
            return false;
        }
        
        try {
            // Zainicjuj czysty interfejs
            ProductionOpt.init();
            
            // Wyczyść istniejące dane
            const productsList = document.getElementById('productsList');
            const resourcesList = document.getElementById('resourcesList');
            
            if (productsList) productsList.innerHTML = '';
            if (resourcesList) resourcesList.innerHTML = '';
            
            ProductionOpt.productRows = 0;
            ProductionOpt.products = [];
            ProductionOpt.resourceRows = 0;
            ProductionOpt.resources = [];
            
            // Najpierw dodaj wszystkie zasoby
            for (const resource of data.resources) {
                const rowId = ProductionOpt.resourceRows++;
                
                const resourceRow = document.createElement('div');
                resourceRow.id = `resource-row-${rowId}`;
                resourceRow.className = 'input-row resource-row';
                
                // Nazwa zasobu
                const nameContainer = document.createElement('div');
                nameContainer.className = 'input-field-container';
                
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'Nazwa:';
                nameLabel.htmlFor = `resource-name-${rowId}`;
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.id = `resource-name-${rowId}`;
                nameInput.placeholder = 'np. Surowiec 1';
                nameInput.value = resource.name;
                
                nameContainer.appendChild(nameLabel);
                nameContainer.appendChild(nameInput);
                
                // Dostępna ilość
                const amountContainer = document.createElement('div');
                amountContainer.className = 'input-field-container';
                
                const amountLabel = document.createElement('label');
                amountLabel.textContent = 'Dostępna ilość:';
                amountLabel.htmlFor = `resource-amount-${rowId}`;
                
                const amountInput = document.createElement('input');
                amountInput.type = 'number';
                amountInput.id = `resource-amount-${rowId}`;
                amountInput.step = '1';
                amountInput.min = '0';
                amountInput.placeholder = 'np. 100';
                amountInput.value = resource.amount;
                
                amountContainer.appendChild(amountLabel);
                amountContainer.appendChild(amountInput);
                
                // Przycisk usuwania
                const removeButton = document.createElement('button');
                removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
                removeButton.className = 'small-button';
                removeButton.onclick = () => ProductionOpt.removeResourceRow(rowId);
                removeButton.title = 'Usuń ten zasób';
                
                // Dodaj elementy do wiersza
                resourceRow.appendChild(nameContainer);
                resourceRow.appendChild(amountContainer);
                resourceRow.appendChild(removeButton);
                
                // Dodaj wiersz do listy zasobów
                resourcesList.appendChild(resourceRow);
                
                // Dodaj ten zasób do listy
                ProductionOpt.resources[rowId] = {
                    active: true,
                    name: resource.name,
                    amount: resource.amount
                };
            }
            
            // Teraz dodaj produkty
            for (const product of data.products) {
                const rowId = ProductionOpt.productRows++;
                
                const productRow = document.createElement('div');
                productRow.id = `product-row-${rowId}`;
                productRow.className = 'input-row product-row';
                
                // Nazwa produktu
                const nameContainer = document.createElement('div');
                nameContainer.className = 'input-field-container';
                
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'Nazwa:';
                nameLabel.htmlFor = `product-name-${rowId}`;
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.id = `product-name-${rowId}`;
                nameInput.placeholder = 'np. Produkt A';
                nameInput.value = product.name;
                
                nameContainer.appendChild(nameLabel);
                nameContainer.appendChild(nameInput);
                
                // Zysk/koszt jednostkowy
                const profitContainer = document.createElement('div');
                profitContainer.className = 'input-field-container';
                
                const profitLabel = document.createElement('label');
                profitLabel.textContent = 'Zysk/szt:';
                profitLabel.htmlFor = `product-profit-${rowId}`;
                
                const profitInput = document.createElement('input');
                profitInput.type = 'number';
                profitInput.id = `product-profit-${rowId}`;
                profitInput.step = '0.1';
                profitInput.placeholder = 'np. 10';
                profitInput.value = product.profit;
                
                profitContainer.appendChild(profitLabel);
                profitContainer.appendChild(profitInput);
                
                // Przycisk usuwania
                const removeButton = document.createElement('button');
                removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
                removeButton.className = 'small-button';
                removeButton.onclick = () => ProductionOpt.removeProductRow(rowId);
                removeButton.title = 'Usuń ten produkt';
                
                // Dodaj elementy do wiersza
                productRow.appendChild(nameContainer);
                productRow.appendChild(profitContainer);
                
                // Dodaj pola dla zużycia zasobów
                const resourceUsageContainer = document.createElement('div');
                resourceUsageContainer.className = 'resource-usage-container';
                resourceUsageContainer.id = `resource-usage-${rowId}`;
                productRow.appendChild(resourceUsageContainer);
                
                // Dodaj przycisk usuwania
                productRow.appendChild(removeButton);
                
                // Dodaj wiersz do listy produktów
                productsList.appendChild(productRow);
                
                // Dodaj ten produkt do listy
                ProductionOpt.products[rowId] = {
                    active: true,
                    name: product.name,
                    profit: product.profit,
                    resourceUsage: [...product.resourceUsage]
                };
                
                // Aktualizuj pola zużycia zasobów
                ProductionOpt.updateResourceUsageFields(rowId);
            }
            
            Utils.displayResults('shareCodeResult', 'Dane optymalizacji produkcji zostały pomyślnie zaimportowane', false);
            return true;
        } catch (error) {
            console.error("Błąd podczas importowania danych optymalizacji produkcji:", error);
            Utils.displayResults('shareCodeResult', `Błąd: ${error.message}`, true);
            return false;
        }
    },
    
    // Funkcja sprawdzająca URL pod kątem kodu udostępniania
    checkUrlForShareCode: () => {
        try {
            // Pobierz fragment URL (część po #)
            const fragment = window.location.hash;
            
            if (fragment && fragment.length > 1) {
                // Usuń # z początku fragmentu
                let shareCode = fragment.substring(1);
                console.log("Wykryto kod udostępniania w URL:", shareCode);
                
                // Sprawdź, czy kod zawiera prefiks 'calc_' oznaczający, że należy wykonać obliczenia
                const shouldCalculate = shareCode.startsWith('calc_');
                if (shouldCalculate) {
                    // Usuń prefiks 'calc_' z kodu
                    shareCode = shareCode.substring(5);
                }
                
                // Importuj dane z kodu
                const success = DataShare.importFromShareCode(shareCode);
                
                // Jeśli dane zostały zaimportowane pomyślnie i kod zawierał prefiks 'calc_'
                if (success && shouldCalculate) {
                    console.log("Automatyczne uruchamianie obliczeń...");
                    
                    // Opóźnij obliczenia, aby dać czas na pełne załadowanie interfejsu
                    setTimeout(() => {
                        if (App.currentTool === 'ahp') {
                            // Uruchom obliczenia AHP
                            AHP.calculate();
                        } else if (App.currentTool === 'cutting-stock') {
                            // Uruchom obliczenia problemu rozkroju
                            CuttingStock.calculate();
                        } else if (App.currentTool === 'production-opt') {
                            // Uruchom obliczenia optymalizacji produkcji
                            ProductionOpt.calculate();
                        }
                    }, 1000);
                }
                
                // Usuń kod z URL, aby uniknąć ponownego importu przy odświeżeniu
                if (history.pushState) {
                    history.pushState("", document.title, window.location.pathname + window.location.search);
                } else {
                    // Fallback dla starszych przeglądarek
                    window.location.hash = "";
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error("Błąd podczas sprawdzania URL pod kątem kodu udostępniania:", error);
            return false;
        }
    },
    
    // Funkcja do tworzenia interfejsu udostępniania
    createShareInterface: (containerId) => {
        console.log(`Tworzenie interfejsu udostępniania dla kontenera: ${containerId}`);
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Wyczyść aktualną zawartość
        container.innerHTML = '';
        
        // Upewnij się, że kontener jest widoczny (tylko ta linia jest dodana w celu naprawy)
        container.style.display = 'block';
        
        // Kontener główny
        const shareContainer = document.createElement('div');
        shareContainer.className = 'share-container';
        
        // Kompaktowy interfejs z zakładkami
        const tabContainer = document.createElement('div');
        tabContainer.className = 'share-tabs';
        
        // Przyciski zakładek
        const generateTab = document.createElement('button');
        generateTab.className = 'share-tab-button active';
        generateTab.innerHTML = '<i class="fas fa-share-alt"></i> Udostępnij';
        generateTab.onclick = () => switchTab('generate');
        
        const importTab = document.createElement('button');
        importTab.className = 'share-tab-button';
        importTab.innerHTML = '<i class="fas fa-file-import"></i> Importuj';
        importTab.onclick = () => switchTab('import');
        
        tabContainer.appendChild(generateTab);
        tabContainer.appendChild(importTab);
        
        // Kontenery zawartości zakładek
        const generateContent = document.createElement('div');
        generateContent.className = 'share-tab-content active';
        generateContent.id = 'generate-tab';
        generateContent.style.display = 'block';
        
        const importContent = document.createElement('div');
        importContent.className = 'share-tab-content';
        importContent.id = 'import-tab';
        importContent.style.display = 'none';
        
        // Zawartość zakładki generowania
        // Usuwam przycisk "Generuj kod", ponieważ nie jest już potrzebny
        
        const codeWrapper = document.createElement('textarea');
        codeWrapper.id = 'shareCodeWrapper';
        codeWrapper.className = 'share-code-wrapper';
        codeWrapper.readOnly = true;
        codeWrapper.placeholder = 'Tu pojawi się wygenerowany kod po kliknięciu jednego z przycisków poniżej';
        codeWrapper.style.height = '60px';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'share-buttons-container';
        buttonContainer.style.display = 'flex';
        
        const copyButton = document.createElement('button');
        copyButton.id = 'copyShareCodeButton';
        copyButton.className = 'action-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Kopiuj kod';
        copyButton.onclick = () => {
            // Zawsze generuj świeży kod
            const shareCode = DataShare.generateShareCode();
            if (shareCode) {
                codeWrapper.value = shareCode;
                codeWrapper.select();
                document.execCommand('copy');
                Utils.displayResults('shareCodeResult', 'Kod został wygenerowany i skopiowany', false);
            } else {
                Utils.displayResults('shareCodeResult', 'Błąd: Nie udało się wygenerować kodu.', true);
            }
        };
        
        // Przycisk do generowania i kopiowania zwykłego linku
        const urlButton = document.createElement('button');
        urlButton.id = 'generateUrlButton';
        urlButton.className = 'action-button';
        urlButton.innerHTML = '<i class="fas fa-link"></i> Kopiuj link';
        urlButton.onclick = () => {
            // Zawsze generuj świeży link
            const shareUrl = DataShare.generateShareUrl();
            if (shareUrl) {
                // Aktualizuj kod w polu tekstowym
                const shareCode = shareUrl.split('#')[1];
                codeWrapper.value = shareCode;
                
                // Skopiuj wygenerowany URL do schowka
                const tempInput = document.createElement('input');
                document.body.appendChild(tempInput);
                tempInput.value = shareUrl;
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                Utils.displayResults('shareCodeResult', 'Link został wygenerowany i skopiowany do schowka', false);
            } else {
                Utils.displayResults('shareCodeResult', 'Błąd: Nie udało się wygenerować linku.', true);
            }
        };
        
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(urlButton);
        
        // Dodaj przycisk generowania linku z wynikami (tylko dla AHP)
        if (containerId === 'ahp-share-container') {
            const resultsUrlButton = document.createElement('button');
            resultsUrlButton.id = 'generateResultsUrlButton';
            resultsUrlButton.className = 'action-button';
            resultsUrlButton.innerHTML = '<i class="fas fa-calculator"></i> Kopiuj link z wynikami';
            resultsUrlButton.title = 'Generuje link, który po otwarciu automatycznie przeprowadzi obliczenia';
            resultsUrlButton.onclick = () => {
                // Zawsze generuj świeży link z wynikami
                const resultsUrl = DataShare.generateResultsShareUrl();
                if (resultsUrl) {
                    // Aktualizuj kod w polu tekstowym (bez prefiksu calc_)
                    let shareCode = resultsUrl.split('#')[1];
                    if (shareCode.startsWith('calc_')) {
                        shareCode = shareCode.substring(5);
                    }
                    codeWrapper.value = shareCode;
                    
                    // Skopiuj wygenerowany URL do schowka
                    const tempInput = document.createElement('input');
                    document.body.appendChild(tempInput);
                    tempInput.value = resultsUrl;
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    
                    Utils.displayResults('shareCodeResult', 'Link z wynikami został wygenerowany i skopiowany do schowka', false);
                } else {
                    Utils.displayResults('shareCodeResult', 'Błąd: Nie udało się wygenerować linku z wynikami.', true);
                }
            };
            
            buttonContainer.appendChild(resultsUrlButton);
        }
        
        // Dodaję informację o funkcjonalności
        const infoText = document.createElement('p');
        infoText.className = 'share-info-text';
        infoText.innerHTML = 'Kliknij jeden z przycisków poniżej, aby wygenerować i skopiować kod/link do udostępnienia';
        infoText.style.fontSize = '14px';
        infoText.style.fontStyle = 'italic';
        infoText.style.marginBottom = '10px';
        
        generateContent.appendChild(infoText);
        generateContent.appendChild(buttonContainer);
        generateContent.appendChild(codeWrapper);
        
        // Zawartość zakładki importu
        const importInput = document.createElement('textarea');
        importInput.id = 'importCodeInput';
        importInput.className = 'share-code-wrapper';
        importInput.placeholder = 'Wklej kod tutaj...';
        importInput.style.height = '60px';
        importInput.style.marginBottom = '10px';
        
        const importButton = document.createElement('button');
        importButton.className = 'action-button';
        importButton.innerHTML = '<i class="fas fa-file-import"></i> Importuj';
        importButton.onclick = () => {
            const shareCode = importInput.value.trim();
            if (shareCode) {
                const success = DataShare.importFromShareCode(shareCode);
                if (success) {
                    importInput.value = '';
                }
            } else {
                Utils.displayResults('shareCodeResult', 'Błąd: Podaj kod do zaimportowania.', true);
            }
        };
        
        importContent.appendChild(importInput);
        importContent.appendChild(importButton);
        
        // Miejsce na wynik operacji
        const resultContainer = document.createElement('div');
        resultContainer.id = 'shareCodeResult';
        resultContainer.className = 'result-container';
        resultContainer.style.display = 'none';
        
        // Dodaj wszystko do głównego kontenera
        shareContainer.appendChild(tabContainer);
        shareContainer.appendChild(generateContent);
        shareContainer.appendChild(importContent);
        shareContainer.appendChild(resultContainer);
        
        container.appendChild(shareContainer);
        
        // Funkcja przełączania zakładek
        function switchTab(tabName) {
            if (tabName === 'generate') {
                generateTab.classList.add('active');
                importTab.classList.remove('active');
                generateContent.style.display = 'block';
                importContent.style.display = 'none';
            } else {
                generateTab.classList.remove('active');
                importTab.classList.add('active');
                generateContent.style.display = 'none';
                importContent.style.display = 'block';
            }
            resultContainer.style.display = 'none';
        }
    }
};

// Dodajemy funkcję do ręcznego wymuszenia inicjalizacji interfejsów udostępniania
// Ta funkcja zostanie wywołana po określonym czasie po załadowaniu strony
window.forceInitShareInterfaces = function() {
    console.log("Wymuszanie inicjalizacji interfejsów udostępniania");
    
    ['ahp', 'cutting-stock', 'production-opt'].forEach(function(tool) {
        const toolElement = document.getElementById(`tool-${tool}`);
        const containerId = `${tool}-share-container`;
        
        if (toolElement) {
            // Sprawdź, czy kontener już istnieje
            let container = document.getElementById(containerId);
            
            // Jeśli nie istnieje, stwórz go
            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                container.className = 'share-section-container';
                
                const header = document.createElement('h3');
                header.textContent = 'Udostępnianie danych';
                container.appendChild(header);
                
                toolElement.appendChild(container);
                
                console.log(`Stworzono nowy kontener ${containerId}`);
            } else {
                console.log(`Kontener ${containerId} już istnieje`);
            }
            
            // Wymuszamy ponowne utworzenie interfejsu
            if (typeof DataShare !== 'undefined' && typeof DataShare.createShareInterface === 'function') {
                DataShare.createShareInterface(containerId);
            }
        }
    });
};

// Dodaj funkcję inicjalizacyjną do ładowania interfejsu udostępniania po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicjalizacja modułu DataShare");
    
    // Znajdź lub stwórz sekcje do udostępniania dla każdego modułu
    const createShareSection = (toolId, containerId) => {
        const toolContainer = document.getElementById(toolId);
        if (!toolContainer) return;
        
        let shareSection = document.getElementById(containerId);
        
        if (!shareSection) {
            // Stwórz nową sekcję
            shareSection = document.createElement('div');
            shareSection.id = containerId;
            shareSection.className = 'share-section-container';
            
            const header = document.createElement('h3');
            header.textContent = 'Udostępnianie danych';
            shareSection.appendChild(header);
            
            // Dodaj sekcję do kontenera narzędzia
            toolContainer.appendChild(shareSection);
        }
        
        return shareSection;
    };
    
    // Stwórz sekcje udostępniania dla każdego narzędzia
    const ahpShare = createShareSection('tool-ahp', 'ahp-share-container');
    const cuttingStockShare = createShareSection('tool-cutting-stock', 'cutting-stock-share-container');
    const productionOptShare = createShareSection('tool-production-opt', 'production-opt-share-container');
    
    // Inicjalizuj interfejsy udostępniania
    if (ahpShare) DataShare.createShareInterface('ahp-share-container');
    if (cuttingStockShare) DataShare.createShareInterface('cutting-stock-share-container');
    if (productionOptShare) DataShare.createShareInterface('production-opt-share-container');
    
    // Sprawdź, czy URL zawiera kod udostępniania
    setTimeout(() => {
        DataShare.checkUrlForShareCode();
    }, 500); // Małe opóźnienie, aby upewnić się, że strona jest w pełni załadowana
});

// Dodajemy globalny event resize dla dodatkowej inicjalizacji interfejsów
window.addEventListener('resize', () => {
    if (typeof DataShare !== 'undefined' && typeof window.forceInitShareInterfaces === 'function') {
        window.forceInitShareInterfaces();
    }
}); 