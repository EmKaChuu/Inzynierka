// --- Global Namespace ---
// Wersja: 1.0.5 - Przycisk pulsujący niewidoczny od początku
// Usunięto zduplikowaną definicję obiektu Utils, ponieważ jest on teraz ładowany z pliku utils.js

// Główna klasa aplikacji
const App = {
    // Aktualnie wybrane narzędzie
    currentTool: null,
    maximizedEditor: false,
    activeModal: null,
    plotlyLoaded: false,
    
    init: () => {
        Logger.init();
        Logger.log('INFO', "App initializing...");

        // App.initThemeSwitcher(); // TODO: Sprawdzić, czy ta funkcja jest potrzebna lub ją zaimplementować

        // Domyślne narzędzie przy starcie
        const initialTool = 'ahp'; 
        App.switchToTool(initialTool);
        // Utils.setActiveButton(document.querySelector(`.nav-button[onclick*="switchToTool(\'${initialTool}\')"]`)); // TODO: Sprawdzić, czy ta funkcja jest potrzebna lub ją zaimplementować

        // Nasłuchuj na załadowanie Plotly
        if (typeof Plotly !== 'undefined') {
            App.plotlyLoaded = true;
            Logger.log('INFO', 'Plotly library already loaded.');
        } else {
            Logger.log('INFO', 'Plotly library not yet loaded, will check on demand.');
        }

        // Automatyczny import z URL, jeśli są dane
        if (typeof LinkHandler !== 'undefined' && LinkHandler.processImportFromUrl) {
            LinkHandler.processImportFromUrl();
        } else {
            Logger.log('WARN', 'LinkHandler or LinkHandler.processImportFromUrl not found during App.init');
        }
        
        Logger.log('INFO', "App initialized.");
    },
    
    // Przełączanie między narzędziami
    switchToTool: (tool) => {
        if (App.currentTool === tool) return;
        
        Logger.log('INFO', `Przełączanie na narzędzie: ${tool}`);
        App.currentTool = tool;
        
        Utils.showActiveToolContent(tool);
        
        // Inicjalizacja narzędzia i interfejsu udostępniania
        let moduleKeyForLinkHandler = '';
        let shareInterfaceContainerId = '';

        switch(tool) {
            case 'ahp':
                if (typeof AHP !== 'undefined') {
                    if (AHP.init) AHP.init();
                    else if (AHP.initialize) AHP.initialize();
                }
                moduleKeyForLinkHandler = 'a';
                shareInterfaceContainerId = 'ahp-share-container';
                break;
            case 'cutting-stock':
                if (typeof CuttingStock !== 'undefined') {
                    if (CuttingStock.init) CuttingStock.init();
                    else if (CuttingStock.initialize) CuttingStock.initialize();
                }
                moduleKeyForLinkHandler = 'c';
                shareInterfaceContainerId = 'cutting-stock-share-container';
                break;
            case 'production-opt':
                if (typeof ProductionOpt !== 'undefined') {
                    if (ProductionOpt.init) ProductionOpt.init();
                    else if (ProductionOpt.initialize) ProductionOpt.initialize();
                }
                moduleKeyForLinkHandler = 'p';
                shareInterfaceContainerId = 'production-opt-share-container';
                break;
        }

        // Utwórz/zaktualizuj interfejs udostępniania dla nowego narzędzia
        if (typeof LinkHandler !== 'undefined' && LinkHandler.createShareInterface && moduleKeyForLinkHandler && shareInterfaceContainerId) {
            // Małe opóźnienie, aby dać czas na inicjalizację modułu i ewentualne stworzenie kontenera
            setTimeout(() => {
                 LinkHandler.createShareInterface(shareInterfaceContainerId, moduleKeyForLinkHandler);
            }, 100); // 100ms powinno wystarczyć
        } else {
            if (typeof LinkHandler === 'undefined') Logger.log('WARN', '[App.switchToTool] LinkHandler jest niezdefiniowany.');
            if (!moduleKeyForLinkHandler) Logger.log('WARN', '[App.switchToTool] Nie udało się ustalić moduleKeyForLinkHandler.');
            if (!shareInterfaceContainerId) Logger.log('WARN', '[App.switchToTool] Nie udało się ustalić shareInterfaceContainerId.');
        }
        
        Utils.adjustContainerHeights();
    }
};

