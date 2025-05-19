# Projekt Dyplomowy - Aplikacja do Optymalizacji

## Opis aplikacji

Projekt jest aplikacją webową zawierającą trzy moduły optymalizacyjne:

1.  **AHP (Analiza Hierarchii Procesów)** - moduł do wspomagania decyzji wielokryterialnych, pozwalający na porównanie różnych opcji według zdefiniowanych kryteriów.
2.  **Cutting Stock (Problem Rozkroju)** - moduł do optymalizacji cięcia materiałów w celu minimalizacji odpadów.
3.  **Production Optimization (Optymalizacja Produkcji)** - moduł do optymalizacji alokacji zasobów w procesie produkcyjnym.

Aplikacja jest wykonana w czystym JavaScript (bez zewnętrznych frameworków), HTML i CSS, co sprawia, że może być uruchomiona bezpośrednio w przeglądarce bez konieczności instalowania dodatkowych narzędzi.

## BARDZO WAŻNE UWAGI OD TWÓRCY PROJEKTU

### Zarządzanie repozytorium Git

1.  **NIE DODAWAJ WSZYSTKIEGO DO GITA!**
    *   Zawsze sprawdzaj, co dokładnie dodajesz do repozytorium
    *   Nie używaj `git add .` bez dokładnego przemyślenia - to podstawowy błąd!
    *   Pliki pomocnicze, tymczasowe, kopie zapasowe itp. NIE POWINNY trafić do repozytorium

2.  **Zawsze używaj prawidłowo pliku .gitignore**
    *   Umieszczaj w nim wszystkie nieistotne z perspektywy działania aplikacji pliki
    *   Ignoruj pliki systemowe (.DS_Store, Thumbs.db)
    *   Ignoruj pliki tymczasowe (*.bak, *.tmp)
    *   Ignoruj pliki IDE (.idea/, .vscode/)

3.  **Dokumentacja nie zawsze powinna być w repozytorium**
    *   Notatki robocze i pliki pomocnicze trzymaj lokalnie
    *   Do repozytorium dodawaj tylko dokumentację, która jest niezbędna dla zrozumienia kodu

4.  **Sprawdzaj rozmiar commita przed wysłaniem**
    *   Duże commity (wiele MB) często zawierają niepotrzebne pliki
    *   Jeśli commit jest podejrzanie duży, sprawdź co dokładnie wysyłasz

### Inne istotne uwagi

1.  **Nie polegaj ślepo na narzędziach AI**
    *   AI może bezmyślnie wrzucać wszystko do repozytorium
    *   Zawsze weryfikuj commity i propozycje AI
    *   GPT to pomocnik, a nie bezmyślne narzędzie do kopiowania - używaj rozumu!

2.  **Dbaj o czystość kodu i repozytorium**
    *   Zachowuj tylko niezbędne pliki w repozytorium
    *   Utrzymuj czytelną strukturę projektu
    *   Unikaj commitowania plików binarnych, chyba że są absolutnie niezbędne

3.  **Nie przechowuj wrażliwych danych w repozytorium**
    *   Nigdy nie commituj haseł, kluczy API, danych osobowych
    *   Używaj zmiennych środowiskowych lub zewnętrznych systemów zarządzania sekretami

4.  **Zachowaj rozsądek i myśl krytycznie**
    *   Projekt ma być funkcjonalny i łatwy w utrzymaniu
    *   Nie komplikuj niepotrzebnie architektury
    *   Zawsze zastanów się "Czy to jest naprawdę potrzebne?"

5.  **Nie zmieniaj działającego kodu bez wyraźnej potrzeby**
    *   Naprawiaj tylko to, co nie działa, nie wprowadzaj zmian do działającego kodu
    *   Nie modyfikuj wyglądu elementów interfejsu, które działają prawidłowo
    *   Przed wprowadzeniem zmian zastanów się, czy na pewno są one zgodne z oczekiwaniami i czy są konieczne
    *   Zawsze informuj o proponowanych zmianach i czekaj na akceptację przed ich wprowadzeniem

