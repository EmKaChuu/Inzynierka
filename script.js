// --- Global Namespace ---
// Wersja: 1.0.5 - Przycisk pulsujący niewidoczny od początku
const Utils = {
    showElement: (id) => {
        document.getElementById(id).style.display = 'block';
    },
    
    hideElement: (id) => {
        document.getElementById(id).style.display = 'none';
    },
    
    clearElement: (id) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = '';
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
    
    showActiveToolContent: (tool) => {
        // Ukryj wszystkie narzędzia
        document.querySelectorAll('.tool-content').forEach(el => {
            el.classList.remove('active');
        });
        
        // Pokaż wybrane narzędzie
        document.getElementById(`tool-${tool}`).classList.add('active');
        
        // Aktualizuj aktywny przycisk w nawigacji
        document.querySelectorAll('nav button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`nav-${tool}`).classList.add('active');
        
        // Dostosuj zawartość nawy bocznej do aktualnego narzędzia
        const sidebar = document.getElementById('app-sidebar');
        const sidebarContent = document.getElementById('ahp-sidebar-content');
        
        // Pokazuj nawę boczną tylko dla AHP
        if (tool === 'ahp') {
            sidebar.style.display = 'block';
            if (sidebarContent) sidebarContent.style.display = 'block';
            document.getElementById('sidebar-toggle').style.display = 'flex';
        } else {
            sidebar.style.display = 'none';
            document.getElementById('sidebar-toggle').style.display = 'none';
        }
    },
    
    validatePositiveInteger: (value, min, max) => {
        value = parseInt(value);
        return !isNaN(value) && value >= min && value <= max;
    },
    
    validatePositiveFloat: (value, min, max) => {
        value = parseFloat(value);
        return !isNaN(value) && value >= min && (max === undefined || value <= max);
    },
    
    formatNumber: (number, maxDecimals = 2) => {
        if (isNaN(number)) return "-";
        return Math.abs(number) < 0.001 ? 
            number.toExponential(maxDecimals) : 
            number.toFixed(maxDecimals).replace(/\.?0+$/, "");
    },
    
    formatPercent: (number, maxDecimals = 1) => {
        if (isNaN(number)) return "-";
        return (number * 100).toFixed(maxDecimals).replace(/\.?0+$/, "") + "%";
    },
    
    // Nowa funkcja do dostosowywania wysokości
    adjustContainerHeights: () => {
        // Daj czas na renderowanie zawartości
        setTimeout(() => {
            console.log("Dostosowywanie wysokości kontenerów...");
            
            // Upewnij się, że wszystkie wykresy Plotly są poprawnie załadowane
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
};

// Główna klasa aplikacji
const App = {
    // Aktualnie wybrane narzędzie
    currentTool: null,
    
    // Funkcja inicjalizująca
    initialize: () => {
        console.log("Inicjalizacja aplikacji...");
        
        // Sprawdzamy, czy pole liczby opcji ma prawidłowe event listenery
        const optionsInput = document.getElementById('ahpNumOptions');
        if (optionsInput) {
            // Usuwamy istniejące event listenery i dodajemy nowe
            const clonedInput = optionsInput.cloneNode(true);
            optionsInput.parentNode.replaceChild(clonedInput, optionsInput);
            
            // Dodajemy nowe event listenery
            clonedInput.addEventListener('input', function() {
                if (typeof AHP !== 'undefined' && AHP.setupOptions) {
                    AHP.setupOptions();
                }
            });
            
            clonedInput.addEventListener('change', function() {
                if (typeof AHP !== 'undefined' && AHP.setupOptions) {
                    AHP.setupOptions();
                }
            });
        }
        
        // Domyślnie pokaż kalkulator AHP
        App.switchToTool('ahp');
    },
    
    // Przełączanie między narzędziami
    switchToTool: (tool) => {
        if (App.currentTool === tool) return;
        
        console.log(`Przełączanie na narzędzie: ${tool}`);
        App.currentTool = tool;
        
        Utils.showActiveToolContent(tool);
        
        // Inicjalizacja narzędzia
        switch(tool) {
            case 'ahp':
                if (typeof AHP !== 'undefined') {
                    if (AHP.init) {
                        AHP.init();
                    } else if (AHP.initialize) {
                        AHP.initialize();
                    }
                }
                break;
            case 'cutting-stock':
                if (typeof CuttingStock !== 'undefined') {
                    if (CuttingStock.init) {
                        CuttingStock.init();
                    } else if (CuttingStock.initialize) {
                        CuttingStock.initialize();
                    }
                }
                break;
            case 'production-opt':
                if (typeof ProductionOpt !== 'undefined') {
                    if (ProductionOpt.init) {
                        ProductionOpt.init();
                    } else if (ProductionOpt.initialize) {
                        ProductionOpt.initialize();
                    }
                }
                break;
        }
        
        Utils.adjustContainerHeights();
    }
};

// Nasłuchuj na zdarzenia po obliczeniach, aby dostosować wysokość kontenera
document.addEventListener('calculation-complete', Utils.adjustContainerHeights);

// Inicjalizacja po załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', App.initialize);

// Obsługa przycisków pomocy i okienek modalnych
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicjalizacja systemu pomocy...");
    
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
        }
    }
    
    // Resetowanie stanu przycisku pomocy (do testów)
    localStorage.removeItem('helpButtonClicked');
    
    // Zmienna do śledzenia, czy przycisk pomocy został już kliknięty
    let helpButtonClicked = localStorage.getItem('helpButtonClicked') === 'true';
    
    // Funkcja tworząca i animująca przyciski pomocy
    function setupHelpButtonAnimation(originalButton, toolName) {
        if (!originalButton) return;
        
        // Ukryj oryginalny przycisk
        originalButton.style.visibility = 'hidden';
        
        // 1. Stwórz pierwszy przycisk (ten, który wjeżdża)
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
        slideInButton.style.opacity = '0';
        
        // Wymuszenie przepływu
        slideInButton.offsetHeight;
        
        // Animacja wjazdu
        slideInButton.classList.add('slide-in');
        
        // 2. Stwórz drugi przycisk (pulsujący)
        const pulseButton = document.createElement('button');
        pulseButton.className = 'help-button pulse-button';
        pulseButton.innerHTML = '?';
        pulseButton.id = `help-${toolName}-pulse`;
        
        // Dodaj przycisk do body, ale ustaw go jako całkowicie niewidoczny
        pulseButton.style.opacity = '0';
        pulseButton.style.visibility = 'hidden'; // Dodatkowe ukrycie
        document.body.appendChild(pulseButton);
        
        // Pozycjonuj przycisk dokładnie w miejscu oryginalnego
        pulseButton.style.top = rect.top + 'px';
        pulseButton.style.right = (window.innerWidth - rect.right) + 'px';
        
        // Po zakończeniu animacji wjazdu, pokaż pulsujący przycisk
        setTimeout(() => {
            // Przygotuj przycisk pulsujący do pokazania
            pulseButton.style.transition = 'opacity 0.3s ease-in';
            pulseButton.style.visibility = 'visible'; // Teraz można go pokazać
            
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
                        pulseButton.style.visibility = 'hidden'; // Ukryj całkowicie
                        
                        // Ustaw interwał ponownego pulsowania co minutę
                        const pulseInterval = setInterval(() => {
                            if (helpButtonClicked) {
                                clearInterval(pulseInterval);
                                return;
                            }
                            
                            // Przygotuj przycisk do pokazania
                            pulseButton.style.visibility = 'visible';
                            
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
                                        pulseButton.style.visibility = 'hidden'; // Ukryj całkowicie
                                    }, 300);
                                }, 1500);
                            }, 10);
                        }, 60000);
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
            
            // Usuń wszystkie dodatkowe przyciski
            document.querySelectorAll('.slide-in-button, .pulse-button').forEach(btn => {
                btn.style.opacity = '0';
                btn.style.visibility = 'hidden'; // Natychmiast ukryj
                setTimeout(() => {
                    if (btn.parentNode) {
                        btn.parentNode.removeChild(btn);
                    }
                }, 300);
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
}); 