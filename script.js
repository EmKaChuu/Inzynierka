// --- Global Namespace ---
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
        modal.classList.add('active');
    }
    
    // Funkcja zamykająca okienko modalne
    function closeHelpModal(modal) {
        modal.classList.remove('active');
    }
    
    // Funkcja dodająca animację wjazdu do przycisku pomocy
    function addSlideInEffect(button) {
        if (button) {
            button.classList.add('slide-in');
        }
    }
    
    // Funkcja dodająca pulsowanie do przycisku pomocy
    function addPulseEffect(button) {
        if (button) {
            button.classList.add('pulse');
        }
    }
    
    // Funkcja usuwająca pulsowanie z przycisku pomocy
    function removePulseEffect(button) {
        if (button) {
            button.classList.remove('pulse');
        }
    }
    
    // Zmienna do śledzenia, czy przycisk pomocy został już kliknięty
    let helpButtonClicked = localStorage.getItem('helpButtonClicked') === 'true';
    
    // Funkcja zarządzająca animacjami przycisku pomocy
    function manageHelpButtonAnimation(button) {
        if (!button || helpButtonClicked) return;
        
        // 1. Najpierw dodaj animację wjazdu od prawej strony
        addSlideInEffect(button);
        
        // 2. Po zakończeniu animacji wjazdu, dodaj pulsowanie
        setTimeout(() => {
            // Dodaj pulsowanie
            addPulseEffect(button);
            
            // 3. Zatrzymaj pulsowanie po 3 sekundach
            setTimeout(() => {
                removePulseEffect(button);
            }, 3000);
        }, 800); // Czas trwania animacji wjazdu
        
        // 4. Ustawienie interwału dla powtarzającego się pulsowania co minutę
        const pulseInterval = setInterval(() => {
            if (helpButtonClicked) {
                clearInterval(pulseInterval);
                return;
            }
            
            // Dodaj pulsowanie
            addPulseEffect(button);
            
            // Zatrzymaj pulsowanie po 3 sekundach
            setTimeout(() => {
                removePulseEffect(button);
            }, 3000);
        }, 60000); // Co minutę
    }
    
    // Obsługa kliknięcia przycisków pomocy
    if (helpAhpBtn) {
        helpAhpBtn.addEventListener('click', function() {
            openHelpModal(helpModalAhp);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            removePulseEffect(helpAhpBtn);
            
            // Wyczyść wszystkie interwały
            const highestId = window.setTimeout(() => {}, 0);
            for (let i = highestId; i >= 0; i--) {
                window.clearInterval(i);
            }
        });
        
        // Uruchom animacje dla aktywnego przycisku pomocy
        if (App.currentTool === 'ahp') {
            manageHelpButtonAnimation(helpAhpBtn);
        }
    }
    
    if (helpCuttingStockBtn) {
        helpCuttingStockBtn.addEventListener('click', function() {
            openHelpModal(helpModalCuttingStock);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            removePulseEffect(helpCuttingStockBtn);
            
            // Wyczyść wszystkie interwały
            const highestId = window.setTimeout(() => {}, 0);
            for (let i = highestId; i >= 0; i--) {
                window.clearInterval(i);
            }
        });
        
        // Uruchom animacje dla aktywnego przycisku pomocy
        if (App.currentTool === 'cutting-stock') {
            manageHelpButtonAnimation(helpCuttingStockBtn);
        }
    }
    
    if (helpProductionOptBtn) {
        helpProductionOptBtn.addEventListener('click', function() {
            openHelpModal(helpModalProductionOpt);
            helpButtonClicked = true;
            localStorage.setItem('helpButtonClicked', 'true');
            removePulseEffect(helpProductionOptBtn);
            
            // Wyczyść wszystkie interwały
            const highestId = window.setTimeout(() => {}, 0);
            for (let i = highestId; i >= 0; i--) {
                window.clearInterval(i);
            }
        });
        
        // Uruchom animacje dla aktywnego przycisku pomocy
        if (App.currentTool === 'production-opt') {
            manageHelpButtonAnimation(helpProductionOptBtn);
        }
    }
    
    // Obsługa przełączania między narzędziami - aktualizacja animacji przycisku pomocy
    const originalSwitchToTool = App.switchToTool;
    App.switchToTool = function(tool) {
        originalSwitchToTool(tool);
        
        // Jeśli przycisk pomocy nie został jeszcze kliknięty, pokaż animacje dla nowego narzędzia
        if (!helpButtonClicked) {
            let activeHelpButton;
            
            switch(tool) {
                case 'ahp':
                    activeHelpButton = helpAhpBtn;
                    break;
                case 'cutting-stock':
                    activeHelpButton = helpCuttingStockBtn;
                    break;
                case 'production-opt':
                    activeHelpButton = helpProductionOptBtn;
                    break;
            }
            
            if (activeHelpButton) {
                manageHelpButtonAnimation(activeHelpButton);
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