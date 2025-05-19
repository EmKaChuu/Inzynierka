// Moduł DataShare - Generowanie i importowanie kodów z danymi
const DataShare = {
    // Funkcja do generowania linku z danymi
    generateShareUrlByType: (type = 'answers') => {
        let moduleData = {};
        let moduleName = '';
        
        switch(App.currentTool) {
            case 'ahp':
                moduleName = 'AHP';
                AHP.saveCurrentComparisonData();
                if (type === 'sheet') {
                    moduleData = {
                        criteriaNames: AHP.criteriaNames,
                        optionNames: AHP.optionNames,
                        numCriteria: AHP.numCriteria,
                        numOptions: AHP.numOptions
                    };
                } else {
                    moduleData = {
                        criteriaNames: AHP.criteriaNames,
                        optionNames: AHP.optionNames,
                        numCriteria: AHP.numCriteria,
                        numOptions: AHP.numOptions,
                        criteriaComparisonMatrix: AHP.criteriaComparisonMatrix,
                        optionComparisonMatrices: AHP.optionComparisonMatrices
                    };
                }
                break;
                
            case 'cutting':
                moduleName = 'Cutting';
                moduleData = Cutting.getCurrentData();
                break;
                
            case 'production':
                moduleName = 'Production';
                moduleData = Production.getCurrentData();
                break;
        }
        
        const shareData = {
            module: moduleName,
            data: moduleData
        };
        
        return '#' + btoa(JSON.stringify(shareData));
    },

    // Funkcja tworząca interfejs udostępniania
    createShareInterface: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        container.style.display = 'block';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'share-buttons-container';
        
        // W AHP pokazujemy dwa przyciski
        if (App.currentTool === 'ahp') {
            // Przycisk do kopiowania linku z arkuszem
            const sheetBtn = document.createElement('button');
            sheetBtn.className = 'action-button';
            sheetBtn.innerHTML = '<i class="fas fa-link"></i> Kopiuj link z gotowym arkuszem';
            sheetBtn.onclick = () => {
                const url = window.location.origin + window.location.pathname + DataShare.generateShareUrlByType('sheet');
                navigator.clipboard.writeText(url).then(() => {
                    Utils.showToast('Link został skopiowany do schowka!');
                });
            };
            buttonContainer.appendChild(sheetBtn);
            
            // Przycisk do kopiowania linku z odpowiedziami
            const answersBtn = document.createElement('button');
            answersBtn.className = 'action-button';
            answersBtn.innerHTML = '<i class="fas fa-link"></i> Kopiuj link z odpowiedziami';
            answersBtn.onclick = () => {
                const url = window.location.origin + window.location.pathname + DataShare.generateShareUrlByType('answers');
                navigator.clipboard.writeText(url).then(() => {
                    Utils.showToast('Link został skopiowany do schowka!');
                });
            };
            buttonContainer.appendChild(answersBtn);
        } else {
            // Dla pozostałych trybów tylko jeden przycisk
            const shareBtn = document.createElement('button');
            shareBtn.className = 'action-button';
            shareBtn.innerHTML = '<i class="fas fa-link"></i> Kopiuj link z wynikami';
            shareBtn.onclick = () => {
                const url = window.location.origin + window.location.pathname + DataShare.generateShareUrlByType('answers');
                navigator.clipboard.writeText(url).then(() => {
                    Utils.showToast('Link został skopiowany do schowka!');
                });
            };
            buttonContainer.appendChild(shareBtn);
        }
        
        container.appendChild(buttonContainer);
    },

    // Funkcja do importu danych z URL
    importFromUrl: () => {
        if (window.location.hash) {
            try {
                const shareData = JSON.parse(atob(window.location.hash.substring(1)));
                
                switch(shareData.module) {
                    case 'AHP':
                        App.switchTool('ahp');
                        if (shareData.data.criteriaComparisonMatrix) {
                            // Pełne dane z odpowiedziami
                            Object.assign(AHP, shareData.data);
                            AHP.setupInputs();
                            AHP.calculate();
                        } else {
                            // Tylko nazwy kryteriów i opcji
                            AHP.criteriaNames = shareData.data.criteriaNames;
                            AHP.optionNames = shareData.data.optionNames;
                            AHP.numCriteria = shareData.data.numCriteria;
                            AHP.numOptions = shareData.data.numOptions;
                            AHP.setupInputs();
                        }
                        break;
                        
                    case 'Cutting':
                        App.switchTool('cutting');
                        Cutting.loadData(shareData.data);
                        break;
                        
                    case 'Production':
                        App.switchTool('production');
                        Production.loadData(shareData.data);
                        break;
                }
                
                // Wyczyść hash po zaimportowaniu
                window.location.hash = '';
                
            } catch (error) {
                console.error('Błąd podczas importu danych:', error);
                Utils.showToast('Błąd podczas importu danych z linku!', true);
            }
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
        DataShare.importFromUrl();
    }, 500); // Małe opóźnienie, aby upewnić się, że strona jest w pełni załadowana
});

// Dodajemy globalny event resize dla dodatkowej inicjalizacji interfejsów
window.addEventListener('resize', () => {
    if (typeof DataShare !== 'undefined' && typeof window.forceInitShareInterfaces === 'function') {
        window.forceInitShareInterfaces();
    }
});

// Kompaktowy interfejs z zakładkami
const tabContainer = document.createElement('div');
tabContainer.className = 'share-tabs';

// Przyciski zakładek
const generateTab = document.createElement('button');
generateTab.className = 'share-tab-button active';
generateTab.innerHTML = '<i class="fas fa-share-alt"></i> Udostępnij';

tabContainer.appendChild(generateTab);

// Kontenery zawartości zakładek
const generateContent = document.createElement('div');
generateContent.className = 'share-tab-content active';
generateContent.id = 'generate-tab';
generateContent.style.display = 'block'; 