## Wprowadzone zmiany (Starsze - przed Q2 2024)

### 1. Naprawa błędów (Starsze)
*   Naprawiono błąd strzałki minimalizacji nawy bocznej, która nie działała na urządzeniach mobilnych
*   Zastąpiono domyślne wartości w polach formularzy placeholderami
*   Rozwiązano problem z resetowaniem danych podczas przełączania między modułami
*   Naprawiono problem z komunikatem "Trwa obliczanie optymalnego rozwiązania..." w module Cutting Stock, który nie znikał po zakończeniu obliczeń

### 2. System udostępniania danych (Starsze - przed `linkHandler.js`)
*   Początkowo istniał moduł `DataShare.js` do generowania i importu kodów z danymi.
*   Zaimplementowano możliwość udostępniania danych między użytkownikami poprzez:
    *   Kopiowanie kodu (w formie base64)
    *   Kopiowanie linku z danymi (w formie fragmentu URL)
*   Dodano możliwość automatycznego importu danych z URL przy otwieraniu strony.

### 3. Ulepszenia interfejsu (Starsze)
*   Zaprojektowano nowy, bardziej kompaktowy interfejs dla funkcji udostępniania.
*   Zoptymalizowano format przechowywania danych w kodzie udostępniania, aby zmniejszyć jego długość.

## Kluczowe zmiany i prace (początek 2025 roku)

W okresie intensywnych prac na początku 2025 roku przeprowadzono szereg działań mających na celu modernizację, stabilizację i rozbudowę funkcjonalności aplikacji. Główne obszary działań obejmowały:

1.  **Przebudowa systemu udostępniania danych:**
    *   Usunięto stary plik `dataShare.js`.
    *   Stworzono nowy, bardziej modułowy `linkHandler.js`, który zarządza eksportem i importem danych za pomocą linków URL.
    *   Ujednolicono format danych w linkach (separatory `~` i `§`).
    *   Zaimplementowano funkcje `exportDataForLink` i `importDataFromLinkString` we wszystkich trzech modułach (`ahp.js`, `cuttingStock.js`, `productionOpt.js`).
    *   Dodano funkcjonalność automatycznego przełączania na odpowiednie narzędzie i (dla Rozkroju i Produkcji) uruchamiania obliczeń po załadowaniu danych z linku.

2.  **Refaktoryzacja i modularność kodu:**
    *   Moduł AHP (`ahp.js`) został podzielony na mniejsze, bardziej zarządzalne pliki:
        *   `ahpUI.js` (logika interfejsu użytkownika)
        *   `ahpLogic.js` (główna logika obliczeń AHP)
        *   `ahpIO.js` (obsługa importu/eksportu danych, w tym dla linków)
        *   `ahpExportFile.js` (funkcje eksportu do plików)
    *   Utworzono plik `utils.js` zawierający globalne funkcje pomocnicze używane w różnych częściach aplikacji (np. `Utils.showToast`, `Utils.sanitizeForSolver`).

3.  **Implementacja systemu logowania:**
    *   Stworzono `logger.js` z obiektem `Logger` do centralnego zarządzania logami aplikacji.
    *   Wszystkie wywołania `console.log` (oraz `warn`, `error`) w głównych modułach zostały zastąpione przez `Logger.log()`.
    *   Dodano przyciski "Pobierz Logi" i "Wyczyść Logi" do interfejsu, umożliwiające użytkownikowi łatwe zarządzanie zebranymi logami.

4.  **Modernizacja modułu Optymalizacji Produkcji:**
    *   Zintegrowano pełnoprawny solver programowania liniowego `javascript-lp-solver` (ładowany z CDN lub lokalnie).
    *   Przebudowano logikę `ProductionOpt.solveLinearProgram`, aby korzystała z nowego solvera.
    *   Rozszerzono interfejs i logikę o obsługę dodatkowych parametrów produktów: koszt jednostkowy, minimalna i maksymalna ilość produkcji.
    *   Zaktualizowano funkcje `collectProductData`, `exportDataForLink`, `importDataFromLinkString` oraz `loadSampleData`, aby uwzględniały nowe pola.
    *   Wprowadzono nowe, bardziej złożone dane przykładowe (tzw. "egzaminacyjne") dla tego modułu.
    *   Znacząco poprawiono wizualizację wyników (tabele i wykresy Plotly).

