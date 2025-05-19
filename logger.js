// logger.js - Moduł do obsługi logowania aplikacji

const Logger = {
    collectedLogs: [],
    logToConsole: true, // Czy logi mają być też wysyłane do konsoli przeglądarki

    init: () => {
        Logger.collectedLogs = [];
        console.log("[Logger] Initialized and logs cleared."); // Ten log jest tylko do konsoli, nie do collectedLogs
    },

    log: (type, ...args) => {
        const timestamp = new Date().toISOString();
        let messageParts = [];
        for (const arg of args) {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    messageParts.push(JSON.stringify(arg, null, 2)); // Pretty print obiekty
                } catch (e) {
                    // Spróbuj obsłużyć elementy DOM bardziej czytelnie
                    if (arg instanceof HTMLElement) {
                        let elementDescription = `<${arg.tagName.toLowerCase()}`;
                        if (arg.id) elementDescription += ` id="${arg.id}"`;
                        if (arg.className) elementDescription += ` class="${arg.className}"`;
                        elementDescription += `>`;
                        messageParts.push(elementDescription);
                    } else {
                        messageParts.push(arg.toString()); // Fallback
                    }
                }
            } else if (arg === undefined) {
                messageParts.push('undefined');
            } else if (arg === null) {
                messageParts.push('null');
            } else {
                messageParts.push(arg.toString());
            }
        }
        const message = messageParts.join(' ');
        const logEntry = `${timestamp} [${type.toUpperCase()}] ${message}`;
        
        Logger.collectedLogs.push(logEntry);

        if (Logger.logToConsole) {
            const consoleArgs = args.length > 1 ? args : args[0]; // Dla console.error/warn lepiej przekazać oryginalne argumenty, jeśli jest ich więcej
            switch (type.toUpperCase()) {
                case 'INFO':
                case 'DEBUG':
                case 'LOG':
                    console.log(logEntry); // Zawsze loguj pełny entry dla spójności, ale oryginalne dla formatowania konsoli
                    // console.log(...args);
                    break;
                case 'WARN':
                    console.warn(logEntry);
                    // console.warn(...args);
                    break;
                case 'ERROR':
                    console.error(logEntry);
                    // console.error(...args);
                    break;
                default:
                    console.log(logEntry);
                    // console.log(...args);
            }
        }
    },

    getLogsAsString: () => {
        return Logger.collectedLogs.join('\n');
    },

    downloadLogs: (filenamePrefix = 'session_logs') => {
        const logString = Logger.getLogsAsString();
        if (!logString) {
            alert("Brak logów do pobrania.");
            Logger.log('WARN', 'Attempted to download empty logs.');
            return;
        }

        const blob = new Blob([logString], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        a.href = url;
        a.download = `${filenamePrefix}_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Logger.log('INFO', `Logs downloaded as ${a.download}`);
    },

    clearLogs: () => {
        Logger.collectedLogs = [];
        // Logger.log('INFO', 'Collected logs have been cleared.'); // Nie loguj tej akcji do właśnie wyczyszczonych logów
        console.log("[Logger] Collected logs have been cleared upon user request."); // Log tylko do konsoli
        alert("Zebrane logi zostały wyczyszczone.");
    }
};

// Inicjalizacja Loggera od razu po załadowaniu skryptu
// Logger.init(); // Zdecydowałem, że Logger.init() będzie wywoływane z App.init() dla lepszej kontroli sekwencji startowej 