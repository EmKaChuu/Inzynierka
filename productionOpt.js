// Moduł ProductionOpt - Optymalizacja produkcji
const ProductionOpt = {
    productRows: 0,
    products: [],
    resourceRows: 0,
    resources: [],
    solution: null,
    
    init: () => {
        console.log("Executing ProductionOpt.init()");
        
        // Przygotuj interfejs
        ProductionOpt.productRows = 0;
        ProductionOpt.products = [];
        ProductionOpt.resourceRows = 0;
        ProductionOpt.resources = [];
        
        // Wyczyść poprzednie wyniki
        Utils.clearElement('productionOptResults');
        Utils.clearElement('productionOptVisualization');
        Utils.hideElement('productionOptLoadingIndicator');
        
        // Przygotuj listy produktów i zasobów
        const productsList = document.getElementById('productsList');
        const resourcesList = document.getElementById('resourcesList');
        
        if (productsList) productsList.innerHTML = '';
        if (resourcesList) resourcesList.innerHTML = '';
        
        // Dodaj pierwszy wiersz produktu i zasobu
        ProductionOpt.addProductRow();
        ProductionOpt.addResourceRow();
        
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
        profitInput.value = '10';
        
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
            
            if (nameInput && profitInput) {
                ProductionOpt.products[i].name = nameInput.value || `Produkt ${i+1}`;
                ProductionOpt.products[i].profit = parseFloat(profitInput.value) || 0;
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
        console.log("Ładowanie przykładowych danych do optymalizacji produkcji");
        
        // Wyczyść istniejące dane
        const productsList = document.getElementById('productsList');
        const resourcesList = document.getElementById('resourcesList');
        
        if (productsList) productsList.innerHTML = '';
        if (resourcesList) resourcesList.innerHTML = '';
        
        ProductionOpt.productRows = 0;
        ProductionOpt.products = [];
        ProductionOpt.resourceRows = 0;
        ProductionOpt.resources = [];
        
        // Przykładowe dane produktów
        const sampleProducts = [
            { name: "Produkt A", profit: 8, resourceUsage: [2, 1] },
            { name: "Produkt B", profit: 6, resourceUsage: [1, 2] },
            { name: "Produkt C", profit: 5, resourceUsage: [2, 3] }
        ];
        
        // Przykładowe dane zasobów
        const sampleResources = [
            { name: "Surowiec 1", amount: 100 },
            { name: "Maszyna 2", amount: 80 }
        ];
        
        // Dodaj przykładowe zasoby
        for (const resource of sampleResources) {
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
            amountInput.value = resource.amount;
            
            amountContainer.appendChild(amountLabel);
            amountContainer.appendChild(amountInput);
            
            // Przycisk usuwania
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
            removeButton.className = 'small-button';
            removeButton.onclick = () => ProductionOpt.removeResourceRow(rowId);
            
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
        
        // Dodaj przykładowe produkty
        for (const product of sampleProducts) {
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
            profitInput.value = product.profit;
            
            profitContainer.appendChild(profitLabel);
            profitContainer.appendChild(profitInput);
            
            // Przycisk usuwania
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '<i class="fas fa-trash"></i> Usuń';
            removeButton.className = 'small-button';
            removeButton.onclick = () => ProductionOpt.removeProductRow(rowId);
            
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
    },
    
    calculateFallback: () => {
        console.log("Uruchomiono funkcję fallback dla obliczania optymalizacji produkcji");
        
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
            console.error("Błąd podczas wykonywania funkcji calculateFallback:", error);
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
        console.log("Funkcja ProductionOpt.calculate została wywołana!");
        try {
            // Zbierz dane z formularza
            console.log("Próba zebrania danych z formularza...");
            ProductionOpt.collectProductData();
            ProductionOpt.collectResourceData();
            
            // Wyczyść poprzednie wyniki
            Utils.clearElement('productionOptResults');
            Utils.clearElement('productionOptVisualization');
            
            // Pokazanie wskaźnika ładowania
            Utils.showElement('productionOptLoadingIndicator');
            
            // Sprawdź, czy mamy jakieś aktywne produkty i zasoby
            const activeProducts = ProductionOpt.products.filter(p => p && p.active);
            const activeResources = ProductionOpt.resources.filter(r => r && r.active);
            
            if (activeProducts.length === 0) {
                throw new Error("Nie zdefiniowano żadnych produktów!");
            }
            
            if (activeResources.length === 0) {
                throw new Error("Nie zdefiniowano żadnych zasobów!");
            }
            
            // Kod sprawdzający, czy solver jest dostępny
            if (typeof solver === 'undefined' || typeof solver.Solve !== 'function') {
                console.error("Biblioteka solver.js nie jest dostępna! Używam metody fallback.");
                Utils.hideElement('productionOptLoadingIndicator');
                ProductionOpt.calculateFallback();
                return;
            }
            
            // Sprawdź, czy wszystkie produkty mają zdefiniowane zużycie dla wszystkich zasobów
            const activeResourceCount = activeResources.length;
            
            for (const product of activeProducts) {
                if (product.resourceUsage.length < activeResourceCount) {
                    // Uzupełnij brakujące wartości zerami
                    while (product.resourceUsage.length < activeResourceCount) {
                        product.resourceUsage.push(0);
                    }
                }
            }
            
            // Wybierz typ optymalizacji
            const optimizationType = document.getElementById('optimizationType')?.value || 'max';
            
            // Utwórz model optymalizacji
            const model = {
                optimize: optimizationType === 'max' ? 'profit' : 'cost',
                opType: optimizationType,
                constraints: {},
                variables: {}
            };
            
            // Dodaj zmienne decyzyjne (produkty)
            for (let i = 0; i < activeProducts.length; i++) {
                const product = activeProducts[i];
                const varName = `x${i}`;
                
                model.variables[varName] = {};
                
                // Ustaw współczynnik funkcji celu
                model.variables[varName][model.optimize] = optimizationType === 'max' ? 
                    product.profit : -product.profit;
                
                // Dodaj ograniczenie nieujemności
                model.variables[varName][`nonNegative${i}`] = 1;
                model.constraints[`nonNegative${i}`] = { min: 0 };
            }
            
            // Dodaj ograniczenia zasobów
            for (let j = 0; j < activeResources.length; j++) {
                const resource = activeResources[j];
                const resourceName = `resource${j}`;
                
                // Dla każdego produktu dodaj jego zużycie zasobu
                for (let i = 0; i < activeProducts.length; i++) {
                    const product = activeProducts[i];
                    const varName = `x${i}`;
                    
                    model.variables[varName][resourceName] = product.resourceUsage[j];
                }
                
                // Ustaw ograniczenie dostępności zasobu
                model.constraints[resourceName] = { max: resource.amount };
            }
            
            console.log("Model optymalizacji:", model);
            
            // Rozwiąż problem optymalizacji
            const result = solver.Solve(model);
            console.log("Wynik optymalizacji:", result);
            
            // Ukryj wskaźnik ładowania
            Utils.hideElement('productionOptLoadingIndicator');
            
            // Sprawdź, czy znaleziono wykonalne rozwiązanie
            if (!result.feasible) {
                // Wyświetl informację o braku rozwiązania
                ProductionOpt.displayNoSolutionMessage();
                return;
            }
            
            // Przygotuj dane do wyświetlenia
            const solutionData = {
                optimizationType: optimizationType,
                objective: result.result,
                products: [],
                resources: []
            };
            
            // Przygotuj dane produktów
            for (let i = 0; i < activeProducts.length; i++) {
                const product = activeProducts[i];
                const quantity = result[`x${i}`] || 0;
                
                solutionData.products.push({
                    name: product.name,
                    profit: product.profit,
                    quantity: quantity,
                    contribution: product.profit * quantity
                });
            }
            
            // Przygotuj dane zasobów
            for (let j = 0; j < activeResources.length; j++) {
                const resource = activeResources[j];
                const resourceName = `resource${j}`;
                
                // Oblicz wykorzystanie zasobu
                let usage = 0;
                for (let i = 0; i < activeProducts.length; i++) {
                    const product = activeProducts[i];
                    const quantity = result[`x${i}`] || 0;
                    
                    usage += product.resourceUsage[j] * quantity;
                }
                
                solutionData.resources.push({
                    name: resource.name,
                    available: resource.amount,
                    used: usage,
                    utilization: (usage / resource.amount) * 100
                });
            }
            
            // Zapisz rozwiązanie
            ProductionOpt.solution = solutionData;
            
            // Wyświetl wyniki
            ProductionOpt.displayResults();
            
            // Wizualizuj wyniki
            ProductionOpt.visualizeResults();
            
        } catch (error) {
            console.error("Błąd podczas optymalizacji:", error);
            Utils.hideElement('productionOptLoadingIndicator');
            
            // Próba użycia metody fallback w przypadku błędu
            try {
                console.log("Próba użycia metody fallback po błędzie...");
                ProductionOpt.calculateFallback();
            } catch (fallbackError) {
                console.error("Błąd podczas używania metody fallback:", fallbackError);
                const resultsContainer = document.getElementById('productionOptResults');
                if (resultsContainer) {
                    resultsContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Błąd podczas optymalizacji</h3>
                            <p>${error.message}</p>
                            <p>Próba użycia metody awaryjnej również nie powiodła się: ${fallbackError.message}</p>
                        </div>
                    `;
                }
            }
        }
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
    
    displayResults: () => {
        if (!ProductionOpt.solution) return;
        
        const solution = ProductionOpt.solution;
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
    
    visualizeResults: () => {
        if (!ProductionOpt.solution) return;
        
        const solution = ProductionOpt.solution;
        const visualizationContainer = document.getElementById('productionOptVisualization');
        visualizationContainer.innerHTML = '';
        
        // Przygotuj dane do wykresów
        const productNames = solution.products.map(p => p.name);
        const productQuantities = solution.products.map(p => p.quantity);
        const productContributions = solution.products.map(p => p.contribution);
        
        const resourceNames = solution.resources.map(r => r.name);
        const resourceUtilizations = solution.resources.map(r => r.utilization);
        
        // Utwórz kontener dla wykresu ilości produkcji
        const quantityChartDiv = document.createElement('div');
        quantityChartDiv.id = 'quantity-chart';
        quantityChartDiv.className = 'chart-container';
        visualizationContainer.appendChild(quantityChartDiv);
        
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
        
        const isMaximization = solution.optimizationType === 'max';
        
        Plotly.newPlot('quantity-chart', [quantityTrace], {
            title: 'Optymalne ilości produkcji',
            xaxis: { title: 'Produkty' },
            yaxis: { title: 'Ilość' },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        }, { responsive: true });
        
        // Utwórz kontener dla wykresu wkładu do funkcji celu
        const contributionChartDiv = document.createElement('div');
        contributionChartDiv.id = 'contribution-chart';
        contributionChartDiv.className = 'chart-container';
        visualizationContainer.appendChild(contributionChartDiv);
        
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
            name: isMaximization ? 'Zysk' : 'Koszt'
        };
        
        Plotly.newPlot('contribution-chart', [contributionTrace], {
            title: isMaximization ? 'Wkład do całkowitego zysku' : 'Udział w całkowitym koszcie',
            xaxis: { title: 'Produkty' },
            yaxis: { title: isMaximization ? 'Zysk' : 'Koszt' },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        }, { responsive: true });
        
        // Utwórz kontener dla wykresu wykorzystania zasobów
        const utilizationChartDiv = document.createElement('div');
        utilizationChartDiv.id = 'utilization-chart';
        utilizationChartDiv.className = 'chart-container';
        visualizationContainer.appendChild(utilizationChartDiv);
        
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
        
        // Wyemituj zdarzenie po zakończeniu wizualizacji
        document.dispatchEvent(new Event('calculation-complete'));
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
            console.error("Błąd podczas eksportu wyników:", error);
            alert("Wystąpił błąd podczas eksportu wyników: " + error.message);
        }
    }
}; 