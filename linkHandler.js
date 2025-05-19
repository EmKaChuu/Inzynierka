// linkHandler.js - Nowy moduł do obsługi generowania i importu danych przez linki

const LinkHandler = {
    // --- Konfiguracja Modułów ---
    modules: {
        'a': { // AHP
            name: 'AHP',
            exportFunc: (type) => AHP.exportDataForLink(type),
            importFunc: (dataStr, type) => AHP.importDataFromLinkString(dataStr, type),
            calculateFunc: () => AHP.calculate(), // Funkcja do wywołania po imporcie pełnych danych
            types: {
                's': 'sheet', // Arkusz
                'f': 'full'   // Pełne dane z odpowiedziami
            }
        },
        'c': { // Cutting Stock
            name: 'CuttingStock',
            exportFunc: () => CuttingStock.exportDataForLink(),
            importFunc: (dataStr) => CuttingStock.importDataFromLinkString(dataStr),
            calculateFunc: () => CuttingStock.calculate()
        },
        'p': { // Production Optimization
            name: 'ProductionOpt',
            exportFunc: () => ProductionOpt.exportDataForLink(),
            importFunc: (dataStr) => ProductionOpt.importDataFromLinkString(dataStr),
            calculateFunc: () => ProductionOpt.calculate()
        }
        // W przyszłości można tu dodawać kolejne moduły
    },

    // --- Główne Funkcje ---

    /**
     * Generuje pełny link udostępniania dla danego modułu i typu danych.
     * @param {string} moduleKey - Klucz modułu (np. 'a', 'c', 'p').
     * @param {string} linkKey - Klucz typu linku (np. 's', 'f' dla AHP; może być pusty dla innych).
     */
    generateShareableLink: (moduleKey, linkKey = '') => {
        const moduleConfig = LinkHandler.modules[moduleKey];
        if (!moduleConfig) {
            console.error(`[LinkHandler] Nieznany klucz modułu: ${moduleKey}`);
            return window.location.origin + window.location.pathname + '#error=invalid_module';
        }

        try {
            const dataType = moduleConfig.types ? moduleConfig.types[linkKey] : undefined;
            const compactDataString = moduleConfig.exportFunc(dataType); // Przekazujemy typ danych (np. 'sheet' lub 'full')

            if (compactDataString === null || compactDataString === undefined) {
                console.warn(`[LinkHandler] Funkcja exportDataForLink dla modułu ${moduleConfig.name} zwróciła null/undefined.`);
                return window.location.origin + window.location.pathname + '#error=export_failed';
            }
            
            const base64Data = btoa(encodeURIComponent(compactDataString));
            
            let hash = `#${moduleKey}`;
            if (linkKey) {
                hash += `!${linkKey}`;
            }
            hash += `!${base64Data}`;
            
            return window.location.origin + window.location.pathname + hash;

        } catch (error) {
            console.error(`[LinkHandler] Błąd podczas generowania linku dla modułu ${moduleConfig.name}:`, error);
            Utils.showToast(`Błąd generowania linku: ${error.message}`, true);
            return window.location.origin + window.location.pathname + '#error=link_generation_failed';
        }
    },

    /**
     * Przetwarza dane z fragmentu URL i importuje je do odpowiedniego modułu.
     */
    processImportFromUrl: () => {
        if (!window.location.hash || window.location.hash.length <= 1) {
            return; // Brak hasha lub tylko '#'
        }

        const hashContent = window.location.hash.substring(1);
        const parts = hashContent.split('!');

        if (parts.length < 2) { // Musi być co najmniej <MOD>!<DATA>
            console.error('[LinkHandler] Nieprawidłowy format hasha URL:', hashContent);
            return;
        }

        const moduleKey = parts[0];
        const moduleConfig = LinkHandler.modules[moduleKey];

        if (!moduleConfig) {
            console.error(`[LinkHandler] Nieznany klucz modułu w URL: ${moduleKey}`);
            Utils.showToast(`Nieznany moduł w linku: ${moduleKey}`, true);
            return;
        }
        
        let linkKey = '';
        let base64Data = '';

        if (parts.length === 2) { // Format: <MOD>!<DATA>
            base64Data = parts[1];
        } else if (parts.length === 3) { // Format: <MOD>!<TYPE>!<DATA>
            linkKey = parts[1];
            base64Data = parts[2];
        } else {
            console.error('[LinkHandler] Nieprawidłowa liczba segmentów w hashu URL:', hashContent);
            return;
        }

        try {
            const compactDataString = decodeURIComponent(atob(base64Data));
            const dataType = moduleConfig.types ? moduleConfig.types[linkKey] : undefined;

            // Przełącz na odpowiednie narzędzie zanim zaimportujesz dane
            let toolIdToSwitch = '';
            if (moduleKey === 'a') toolIdToSwitch = 'ahp';
            else if (moduleKey === 'c') toolIdToSwitch = 'cutting-stock';
            else if (moduleKey === 'p') toolIdToSwitch = 'production-opt';

            if (toolIdToSwitch && typeof App !== 'undefined' && App.switchToTool) {
                App.switchToTool(toolIdToSwitch);
            } else if (toolIdToSwitch) {
                 Logger.log('WARN', `[LinkHandler] Nie można przełączyć na narzędzie ${toolIdToSwitch} - App.switchToTool jest niedostępne.`);
            }

            const importSuccess = moduleConfig.importFunc(compactDataString, dataType);

            // Uruchom obliczenia, jeśli import się udał, to pełny import i funkcja istnieje
            if (importSuccess && moduleConfig.calculateFunc) {
                 // Dla AHP, obliczenia tylko dla typu 'full' (lub jeśli linkKey jest pusty, co też by oznaczało pełne dane)
                const isFullAHP = moduleKey === 'a' && linkKey === 'f';
                const isOtherModuleFullImport = moduleKey !== 'a'; // Dla innych modułów każdy import jest "pełny"

                if (isFullAHP || isOtherModuleFullImport) {
                    // Małe opóźnienie, aby DOM zdążył się zaktualizować po imporcie
                    setTimeout(() => {
                        moduleConfig.calculateFunc();
                        Utils.showToast('Dane zaimportowano i obliczono!');
                    }, 200);
                } else {
                     Utils.showToast('Struktura danych zaimportowana!');
                }
            } else {
                 Utils.showToast('Dane zaimportowano!');
            }
            
            // Wyczyść hash, aby uniknąć ponownego importu przy odświeżaniu
            // Robimy to z opóźnieniem, aby ewentualne przekierowania wewnątrz modułów nie zostały przerwane
            setTimeout(() => {
                if (window.history.pushState) {
                    window.history.pushState("", document.title, window.location.pathname + window.location.search);
                } else {
                    window.location.hash = '';
                }
            }, 600);

        } catch (error) {
            console.error(`[LinkHandler] Błąd podczas importu danych dla modułu ${moduleConfig.name}:`, error);
            Utils.showToast(`Błąd importu danych z linku: ${error.message}`, true);
             // Można rozważyć wyczyszczenie hasha nawet przy błędzie
            // window.location.hash = ''; 
        }
    },

    /**
     * Tworzy interfejs udostępniania (przyciski) w danym kontenerze.
     * @param {string} containerId - ID elementu HTML, w którym stworzyć interfejs.
     * @param {string} currentModuleKey - Klucz aktualnie aktywnego modułu (np. 'a', 'c', 'p').
     */
    createShareInterface: (containerId, currentModuleKey) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[LinkHandler] Nie znaleziono kontenera dla interfejsu udostępniania: ${containerId}`);
            return;
        }
        
        container.innerHTML = ''; // Wyczyść stary interfejs
        // container.style.display = 'block'; // Upewnij się, że jest widoczny

        const moduleConfig = LinkHandler.modules[currentModuleKey];
        if (!moduleConfig) {
            console.error(`[LinkHandler] createShareInterface: Nieznany klucz modułu: ${currentModuleKey}`);
            return;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'share-buttons-container';

        if (currentModuleKey === 'a') { // Specjalna obsługa dla AHP (dwa typy linków)
            // Przycisk: Kopiuj link z gotowym arkuszem (tylko struktura)
            const sheetBtn = document.createElement('button');
            sheetBtn.className = 'action-button';
            sheetBtn.innerHTML = '<i class="fas fa-link"></i> Kopiuj link z arkuszem';
            sheetBtn.title = 'Kopiuje link z definicją kryteriów i opcji (bez ocen).';
            sheetBtn.onclick = () => {
                const url = LinkHandler.generateShareableLink('a', 's');
                navigator.clipboard.writeText(url).then(() => {
                    Utils.showToast('Link z arkuszem AHP skopiowany!');
                }).catch(err => {
                    Utils.showToast('Błąd kopiowania linku.', true);
                    console.error('Błąd kopiowania (AHP sheet):', err);
                });
            };
            buttonContainer.appendChild(sheetBtn);

            // Przycisk: Kopiuj link z odpowiedziami (pełne dane + wyniki)
            const fullBtn = document.createElement('button');
            fullBtn.className = 'action-button';
            fullBtn.innerHTML = '<i class="fas fa-calculator"></i> Kopiuj link z ocenami';
            fullBtn.title = 'Kopiuje link z pełnymi danymi i ocenami, który automatycznie uruchomi obliczenia.';
            fullBtn.onclick = () => {
                // Dla AHP 'full', najpierw zapiszmy dane z interfejsu do modelu
                if (typeof AHP !== 'undefined' && AHP.saveCurrentComparisonData) {
                    AHP.saveCurrentComparisonData();
                }
                const url = LinkHandler.generateShareableLink('a', 'f');
                navigator.clipboard.writeText(url).then(() => {
                    Utils.showToast('Link z ocenami AHP skopiowany!');
                }).catch(err => {
                    Utils.showToast('Błąd kopiowania linku.', true);
                    console.error('Błąd kopiowania (AHP full):', err);
                });
            };
            buttonContainer.appendChild(fullBtn);

        } else { // Dla pozostałych modułów (CuttingStock, ProductionOpt) - jeden typ linku
            const shareBtn = document.createElement('button');
            shareBtn.className = 'action-button';
            shareBtn.innerHTML = '<i class="fas fa-calculator"></i> Kopiuj link z danymi';
            shareBtn.title = 'Kopiuje link z wprowadzonymi danymi, który automatycznie uruchomi obliczenia.';
            shareBtn.onclick = () => {
                // Dla innych modułów, upewnijmy się, że dane są zapisane w modelu przed eksportem
                // (jeśli moduły mają taką logikę, np. przy zmianie pól)
                // Na razie zakładamy, że exportFunc() pobierze aktualne dane.
                const url = LinkHandler.generateShareableLink(currentModuleKey);
                navigator.clipboard.writeText(url).then(() => {
                    Utils.showToast(`Link dla ${moduleConfig.name} skopiowany!`);
                }).catch(err => {
                    Utils.showToast('Błąd kopiowania linku.', true);
                    console.error(`Błąd kopiowania (${moduleConfig.name}):`, err);
                });
            };
            buttonContainer.appendChild(shareBtn);
        }
        
        container.appendChild(buttonContainer);
    },

    /**
     * Inicjalizuje interfejsy udostępniania dla wszystkich zdefiniowanych narzędzi
     * oraz próbuje zaimportować dane, jeśli są w URL.
     */
    initialize: () => {
        console.log("[LinkHandler] Inicjalizacja...");

        // Znajdź lub stwórz sekcje do udostępniania dla każdego modułu
        Object.keys(LinkHandler.modules).forEach(moduleKey => {
            let toolIdForContainer = '';
            if (moduleKey === 'a') toolIdForContainer = 'ahp';
            else if (moduleKey === 'c') toolIdForContainer = 'cutting-stock';
            else if (moduleKey === 'p') toolIdForContainer = 'production-opt';
            else return; // Nieznany klucz modułu do mapowania na ID kontenera

            const mainToolContainer = document.getElementById(`tool-${toolIdForContainer}`);
            const shareContainerId = `${toolIdForContainer}-share-container`; // np. ahp-share-container

            if (mainToolContainer) {
                let shareSection = document.getElementById(shareContainerId);
                if (!shareSection) {
                    shareSection = document.createElement('div');
                    shareSection.id = shareContainerId;
                    shareSection.className = 'share-section-container'; // Możesz chcieć zachować stare style
                    
                    const header = document.createElement('h3');
                    header.textContent = 'Udostępnianie danych';
                    shareSection.appendChild(header);
                    
                    // Dodaj sekcję do kontenera narzędzia - np. na końcu
                    mainToolContainer.appendChild(shareSection); 
                    console.log(`[LinkHandler] Stworzono kontener udostępniania: ${shareContainerId}`);
                }

                // Na razie nie tworzymy interfejsu od razu, tylko przy przełączaniu narzędzi
                // LinkHandler.createShareInterface(shareContainerId, moduleKey);
            } else {
                console.warn(`[LinkHandler] Nie znaleziono głównego kontenera dla narzędzia: tool-${toolIdForContainer}`);
            }
        });
        
        // Nasłuchuj na zmianę narzędzia, aby zaktualizować interfejs udostępniania
        // To wymaga, aby `App.switchTool` emitowało zdarzenie lub wołało callback
        // Na razie zakładamy, że `App.currentTool` będzie aktualizowane,
        // a interfejs udostępniania będzie tworzony/aktualizowany przez `App.switchTool`
        // lub inną logikę zarządzającą widokiem.

        // Spróbuj zaimportować dane z URL przy starcie aplikacji
        // Opóźnienie, aby dać czas na załadowanie i inicjalizację modułów
        setTimeout(() => {
            LinkHandler.processImportFromUrl();
        }, 700); // Nieco dłuższe opóźnienie na wszelki wypadek
    }
};

// --- Inicjalizacja po załadowaniu DOM ---
document.addEventListener('DOMContentLoaded', () => {
    LinkHandler.initialize();
});

// --- Dodatkowe: aktualizacja interfejsu udostępniania przy zmianie narzędzia ---
// To jest miejsce, gdzie trzeba zintegrować z App.switchTool
// Przykład: document.addEventListener('toolChanged', (event) => {
//     const newToolKey = event.detail.newTool; // np. 'a', 'c', 'p'
//     const containerId = `${event.detail.newToolHtmlId}-share-container`; // np. ahp-share-container
//     LinkHandler.createShareInterface(containerId, newToolKey);
// });
// Na razie, wywołanie LinkHandler.createShareInterface będzie musiało być
// dodane ręcznie w App.switchTool lub podobnej funkcji w script.js 