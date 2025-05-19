// Moduł ProductionOpt - Optymalizacja produkcji
const ProductionOpt = {
    productRows: 0,
    products: [],
    resourceRows: 0,
    resources: [],
    solution: null,
    
    init: () => {
        Logger.log('INFO', "Executing ProductionOpt.init()");
        
        // Wyczyść poprzednie wyniki, ale zachowaj dane wejściowe
        Utils.clearElement('productionOptResults');
        Utils.clearElement('productionOptVisualization');
        Utils.hideElement('productionOptLoadingIndicator');
        
        // Przygotuj listy produktów i zasobów TYLKO jeśli są puste
        const productsList = document.getElementById('productsList');
        const resourcesList = document.getElementById('resourcesList');
        
        const hasExistingData = ProductionOpt.products.length > 0 || ProductionOpt.resources.length > 0;
        
        if (productsList && resourcesList && (productsList.children.length === 0 || resourcesList.children.length === 0)) {
            if (!hasExistingData) {
                // Inicjalizacja tylko przy pierwszym uruchomieniu
                ProductionOpt.productRows = 0;
                ProductionOpt.products = [];
                ProductionOpt.resourceRows = 0;
                ProductionOpt.resources = [];
                
                // Dodaj pierwszy wiersz produktu i zasobu
                ProductionOpt.addProductRow();
                ProductionOpt.addResourceRow();
            } else {
                // Odtwórz interfejs z istniejących danych
                ProductionOpt.rebuildInterface();
            }
        }
        
        // Podepnij obsługę przycisku obliczania
        const calculateButton = document.querySelector('#tool-production-opt .calculate-button');
        if (calculateButton) {
            calculateButton.addEventListener('click', ProductionOpt.calculate);
        }
        
        // Dodaj przyciski do ładowania przykładowych wartości, zapisywania i eksportu wyników
        const inputGroup = document.querySelector('#tool-production-opt .input-group');
        
        if (inputGroup && !document.getElementById('loadSampleDataProdButton')) {
            const buttonRow = document.createElement('div');
            buttonRow.className = 'input-row button-row';
            buttonRow.style.marginTop = '20px';
            buttonRow.style.justifyContent = 'center';
            
            const loadSampleButton = document.createElement('button');
            loadSampleButton.id = 'loadSampleDataProdButton';
            loadSampleButton.innerHTML = '<i class="fas fa-flask"></i> Załaduj przykładowe dane';
            loadSampleButton.onclick = ProductionOpt.loadSampleData;
            loadSampleButton.className = 'action-button';
            loadSampleButton.title = 'Załaduj przykładowe dane do testowania';
            
            buttonRow.appendChild(loadSampleButton);
            inputGroup.appendChild(buttonRow);
        }
    },

    getCurrentData: () => {
        const optimizationTypeElement = document.getElementById('optimizationType');
        const optimizationType = optimizationTypeElement ? optimizationTypeElement.value : 'maximize';
        
        const products = [];
        const productElements = document.querySelectorAll('#productsList .product-row');
        productElements.forEach(productElement => {
            const productIdString = productElement.id.split('-').pop();
            if (productIdString === undefined) return;
            const productId = parseInt(productIdString);

            // Sprawdź, czy produkt jest aktywny w modelu danych
            if (ProductionOpt.products[productId] && ProductionOpt.products[productId].active === false) return; 

            const nameInput = document.getElementById(`product-name-${productId}`);
            const profitInput = document.getElementById(`product-profit-${productId}`);
            
            if (nameInput && profitInput && nameInput.value && profitInput.value) {
                const productData = {
                    id: productId,
                    name: nameInput.value,
                    profit: parseFloat(profitInput.value),
                    resourceUsage: []
                };
                
                // Pobierz zużycie zasobów dla tego produktu
                // Zakładamy, że kolejność pól zużycia odpowiada kolejności aktywnych zasobów
                const activeResources = ProductionOpt.resources.filter(r => r.active);
                for (let i = 0; i < activeResources.length; i++) {
                    const usageInputElement = document.getElementById(`resource-usage-${productId}-${i}`); // ID może wymagać weryfikacji
                    if (usageInputElement) {
                        productData.resourceUsage.push(parseFloat(usageInputElement.value) || 0);
                    } else {
                        productData.resourceUsage.push(0); // Domyślne zużycie jeśli pole nie istnieje
                    }
                }
                products.push(productData);
            }
        });

        const resources = [];
        const resourceElements = document.querySelectorAll('#resourcesList .resource-row');
        resourceElements.forEach(resourceElement => {
            const resourceIdString = resourceElement.id.split('-').pop();
            if (resourceIdString === undefined) return;
            const resourceId = parseInt(resourceIdString);

            // Sprawdź, czy zasób jest aktywny w modelu danych
            if (ProductionOpt.resources[resourceId] && ProductionOpt.resources[resourceId].active === false) return;

            const nameInput = document.getElementById(`resource-name-${resourceId}`);
            const amountInput = document.getElementById(`resource-amount-${resourceId}`);

            if (nameInput && amountInput && nameInput.value && amountInput.value) {
                resources.push({
                    id: resourceId,
                    name: nameInput.value,
                    amount: parseFloat(amountInput.value)
                });
            }
        });
        
        return {
            optimizationType: optimizationType,
            products: products,
            resources: resources
        };
    },

    loadData: (data) => {
        if (!data) return;

        const optimizationTypeElement = document.getElementById('optimizationType');
        if (data.optimizationType && optimizationTypeElement) {
            optimizationTypeElement.value = data.optimizationType;
        }

        // Przywróć produkty i zasoby do modelu danych
        // Upewnij się, że zachowujemy informację o 'active'
        ProductionOpt.products = (data.products || []).map(p => ({ ...p, active: true })); // Domyślnie aktywne po załadowaniu
        ProductionOpt.resources = (data.resources || []).map(r => ({ ...r, active: true }));

        ProductionOpt.productRows = ProductionOpt.products.length > 0 ? Math.max(...ProductionOpt.products.map(p => p.id)) + 1 : 0;
        ProductionOpt.resourceRows = ProductionOpt.resources.length > 0 ? Math.max(...ProductionOpt.resources.map(r => r.id)) + 1 : 0;
        
        const productsList = document.getElementById('productsList');
        if (productsList) productsList.innerHTML = '';
        const resourcesList = document.getElementById('resourcesList');
        if (resourcesList) resourcesList.innerHTML = '';
        
        ProductionOpt.rebuildInterface(); 
    },

    addProductRow: () => {
        const productsList = document.getElementById('productsList');
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
        nameInput.value = `Produkt ${String.fromCharCode(65 + rowId)}`;
        
        nameContainer.appendChild(nameLabel);
        nameContainer.appendChild(nameInput);
        
        // Zysk/koszt jednostkowy (pozostaje jako zysk)
        const profitContainer = document.createElement('div');
        profitContainer.className = 'input-field-container';
        
        const profitLabel = document.createElement('label');
        profitLabel.textContent = 'Zysk/szt.:'; // Utrzymujemy to jako zysk
        profitLabel.htmlFor = `product-profit-${rowId}`;
        
        const profitInput = document.createElement('input');
        profitInput.type = 'number';
        profitInput.id = `product-profit-${rowId}`;
        profitInput.step = '0.1';
        profitInput.placeholder = 'np. 10';
        profitInput.value = '10';
        
        profitContainer.appendChild(profitLabel);
        profitContainer.appendChild(profitInput);

        // Koszt jednostkowy (nowe pole)
        const costContainer = document.createElement('div');
        costContainer.className = 'input-field-container';

        const costLabel = document.createElement('label');
        costLabel.textContent = 'Koszt/szt.:';
        costLabel.htmlFor = `product-cost-${rowId}`;

        const costInput = document.createElement('input');
        costInput.type = 'number';
        costInput.id = `product-cost-${rowId}`;
        costInput.step = '0.1';
        costInput.min = '0';
        costInput.placeholder = 'np. 5';
        costInput.value = '5'; // Domyślna wartość

        costContainer.appendChild(costLabel);
        costContainer.appendChild(costInput);

        // Min ilość (nowe pole)
        const minQtyContainer = document.createElement('div');
        minQtyContainer.className = 'input-field-container';

        const minQtyLabel = document.createElement('label');
        minQtyLabel.textContent = 'Min. ilość:';
        minQtyLabel.htmlFor = `product-min-qty-${rowId}`;

        const minQtyInput = document.createElement('input');
        minQtyInput.type = 'number';
        minQtyInput.id = `product-min-qty-${rowId}`;
        minQtyInput.step = '1';
        minQtyInput.min = '0';
        minQtyInput.placeholder = '(opcjonalnie)';

        minQtyContainer.appendChild(minQtyLabel);
        minQtyContainer.appendChild(minQtyInput);

        // Max ilość (nowe pole)
        const maxQtyContainer = document.createElement('div');
        maxQtyContainer.className = 'input-field-container';

        const maxQtyLabel = document.createElement('label');
        maxQtyLabel.textContent = 'Max. ilość:';
        maxQtyLabel.htmlFor = `product-max-qty-${rowId}`;

        const maxQtyInput = document.createElement('input');
        maxQtyInput.type = 'number';
        maxQtyInput.id = `product-max-qty-${rowId}`;
        maxQtyInput.step = '1';
        maxQtyInput.min = '0';
        maxQtyInput.placeholder = '(opcjonalnie)';

        maxQtyContainer.appendChild(maxQtyLabel);
        maxQtyContainer.appendChild(maxQtyInput);
        
        // Przycisk usuwania
        const removeButton = document.createElement('button');
        removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
        removeButton.className = 'small-button';
        removeButton.onclick = () => ProductionOpt.removeProductRow(rowId);
        removeButton.title = 'Usuń ten produkt';
        
        // Dodaj elementy do wiersza
        productRow.appendChild(nameContainer);
        productRow.appendChild(profitContainer);
        productRow.appendChild(costContainer); // Dodajemy nowe pole
        productRow.appendChild(minQtyContainer); // Dodajemy nowe pole
        productRow.appendChild(maxQtyContainer); // Dodajemy nowe pole
        
        // Dodaj pola dla zużycia zasobów (początkowo żadne, zostaną dodane później)
        const resourceUsageContainer = document.createElement('div');
        resourceUsageContainer.className = 'resource-usage-container';
        resourceUsageContainer.id = `resource-usage-${rowId}`;
        productRow.appendChild(resourceUsageContainer);
        
        // Dodaj przycisk usuwania
        productRow.appendChild(removeButton);
        
        // Dodaj wiersz do listy produktów
        productsList.appendChild(productRow);
        
        // Aktualizuj pola zużycia zasobów dla tego produktu
        ProductionOpt.updateResourceUsageFields(rowId);
        
        // Dodaj ten produkt do listy
        ProductionOpt.products[rowId] = {
            active: true,
            name: `Produkt ${String.fromCharCode(65 + rowId)}`,
            profit: 10,
            cost: 5, // Domyślny koszt
            minQuantity: null, // Domyślnie brak limitu
            maxQuantity: null, // Domyślnie brak limitu
            resourceUsage: Array(Math.max(1, ProductionOpt.resourceRows)).fill(1)
        };
    },
    
    removeProductRow: (rowId) => {
        const row = document.getElementById(`product-row-${rowId}`);
        if (row) {
            row.parentNode.removeChild(row);
            
            // Oznacz produkt jako nieaktywny zamiast go usuwać
            if (ProductionOpt.products[rowId]) {
                ProductionOpt.products[rowId].active = false;
            }
        }
    },

    addResourceRow: () => {
        const resourcesList = document.getElementById('resourcesList');
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
        nameInput.value = `Zasób ${rowId + 1}`;
        
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
        amountInput.value = '100';
        
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
            name: `Zasób ${rowId + 1}`,
            amount: 100
        };
        
        // Zaktualizuj wszystkie pola zużycia zasobów dla istniejących produktów
        for (let i = 0; i < ProductionOpt.productRows; i++) {
            if (ProductionOpt.products[i] && ProductionOpt.products[i].active) {
                // Dodaj domyślne zużycie dla nowego zasobu
                if (ProductionOpt.products[i].resourceUsage.length < ProductionOpt.resourceRows) {
                    ProductionOpt.products[i].resourceUsage.push(1);
                }
                ProductionOpt.updateResourceUsageFields(i);
            }
        }
    },
    
    removeResourceRow: (rowId) => {
        const row = document.getElementById(`resource-row-${rowId}`);
        if (row) {
            row.parentNode.removeChild(row);
            
            // Oznacz zasób jako nieaktywny zamiast go usuwać
            if (ProductionOpt.resources[rowId]) {
                ProductionOpt.resources[rowId].active = false;
                
                // Usuń odpowiednie pola zużycia zasobów z produktów
                for (let i = 0; i < ProductionOpt.productRows; i++) {
                    if (ProductionOpt.products[i] && ProductionOpt.products[i].active) {
                        ProductionOpt.updateResourceUsageFields(i);
                    }
                }
            }
        }
    },

    updateResourceUsageFields: (productRowId) => {
        // Aktualizuje pola zużycia zasobów dla danego produktu
        const container = document.getElementById(`resource-usage-${productRowId}`);
        if (!container) return;
        
        container.innerHTML = '';
        
        let resourceIndex = 0;
        for (let i = 0; i < ProductionOpt.resourceRows; i++) {
            if (!ProductionOpt.resources[i] || !ProductionOpt.resources[i].active) continue;
            
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'input-field-container';
            
            const label = document.createElement('label');
            label.textContent = `${ProductionOpt.resources[i].name}:`;
            label.htmlFor = `product-resource-${productRowId}-${i}`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `product-resource-${productRowId}-${i}`;
            input.className = 'resource-usage-input';
            input.step = '0.1';
            input.min = '0';
            input.placeholder = 'Zużycie';
            
            // Ustaw wartość z modelu danych lub domyślną
            if (ProductionOpt.products[productRowId] && 
                ProductionOpt.products[productRowId].resourceUsage && 
                resourceIndex < ProductionOpt.products[productRowId].resourceUsage.length) {
                input.value = ProductionOpt.products[productRowId].resourceUsage[resourceIndex];
            } else {
                input.value = '1';
            }
            
            // Dodaj obsługę zdarzeń do aktualizacji danych
            input.dataset.productId = productRowId;
            input.dataset.resourceId = i;
            input.addEventListener('change', (e) => {
                const prodId = parseInt(e.target.dataset.productId);
                const resId = parseInt(e.target.dataset.resourceId);
                const value = parseFloat(e.target.value) || 0;
                
                if (ProductionOpt.products[prodId] && ProductionOpt.products[prodId].active) {
                    // Zapewnij, że tablica ma odpowiednią długość
                    while (ProductionOpt.products[prodId].resourceUsage.length <= resId) {
                        ProductionOpt.products[prodId].resourceUsage.push(0);
                    }
                    ProductionOpt.products[prodId].resourceUsage[resourceIndex] = value;
                }
            });
            
            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            container.appendChild(fieldContainer);
            
            resourceIndex++;
        }
    },
    
    collectProductData: () => {
        // Zbierz aktualne dane produktów
        for (let i = 0; i < ProductionOpt.productRows; i++) {
            if (!ProductionOpt.products[i] || !ProductionOpt.products[i].active) continue;
            
            const nameInput = document.getElementById(`product-name-${i}`);
            const profitInput = document.getElementById(`product-profit-${i}`);
            const costInput = document.getElementById(`product-cost-${i}`); // NOWE
            const minQtyInput = document.getElementById(`product-min-qty-${i}`); // NOWE
            const maxQtyInput = document.getElementById(`product-max-qty-${i}`); // NOWE
            
            if (nameInput && profitInput && costInput && minQtyInput && maxQtyInput) { // Upewniamy się, że wszystkie nowe inputy istnieją
                ProductionOpt.products[i].name = nameInput.value || `Produkt ${i+1}`;
                ProductionOpt.products[i].profit = parseFloat(profitInput.value) || 0;
                ProductionOpt.products[i].cost = parseFloat(costInput.value) || 0; // NOWE
                
                const minQty = parseInt(minQtyInput.value);
                ProductionOpt.products[i].minQuantity = isNaN(minQty) ? null : minQty; // NOWE
                
                const maxQty = parseInt(maxQtyInput.value);
                ProductionOpt.products[i].maxQuantity = isNaN(maxQty) ? null : maxQty; // NOWE
            }
            
            // Zbierz dane zużycia zasobów
            let resourceIndex = 0;
            for (let j = 0; j < ProductionOpt.resourceRows; j++) {
                if (!ProductionOpt.resources[j] || !ProductionOpt.resources[j].active) continue;
                
                const usageInput = document.getElementById(`product-resource-${i}-${j}`);
                if (usageInput) {
                    // Zapewnij, że tablica ma odpowiednią długość
                    while (ProductionOpt.products[i].resourceUsage.length <= resourceIndex) {
                        ProductionOpt.products[i].resourceUsage.push(0);
                    }
                    
                    ProductionOpt.products[i].resourceUsage[resourceIndex] = parseFloat(usageInput.value) || 0;
                }
                
                resourceIndex++;
            }
        }
    },
    
    collectResourceData: () => {
        // Zbierz aktualne dane zasobów
        for (let i = 0; i < ProductionOpt.resourceRows; i++) {
            if (!ProductionOpt.resources[i] || !ProductionOpt.resources[i].active) continue;
            
            const nameInput = document.getElementById(`resource-name-${i}`);
            const amountInput = document.getElementById(`resource-amount-${i}`);
            
            if (nameInput && amountInput) {
                ProductionOpt.resources[i].name = nameInput.value || `Zasób ${i+1}`;
                ProductionOpt.resources[i].amount = parseFloat(amountInput.value) || 0;
            }
        }
    },
    
    loadSampleData: () => {
        Logger.log('INFO', "Ładowanie przykładowych danych Egzaminacyjnych (Optymalizacja Produkcji)");
        
        const productsList = document.getElementById('productsList');
        const resourcesList = document.getElementById('resourcesList');
        
        if (productsList) productsList.innerHTML = '';
        if (resourcesList) resourcesList.innerHTML = '';
        
        ProductionOpt.productRows = 0;
        ProductionOpt.products = [];
        ProductionOpt.resourceRows = 0;
        ProductionOpt.resources = [];
        
        // Dane Egzaminacyjne
        const sampleProductsData = [
            { name: "Produkt A", profit: 40, cost: 350, minQuantity: null, maxQuantity: null, resourceUsage: [1, 350] }, // Zużycie: [powierzchnia, koszt_jednostkowy_dla_budzetu]
            { name: "Produkt B", profit: 140, cost: 800, minQuantity: null, maxQuantity: null, resourceUsage: [3, 800] },
            { name: "Produkt C", profit: 80, cost: 600, minQuantity: 30, maxQuantity: 100, resourceUsage: [2, 600] }
        ];
        
        const sampleResourcesData = [
            { name: "Powierzchnia", amount: 400 },
            { name: "Budżet", amount: 150000 } // Ograniczenie na całkowity koszt
        ];
        
        // Ustaw typ optymalizacji na maksymalizację zysku dla tych danych
        const optimizationTypeElement = document.getElementById('optimizationType');
        if (optimizationTypeElement) {
            optimizationTypeElement.value = 'max';
        }
        
        // Dodaj przykładowe zasoby
        sampleResourcesData.forEach((resourceData, index) => {
            const rowId = ProductionOpt.resourceRows++;
            ProductionOpt.resources[rowId] = {
                id: rowId, 
                active: true,
                name: resourceData.name,
                amount: resourceData.amount
            };
            
            const resourceRow = document.createElement('div');
            resourceRow.id = `resource-row-${rowId}`;
            resourceRow.className = 'input-row resource-row';
            
            const nameContainer = document.createElement('div');
            nameContainer.className = 'input-field-container';
            const nameLabel = document.createElement('label');
            nameLabel.textContent = 'Nazwa:'; nameLabel.htmlFor = `resource-name-${rowId}`;
            const nameInput = document.createElement('input');
            nameInput.type = 'text'; nameInput.id = `resource-name-${rowId}`; nameInput.value = resourceData.name;
            nameContainer.appendChild(nameLabel); nameContainer.appendChild(nameInput);
            
            const amountContainer = document.createElement('div');
            amountContainer.className = 'input-field-container';
            const amountLabel = document.createElement('label');
            amountLabel.textContent = 'Dostępna ilość:'; amountLabel.htmlFor = `resource-amount-${rowId}`;
            const amountInput = document.createElement('input');
            amountInput.type = 'number'; amountInput.id = `resource-amount-${rowId}`; amountInput.step = '1'; amountInput.min = '0'; amountInput.value = resourceData.amount;
            amountContainer.appendChild(amountLabel); amountContainer.appendChild(amountInput);
            
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń'; removeButton.className = 'small-button';
            removeButton.onclick = () => ProductionOpt.removeResourceRow(rowId);
            
            resourceRow.appendChild(nameContainer); resourceRow.appendChild(amountContainer); resourceRow.appendChild(removeButton);
            resourcesList.appendChild(resourceRow);
        });
        
        // Dodaj przykładowe produkty
        sampleProductsData.forEach((productData, index) => {
            const rowId = ProductionOpt.productRows++;
            ProductionOpt.products[rowId] = {
                id: rowId, 
                active: true,
                name: productData.name,
                profit: productData.profit,
                cost: productData.cost, 
                minQuantity: productData.minQuantity,
                maxQuantity: productData.maxQuantity,
                resourceUsage: [...productData.resourceUsage]
            };
            
            const productRow = document.createElement('div');
            productRow.id = `product-row-${rowId}`;
            productRow.className = 'input-row product-row';
            
            const nameContainer = document.createElement('div');
            nameContainer.className = 'input-field-container';
            const nameLabel = document.createElement('label');
            nameLabel.textContent = 'Nazwa:'; nameLabel.htmlFor = `product-name-${rowId}`;
            const nameInput = document.createElement('input');
            nameInput.type = 'text'; nameInput.id = `product-name-${rowId}`; nameInput.value = productData.name;
            nameContainer.appendChild(nameLabel); nameContainer.appendChild(nameInput);
            
            const profitContainer = document.createElement('div');
            profitContainer.className = 'input-field-container';
            const profitLabel = document.createElement('label');
            profitLabel.textContent = 'Zysk/szt.:'; profitLabel.htmlFor = `product-profit-${rowId}`;
            const profitInput = document.createElement('input');
            profitInput.type = 'number'; profitInput.id = `product-profit-${rowId}`; profitInput.step = '0.1'; profitInput.value = productData.profit;
            profitContainer.appendChild(profitLabel); profitContainer.appendChild(profitInput);

            const costContainer = document.createElement('div');
            costContainer.className = 'input-field-container';
            const costLabel = document.createElement('label');
            costLabel.textContent = 'Koszt/szt.:'; costLabel.htmlFor = `product-cost-${rowId}`;
            const costInputElem = document.createElement('input'); // Zmieniona nazwa zmiennej, aby uniknąć konfliktu
            costInputElem.type = 'number'; costInputElem.id = `product-cost-${rowId}`; costInputElem.step = '0.1'; costInputElem.min = '0'; costInputElem.value = productData.cost;
            costContainer.appendChild(costLabel); costContainer.appendChild(costInputElem);

            const minQtyContainer = document.createElement('div');
            minQtyContainer.className = 'input-field-container';
            const minQtyLabel = document.createElement('label');
            minQtyLabel.textContent = 'Min. ilość:'; minQtyLabel.htmlFor = `product-min-qty-${rowId}`;
            const minQtyInput = document.createElement('input');
            minQtyInput.type = 'number'; minQtyInput.id = `product-min-qty-${rowId}`; minQtyInput.step = '1'; minQtyInput.min = '0';
            minQtyInput.value = productData.minQuantity === null || productData.minQuantity === undefined ? '' : productData.minQuantity;
            minQtyInput.placeholder = '(opcjonalnie)';
            minQtyContainer.appendChild(minQtyLabel); minQtyContainer.appendChild(minQtyInput);

            const maxQtyContainer = document.createElement('div');
            maxQtyContainer.className = 'input-field-container';
            const maxQtyLabel = document.createElement('label');
            maxQtyLabel.textContent = 'Max. ilość:'; maxQtyLabel.htmlFor = `product-max-qty-${rowId}`;
            const maxQtyInput = document.createElement('input');
            maxQtyInput.type = 'number'; maxQtyInput.id = `product-max-qty-${rowId}`; maxQtyInput.step = '1'; maxQtyInput.min = '0';
            maxQtyInput.value = productData.maxQuantity === null || productData.maxQuantity === undefined ? '' : productData.maxQuantity;
            maxQtyInput.placeholder = '(opcjonalnie)';
            maxQtyContainer.appendChild(maxQtyLabel); maxQtyContainer.appendChild(maxQtyInput);
            
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń'; removeButton.className = 'small-button';
            removeButton.onclick = () => ProductionOpt.removeProductRow(rowId);
            
            productRow.appendChild(nameContainer);
            productRow.appendChild(profitContainer);
            productRow.appendChild(costContainer);
            productRow.appendChild(minQtyContainer);
            productRow.appendChild(maxQtyContainer);
            
            const resourceUsageContainer = document.createElement('div');
            resourceUsageContainer.className = 'resource-usage-container';
            resourceUsageContainer.id = `resource-usage-${rowId}`;
            productRow.appendChild(resourceUsageContainer);
            
            productRow.appendChild(removeButton);
            productsList.appendChild(productRow);
            
            ProductionOpt.updateResourceUsageFields(rowId);
        });
        Utils.showToast("Przykładowe dane egzaminacyjne zostały załadowane.");
    },
    
    calculateFallback: () => {
        Logger.log('INFO', "Uruchomiono funkcję fallback dla obliczania optymalizacji produkcji");
        
        try {
            // Przygotuj dane na podstawie tego, co mamy w formularzach
            ProductionOpt.collectProductData();
            ProductionOpt.collectResourceData();
            
            // Kontener na wyniki
            const resultsContainer = document.getElementById('productionOptResults');
            if (!resultsContainer) {
                throw new Error("Nie znaleziono kontenera na wyniki!");
            }
            
            // Przygotuj dane
            const activeProducts = ProductionOpt.products.filter(p => p && p.active);
            const activeResources = ProductionOpt.resources.filter(r => r && r.active);
            
            if (activeProducts.length === 0) {
                throw new Error("Nie zdefiniowano żadnych produktów!");
            }
            
            if (activeResources.length === 0) {
                throw new Error("Nie zdefiniowano żadnych zasobów!");
            }
            
            // Pokaż proste rozwiązanie przykładowe
            const optimizationType = document.getElementById('optimizationType')?.value || 'max';
            const isMaximization = optimizationType === 'max';
            
            // Przygotuj przykładowe wartości
            let exampleSolution = {
                objective: isMaximization ? 1500 : 800,
                products: [],
                resources: []
            };
            
            // Generuj przykładowe wartości dla produktów
            for (let i = 0; i < activeProducts.length; i++) {
                const product = activeProducts[i];
                // Generuj wartość od 0 do 10 dla każdego produktu, z większymi wartościami dla produktów z większym zyskiem
                const productValue = product.profit > 0 ? Math.floor(Math.random() * 10) + 1 : 0;
                
                exampleSolution.products.push({
                    name: product.name,
                    profit: product.profit,
                    quantity: productValue,
                    contribution: product.profit * productValue
                });
            }
            
            // Generuj wartości dla zasobów
            for (let i = 0; i < activeResources.length; i++) {
                const resource = activeResources[i];
                const usage = Math.floor(Math.random() * (resource.amount * 0.8)) + (resource.amount * 0.1);
                
                exampleSolution.resources.push({
                    name: resource.name,
                    available: resource.amount,
                    used: usage,
                    utilization: (usage / resource.amount) * 100
                });
            }
            
            // Wyświetl wyniki
            let html = `
                <div class="main-result">
                    <h3>Wyniki optymalizacji produkcji</h3>
                    <p><strong>${isMaximization ? 'Maksymalny zysk' : 'Minimalny koszt'}:</strong> ${exampleSolution.objective.toFixed(2)}</p>
                </div>
                
                <div class="detailed-results">
                    <h4>Optymalne ilości produkcji:</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #d5b99f; color: #4A3C31;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #a38b75;">Produkt</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #a38b75;">Ilość</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #a38b75;">${isMaximization ? 'Zysk' : 'Koszt'}/szt</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #a38b75;">Całkowity ${isMaximization ? 'zysk' : 'koszt'}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Dodaj wiersze produktów
            for (const product of exampleSolution.products) {
                html += `
                    <tr style="border-bottom: 1px solid #d5b99f;">
                        <td style="padding: 8px; text-align: left; border: 1px solid #d5b99f;">${product.name}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #d5b99f;">${product.quantity.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #d5b99f;">${product.profit.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #d5b99f;">${product.contribution.toFixed(2)}</td>
                    </tr>
                `;
            }
            
            // Zamknij tabelę produktów i rozpocznij tabelę zasobów
            html += `
                        </tbody>
                    </table>
                    
                    <h4>Wykorzystanie zasobów:</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background-color: #d5b99f; color: #4A3C31;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #a38b75;">Zasób</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #a38b75;">Dostępne</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #a38b75;">Wykorzystane</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #a38b75;">% wykorzystania</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Dodaj wiersze zasobów
            for (const resource of exampleSolution.resources) {
                html += `
                    <tr style="border-bottom: 1px solid #d5b99f;">
                        <td style="padding: 8px; text-align: left; border: 1px solid #d5b99f;">${resource.name}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #d5b99f;">${resource.available.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #d5b99f;">${resource.used.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #d5b99f;">${resource.utilization.toFixed(2)}%</td>
                    </tr>
                `;
            }
            
            // Zamknij tabelę zasobów i dodaj przycisk eksportu wyników
            html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="export-options" style="margin-top: 20px;">
                    <button onclick="ProductionOpt.exportResults()" style="background-color: #d5b99f; color: #4A3C31; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">
                        <i class="fas fa-file-export"></i> Eksportuj wyniki
                    </button>
                </div>
            `;
            
            // Wstaw HTML do kontenera
            resultsContainer.innerHTML = html;
            
            // Dodaj wizualizację
            const vizContainer = document.getElementById('productionOptVisualization');
            if (vizContainer) {
                vizContainer.innerHTML = `
                    <h4>Wizualizacja rozwiązania</h4>
                    <div id="productChart" style="width: 100%; height: 300px;"></div>
                    <div id="resourceChart" style="width: 100%; height: 300px;"></div>
                `;
                
                // Utwórz przykładowe wykresy, jeśli Plotly jest dostępne
                if (typeof Plotly !== 'undefined') {
                    // Wykres produktów
                    const productNames = exampleSolution.products.map(p => p.name);
                    const productQuantities = exampleSolution.products.map(p => p.quantity);
                    
                    Plotly.newPlot('productChart', [{
                        x: productNames,
                        y: productQuantities,
                        type: 'bar',
                        marker: {
                            color: '#785E45'
                        }
                    }], {
                        title: 'Ilości produktów w optymalnym rozwiązaniu',
                        xaxis: { title: 'Produkt' },
                        yaxis: { title: 'Ilość' }
                    });
                    
                    // Wykres wykorzystania zasobów
                    const resourceNames = exampleSolution.resources.map(r => r.name);
                    const resourceUtilization = exampleSolution.resources.map(r => r.utilization);
                    
                    Plotly.newPlot('resourceChart', [{
                        x: resourceNames,
                        y: resourceUtilization,
                        type: 'bar',
                        marker: {
                            color: '#BFA58E'
                        }
                    }], {
                        title: 'Wykorzystanie zasobów (%)',
                        xaxis: { title: 'Zasób' },
                        yaxis: { title: 'Wykorzystanie (%)', range: [0, 100] }
                    });
                }
            }
            
            // Zapisz dane do ewentualnego eksportu
            ProductionOpt.solution = {
                optimizationType: optimizationType,
                objective: exampleSolution.objective,
                products: exampleSolution.products,
                resources: exampleSolution.resources
            };
            
        } catch (error) {
            Logger.log('ERROR', "Błąd podczas wykonywania funkcji calculateFallback:", error);
            const resultsContainer = document.getElementById('productionOptResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="error-message" style="background-color: #FEE7E7; border-left: 5px solid #D53636; padding: 15px; margin: 15px 0; border-radius: 5px;">
                        <h3>Błąd podczas obliczania optymalizacji</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    calculate: () => {
        Logger.log('INFO', "Executing ProductionOpt.calculate() with new solver logic");
        
            Utils.clearElement('productionOptResults');
            Utils.clearElement('productionOptVisualization');
            Utils.showElement('productionOptLoadingIndicator');
            
        // Małe opóźnienie, aby UI zdążył pokazać wskaźnik ładowania
        setTimeout(() => {
            try {
                // Wywołanie nowej funkcji solveLinearProgram, która sama zbiera dane
                const solution = ProductionOpt.solveLinearProgram(); 
                
                // Zapisujemy surowy wynik (lub obiekt błędu) do ProductionOpt.solution
                // To jest używane np. przez exportResults()
                ProductionOpt.solution = solution; 
                
                if (solution && solution.feasible) {
                    // Pobierz świeże activeProducts/activeResources, które były użyte do rozwiązania,
                    // na wypadek gdyby solveLinearProgram je modyfikowała (chociaż nie powinna)
                    // lub dla pewności, że displayResults dostaje dokładnie to, co było rozwiązane.
                    // Jednak nowa solveLinearProgram sama pobiera te dane, więc są one już 'świeże' wewnątrz niej.
                    // Dla displayResults/visualizeResults potrzebujemy list produktów/zasobów, które odpowiadają danym w solution.
                    const currentActiveProducts = ProductionOpt.products.filter(p => p && p.active);
                    const currentActiveResources = ProductionOpt.resources.filter(r => r && r.active);

                    ProductionOpt.displayResults(currentActiveProducts, currentActiveResources, solution);
                    ProductionOpt.visualizeResults(currentActiveProducts, currentActiveResources, solution);
                } else {
                    ProductionOpt.displayNoSolutionMessage(); 
                    if (solution && solution.error) {
                         Logger.log('WARN', `[ProductionOpt Calculate] Solver failed or no feasible solution: ${solution.error}`, solution.details ? JSON.stringify(solution.details) : '');
                         Utils.showToast(solution.error, true);
                    } else {
                         Logger.log('WARN', "[ProductionOpt Calculate] No solution or unknown solver error.");
                         Utils.showToast("Nie udało się znaleźć rozwiązania.", true);
                    }
                }
            } catch (err) { 
                Logger.log('ERROR', "[ProductionOpt Calculate] Critical error during optimization process:", err, err.stack ? err.stack : '');
                Utils.showToast("Wystąpił krytyczny błąd podczas optymalizacji.", true);
                // Wyświetl bardziej szczegółowy komunikat błędu, jeśli to możliwe
                const resultsContainer = document.getElementById('productionOptResults');
                if (resultsContainer) {
                    resultsContainer.innerHTML = `<div class="error-message"><h3>Krytyczny błąd optymalizacji</h3><p>${err.message || 'Nieznany błąd'}</p>${err.stack ? `<pre>${err.stack}</pre>` : ''}</div>`;
                }
            } finally {
                    Utils.hideElement('productionOptLoadingIndicator');
            }
        }, 50); // Opóźnienie dla UI
    },
    
    displayNoSolutionMessage: () => {
        const resultsContainer = document.getElementById('productionOptResults');
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>Brak wykonalnego rozwiązania</h3>
                <p>Nie znaleziono rozwiązania spełniającego wszystkie ograniczenia. Spróbuj zmodyfikować dane wejściowe.</p>
                <ul>
                    <li>Sprawdź, czy dostępne ilości zasobów są wystarczające</li>
                    <li>Sprawdź, czy produkty nie mają sprzecznych wymagań</li>
                    <li>Zmodyfikuj zużycie zasobów przez produkty</li>
                </ul>
            </div>
        `;
    },
    
    displayResults: (activeProducts, activeResources, solution) => {
        if (!solution) return;
        
        const resultsContainer = document.getElementById('productionOptResults');
        
        const isMaximization = solution.optimizationType === 'max';
        const objectiveLabel = isMaximization ? 'Maksymalny zysk' : 'Minimalny koszt';
        
        // Przygotuj HTML wyników
        let html = `
            <div class="main-result">
                <h3>Wyniki optymalizacji</h3>
                <p><strong>${objectiveLabel}:</strong> ${solution.objective.toFixed(2)}</p>
            </div>
            
            <div class="detailed-results">
                <h4>Optymalne ilości produkcji:</h4>
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Produkt</th>
                            <th>Ilość</th>
                            <th>${isMaximization ? 'Zysk' : 'Koszt'}/szt</th>
                            <th>Całkowity ${isMaximization ? 'zysk' : 'koszt'}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Dodaj wiersze produktów
        for (const product of solution.products) {
            html += `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity.toFixed(2)}</td>
                    <td>${product.profit.toFixed(2)}</td>
                    <td>${product.contribution.toFixed(2)}</td>
                </tr>
            `;
        }
        
        // Dodaj wiersz sumy
        html += `
                    <tr class="total-row">
                        <td colspan="3"><strong>Suma</strong></td>
                        <td><strong>${solution.objective.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <h4>Wykorzystanie zasobów:</h4>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Zasób</th>
                        <th>Dostępna ilość</th>
                        <th>Wykorzystana ilość</th>
                        <th>Wykorzystanie %</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Dodaj wiersze zasobów
        for (const resource of solution.resources) {
            const utilization = resource.utilization;
            let status = 'Niewykorzystany';
            
            if (Math.abs(resource.used - resource.available) < 0.001) {
                status = 'Wyczerpany (wiążący)';
            } else if (utilization > 0) {
                status = 'Częściowo wykorzystany';
            }
            
            html += `
                <tr>
                    <td>${resource.name}</td>
                    <td>${resource.available.toFixed(2)}</td>
                    <td>${resource.used.toFixed(2)}</td>
                    <td>${utilization.toFixed(2)}%</td>
                <td>${status}</td>
                </tr>
            `;
        }
        
        // Zamknij tabele i dodaj przycisk eksportu
        html += `
                </tbody>
            </table>
        </div>
        
        <div class="export-options" style="margin-top: 20px;">
            <button onclick="ProductionOpt.exportResults()" class="action-button">
                <i class="fas fa-file-export"></i> Eksportuj wyniki
            </button>
        </div>
        `;
        
        // Wyświetl wyniki
        resultsContainer.innerHTML = html;
    },
    
    visualizeResults: (activeProducts, activeResources, solution) => {
        if (!solution) return;
        
        // Odczytaj typ optymalizacji z solution, aby ustawić isMaximization
        const optimizationType = solution.optimizationType || 'maximize'; // Domyślnie maximize, jeśli brak
        const isMaximization = optimizationType === 'maximize';
        
        const visualizationContainer = document.getElementById('productionOptVisualization');
        visualizationContainer.innerHTML = '';
        
        // Przygotuj dane do wykresów
        const productNames = activeProducts.map(p => p.name);
        const productQuantities = activeProducts.map(p => {
            const solvedProduct = solution.products.find(sp => sp.name === p.name);
            return solvedProduct ? solvedProduct.quantity : 0; 
        });
        const productContributions = activeProducts.map(p => {
            const solvedProduct = solution.products.find(sp => sp.name === p.name);
            return solvedProduct ? solvedProduct.contribution : 0; 
        });
        
        const resourceNames = activeResources.map(r => r.name);
        const resourceUtilizations = activeResources.map(r => {
            const solvedResource = solution.resources.find(sr => sr.name === r.name);
            // Dodatkowe zabezpieczenie: upewnij się, że solvedResource i solvedResource.utilization istnieją i są liczbami
            if (solvedResource && typeof solvedResource.utilization === 'number') {
                return solvedResource.utilization;
            }
            Logger.log('WARN', `[VisualizeResults] Brak danych o wykorzystaniu dla zasobu: ${r.name}. Używam 0.`);
            return 0; // Zwróć 0, jeśli czegoś brakuje
        });
        
        // Logowanie danych wejściowych dla wykresów produktów
        Logger.log('DEBUG', "[VisualizeResults Data] productNames:", JSON.parse(JSON.stringify(productNames)));
        Logger.log('DEBUG', "[VisualizeResults Data] productQuantities:", JSON.parse(JSON.stringify(productQuantities)));
        Logger.log('DEBUG', "[VisualizeResults Data] productContributions:", JSON.parse(JSON.stringify(productContributions)));
        Logger.log('DEBUG', "[VisualizeResults Data] resourceNames:", JSON.parse(JSON.stringify(resourceNames)));
        Logger.log('DEBUG', "[VisualizeResults Data] resourceUtilizations:", JSON.parse(JSON.stringify(resourceUtilizations)));
        
        // Utwórz kontener dla wykresu ilości produkcji
        const quantityChartDiv = document.createElement('div');
        quantityChartDiv.id = 'quantity-chart';
        quantityChartDiv.className = 'chart-container';
        visualizationContainer.appendChild(quantityChartDiv);
        
        // Utwórz kontener dla wykresu wkładu do funkcji celu
        const contributionChartDiv = document.createElement('div');
        contributionChartDiv.id = 'contribution-chart';
        contributionChartDiv.className = 'chart-container';
        visualizationContainer.appendChild(contributionChartDiv);
        
        // Utwórz kontener dla wykresu wykorzystania zasobów
        const utilizationChartDiv = document.createElement('div');
        utilizationChartDiv.id = 'utilization-chart';
        utilizationChartDiv.className = 'chart-container';
        visualizationContainer.appendChild(utilizationChartDiv);

        // Opóźnienie renderowania wykresów, aby DOM był na pewno gotowy
        setTimeout(() => {
            try {
        // Wykres ilości produkcji
        const quantityTrace = {
            x: productNames,
            y: productQuantities,
            type: 'bar',
            marker: {
                color: 'rgba(70, 130, 180, 0.7)',
                line: {
                    color: 'rgba(70, 130, 180, 1.0)',
                    width: 1
                }
            },
            name: 'Ilość'
        };
        
        Plotly.newPlot('quantity-chart', [quantityTrace], {
            title: 'Optymalne ilości produkcji',
            xaxis: { title: 'Produkty' },
            yaxis: { title: 'Ilość' },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        }, { responsive: true });
        
        // Wykres wkładu do funkcji celu
        const contributionTrace = {
            x: productNames,
            y: productContributions,
            type: 'bar',
            marker: {
                color: 'rgba(46, 139, 87, 0.7)',
                line: {
                    color: 'rgba(46, 139, 87, 1.0)',
                    width: 1
                }
            },
                    name: isMaximization ? 'Zysk' : 'Koszt' // Tutaj używamy isMaximization
        };
        
        Plotly.newPlot('contribution-chart', [contributionTrace], {
                    title: isMaximization ? 'Wkład do całkowitego zysku' : 'Udział w całkowitym koszcie', // Tutaj używamy isMaximization
            xaxis: { title: 'Produkty' },
            yaxis: { title: isMaximization ? 'Zysk' : 'Koszt' },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        }, { responsive: true });
        
        // Wykres wykorzystania zasobów
        const utilizationTrace = {
            x: resourceUtilizations,
            y: resourceNames,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: resourceUtilizations.map(u => 
                    u >= 99.9 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(70, 130, 180, 0.7)'
                ),
                line: {
                    color: resourceUtilizations.map(u => 
                        u >= 99.9 ? 'rgba(220, 53, 69, 1.0)' : 'rgba(70, 130, 180, 1.0)'
                    ),
                    width: 1
                }
            },
            text: resourceUtilizations.map(u => u.toFixed(1) + '%'),
            textposition: 'auto',
            name: 'Wykorzystanie'
        };
        
        Plotly.newPlot('utilization-chart', [utilizationTrace], {
            title: 'Wykorzystanie zasobów',
            xaxis: { 
                title: 'Wykorzystanie (%)',
                range: [0, 100]
            },
            yaxis: { title: 'Zasoby' },
            margin: { t: 40, b: 60, l: 120, r: 40 }
        }, { responsive: true });
        
            } catch (plotlyError) {
                Logger.log('ERROR', "[Plotly] Błąd podczas renderowania wykresu (próba logowania przez Logger):", plotlyError);
                // Bezpośrednie logowanie do konsoli przeglądarki dla surowego obiektu błędu Plotly
                console.error("[Plotly DEBUG] Surowy obiekt błędu Plotly:", plotlyError);
                console.dir(plotlyError); 
                // Można tutaj dodać komunikat dla użytkownika, jeśli wykresy się nie załadują
                Utils.showToast("Wystąpił błąd podczas renderowania wykresów.", true);
            }
        }, 50); // Małe opóźnienie, np. 50ms
        
        // Wyemituj zdarzenie po zakończeniu wizualizacji (pozostaje bez zmian)
        document.dispatchEvent(new Event('calculation-complete'));
        
        // Ukryj wskaźnik ładowania po zakończeniu wizualizacji
        Utils.hideElement('productionOptLoadingIndicator');
    },
    
    exportResults: () => {
        if (!ProductionOpt.solution) {
            alert("Najpierw przeprowadź optymalizację produkcji, aby wygenerować wyniki do eksportu!");
            return;
        }
        
        try {
            const solution = ProductionOpt.solution;
            const isMaximization = solution.optimizationType === 'max';
            
            let text = `WYNIKI OPTYMALIZACJI PRODUKCJI\n`;
            text += `===============================\n\n`;
            
            text += `${isMaximization ? 'Maksymalny zysk' : 'Minimalny koszt'}: ${solution.objective.toFixed(2)}\n\n`;
            
            text += `OPTYMALNE ILOŚCI PRODUKCJI:\n`;
            text += `-------------------------\n`;
            text += `Produkt\tIlość\t${isMaximization ? 'Zysk' : 'Koszt'}/szt\tCałkowity ${isMaximization ? 'zysk' : 'koszt'}\n`;
            
            for (const product of solution.products) {
                text += `${product.name}\t${product.quantity.toFixed(2)}\t${product.profit.toFixed(2)}\t${product.contribution.toFixed(2)}\n`;
            }
            
            text += `\nWYKORZYSTANIE ZASOBÓW:\n`;
            text += `--------------------\n`;
            text += `Zasób\tDostępne\tWykorzystane\t% wykorzystania\n`;
            
            for (const resource of solution.resources) {
                text += `${resource.name}\t${resource.available.toFixed(2)}\t${resource.used.toFixed(2)}\t${resource.utilization.toFixed(2)}%\n`;
            }
            
            // Utwórz plik do pobrania
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'optymalizacja_produkcji.txt';
            document.body.appendChild(a);
            a.click();
            
            // Posprzątaj
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
        } catch (error) {
            Logger.log('ERROR', "Błąd podczas eksportu wyników:", error);
            alert("Wystąpił błąd podczas eksportu wyników: " + error.message);
        }
    },

    // Nowa funkcja do odtwarzania interfejsu z istniejących danych
    rebuildInterface: () => {
        Logger.log('INFO', "Rebuilding ProductionOpt interface from existing data");
        
        const productsList = document.getElementById('productsList');
        const resourcesList = document.getElementById('resourcesList');
        
        if (!productsList || !resourcesList) return;
        
        // Wyczyść listy
        productsList.innerHTML = '';
        resourcesList.innerHTML = '';
        
        // Najpierw odtwórz listę zasobów
        const activeResources = ProductionOpt.resources.filter(r => r && r.active);
        
        if (activeResources.length === 0) {
            // Jeśli nie ma żadnych zasobów, dodaj domyślny
            ProductionOpt.resourceRows = 0;
            ProductionOpt.addResourceRow();
            } else {
            // Odtwórz istniejące zasoby
            for (let i = 0; i < ProductionOpt.resources.length; i++) {
                const resource = ProductionOpt.resources[i];
                if (!resource || !resource.active) continue;
                
                const resourceRow = document.createElement('div');
                resourceRow.id = `resource-row-${i}`;
                resourceRow.className = 'input-row resource-row';
                
                // Nazwa zasobu
                const nameContainer = document.createElement('div');
                nameContainer.className = 'input-field-container';
                
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'Nazwa:';
                nameLabel.htmlFor = `resource-name-${i}`;
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.id = `resource-name-${i}`;
                nameInput.placeholder = 'np. Surowiec 1';
                nameInput.value = resource.name || `Zasób ${i + 1}`;
                
                nameContainer.appendChild(nameLabel);
                nameContainer.appendChild(nameInput);
                
                // Dostępna ilość
                const amountContainer = document.createElement('div');
                amountContainer.className = 'input-field-container';
                
                const amountLabel = document.createElement('label');
                amountLabel.textContent = 'Dostępna ilość:';
                amountLabel.htmlFor = `resource-amount-${i}`;
                
                const amountInput = document.createElement('input');
                amountInput.type = 'number';
                amountInput.id = `resource-amount-${i}`;
                amountInput.step = '1';
                amountInput.min = '0';
                amountInput.placeholder = 'np. 100';
                amountInput.value = resource.amount || 100;
                
                amountContainer.appendChild(amountLabel);
                amountContainer.appendChild(amountInput);
                
                // Przycisk usuwania
                const removeButton = document.createElement('button');
                removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
                removeButton.className = 'small-button';
                removeButton.onclick = () => ProductionOpt.removeResourceRow(i);
                removeButton.title = 'Usuń ten zasób';
                
                // Dodaj elementy do wiersza
                resourceRow.appendChild(nameContainer);
                resourceRow.appendChild(amountContainer);
                resourceRow.appendChild(removeButton);
                
                // Dodaj wiersz do listy zasobów
                resourcesList.appendChild(resourceRow);
            }
        }
        
        // Teraz odtwórz listę produktów
        const activeProducts = ProductionOpt.products.filter(p => p && p.active);
        
        if (activeProducts.length === 0) {
            // Jeśli nie ma żadnych produktów, dodaj domyślny
            ProductionOpt.productRows = 0;
            ProductionOpt.addProductRow();
        } else {
            // Odtwórz istniejące produkty
            for (let i = 0; i < ProductionOpt.products.length; i++) {
                const product = ProductionOpt.products[i];
                if (!product || !product.active) continue;
                
                const productRow = document.createElement('div');
                productRow.id = `product-row-${i}`;
                productRow.className = 'input-row product-row';
                
                // Nazwa produktu
                const nameContainer = document.createElement('div');
                nameContainer.className = 'input-field-container';
                
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'Nazwa:';
                nameLabel.htmlFor = `product-name-${i}`;
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.id = `product-name-${i}`;
                nameInput.placeholder = 'np. Produkt A';
                nameInput.value = product.name || `Produkt ${String.fromCharCode(65 + i)}`;
                
                nameContainer.appendChild(nameLabel);
                nameContainer.appendChild(nameInput);
                
                // Zysk/koszt jednostkowy
                const profitContainer = document.createElement('div');
                profitContainer.className = 'input-field-container';
                
                const profitLabel = document.createElement('label');
                profitLabel.textContent = 'Zysk/szt.:';
                profitLabel.htmlFor = `product-profit-${i}`;
                
                const profitInput = document.createElement('input');
                profitInput.type = 'number';
                profitInput.id = `product-profit-${i}`;
                profitInput.step = '0.1';
                profitInput.placeholder = 'np. 10';
                profitInput.value = product.profit || 10;
                
                profitContainer.appendChild(profitLabel);
                profitContainer.appendChild(profitInput);

                // Koszt jednostkowy (NOWE)
                const costContainer = document.createElement('div');
                costContainer.className = 'input-field-container';
                const costLabel = document.createElement('label');
                costLabel.textContent = 'Koszt/szt.:';
                costLabel.htmlFor = `product-cost-${i}`;
                const costInput = document.createElement('input');
                costInput.type = 'number';
                costInput.id = `product-cost-${i}`;
                costInput.step = '0.1';
                costInput.min = '0';
                costInput.placeholder = 'np. 5';
                costInput.value = product.cost || 5;
                costContainer.appendChild(costLabel);
                costContainer.appendChild(costInput);

                // Min ilość (NOWE)
                const minQtyContainer = document.createElement('div');
                minQtyContainer.className = 'input-field-container';
                const minQtyLabel = document.createElement('label');
                minQtyLabel.textContent = 'Min. ilość:';
                minQtyLabel.htmlFor = `product-min-qty-${i}`;
                const minQtyInput = document.createElement('input');
                minQtyInput.type = 'number';
                minQtyInput.id = `product-min-qty-${i}`;
                minQtyInput.step = '1';
                minQtyInput.min = '0';
                minQtyInput.placeholder = '(opcjonalnie)';
                if (product.minQuantity !== null && product.minQuantity !== undefined) {
                    minQtyInput.value = product.minQuantity;
                }
                minQtyContainer.appendChild(minQtyLabel);
                minQtyContainer.appendChild(minQtyInput);

                // Max ilość (NOWE)
                const maxQtyContainer = document.createElement('div');
                maxQtyContainer.className = 'input-field-container';
                const maxQtyLabel = document.createElement('label');
                maxQtyLabel.textContent = 'Max. ilość:';
                maxQtyLabel.htmlFor = `product-max-qty-${i}`;
                const maxQtyInput = document.createElement('input');
                maxQtyInput.type = 'number';
                maxQtyInput.id = `product-max-qty-${i}`;
                maxQtyInput.step = '1';
                maxQtyInput.min = '0'; // Powinno być co najmniej min. ilość, ale to obsłuży walidacja/solver
                maxQtyInput.placeholder = '(opcjonalnie)';
                if (product.maxQuantity !== null && product.maxQuantity !== undefined) {
                    maxQtyInput.value = product.maxQuantity;
                }
                maxQtyContainer.appendChild(maxQtyLabel);
                maxQtyContainer.appendChild(maxQtyInput);
                
                // Dodaj elementy do wiersza
                productRow.appendChild(nameContainer);
                productRow.appendChild(profitContainer);
                productRow.appendChild(costContainer); // NOWE
                productRow.appendChild(minQtyContainer); // NOWE
                productRow.appendChild(maxQtyContainer); // NOWE
                
                // Dodaj pola dla zużycia zasobów
                const resourceUsageContainer = document.createElement('div');
                resourceUsageContainer.className = 'resource-usage-container';
                resourceUsageContainer.id = `resource-usage-${i}`;
                productRow.appendChild(resourceUsageContainer);
                
                // Przycisk usuwania
                const removeButton = document.createElement('button');
                removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
                removeButton.className = 'small-button';
                removeButton.onclick = () => ProductionOpt.removeProductRow(i);
                removeButton.title = 'Usuń ten produkt';
                
                // Dodaj przycisk usuwania
                productRow.appendChild(removeButton);
                
                // Dodaj wiersz do listy produktów
                productsList.appendChild(productRow);
                
                // Aktualizuj pola zużycia zasobów
                ProductionOpt.updateResourceUsageFields(i);
            }
        }
    },

    // NOWE FUNKCJE DLA linkHandler.js
    exportDataForLink: () => {
        Logger.log('DEBUG', "[ProductionOpt] Exporting data for link");
        let dataParts = [];

        const optimizationTypeElement = document.getElementById('optimizationType');
        const optimizationType = optimizationTypeElement ? optimizationTypeElement.value : 'maximize';
        dataParts.push(optimizationType);

        const productsData = [];
        if (ProductionOpt.collectProductData) ProductionOpt.collectProductData();
        if (ProductionOpt.collectResourceData) ProductionOpt.collectResourceData();

        (ProductionOpt.products || []).forEach(product => {
            if (product && product.active) {
                const name = encodeURIComponent(product.name || '');
                const profit = product.profit || 0;
                const cost = product.cost || 0; // NOWE
                const minQty = product.minQuantity === null || product.minQuantity === undefined ? '' : product.minQuantity; // NOWE
                const maxQty = product.maxQuantity === null || product.maxQuantity === undefined ? '' : product.maxQuantity; // NOWE
                const usages = (product.resourceUsage || []).join('^');
                // Format: name^profit^cost_minQty_maxQty_usages
                productsData.push(`${name}^${profit}^${cost}_${minQty}_${maxQty}_${usages}`);
            }
        });
        dataParts.push(productsData.join('~'));

        const resourcesData = [];
        (ProductionOpt.resources || []).forEach(resource => {
            if (resource && resource.active) {
                const name = encodeURIComponent(resource.name || '');
                const amount = resource.amount || 0;
                resourcesData.push(`${name}^${amount}`);
            }
        });
        dataParts.push(resourcesData.join('~'));

        return dataParts.join('§');
    },

    importDataFromLinkString: (dataString) => {
        Logger.log('DEBUG', `[ProductionOpt] Importing data from string: ${dataString}`);
        if (!dataString) return false;

        const parts = dataString.split('§');
        if (parts.length < 3) { // Oczekujemy typu, produktów, zasobów
            Logger.log('ERROR', "[ProductionOpt] Nieprawidłowy format danych z linku (za mało części).");
            Utils.showToast('Błąd przetwarzania danych Optymalizacji Produkcji z linku.', true);
            return false;
        }

        try {
            const optimizationType = parts[0];
            const productsStrings = parts[1] && parts[1].trim() !== "" ? parts[1].split('~') : [];
            const resourcesStrings = parts[2] && parts[2].trim() !== "" ? parts[2].split('~') : [];

            const optimizationTypeElement = document.getElementById('optimizationType');
            if (optimizationTypeElement) {
                if (optimizationType === 'max' || optimizationType === 'min') {
                    optimizationTypeElement.value = optimizationType;
                } else {
                    Logger.warn("[ProductionOpt] Nieznany typ optymalizacji w linku: ", optimizationType, " Ustawiam na max.");
                    optimizationTypeElement.value = 'max';
                }
            }

            ProductionOpt.products = [];
            productsStrings.forEach((pStr, index) => {
                if (!pStr.trim()) return; 
                const pData = pStr.split('^');
                // Oczekujemy teraz co najmniej 3 części: name^profit^cost_min_max_usages
                // gdzie cost_min_max_usages może być jedną częścią, jeśli usages jest puste
                if (pData.length >= 3) { 
                    const name = decodeURIComponent(pData[0]);
                    const profit = parseFloat(pData[1]);
                    
                    // Rozdzielenie cost_minQty_maxQty_usages
                    const extraDataAndUsages = pData[2].split('_');
                    let cost = 0;
                    let minQuantity = null;
                    let maxQuantity = null;
                    let resourceUsage = [];

                    if (extraDataAndUsages.length >= 3) { // Oczekujemy co najmniej cost, min, max
                        cost = parseFloat(extraDataAndUsages[0]);
                        const minQtyStr = extraDataAndUsages[1];
                        minQuantity = minQtyStr === '' ? null : parseInt(minQtyStr);
                        const maxQtyStr = extraDataAndUsages[2];
                        maxQuantity = maxQtyStr === '' ? null : parseInt(maxQtyStr);
                        
                        // Reszta to usages (jeśli istnieją)
                        if (extraDataAndUsages.length > 3 && extraDataAndUsages[3].trim() !== '') {
                            resourceUsage = extraDataAndUsages[3].split('^').map(val => {
                                const num = parseFloat(val);
                                return isNaN(num) ? 0 : num;
                            });
                        } else if (extraDataAndUsages.length > 3) { // pusta część usages
                             resourceUsage = [];
                        }
                    } else {
                        Logger.warn(`[ProductionOpt] Niekompletne dane cost_min_max dla produktu: ${pStr}. Używam domyślnych.`);
                    }

                    if (name.trim() !== "" && !isNaN(profit) && !isNaN(cost)) {
                        ProductionOpt.products.push({
                            id: index, 
                            active: true,
                            name: name,
                            profit: profit,
                            cost: cost, // NOWE
                            minQuantity: isNaN(minQuantity) ? null : minQuantity, // NOWE
                            maxQuantity: isNaN(maxQuantity) ? null : maxQuantity, // NOWE
                            resourceUsage: resourceUsage
                        });
                    } else {
                        Logger.warn(`[ProductionOpt] Pomijam produkt z linku z powodu nieprawidłowych danych: ${pStr}`);
                    }
                } else {
                     Logger.warn(`[ProductionOpt] Nieprawidłowy format danych produktu w linku (za mało części ^): ${pStr}`);
                }
            });

            ProductionOpt.resources = [];
            resourcesStrings.forEach((rStr, index) => {
                if (!rStr.trim()) return; // Pomiń puste stringi
                const rData = rStr.split('^');
                if (rData.length === 2) {
                    const name = decodeURIComponent(rData[0]);
                    const amount = parseFloat(rData[1]);
                    if (name.trim() !== "" && !isNaN(amount) && amount >= 0) {
                        ProductionOpt.resources.push({
                            id: index,
                            active: true,
                            name: name,
                            amount: amount
                        });
                    } else {
                        Logger.warn(`[ProductionOpt] Pomijam zasób z linku z powodu nieprawidłowych danych: ${rStr}`);
                    }
                }
            });
            
            ProductionOpt.productRows = ProductionOpt.products.length;
            ProductionOpt.resourceRows = ProductionOpt.resources.length;

            const productsList = document.getElementById('productsList');
            if (productsList) productsList.innerHTML = '';
            const resourcesList = document.getElementById('resourcesList');
            if (resourcesList) resourcesList.innerHTML = '';

            if (ProductionOpt.rebuildInterface) {
                ProductionOpt.rebuildInterface(); 
            }
            
            Utils.showToast("Dane dla Optymalizacji Produkcji zostały zaimportowane.");
            return true; // Sukces

        } catch (error) {
            Logger.log('ERROR', '[ProductionOpt] Błąd podczas importowania danych:', error, error.stack);
            Utils.showToast('Błąd przetwarzania danych Optymalizacji Produkcji z linku.', true);
            ProductionOpt.products = []; ProductionOpt.resources = []; 
            if (ProductionOpt.rebuildInterface) {
                ProductionOpt.rebuildInterface();
            }
            return false; // Błąd
        }
    },

    // importDataFromLinkString: (dataString) => { ... }, // Poprzednia funkcja bez zmian

    // NOWA IMPLEMENTACJA solveLinearProgram wykorzystująca javascript-lp-solver
    solveLinearProgram: () => {
        Logger.log('INFO', "[ProductionOpt] Starting new solveLinearProgram with javascript-lp-solver.");

        const optimizationTypeElement = document.getElementById('optimizationType');
        const optimizationType = optimizationTypeElement ? optimizationTypeElement.value : 'max'; 
        const objectiveFieldName = optimizationType === 'max' ? 'profitToMaximize' : 'costToMinimize';

        ProductionOpt.collectProductData();
        ProductionOpt.collectResourceData();

        const activeProducts = ProductionOpt.products.filter(p => p && p.active);
        const activeResources = ProductionOpt.resources.filter(r => r && r.active);

        if (activeProducts.length === 0) {
            Logger.log('ERROR', "[ProductionOpt SolveLP] No active products to optimize.");
            Utils.showToast("Brak aktywnych produktów do optymalizacji.", true);
            return { feasible: false, error: "Brak aktywnych produktów." };
        }
        
        const productsRequireResources = activeProducts.some(p => 
            p.resourceUsage && p.resourceUsage.some(usage => typeof usage === 'number' && usage > 0)
        );

        if (productsRequireResources && activeResources.length === 0) {
            Logger.log('ERROR', "[ProductionOpt SolveLP] No active resources defined, but products require them.");
            Utils.showToast("Brak aktywnych zasobów, a produkty ich wymagają.", true);
            return { feasible: false, error: "Brak aktywnych zasobów potrzebnych dla produktów." };
        }

        const model = {
            optimize: objectiveFieldName, 
            opType: optimizationType,
            constraints: {},
            variables: {},
            ints: {}
        };

        const resourceSolverNameMap = new Map(); 

        activeResources.forEach((resource, index) => {
            const originalResourceName = resource.name || `Resource${index}`;
            const solverConstraintName = `res_${Utils.sanitizeForSolver(originalResourceName)}`;
            model.constraints[solverConstraintName] = { max: resource.amount };
            resourceSolverNameMap.set(index, solverConstraintName); 
            Logger.log('DEBUG', `[Solver Model] Constraint: ${solverConstraintName} <= ${resource.amount}`);
        });

        activeProducts.forEach((product, productIdx) => {
            const originalProductName = product.name || `Product${productIdx}`;
            const productSolverName = `prod_${Utils.sanitizeForSolver(originalProductName)}`;
            
            model.variables[productSolverName] = {};
            model.variables[productSolverName][objectiveFieldName] = optimizationType === 'max' ? (product.profit || 0) : (product.cost || 0);
            model.ints[productSolverName] = 1; 

            Logger.log('DEBUG', `[Solver Model] Variable: ${productSolverName}, ${objectiveFieldName}: ${model.variables[productSolverName][objectiveFieldName]}`);

            if (product.resourceUsage && product.resourceUsage.length > 0) {
                product.resourceUsage.forEach((usageValue, activeResourceIndex) => {
                    if (activeResourceIndex < activeResources.length) { 
                        // POPRAWIONA LITERÓWKA TUTAJ:
                        const resourceSolverName = resourceSolverNameMap.get(activeResourceIndex);
                        if (resourceSolverName && typeof usageValue === 'number' && usageValue > 0) {
                            model.variables[productSolverName][resourceSolverName] = usageValue;
                            Logger.log('DEBUG', `[Solver Model] ${productSolverName} uses ${usageValue} of ${resourceSolverName}`);
                        }
                    }
                });
            }

            if (typeof product.minQuantity === 'number' && product.minQuantity > 0) {
                const minConstrName = `${productSolverName}_min_constr`;
                model.constraints[minConstrName] = { min: product.minQuantity };
                model.variables[productSolverName][minConstrName] = 1;
                 Logger.log('DEBUG', `[Solver Model] Min Qty: ${productSolverName} >= ${product.minQuantity} (Constraint: ${minConstrName})`);
            }
            if (typeof product.maxQuantity === 'number' && product.maxQuantity >= 0) { 
                const maxConstrName = `${productSolverName}_max_constr`;
                model.constraints[maxConstrName] = { max: product.maxQuantity };
                model.variables[productSolverName][maxConstrName] = 1;
                Logger.log('DEBUG', `[Solver Model] Max Qty: ${productSolverName} <= ${product.maxQuantity} (Constraint: ${maxConstrName})`);
            }
        });

        Logger.log('INFO', "[ProductionOpt SolveLP] Model prepared for solver:", JSON.parse(JSON.stringify(model)));

        let solverRawResults;
        try {
            if (typeof solver === 'undefined' || typeof solver.Solve !== 'function') {
                Logger.log('ERROR', "[ProductionOpt SolveLP] javascript-lp-solver is not loaded or not a function!");
                Utils.showToast("Błąd: Biblioteka solvera nie jest załadowana. Odśwież stronę.", true);
                return { feasible: false, error: "Solver not loaded." };
            }
            solverRawResults = solver.Solve(model);
            Logger.log('INFO', "[ProductionOpt SolveLP] Raw solver results:", JSON.parse(JSON.stringify(solverRawResults)));
        } catch (e) {
            Logger.log('ERROR', "[ProductionOpt SolveLP] Error during solver.Solve():", e, e.stack ? e.stack : '');
            Utils.showToast("Wystąpił błąd podczas działania solvera.", true);
            return { feasible: false, error: "Solver execution error.", details: e.toString() };
        }
        
        if (!solverRawResults || typeof solverRawResults.feasible !== 'boolean') {
             Logger.log('ERROR', "[ProductionOpt SolveLP] Solver returned invalid results structure:", solverRawResults);
             Utils.showToast("Solver zwrócił nieprawidłowe wyniki.", true);
             return { feasible: false, error: "Invalid solver results."};
        }

        if (!solverRawResults.feasible) {
            let message = "Nie znaleziono wykonalnego rozwiązania.";
            if (solverRawResults.hasOwnProperty('bounded') && solverRawResults.bounded === false) {
                message = "Problem jest nieograniczony (unbounded). Sprawdź ograniczenia i dane wejściowe.";
            } else if (solverRawResults.result === -1 && !solverRawResults.feasible) { 
                 message = "Nie znaleziono wykonalnego rozwiązania (infeasible). Sprawdź sprzeczności w ograniczeniach.";
            }
            Logger.log('WARN', `[ProductionOpt SolveLP] Solution not feasible. Message: ${message}`, solverRawResults);
            return { feasible: false, error: message, details: solverRawResults };
        }
        
        const solutionOutput = {
            optimizationType: optimizationType,
            objective: solverRawResults.result,
            products: [],
            resources: []
        };

        activeProducts.forEach((product, productIdx) => {
            const originalProductName = product.name || `Product${productIdx}`;
            const productSolverName = `prod_${Utils.sanitizeForSolver(originalProductName)}`;
            const quantity = solverRawResults[productSolverName] || 0;
            const objectiveValuePerUnit = optimizationType === 'max' ? (product.profit || 0) : (product.cost || 0);

            solutionOutput.products.push({
                name: product.name,
                quantity: quantity,
                profit: product.profit || 0, 
                cost: product.cost || 0,     
                objectiveValuePerUnit: objectiveValuePerUnit, 
                contribution: quantity * objectiveValuePerUnit 
            });
        });

        activeResources.forEach((resource, activeResourceIndex) => {
            let totalResourceUsed = 0;
            solutionOutput.products.forEach(solvedProduct => {
                const originalProduct = activeProducts.find(p => p.name === solvedProduct.name);
                if (originalProduct && originalProduct.resourceUsage && originalProduct.resourceUsage.length > activeResourceIndex) {
                    const usagePerUnit = originalProduct.resourceUsage[activeResourceIndex] || 0;
                    totalResourceUsed += solvedProduct.quantity * usagePerUnit;
                }
            });
            
            totalResourceUsed = Math.max(0, totalResourceUsed);
            if (Math.abs(totalResourceUsed - resource.amount) < 1e-6 && totalResourceUsed > resource.amount) {
                 totalResourceUsed = resource.amount; 
            }

            solutionOutput.resources.push({
                name: resource.name,
                available: resource.amount,
                used: totalResourceUsed,
                utilization: resource.amount > 0 ? Math.min(100, (totalResourceUsed / resource.amount) * 100) : 0 
            });
        });
        
        Logger.log('INFO', "[ProductionOpt SolveLP] Solution processed and ready for display:", JSON.parse(JSON.stringify(solutionOutput)));
        return { feasible: true, ...solutionOutput };
    },

    // calculate: () => { ... } // Ta funkcja zostanie zmodyfikowana w następnym kroku
}; 