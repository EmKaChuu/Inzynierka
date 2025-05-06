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
    console.log("Inicjalizacja systemu pomocy...");
    
    // Przyciski pomocy
    const helpAhpBtn = document.getElementById('help-ahp');
    const helpCuttingStockBtn = document.getElementById('help-cutting-stock');
    const helpProductionOptBtn = document.getElementById('help-production-opt');
    
    console.log("Przyciski pomocy:", helpAhpBtn, helpCuttingStockBtn, helpProductionOptBtn);
    
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
    
    // Funkcja dodająca animację wjazdu do przycisku pomocy
    function addSlideInEffect(button) {
        if (button) {
            console.log("Dodaję efekt wjazdu do przycisku:", button);
            button.classList.add('slide-in');
        }
    }
    
    // Funkcja dodająca pulsowanie do przycisku pomocy
    function addPulseEffect(button) {
        if (button) {
            console.log("Dodaję efekt pulsowania do przycisku:", button);
            button.classList.add('pulse');
        }
    }
    
    // Funkcja usuwająca pulsowanie z przycisku pomocy
    function removePulseEffect(button) {
        if (button) {
            console.log("Usuwam efekt pulsowania z przycisku:", button);
            button.classList.remove('pulse');
        }
    }
    
    // Resetowanie stanu przycisku pomocy (do testów)
    localStorage.removeItem('helpButtonClicked');
    
    // Zmienna do śledzenia, czy przycisk pomocy został już kliknięty
    let helpButtonClicked = localStorage.getItem('helpButtonClicked') === 'true';
    console.log("Stan przycisku pomocy (kliknięty):", helpButtonClicked);
    
    // Funkcja zarządzająca animacjami przycisku pomocy
    function manageHelpButtonAnimation(button) {
        if (!button) {
            console.error("Brak przycisku do animacji");
            return;
        }
        
        if (helpButtonClicked) {
            console.log("Pomijam animacje - przycisk już kliknięty");
            return;
        }
        
        console.log("Rozpoczynam sekwencję animacji dla przycisku:", button);
        
        // 1. Najpierw dodaj animację wjazdu od prawej strony
        button.style.transform = "translateX(100px)";
        button.style.opacity = "0";
        
        // Wymuszenie przepływu i ponownego renderowania
        button.offsetHeight;
        
        // Dodaj klasę animacji
        button.classList.add('slide-in');
        
        console.log("Dodano animację wjazdu, czekam 800ms...");
        
        // 2. Po zakończeniu animacji wjazdu, dodaj pulsowanie
        setTimeout(() => {
            console.log("Czas na pulsowanie");
            
            // Dodaj pulsowanie
            addPulseEffect(button);
            
            // 3. Zatrzymaj pulsowanie po 3 sekundach
            setTimeout(() => {
                console.log("Koniec pierwszego pulsowania");
                removePulseEffect(button);
            }, 3000);
        }, 800); // Czas trwania animacji wjazdu
        
        // 4. Ustawienie interwału dla powtarzającego się pulsowania co minutę
        const pulseInterval = setInterval(() => {
            if (helpButtonClicked) {
                console.log("Czyszczę interwał - przycisk został kliknięty");
                clearInterval(pulseInterval);
                return;
            }
            
            console.log("Rozpoczynam cykliczne pulsowanie");
            // Dodaj pulsowanie
            addPulseEffect(button);
            
            // Zatrzymaj pulsowanie po 3 sekundach
            setTimeout(() => {
                console.log("Koniec cyklicznego pulsowania");
                removePulseEffect(button);
            }, 3000);
        }, 60000); // Co minutę
    }
    
    // Obsługa kliknięcia przycisków pomocy
    if (helpAhpBtn) {
        helpAhpBtn.addEventListener('click', function() {
            console.log("Kliknięto przycisk pomocy AHP");
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
        if (App.currentTool === 'ahp' || App.currentTool === null) {
            console.log("Uruchamiam animację dla przycisku AHP");
            // Daj chwilę na załadowanie DOM
            setTimeout(() => {
                manageHelpButtonAnimation(helpAhpBtn);
            }, 100);
        }
    } else {
        console.error("Nie znaleziono przycisku pomocy AHP");
    }
    
    if (helpCuttingStockBtn) {
        helpCuttingStockBtn.addEventListener('click', function() {
            console.log("Kliknięto przycisk pomocy Cutting Stock");
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
    }
    
    if (helpProductionOptBtn) {
        helpProductionOptBtn.addEventListener('click', function() {
            console.log("Kliknięto przycisk pomocy Production Opt");
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
    }
    
    // Obsługa przełączania między narzędziami - aktualizacja animacji przycisku pomocy
    const originalSwitchToTool = App.switchToTool;
    App.switchToTool = function(tool) {
        console.log("Przełączanie narzędzia na:", tool);
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
                console.log("Uruchamiam animację dla przycisku:", tool);
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