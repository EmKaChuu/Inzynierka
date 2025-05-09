# Projekt Dyplomowy - Aplikacja do Optymalizacji

## Opis aplikacji

Projekt jest aplikacją webową zawierającą trzy moduły optymalizacyjne:

1. **AHP (Analiza Hierarchii Procesów)** - moduł do wspomagania decyzji wielokryterialnych, pozwalający na porównanie różnych opcji według zdefiniowanych kryteriów.
2. **Cutting Stock (Problem Rozkroju)** - moduł do optymalizacji cięcia materiałów w celu minimalizacji odpadów.
3. **Production Optimization (Optymalizacja Produkcji)** - moduł do optymalizacji alokacji zasobów w procesie produkcyjnym.

Aplikacja jest wykonana w czystym JavaScript (bez zewnętrznych frameworków), HTML i CSS, co sprawia, że może być uruchomiona bezpośrednio w przeglądarce bez konieczności instalowania dodatkowych narzędzi.

## Wprowadzone zmiany

### 1. Naprawa błędów
- Naprawiono błąd strzałki minimalizacji nawy bocznej, która nie działała na urządzeniach mobilnych
- Zastąpiono domyślne wartości w polach formularzy placeholderami
- Rozwiązano problem z resetowaniem danych podczas przełączania między modułami
- Naprawiono problem z komunikatem "Trwa obliczanie optymalnego rozwiązania..." w module Cutting Stock, który nie znikał po zakończeniu obliczeń

### 2. System udostępniania danych
- Dodano moduł DataShare do generowania i importu kodów z danymi
- Zaimplementowano możliwość udostępniania danych między użytkownikami poprzez:
  - Kopiowanie kodu (w formie base64)
  - Kopiowanie linku z danymi (w formie fragmentu URL)
  - Kopiowanie linku z danymi i automatycznym uruchomieniem obliczeń (tylko dla AHP)
- Dodano możliwość automatycznego importu danych z URL przy otwieraniu strony

### 3. Ulepszenia interfejsu
- Zaprojektowano nowy, bardziej kompaktowy interfejs dla funkcji udostępniania
- Zoptymalizowano format przechowywania danych w kodzie udostępniania, aby zmniejszyć jego długość
- Dodano przycisk "Kopiuj link z wynikami" w module AHP, generujący link, który po otwarciu automatycznie przeprowadza obliczenia

## Ważne uwagi techniczne

1. **Struktura projektu:**
   - Każdy moduł (AHP, Cutting Stock, Production Optimization) ma swój własny plik JavaScript
   - Moduł DataShare.js obsługuje funkcjonalność udostępniania danych
   - Styles CSS są podzielone na główny plik stylów oraz dodatkowy main.css dla nowych funkcji

2. **Udostępnianie danych:**
   - Dane są konwertowane do JSON, kompresowane i kodowane w base64
   - W URL są umieszczane po znaku # (fragment URL), co sprawia, że są obsługiwane po stronie klienta bez potrzeby serwera
   - Prefiks "calc_" w URL oznacza, że po zaimportowaniu danych należy automatycznie uruchomić obliczenia

3. **Kompatybilność:**
   - Aplikacja jest zoptymalizowana pod kątem działania na różnych przeglądarkach
   - Interfejs jest responsywny i dostosowuje się do urządzeń mobilnych
   - Korzysta z standardowych API JavaScript (nie wymaga dodatkowych bibliotek)

4. **Rozszerzalność:**
   - Moduł DataShare został zaprojektowany tak, aby wspierać potencjalne przyszłe formaty danych
   - Funkcje generujące i importujące kody są modułowe i łatwe do rozszerzenia

## Pliki wymagające uwagi

- **dataShare.js** - Najnowszy plik zawierający logikę udostępniania danych
- **ahp.js** - Moduł AHP z mechanizmem obliczeniowym (metodą AHP)
- **cuttingStock.js** - Moduł Cutting Stock z algorytmami optymalizacji rozkroju
- **productionOpt.js** - Moduł optymalizacji produkcji
- **css/main.css** - Styles CSS dla nowych funkcjonalności

## Uwagi do dalszego rozwoju

1. Dalszy rozwój systemu udostępniania danych:
   - Możliwość zapisywania wyników w bazie danych
   - Dodanie mechanizmu skracania linków dla łatwiejszego udostępniania

2. Ewentualne dodanie nowych modułów optymalizacyjnych:
   - VRP (Vehicle Routing Problem)
   - Knapsack Problem (Problem plecakowy)
   - Szeregowanie zadań

3. Ulepszenie wizualizacji wyników:
   - Bardziej interaktywne wykresy
   - Eksport do różnych formatów (PDF, Excel)

4. Testowanie i optymalizacja wydajności:
   - Benchmarking dla większych zbiorów danych
   - Optymalizacja algorytmów obliczeniowych 