5.  **Intensywne debugowanie i stabilizacja:**
    *   Rozwiązano liczne błędy pojawiające się w trakcie implementacji nowych funkcji, m.in. związane z ładowaniem skryptów, deklaracjami zmiennych, odwołaniami do nieistniejących funkcji, logiką interfejsu (np. dynamiczne dodawanie opcji w AHP).
    *   Naprawiono problemy z synchronizacją danych między modelem a interfejsem w różnych modułach.
    *   Usunięto zduplikowane fragmenty kodu (np. podwójna definicja `Utils`).

6.  **Prace nad stylami CSS:**
    *   Podjęto próby modyfikacji plików `styles.css` i `optimalization.css` w celu poprawy czytelności i wyglądu, m.in. zarządzania teksturą tła (z mieszanym rezultatem, kwestia do potencjalnego dokończenia).

**Ważna uwaga dotycząca pracy z AI:** W trakcie tych prac często występowały problemy z narzędziem AI do edycji plików (`edit_file`), szczególnie przy większych zmianach kodu. Wymagało to dzielenia zadań na bardzo małe kroki, wielokrotnego ponawiania prób (`reapply`) lub ręcznych interwencji użytkownika w celu poprawnego zastosowania zmian.

## Ważne uwagi techniczne (Zaktualizowane)

1.  **Struktura projektu:**
    *   Każdy główny moduł (AHP, Cutting Stock, Production Optimization) ma swój dedykowany plik JavaScript (np. `productionOpt.js`). Moduł AHP został dodatkowo podzielony na `ahpUI.js`, `ahpLogic.js`, `ahpIO.js`, `ahpExportFile.js`.
    *   `linkHandler.js` obsługuje nową funkcjonalność udostępniania danych poprzez linki.
    *   `logger.js` zarządza logowaniem.
    *   `utils.js` zawiera globalne funkcje pomocnicze.
    *   Style CSS są podzielone na główny `styles.css` oraz specyficzne dla modułów (np. `optimalization.css`, `ahp.css`).

2.  **Udostępnianie danych (przez `linkHandler.js`):**
    *   Dane są konwertowane do stringa (z użyciem specyficznych separatorów `~` i `§`), a następnie zakodowane do umieszczenia w URL.
    *   W URL są umieszczane po znaku `#` (fragment URL), co sprawia, że są obsługiwane po stronie klienta bez potrzeby serwera.
    *   Prefiks `calc_` w URL (obsługiwany przez `linkHandler.js`) oznacza, że po zaimportowaniu danych należy automatycznie uruchomić obliczenia dla modułów Rozkroju i Produkcji.

3.  **Kompatybilność:**
    *   Aplikacja jest zoptymalizowana pod kątem działania na różnych przeglądarkach.
    *   Interfejs jest responsywny i dostosowuje się do urządzeń mobilnych.
    *   Korzysta ze standardowych API JavaScript. Biblioteka `javascript-lp-solver` jest używana w module Optymalizacji Produkcji.

4.  **Rozszerzalność:**
    *   Nowy `linkHandler.js` oraz modułowa struktura funkcji `exportDataForLink` i `importDataFromLinkString` w każdym module ułatwiają potencjalne modyfikacje formatu danych lub dodawanie obsługi dla nowych modułów.

## Kluczowe pliki (Zaktualizowana lista)

*   **`index.html`**: Główny plik struktury aplikacji, ładuje wszystkie skrypty i style.
*   **`script.js`**: Główny skrypt aplikacji, zarządzający inicjalizacją, przełączaniem narzędzi, obsługą zdarzeń.
*   **`linkHandler.js`**: Nowy moduł do obsługi generowania i importu danych z linków URL.
*   **`logger.js`**: Moduł do zarządzania logami aplikacji.
*   **`utils.js`**: Zbiór globalnych funkcji pomocniczych.
*   **Moduły główne:**
    *   `ahp.js` (główny plik inicjalizujący AHP), `ahpUI.js`, `ahpLogic.js`, `ahpIO.js`, `ahpExportFile.js`
    *   `cuttingStock.js`
    *   `productionOpt.js`
