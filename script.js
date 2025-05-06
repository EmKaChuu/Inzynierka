// --- Global Namespace ---
// Wersja: 1.0.2 - Płynne przejścia między przyciskami pomocy
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
        } else {
            console.error("Próba otwarcia nieistniejącego okna pomocy");
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
    
    // Funkcja tworząca zduplikowany przycisk do animacji
    function createDuplicateButton(originalButton, toolName) {
        if (!originalButton) return;
        
        // Nie ukrywamy oryginalnego przycisku - będzie widoczny cały czas
        // originalButton.style.opacity = '0';
        
        // Stwórz duplikat przycisku do animacji wjazdu
        const slideInBtn = document.createElement('button');
        slideInBtn.className = 'help-button duplicate-help-button slide-in-btn';
        slideInBtn.innerHTML = '?';
        slideInBtn.id = `help-${toolName}-slide-in`;
        
        // Dodaj duplikat do body
        document.body.appendChild(slideInBtn);
        
        // Pozycjonuj duplikat dokładnie nad oryginalnym przyciskiem
        const rect = originalButton.getBoundingClientRect();
        slideInBtn.style.top = rect.top + 'px';
        slideInBtn.style.right = (window.innerWidth - rect.right) + 'px';
        
        // Dodaj animację wjazdu
        slideInBtn.style.transform = 'translateX(100px)';
        slideInBtn.style.opacity = '0';
        slideInBtn.offsetHeight; // Wymuszenie przepływu
        slideInBtn.classList.add('slide-in');
        
        // Stwórz drugi duplikat przycisku do pulsowania
        const pulseBtn = document.createElement('button');
        pulseBtn.className = 'help-button duplicate-help-button pulse-btn';
        pulseBtn.innerHTML = '?';
        pulseBtn.id = `help-${toolName}-pulse`;
        pulseBtn.style.opacity = '0'; // Początkowo niewidoczny
        
        // Dodaj drugi duplikat do body
        document.body.appendChild(pulseBtn);
        
        // Pozycjonuj drugi duplikat dokładnie nad oryginalnym przyciskiem
        pulseBtn.style.top = rect.top + 'px';
        pulseBtn.style.right = (window.innerWidth - rect.right) + 'px';
        
        // Po zakończeniu animacji wjazdu, usuń pierwszy duplikat i pokaż pulsujący
        setTimeout(() => {
            // Usuń przycisk wjeżdżający
            slideInBtn.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(slideInBtn);
            }, 300);
            
            // Pokaż przycisk pulsujący z płynnym przejściem
            pulseBtn.style.transition = 'opacity 0.3s ease-in';
            pulseBtn.style.opacity = '1';
            pulseBtn.classList.add('pulse');
            
            // Zatrzymaj pulsowanie po 3 sekundach
            setTimeout(() => {
                // Płynne ukrycie przycisku pulsującego
                pulseBtn.style.opacity = '0';
                setTimeout(() => {
                    pulseBtn.classList.remove('pulse');
                    document.body.removeChild(pulseBtn);
                    
                    // Ustaw interwał ponownego pulsowania co minutę
                    const pulseInterval = setInterval(() => {
                        if (helpButtonClicked) {
                            clearInterval(pulseInterval);
                            return;
                        }
                        
                        // Stwórz nowy przycisk pulsujący
                        const newPulseBtn = document.createElement('button');
                        newPulseBtn.className = 'help-button duplicate-help-button pulse-btn';
                        newPulseBtn.innerHTML = '?';
                        newPulseBtn.style.opacity = '0';
                        newPulseBtn.style.top = rect.top + 'px';
                        newPulseBtn.style.right = (window.innerWidth - rect.right) + 'px';
                        document.body.appendChild(newPulseBtn);
                        
                        // Płynne pojawienie się i pulsowanie
                        setTimeout(() => {
                            newPulseBtn.style.transition = 'opacity 0.3s ease-in';
                            newPulseBtn.style.opacity = '1';
                            newPulseBtn.classList.add('pulse');
                            
                            // Zatrzymaj pulsowanie po 3 sekundach
                            setTimeout(() => {
                                // Płynne ukrycie
                                newPulseBtn.style.opacity = '0';
                                setTimeout(() => {
                                    newPulseBtn.classList.remove('pulse');
                                    document.body.removeChild(newPulseBtn);
                                }, 300);
                            }, 3000);
                        }, 10);
                    }, 60000);
                }, 300);
            }, 3000);
        }, 800);
        
        return { slideInBtn, pulseBtn };
    }
    
    // Obsługa kliknięcia przycisków pomocy
    if (helpAhpBtn) {
        helpAhpBtn.addEventListener('click', function() {
            openHelpModal(helpModalAhp);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            
            // Usuń wszystkie duplikaty przycisków
            document.querySelectorAll('.duplicate-help-button').forEach(btn => {
                btn.style.opacity = '0';
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
        });
        
        // Uruchom animacje dla aktywnego przycisku pomocy
        if (App.currentTool === 'ahp' || App.currentTool === null) {
            setTimeout(() => {
                createDuplicateButton(helpAhpBtn, 'ahp');
            }, 500);
        }
    }
    
    if (helpCuttingStockBtn) {
        helpCuttingStockBtn.addEventListener('click', function() {
            openHelpModal(helpModalCuttingStock);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            
            // Usuń wszystkie duplikaty przycisków
            document.querySelectorAll('.duplicate-help-button').forEach(btn => {
                btn.style.opacity = '0';
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
        });
    }
    
    if (helpProductionOptBtn) {
        helpProductionOptBtn.addEventListener('click', function() {
            openHelpModal(helpModalProductionOpt);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            
            // Usuń wszystkie duplikaty przycisków
            document.querySelectorAll('.duplicate-help-button').forEach(btn => {
                btn.style.opacity = '0';
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
        });
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
            
            // Usuń wszystkie istniejące duplikaty przycisków
            document.querySelectorAll('.duplicate-help-button').forEach(btn => {
                btn.style.opacity = '0';
                setTimeout(() => {
                    if (btn.parentNode) {
                        btn.parentNode.removeChild(btn);
                    }
                }, 300);
            });
            
            if (activeHelpButton) {
                setTimeout(() => {
                    createDuplicateButton(activeHelpButton, toolName);
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