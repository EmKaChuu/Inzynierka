# Optymalizator Zasobów i Produkcji

Aplikacja webowa do rozwiązywania problemów decyzyjnych i optymalizacyjnych w zarządzaniu produkcją.

## Funkcjonalności

Aplikacja zawiera trzy główne moduły:

1. **Kalkulator AHP** - narzędzie do podejmowania decyzji wielokryterialnych metodą Analitycznego Procesu Hierarchicznego (AHP)
   - Definiowanie kryteriów i opcji decyzyjnych
   - Porównywanie parami kryteriów i opcji
   - Obliczanie wag i współczynników spójności (CR)
   - Wizualizacja wyników za pomocą wykresów

2. **Problem Rozkroju** - narzędzie do optymalizacji cięcia materiałów
   - Definiowanie długości dostępnych materiałów
   - Określanie zamówień (długości i ilości)
   - Generowanie optymalnych wzorów cięcia
   - Minimalizacja odpadów i ilości użytych materiałów

3. **Optymalizacja Produkcji** - narzędzie wykorzystujące programowanie liniowe do:
   - Maksymalizacji zysków lub minimalizacji kosztów
   - Uwzględniania ograniczeń produkcyjnych
   - Znajdowania optymalnego miksu produktów
   - Analizy wrażliwości i wykorzystania zasobów

## Technologie

- JavaScript (frontend)
- HTML i CSS
- Biblioteki zewnętrzne:
  - math.js - operacje matematyczne
  - plotly.js - wizualizacja danych
  - javascript-lp-solver - rozwiązywanie problemów programowania liniowego

## Struktura projektu

```
├── index.html       - główny plik HTML
├── styles.css       - arkusz stylów
├── script.js        - główny skrypt zarządzający aplikacją
├── ahp.js           - moduł kalkulatora AHP
├── cuttingStock.js  - moduł problemu rozkroju
├── productionOpt.js - moduł optymalizacji produkcji
└── solver.js        - biblioteka do rozwiązywania problemów optymalizacyjnych
```

## Instalacja i uruchamianie

1. Sklonuj repozytorium
2. Otwórz plik `index.html` w przeglądarce

Aplikacja nie wymaga serwera i działa całkowicie po stronie klienta.

## Autor

Michał Kopeć, 2024/2025
