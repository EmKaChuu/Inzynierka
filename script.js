// --- Global Namespace ---
const Utils = {
    showElement: (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    },
    
    hideElement: (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    },
    
    clearElement: (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    },
    
    displayResults: (containerId, content, isError = false) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = isError ? 
                `<div class="error-message">${content}</div>` : 
                content;
            container.style.display = 'block';
        }
    },
    
    displayError: (message) => {
        // Tworzymy element div z komunikatem błędu
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-content">
                <h4>Wystąpił błąd</h4>
                <p>${message}</p>
            </div>
        `;
        
        // Znajdź kontener do wyświetlenia błędu na podstawie aktywnego narzędzia
        let containerId = 'ahpResults'; // Domyślny kontener
        
        if (document.getElementById('tool-cutting-stock').style.display === 'block') {
            containerId = 'cuttingStockResults';
        } else if (document.getElementById('tool-production-opt').style.display === 'block') {
            containerId = 'productionOptResults';
        }
        
        // Wyświetl błąd w odpowiednim kontenerze
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            container.appendChild(errorDiv);
            container.style.display = 'block';
        }
    },

    // Nowa funkcja do dostosowywania wysokości
    adjustContainerHeights: () => {
        // Daj czas na renderowanie zawartości
        setTimeout(() => {
            console.log("Dostosowywanie wysokości kontenerów...");
            
            // Upewnij się, że wszystkie wykresy Plotly są poprawnie załadowane
            window.dispatchEvent(new Event('resize'));
            
            // Ustaw wysokość kontenera na podstawie jego zawartości
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                // Odśwież layout po renderowaniu wykresów
                const container = document.querySelector('.container');
                if (container) {
                    container.style.height = 'auto';
                    container.style.minHeight = 'fit-content';
                }
            }
        }, 100);
    }
};

const App = {
    currentTool: null,

    switchToTool: (toolId) => {
        console.log(`--- Attempting to switch to tool: ${toolId} ---`);

        // Deactivate previous tool button and content
        if (App.currentTool) {
            const previousToolContentId = `tool-${App.currentTool}`;
            const previousNavButtonId = `nav-${App.currentTool}`;
            console.log(`Hiding previous content: ${previousToolContentId}`);
            Utils.hideElement(previousToolContentId);

            const previousNavButton = document.getElementById(previousNavButtonId);
            if (previousNavButton) {
                previousNavButton.classList.remove('active');
                console.log(`Deactivated nav button: ${previousNavButtonId}`);
            } else {
                console.warn(`Previous nav button not found: ${previousNavButtonId}`);
            }
        } else {
            console.log("No previous tool to deactivate.");
        }

        // Activate new tool button and content
        App.currentTool = toolId;
        const currentToolContentId = `tool-${toolId}`;
        const currentNavButtonId = `nav-${toolId}`;

        console.log(`Showing current content: ${currentToolContentId}`);
        Utils.showElement(currentToolContentId);

        const currentNavButton = document.getElementById(currentNavButtonId);
        if (currentNavButton) {
            currentNavButton.classList.add('active');
            console.log(`Activated nav button: ${currentNavButtonId}`);
        } else {
            console.warn(`Current nav button not found: ${currentNavButtonId}`);
        }

        console.log(`Checking if init function exists for ${toolId}...`);
        // Initialize tool if needed
        try {
            switch (toolId) {
                case 'ahp':
                    if (typeof AHP !== 'undefined' && typeof AHP.init === 'function') {
                        console.log("Calling AHP.init()");
                        AHP.init();
                    } else { console.warn("AHP.init() not found"); }
                    break;
                case 'cutting-stock':
                    if (typeof CuttingStock !== 'undefined' && typeof CuttingStock.init === 'function') {
                        console.log("Calling CuttingStock.init()");
                        CuttingStock.init();
                    } else { console.warn("CuttingStock.init() not found"); }
                    break;
                case 'production-opt':
                    if (typeof ProductionOpt !== 'undefined' && typeof ProductionOpt.init === 'function') {
                        console.log("Calling ProductionOpt.init()");
                        ProductionOpt.init();
                    } else { console.warn("ProductionOpt.init() not found"); }
                    break;
                default:
                    console.log(`No specific init function defined for tool: ${toolId}`);
            }
            
            // Dostosuj wysokość po inicjalizacji
            Utils.adjustContainerHeights();
            
            console.log(`Initialization logic completed for ${toolId}.`);
        } catch (initError) {
            console.error(`Error during init for tool ${toolId}:`, initError);
            const resultsAreaId = `${toolId}Results`;
            Utils.displayResults(resultsAreaId, `Error initializing tool: ${initError.message}. Check console.`, true);
        }
        console.log(`--- Switch to ${toolId} complete ---`);
    }
};

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    // Domyślnie pokaż pierwszy moduł (AHP)
    App.switchToTool('ahp');
    
    // Nasłuchuj na zdarzenie resize, aby dostosować wysokość kontenerów
    window.addEventListener('resize', Utils.adjustContainerHeights);
});

// Nasłuchuj na zdarzenia po obliczeniach, aby dostosować wysokość kontenera
document.addEventListener('calculation-complete', Utils.adjustContainerHeights); 