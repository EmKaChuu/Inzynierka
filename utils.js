// Plik utils.js - funkcje pomocnicze

const Utils = {
    /**
     * Wyświetla krótki komunikat (toast) na ekranie.
     * @param {string} message - Wiadomość do wyświetlenia.
     * @param {boolean} isError - Czy komunikat jest błędem (wpływa na styl).
     * @param {number} duration - Czas wyświetlania w milisekundach.
     */
    showToast: (message, isError = false, duration = 3000) => {
        // Sprawdzenie, czy element toast-container już istnieje
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            // Style dla kontenera toastów
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999'; // Aby był na wierzchu
            toastContainer.style.display = 'flex';
            toastContainer.style.flexDirection = 'column';
            toastContainer.style.gap = '10px';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;

        // Style dla pojedynczego toasta
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.color = 'white';
        toast.style.backgroundColor = isError ? 'rgba(217, 83, 79, 0.9)' : 'rgba(92, 184, 92, 0.9)'; // Czerwony dla błędu, zielony dla sukcesu
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        toast.style.transform = 'translateY(20px)';
        
        // Dodaj do kontenera
        toastContainer.appendChild(toast);

        // Animacja pojawienia się
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 50); // Krótkie opóźnienie dla poprawnego działania transition

        // Automatyczne usunięcie toasta
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
                // Jeśli kontener jest pusty, można go usunąć (opcjonalnie)
                // if (toastContainer.children.length === 0) {
                //     document.body.removeChild(toastContainer);
                // }
            }, 300); // Czas na animację zniknięcia
        }, duration);
    },

    // Można tutaj dodać inne funkcje pomocnicze, np. hideElement, displayResults, itp.
    // które były wcześniej częścią AHP lub innych modułów, a mają charakter ogólny.

    hideElement: (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        } else {
            Logger.log(`[Utils] Element o ID '${elementId}' nie został znaleziony do ukrycia.`);
        }
    },

    showElement: (elementId, displayStyle = 'block') => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = displayStyle;
        } else {
            Logger.log(`[Utils] Element o ID '${elementId}' nie został znaleziony do pokazania.`);
        }
    },

    /**
     * Wyświetla wyniki lub komunikaty w określonym kontenerze.
     * @param {string} containerId - ID elementu kontenera.
     * @param {string} message - Wiadomość HTML lub tekst do wyświetlenia.
     * @param {boolean} isError - Czy wiadomość jest błędem (zmienia styl).
     */
    displayResults: (containerId, message, isError = false) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = message;
            container.className = isError ? 'results-error' : 'results-success'; // Można dodać odpowiednie klasy CSS
            if (isError) {
                container.style.color = 'red'; // Prosty styl błędu
            } else {
                container.style.color = 'green'; // Prosty styl sukcesu
            }
            Utils.showElement(containerId);
        } else {
            Logger.log(`[Utils] Kontener o ID '${containerId}' nie został znaleziony do wyświetlenia wyników.`);
        }
    },

    clearElement: (id) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = '';
    },

    showActiveToolContent: (tool) => {
        // Ukryj wszystkie narzędzia
        document.querySelectorAll('.tool-content').forEach(el => {
            el.classList.remove('active');
        });
        
        // Pokaż wybrane narzędzie
        const toolElement = document.getElementById(`tool-${tool}`);
        if (toolElement) {
            toolElement.classList.add('active');
        } else {
            Logger.log(`[Utils] Nie znaleziono elementu narzędzia: tool-${tool}`);
        }
        
        // Aktualizuj aktywny przycisk w nawigacji
        document.querySelectorAll('nav button').forEach(btn => {
            btn.classList.remove('active');
        });
        const navButton = document.getElementById(`nav-${tool}`);
        if (navButton) {
            navButton.classList.add('active');
        } else {
            Logger.log(`[Utils] Nie znaleziono przycisku nawigacji: nav-${tool}`);
        }
        
        // Dostosuj zawartość nawy bocznej do aktualnego narzędzia
        const sidebar = document.getElementById('app-sidebar');
        const sidebarContent = document.getElementById('ahp-sidebar-content'); // To jest specyficzne dla AHP
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (sidebar && sidebarToggle) {
            if (tool === 'ahp') {
                sidebar.style.display = 'block';
                if (sidebarContent) sidebarContent.style.display = 'block';
                sidebarToggle.style.display = 'flex';
                
                const arrowIcon = sidebarToggle.querySelector('.arrow-icon');
                if (arrowIcon && !sidebar.classList.contains('sidebar-minimized')) {
                    arrowIcon.innerHTML = '◀';
                }
            } else {
                sidebar.style.display = 'none';
                sidebarToggle.style.display = 'none';
            }
        } else {
            if (!sidebar) Logger.log('[Utils] Nie znaleziono elementu paska bocznego: app-sidebar');
            if (!sidebarToggle) Logger.log('[Utils] Nie znaleziono przełącznika paska bocznego: sidebar-toggle');
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
        if (number === null || typeof number === 'undefined') return "-";
        return Math.abs(number) < 0.001 && number !== 0 ? 
            number.toExponential(maxDecimals) : 
            parseFloat(number.toFixed(maxDecimals)).toString(); // Usunięcie .replace(/\.?0+$/, "") dla spójności
    },
    
    formatPercent: (number, maxDecimals = 1) => {
        if (isNaN(number)) return "-";
        if (number === null || typeof number === 'undefined') return "-";
        return parseFloat((number * 100).toFixed(maxDecimals)).toString() + "%"; // Usunięcie .replace(/\.?0+$/, "")
    },
    
    adjustContainerHeights: () => {
        setTimeout(() => {
            Logger.log("[Utils] Dostosowywanie wysokości kontenerów..."); // Zmieniono console.log na Logger.log
            window.dispatchEvent(new Event('resize'));
        }, 100);
    },

    /**
     * Sanityzuje tekst, aby był bezpieczny jako nazwa zmiennej/ograniczenia w solverze.
     * @param {string} text - Tekst do sanityzacji.
     * @returns {string} - Zsanitaryzowany tekst.
     */
    sanitizeForSolver: (text) => {
        if (typeof text !== 'string' || !text.trim()) {
            // Zwróć unikalny placeholder, jeśli tekst jest pusty lub nie jest stringiem,
            // aby uniknąć pustych kluczy lub błędów.
            // Użycie kombinacji czasu i losowej liczby dla większej unikalności w krótkim czasie.
            const timestamp = Date.now().toString(36);
            const randomPart = Math.random().toString(36).substring(2, 7);
            Logger.log('WARN', `[Utils.sanitizeForSolver] Input text is invalid or empty. Original: '${text}'. Returning placeholder.`);
            return `var_${timestamp}_${randomPart}`;
        }
        // Usuń początkowe/końcowe białe znaki
        let sanitized = text.trim();
        // Zastąp wszystko, co nie jest literą alfabetu łacińskiego (bez rozróżniania wielkości), cyfrą ani podkreśleniem, pojedynczym podkreśleniem.
        // Usunięto specyficzne dla języka znaki, aby zapewnić maksymalną kompatybilność.
        sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '_');
        // Jeśli nazwa zaczyna się od cyfry, dodaj prefix '_'
        if (/^[0-9]/.test(sanitized)) {
            sanitized = '_' + sanitized;
        }
        // Zastąp wielokrotne podkreślenia jednym podkreśleniem
        sanitized = sanitized.replace(/__+/g, '_');
        // Usuń podkreślenia z początku lub końca stringu (jeśli jakieś powstały po wcześniejszych operacjach)
        sanitized = sanitized.replace(/^_+|_+$/g, '');
        
        // Jeśli po sanitacji string jest pusty (np. oryginalny string to były same znaki specjalne jak "!@#$%"),
        // zwróć generyczny placeholder, aby uniknąć pustych nazw kluczy.
        if (!sanitized) {
            const timestampFallback = Date.now().toString(36);
            const randomPartFallback = Math.random().toString(36).substring(2, 7);
            Logger.log('WARN', `[Utils.sanitizeForSolver] Sanitized text became empty. Original: '${text}'. Returning placeholder.`);
            return `sanitized_empty_${timestampFallback}_${randomPartFallback}`;
        }
        return sanitized;
    }
}; 