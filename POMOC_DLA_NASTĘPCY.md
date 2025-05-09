# Projekt Dyplomowy - Aplikacja do Optymalizacji

## Opis aplikacji

Projekt jest aplikacją webową zawierającą trzy moduły optymalizacyjne:

1. **AHP (Analiza Hierarchii Procesów)** - moduł do wspomagania decyzji wielokryterialnych, pozwalający na porównanie różnych opcji według zdefiniowanych kryteriów.
2. **Cutting Stock (Problem Rozkroju)** - moduł do optymalizacji cięcia materiałów w celu minimalizacji odpadów.
3. **Production Optimization (Optymalizacja Produkcji)** - moduł do optymalizacji alokacji zasobów w procesie produkcyjnym.

Aplikacja jest wykonana w czystym JavaScript (bez zewnętrznych frameworków), HTML i CSS, co sprawia, że może być uruchomiona bezpośrednio w przeglądarce bez konieczności instalowania dodatkowych narzędzi.

## BARDZO WAŻNE UWAGI OD TWÓRCY PROJEKTU

### Zarządzanie repozytorium Git

1. **NIE DODAWAJ WSZYSTKIEGO DO GITA!** 
   - Zawsze sprawdzaj, co dokładnie dodajesz do repozytorium
   - Nie używaj `git add .` bez dokładnego przemyślenia - to podstawowy błąd!
   - Pliki pomocnicze, tymczasowe, kopie zapasowe itp. NIE POWINNY trafić do repozytorium

2. **Zawsze używaj prawidłowo pliku .gitignore**
   - Umieszczaj w nim wszystkie nieistotne z perspektywy działania aplikacji pliki
   - Ignoruj pliki systemowe (.DS_Store, Thumbs.db)
   - Ignoruj pliki tymczasowe (*.bak, *.tmp)
   - Ignoruj pliki IDE (.idea/, .vscode/)

3. **Dokumentacja nie zawsze powinna być w repozytorium**
   - Notatki robocze i pliki pomocnicze trzymaj lokalnie
   - Do repozytorium dodawaj tylko dokumentację, która jest niezbędna dla zrozumienia kodu

4. **Sprawdzaj rozmiar commita przed wysłaniem**
   - Duże commity (wiele MB) często zawierają niepotrzebne pliki
   - Jeśli commit jest podejrzanie duży, sprawdź co dokładnie wysyłasz

### Inne istotne uwagi

1. **Nie polegaj ślepo na narzędziach AI**
   - AI może bezmyślnie wrzucać wszystko do repozytorium
   - Zawsze weryfikuj commity i propozycje AI
   - GPT to pomocnik, a nie bezmyślne narzędzie do kopiowania - używaj rozumu!

2. **Dbaj o czystość kodu i repozytorium**
   - Zachowuj tylko niezbędne pliki w repozytorium
   - Utrzymuj czytelną strukturę projektu
   - Unikaj commitowania plików binarnych, chyba że są absolutnie niezbędne

3. **Nie przechowuj wrażliwych danych w repozytorium**
   - Nigdy nie commituj haseł, kluczy API, danych osobowych
   - Używaj zmiennych środowiskowych lub zewnętrznych systemów zarządzania sekretami

4. **Zachowaj rozsądek i myśl krytycznie**
   - Projekt ma być funkcjonalny i łatwy w utrzymaniu
   - Nie komplikuj niepotrzebnie architektury
   - Zawsze zastanów się "Czy to jest naprawdę potrzebne?"
   
5. **Nie zmieniaj działającego kodu bez wyraźnej potrzeby**
   - Naprawiaj tylko to, co nie działa, nie wprowadzaj zmian do działającego kodu
   - Nie modyfikuj wyglądu elementów interfejsu, które działają prawidłowo
   - Przed wprowadzeniem zmian zastanów się, czy na pewno są one zgodne z oczekiwaniami i czy są konieczne
   - Zawsze informuj o proponowanych zmianach i czekaj na akceptację przed ich wprowadzeniem

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
   - Style CSS są podzielone na główny plik stylów oraz dodatkowy main.css dla nowych funkcji

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
- **css/main.css** - Style CSS dla nowych funkcjonalności

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




PS od człwoieka, w plikach w folderze pomoc masz masz między innymi pdf z wykłądów które były inspiracją tego projektu oraz moje poprzednie aplikacje w python. Nie były idealne i nie pokazywały zawsze prawidłowych rozwiązań ale były na tyle dobreym pomysłem że zdecydowałem się pracować nad nim. 

Gdy mówię o tym że stronie działa na github chodzi mi oczywiście o Github Pages

I proszę, zastamów się czy na pewno to co robisz będzie tym czego oczekuję i czy na pewno zmiany kóre chcesz wprowadzać na około teg oo co proszę są konieczne