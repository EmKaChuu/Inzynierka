// Moduł AHP - Eksport Wyników do Plików
// Ten plik będzie zawierał funkcje odpowiedzialne za
// generowanie i pobieranie plików z wynikami analizy AHP.

// Globalny obiekt AHP jest zdefiniowany w ahp.js i tutaj jest rozszerzany.

AHP.downloadResultsTXT = function() {
    try {
        if (!this.globalOptionWeights || !this.criteriaPriorities) {
            Logger.log("[AHP ExportFile] Brak danych do wygenerowania pliku TXT.");
            Utils.showToast("Brak wyników do wyeksportowania.", true);
            return;
        }
        let content = `WYNIKI ANALIZY AHP\n`;
        content += `=====================\n\n`;
        
        let bestOptionIndex = 0;
        if (this.numOptions > 0 && this.globalOptionWeights.length === this.numOptions) {
            for (let i = 1; i < this.numOptions; i++) {
                if (this.globalOptionWeights[i] > this.globalOptionWeights[bestOptionIndex]) {
                    bestOptionIndex = i;
                }
            }
            content += `NAJLEPSZA OPCJA: ${this.optionNames[bestOptionIndex]} (${(this.globalOptionWeights[bestOptionIndex] * 100).toFixed(2)}%)\n\n`;
        } else {
            content += `NAJLEPSZA OPCJA: Brak (niewystarczające dane)\n\n`;
        }
        
        content += `WAGI KRYTERIÓW:\n`;
        content += `---------------\n`;
        if (this.numCriteria > 0 && this.criteriaPriorities.length === this.numCriteria) {
            for (let i = 0; i < this.numCriteria; i++) {
                content += `${this.criteriaNames[i] || `Kryterium ${i+1}`}: ${(this.criteriaPriorities[i] * 100).toFixed(2)}%\n`;
            }
        }
        content += `\n`;
        
        content += `RANKING OPCJI:\n`;
        content += `-------------\n`;
        if (this.numOptions > 0 && this.globalOptionWeights.length === this.numOptions) {
            const sortedIndices = Array.from({length: this.numOptions}, (_, i) => i)
                .sort((a, b) => this.globalOptionWeights[b] - this.globalOptionWeights[a]);
            for (let i = 0; i < sortedIndices.length; i++) {
                const idx = sortedIndices[i];
                content += `${i+1}. ${this.optionNames[idx] || `Opcja ${idx+1}`}: ${(this.globalOptionWeights[idx] * 100).toFixed(2)}%\n`;
            }
        }
        content += `\n`;
        
        content += `ROZBICIE WYNIKÓW WEDŁUG KRYTERIÓW:\n`;
        content += `--------------------------------\n`;
        content += `Opcja\t`;
        if (this.numCriteria > 0) {
            for (let c = 0; c < this.numCriteria; c++) {
                content += `${this.criteriaNames[c] || `Kryterium ${c+1}`}\t`;
            }
        }
        content += `Wynik całkowity\n`;
        
        if (this.numOptions > 0 && this.numCriteria > 0 && this.localOptionWeights && this.globalOptionWeights) {
            for (let o = 0; o < this.numOptions; o++) {
                content += `${this.optionNames[o] || `Opcja ${o+1}`}\t`;
                for (let c = 0; c < this.numCriteria; c++) {
                    if(this.localOptionWeights[c] && this.criteriaPriorities[c] !== undefined){
                        const localScore = this.localOptionWeights[c][o] || 0;
                        const weightedScore = localScore * this.criteriaPriorities[c];
                        content += `${(weightedScore * 100).toFixed(2)}%\t`;
                    } else {
                        content += `N/A\t`;
                    }
                }
                content += `${(this.globalOptionWeights[o] * 100).toFixed(2)}%\n`;
            }
        }
        content += `\n`;
        content += `Wygenerowano: ${new Date().toLocaleString()}\n`;
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wyniki_ahp_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    } catch (error) {
        Logger.log("ERROR: Błąd podczas eksportu do TXT:", error, error.stack);
        Utils.showToast("Wystąpił błąd podczas eksportu wyników do pliku TXT.", true);
    }
};