// Nasłuchuj na zdarzenia po obliczeniach, aby dostosować wysokość kontenera
document.addEventListener('calculation-complete', Utils.adjustContainerHeights);

// Inicjalizacja po załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', App.init);

// Obsługa przycisków pomocy i okienek modalnych
document.addEventListener('DOMContentLoaded', function() {
    Logger.log('INFO', "Inicjalizacja systemu pomocy...");
    
    // Przyciski pomocy
    const helpAhpBtn = document.getElementById('help-ahp');
    const helpCuttingStockBtn = document.getElementById('help-cutting-stock');
    const helpProductionOptBtn = document.getElementById('help-production-opt');
    
    // Natychmiast ukryj wszystkie oryginalne przyciski
    [helpAhpBtn, helpCuttingStockBtn, helpProductionOptBtn].forEach(btn => {
        if (btn) {
            btn.style.opacity = '0';
            btn.style.display = 'none';
        }
    });
    
    // Okienka modalne
    const helpModalAhp = document.getElementById('help-modal-ahp');
    const helpModalCuttingStock = document.getElementById('help-modal-cutting-stock');
    const helpModalProductionOpt = document.getElementById('help-modal-production-opt');
    
    // Przyciski zamykania okienek
    const closeButtons = document.querySelectorAll('.close-help-modal');
    
    // Funkcja otwierająca okienko modalne
    function openHelpModal(modal) {
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    // Funkcja zamykająca okienko modalne
    function closeHelpModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            
            // Upewnij się, że oryginalny przycisk dla aktualnego narzędzia jest widoczny
            let originalBtn;
            switch(App.currentTool) {
                case 'ahp':
                    originalBtn = helpAhpBtn;
                    break;
                case 'cutting-stock':
                    originalBtn = helpCuttingStockBtn;
                    break;
                case 'production-opt':
                    originalBtn = helpProductionOptBtn;
                    break;
            }
            
            if (originalBtn && helpButtonClicked) {
                originalBtn.style.opacity = '1';
                originalBtn.style.display = 'flex';
            }
        }
    }
    
    // Resetowanie stanu przycisku pomocy (do testów)
    localStorage.removeItem('helpButtonClicked');
    
    // Zmienna do śledzenia, czy przycisk pomocy został już kliknięty
    let helpButtonClicked = localStorage.getItem('helpButtonClicked') === 'true';
    
    // Funkcja tworząca i animująca przyciski pomocy
    function setupHelpButtonAnimation(originalButton, toolName) {
        if (!originalButton) return;
        
        // Ukryj oryginalny przycisk całkowicie
        originalButton.style.opacity = '0';
        originalButton.style.display = 'none';
        
        // 1. Stwórz pierwszy przycisk (ten, który wjeżdża) - ZAWSZE WIDOCZNY po wjechaniu
        const slideInButton = document.createElement('button');
        slideInButton.className = 'help-button slide-in-button';
        slideInButton.innerHTML = '?';
        slideInButton.id = `help-${toolName}-slide`;
        
        // Dodaj przycisk do body
        document.body.appendChild(slideInButton);
        
        // Pozycjonuj przycisk dokładnie w miejscu oryginalnego
        const rect = originalButton.getBoundingClientRect();
        slideInButton.style.top = rect.top + 'px';
        slideInButton.style.right = (window.innerWidth - rect.right) + 'px';
        
        // Ustaw początkową pozycję poza ekranem
        slideInButton.style.transform = 'translateX(100px)';
        
        // Wymuszenie przepływu
        slideInButton.offsetHeight;
        
        // Animacja wjazdu
        slideInButton.classList.add('slide-in');
        
        // 2. Stwórz drugi przycisk (pulsujący)
        const pulseButton = document.createElement('button');
        pulseButton.className = 'help-button pulse-button';
        pulseButton.innerHTML = '?';
        pulseButton.id = `help-${toolName}-pulse`;
        pulseButton.style.zIndex = '1003'; // Wyższy z-index niż slide-in-button
        
        // Dodaj przycisk do body, ale ustaw go jako całkowicie niewidoczny
        pulseButton.style.opacity = '0';
        pulseButton.style.display = 'none'; // Całkowicie ukryty
        document.body.appendChild(pulseButton);
        
        // Pozycjonuj przycisk dokładnie w miejscu oryginalnego
        pulseButton.style.top = rect.top + 'px';
        pulseButton.style.right = (window.innerWidth - rect.right) + 'px';
        
        // Po zakończeniu animacji wjazdu, pokaż pulsujący przycisk
        setTimeout(() => {
            // Przygotuj przycisk pulsujący do pokazania
            pulseButton.style.transition = 'opacity 0.3s ease-in';
            pulseButton.style.display = 'flex';
            
            // Płynne pojawienie się pulsującego przycisku
            setTimeout(() => {
                pulseButton.style.opacity = '1';
                pulseButton.classList.add('pulse');
                
                // Po 1.5 sekundy zatrzymaj pulsowanie i ukryj przycisk
                setTimeout(() => {
                    // Płynne ukrycie pulsującego przycisku
                    pulseButton.style.opacity = '0';
                    
                    setTimeout(() => {
                        pulseButton.classList.remove('pulse');
                        pulseButton.style.display = 'none'; // Całkowicie ukryj
                        
                        // Pokaż przycisk ponownie po 10 sekundach
                        setTimeout(() => {
                            if (helpButtonClicked) return;
                            
                            // Przygotuj przycisk do pokazania
                            pulseButton.style.display = 'flex';
                            
                            // Płynne pojawienie się pulsującego przycisku
                            setTimeout(() => {
                                pulseButton.style.opacity = '1';
                                pulseButton.classList.add('pulse');
                                
                                // Po 1.5 sekundy zatrzymaj pulsowanie i ukryj przycisk
                                setTimeout(() => {
                                    // Płynne ukrycie pulsującego przycisku
                                    pulseButton.style.opacity = '0';
                                    
                                    setTimeout(() => {
                                        pulseButton.classList.remove('pulse');
                                        pulseButton.style.display = 'none'; // Całkowicie ukryj
                                        
                                        // Teraz ustaw interwał ponownego pulsowania co minutę
                                        const pulseInterval = setInterval(() => {
                                            if (helpButtonClicked) {
                                                clearInterval(pulseInterval);
                                                return;
                                            }
                                            
                                            // Przygotuj przycisk do pokazania
                                            pulseButton.style.display = 'flex';
                                            
                                            // Płynne pojawienie się pulsującego przycisku
                                            setTimeout(() => {
                                                pulseButton.style.opacity = '1';
                                                pulseButton.classList.add('pulse');
                                                
                                                // Po 1.5 sekundy zatrzymaj pulsowanie i ukryj przycisk
                                                setTimeout(() => {
                                                    // Płynne ukrycie pulsującego przycisku
                                                    pulseButton.style.opacity = '0';
                                                    
                                                    setTimeout(() => {
                                                        pulseButton.classList.remove('pulse');
                                                        pulseButton.style.display = 'none'; // Całkowicie ukryj
                                                    }, 300);
                                                }, 1500);
                                            }, 10);
                                        }, 60000); // Interwał co minutę
                                    }, 300);
                                }, 1500);
                            }, 10);
                        }, 10000); // Pokaż ponownie po 10 sekundach
                    }, 300);
                }, 1500);
            }, 10);
        }, 800); // Po zakończeniu animacji wjazdu
        
        // Dodaj obsługę kliknięcia do obu przycisków
        slideInButton.addEventListener('click', function() {
            handleHelpButtonClick(toolName);
        });
        
        pulseButton.addEventListener('click', function() {
            handleHelpButtonClick(toolName);
        });
        
        return { slideInButton, pulseButton };
    }
    
    // Funkcja obsługująca kliknięcie przycisku pomocy
    function handleHelpButtonClick(toolName) {
        let modal;
        switch(toolName) {
            case 'ahp':
                modal = helpModalAhp;
                break;
            case 'cutting-stock':
                modal = helpModalCuttingStock;
                break;
            case 'production-opt':
                modal = helpModalProductionOpt;
                break;
        }
        
        if (modal) {
            openHelpModal(modal);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            
            // Znajdź oryginalny przycisk dla danego narzędzia
            let originalBtn;
            switch(toolName) {
                case 'ahp':
                    originalBtn = helpAhpBtn;
                    break;
                case 'cutting-stock':
                    originalBtn = helpCuttingStockBtn;
                    break;
                case 'production-opt':
                    originalBtn = helpProductionOptBtn;
                    break;
            }
            
            // Zatrzymaj animacje i ukryj TYLKO pulsujący przycisk
            document.querySelectorAll('.pulse-button').forEach(btn => {
                // Zatrzymaj animacje
                btn.style.animation = 'none';
                btn.classList.remove('pulse');
                
                // Ukryj przycisk
                btn.style.opacity = '0';
                btn.style.display = 'none';
            });
            
            // Wyczyść wszystkie interwały
            const highestId = window.setTimeout(() => {}, 0);
            for (let i = highestId; i >= 0; i--) {
                window.clearInterval(i);
            }
        }
    }
    
    // Uruchom animacje dla aktywnego przycisku pomocy
    if (App.currentTool === 'ahp' || App.currentTool === null) {
        setTimeout(() => {
            setupHelpButtonAnimation(helpAhpBtn, 'ahp');
        }, 300);
    }
    
    // Obsługa przełączania między narzędziami - aktualizacja animacji przycisku pomocy
    const originalSwitchToTool = App.switchToTool;
    App.switchToTool = function(tool) {
        originalSwitchToTool(tool);
        
        // Jeśli przycisk pomocy nie został jeszcze kliknięty, pokaż animacje dla nowego narzędzia
        if (!helpButtonClicked) {
            let activeHelpButton;
            let toolName;
            
            switch(tool) {
                case 'ahp':
                    activeHelpButton = helpAhpBtn;
                    toolName = 'ahp';
                    break;
                case 'cutting-stock':
                    activeHelpButton = helpCuttingStockBtn;
                    toolName = 'cutting-stock';
                    break;
                case 'production-opt':
                    activeHelpButton = helpProductionOptBtn;
                    toolName = 'production-opt';
                    break;
            }
            
            // Ukryj wszystkie oryginalne przyciski
            [helpAhpBtn, helpCuttingStockBtn, helpProductionOptBtn].forEach(btn => {
                if (btn) {
                    btn.style.opacity = '0';
                    btn.style.display = 'none';
                }
            });
            
            // Usuń wszystkie istniejące przyciski animowane
            document.querySelectorAll('.slide-in-button, .pulse-button').forEach(btn => {
                if (btn.parentNode) {
                    btn.parentNode.removeChild(btn);
                }
            });
            
            if (activeHelpButton) {
                setTimeout(() => {
                    setupHelpButtonAnimation(activeHelpButton, toolName);
                }, 500);
            }
        }
    };
    
    // Obsługa zamykania okienek
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const modal = button.closest('.help-modal');
            closeHelpModal(modal);
        });
    });
    
    // Zamykanie okienka po kliknięciu poza jego zawartością
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('help-modal')) {
            closeHelpModal(e.target);
        }
    });

    // Obsługa przycisków logowania
    const downloadLogsButton = document.getElementById('downloadLogsButton');
    if (downloadLogsButton) {
        downloadLogsButton.addEventListener('click', () => {
            Logger.downloadLogs();
        });
    }

    const clearLogsButton = document.getElementById('clearLogsButton');
    if (clearLogsButton) {
        clearLogsButton.addEventListener('click', () => {
            Logger.clearLogs();
        });
    }
}); 