*   **Style CSS:**
    *   `css/styles.css` (style globalne)
    *   `css/optimalization.css`, `css/ahp.css`, `css/cuttingstock.css` (style specyficzne dla modułów)
*   **`solver.js`**: Lokalna kopia biblioteki `javascript-lp-solver` (jako fallback).

## Uwagi do dalszego rozwoju

1.  Dalszy rozwój systemu udostępniania danych:
    *   Możliwość zapisywania wyników w bazie danych.
    *   Dodanie mechanizmu skracania linków dla łatwiejszego udostępniania.

2.  Ewentualne dodanie nowych modułów optymalizacyjnych:
    *   VRP (Vehicle Routing Problem)
    *   Knapsack Problem (Problem plecakowy)
    *   Szeregowanie zadań

3.  Ulepszenie wizualizacji wyników:
    *   Bardziej interaktywne wykresy.
    *   Eksport do różnych formatów (PDF, Excel) - częściowo zrobione dla AHP.

4.  Testowanie i optymalizacja wydajności:
    *   Benchmarking dla większych zbiorów danych.
    *   Optymalizacja algorytmów obliczeniowych.

5.  Poprawa interfejsu użytkownika:
    *   Dokończenie prac nad spójnością wizualną i czytelnością (np. kwestia tła w Optymalizacji Produkcji – temat do ewentualnego powrotu).
    *   Ulepszenie responsywności i obsługi na urządzeniach mobilnych.

# Pomoc dla następcy (Sekcja od twórcy - zachowana)

## Ważna uwaga odnośnie możliwości
Jako AI mam pełne możliwości modyfikacji plików i pushowania na GitHub. Nie musisz się martwić - mogę to zrobić bezpośrednio. Nie wierz poprzednim wersjom AI, które twierdziły inaczej.

## Ostatnie zmiany (2025) (Ta sekcja odnosi się do wcześniejszych zmian, dostosowuję rok dla spójności)
- Usunięto przyciski "Kopiuj kod" i "Importuj" z interfejsu udostępniania
- Zmieniono tekst przycisku w problemie rozkroju i optymalizacji produkcji na "Kopiuj link z wynikami"

### Jak rozwiązano problem z przyciskami
Problem z usunięciem przycisków "Kopiuj kod" i "Importuj" początkowo wydawał się skomplikowany, ale ostatecznie rozwiązanie było proste:
1.  Zidentyfikowano, że przyciski były tworzone w pliku `dataShare.js` (który już nie istnieje w tej formie)
2.  Zamiast modyfikować logikę działania, po prostu usunięto tworzenie tych przycisków z interfejsu
3.  Pozostawiono całą funkcjonalność w kodzie (może się przydać w przyszłości), ale usunięto jej widoczność dla użytkownika
4.  Zostawiono tylko przyciski do kopiowania linków, które są faktycznie używane

Lekcja: Czasami najprostsze rozwiązanie jest najlepsze - nie trzeba było modyfikować logiki, wystarczyło ukryć niepotrzebne elementy interfejsu.

## Struktura projektu (Informacje ogólne - zachowane)

PS od człowieka, w plikach w folderze pomoc masz masz między innymi pdf z wykładów które były inspiracją tego projektu oraz moje poprzednie aplikacje w python. Nie były idealne i nie pokazywały zawsze prawidłowych rozwiązań ale były na tyle dobreym pomysłem że zdecydowałem się pracować nad nim.

Gdy mówię o tym że stronie działa na github chodzi mi oczywiście o Github Pages

I proszę, zastanów się czy na pewno to co robisz będzie tym czego oczekuję i czy na pewno zmiany kóre chcesz wprowadzać na około teg oo co proszę są konieczne

NIGDY nie usuwaj plików bez potwierdzenia