AHP.downloadResultsCSV = function() {
    try {
        if (!this.globalOptionWeights || !this.criteriaPriorities) {
            Logger.log("[AHP ExportFile] Brak danych do wygenerowania pliku CSV.");
            Utils.showToast("Brak wyników do wyeksportowania.", true);
            return;
        }
        let csvContent = "\uFEFF"; // BOM dla UTF-8, aby Excel poprawnie odczytał polskie znaki

        csvContent += "Wyniki analizy AHP\r\n\r\n";
        csvContent += "Ranking opcji (wynik końcowy)\r\n";
        csvContent += "Ranking,Opcja,Wynik,Wynik (%)\r\n";
        
        if (this.numOptions > 0 && this.globalOptionWeights.length === this.numOptions) {
            const sortedIndices = Array.from({length: this.numOptions}, (_, i) => i)
                .sort((a, b) => this.globalOptionWeights[b] - this.globalOptionWeights[a]);
            for (let i = 0; i < sortedIndices.length; i++) {
                const optionIndex = sortedIndices[i];
                const option = this.optionNames[optionIndex] || `Opcja ${optionIndex+1}`;
                const score = this.globalOptionWeights[optionIndex];
                csvContent += `${i+1},"${option.replace(/"/g, '""')}",${score.toFixed(6)},${(score * 100).toFixed(2)}%\r\n`;
            }
        }
        csvContent += "\r\n";
        
        csvContent += "Wagi kryteriów\r\n";
        csvContent += "Kryterium,Waga,Waga (%)\r\n";
        if (this.numCriteria > 0 && this.criteriaPriorities.length === this.numCriteria) {
            for (let i = 0; i < this.numCriteria; i++) {
                const criteria = this.criteriaNames[i] || `Kryterium ${i+1}`;
                const weight = this.criteriaPriorities[i];
                csvContent += `"${criteria.replace(/"/g, '""')}",${weight.toFixed(6)},${(weight * 100).toFixed(2)}%\r\n`;
            }
        }
        csvContent += "\r\n";
        
        csvContent += "Rozbicie wyników według kryteriów\r\n";
        csvContent += "Opcja";
        if (this.numCriteria > 0) {
            for (let c = 0; c < this.numCriteria; c++) {
                csvContent += `,"${(this.criteriaNames[c] || `Kryterium ${c+1}`).replace(/"/g, '""')}"`;
            }
        }
        csvContent += ",Wynik całkowity\r\n";
        
        if (this.numOptions > 0 && this.numCriteria > 0 && this.localOptionWeights && this.globalOptionWeights) {
            for (let o = 0; o < this.numOptions; o++) {
                csvContent += `"${(this.optionNames[o] || `Opcja ${o+1}`).replace(/"/g, '""')}"`;
                for (let c = 0; c < this.numCriteria; c++) {
                     if(this.localOptionWeights[c] && this.criteriaPriorities[c] !== undefined){
                        const localScore = this.localOptionWeights[c][o] || 0;
                        const weightedScore = localScore * this.criteriaPriorities[c];
                        csvContent += `,${(weightedScore * 100).toFixed(2)}%`;
                    } else {
                        csvContent += `,N/A`;
                    }
                }
                csvContent += `,${(this.globalOptionWeights[o] * 100).toFixed(2)}%\r\n`;
            }
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `wyniki_ahp_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },0);
    } catch (error) {
        Logger.log("ERROR: Błąd podczas eksportu do CSV:", error, error.stack);
        Utils.showToast("Wystąpił błąd podczas eksportu wyników do pliku CSV.", true);
    }
};

AHP.downloadResultsJSON = function() {
    try {
        if (!this.globalOptionWeights || !this.criteriaPriorities) {
            Logger.log("[AHP ExportFile] Brak danych do wygenerowania pliku JSON.");
            Utils.showToast("Brak wyników do wyeksportowania.", true);
            return;
        }
        const results = {
            metadata: {
                date: new Date().toISOString(),
                numCriteria: this.numCriteria,
                numOptions: this.numOptions
            },
            criteriaNames: this.criteriaNames || [],
            optionNames: this.optionNames || [],
            criteriaComparisonMatrix: this.criteriaComparisonMatrix || [],
            optionComparisonMatrices: this.optionComparisonMatrices || [],
            criteriaPriorities: this.criteriaPriorities || [],
            localOptionWeights: this.localOptionWeights || [],
            globalOptionWeights: this.globalOptionWeights || [],
            results: {
                ranking: (this.numOptions > 0 && this.globalOptionWeights.length === this.numOptions) ? 
                    Array.from({length: this.numOptions}, (_, i) => i)
                        .sort((a, b) => this.globalOptionWeights[b] - this.globalOptionWeights[a])
                        .map((idx, rank) => ({
                            rank: rank + 1,
                            optionName: this.optionNames[idx] || `Opcja ${idx+1}`,
                            optionIndex: idx,
                            score: this.globalOptionWeights[idx],
                            scorePercent: (this.globalOptionWeights[idx] * 100).toFixed(2)
                        })) 
                    : []
            }
        };
        
        const blob = new Blob([JSON.stringify(results, null, 2)], {type: 'application/json;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wyniki_ahp_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    } catch (error) {
        Logger.log("ERROR: Błąd podczas eksportu do JSON:", error, error.stack);
        Utils.showToast("Wystąpił błąd podczas eksportu wyników do pliku JSON.", true);
    }
};
