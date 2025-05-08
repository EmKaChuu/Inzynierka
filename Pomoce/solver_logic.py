from pulp import LpProblem, LpMinimize, LpMaximize, LpVariable, lpSum, LpStatus, value, COIN_CMD, PULP_CBC_CMD
import os
import sys

def get_solver_path():
    if getattr(sys, 'frozen', False):
        # Jeśli aplikacja jest spakowana przez PyInstaller
        application_path = os.path.dirname(sys.executable)
        solver_path = os.path.join(application_path, 'cbc.exe')
    else:
        # Jeśli uruchomione z IDE
        solver_path = os.path.join(os.path.dirname(__file__), 'cbc.exe')
    
    print(f"Solver path: {solver_path}")
    print(f"Solver exists: {os.path.exists(solver_path)}")
    
    return solver_path

def generate_cutting_patterns(log_length, order_lengths):
    """
    Generuje wszystkie możliwe wzory cięcia dla danej długości kłody.
    """
    def generate_patterns_recursive(remaining_length, current_pattern, patterns):
        if sum(current_pattern) > 0:
            patterns.append(current_pattern.copy())
        
        for i, length in enumerate(order_lengths):
            if length <= remaining_length:
                current_pattern[i] += 1
                generate_patterns_recursive(remaining_length - length, current_pattern, patterns)
                current_pattern[i] -= 1
    
    patterns = []
    initial_pattern = [0] * len(order_lengths)
    generate_patterns_recursive(log_length, initial_pattern, patterns)
    return patterns

def solve_lumber_problem(log_length, order_lengths, order_quantities, num_logs=None, exact=False):
    """
    Rozwiązuje problem optymalizacji cięcia kłód na zamówione kawałki.
    Parametr 'exact' kontroluje, czy ma być dokładnie żądana liczba sztuk, czy co najmniej.
    """
    
    # Konwersja długości na centymetry aby uniknąć problemów z liczbami zmiennoprzecinkowymi
    scale = 100
    log_length_scaled = int(log_length * scale)
    order_lengths_scaled = [int(length * scale) for length in order_lengths]
    
    # Generowanie wszystkich możliwych wzorów cięcia
    patterns = generate_cutting_patterns(log_length_scaled, order_lengths_scaled)
    
    # Filtrowanie i sortowanie wzorów według odpadu
    filtered_patterns = []
    pattern_wastes = []
    pattern_efficiencies = []
    
    for pattern in patterns:
        total_length = sum(p * l for p, l in zip(pattern, order_lengths_scaled))
        waste = log_length_scaled - total_length
        if waste >= 0:
            filtered_patterns.append(pattern)
            pattern_wastes.append(waste)
            efficiency = total_length / log_length_scaled
            pattern_efficiencies.append(efficiency)
    
    if not filtered_patterns:
        return {"status": "No feasible patterns found", "min_logs": None}
    
    # Inicjalizacja problemu
    prob = LpProblem("Lumber_Cutting", LpMinimize)
    
    # Zmienne decyzyjne
    pattern_vars = LpVariable.dicts("Pattern",
                                  range(len(filtered_patterns)),
                                  lowBound=0,
                                  cat='Integer')
    
    # Funkcja celu
    prob += lpSum(pattern_vars[i] * pattern_wastes[i] for i in range(len(filtered_patterns)))
    
    # Ograniczenia: spełnienie zamówień (co najmniej zamówiona ilość)
    for j in range(len(order_lengths)):
        if exact:
            prob += lpSum(pattern_vars[i] * filtered_patterns[i][j]
                           for i in range(len(filtered_patterns))) == order_quantities[j]  #Zmienione na ==
        else:
            prob += lpSum(pattern_vars[i] * filtered_patterns[i][j]
                           for i in range(len(filtered_patterns))) >= order_quantities[j]  #Pozostawione >=
    
    if num_logs is not None:
        prob += lpSum(pattern_vars[i] for i in range(len(filtered_patterns))) <= num_logs
    
    # Użyj ścieżki do solvera
    if getattr(sys, 'frozen', False):
        # Jeśli aplikacja jest uruchomiona jako plik .exe
        solver_path = os.path.join(os.path.dirname(sys.executable), "cbc.exe")
        solver = COIN_CMD(path=solver_path, msg=1)  # Zmieniono msg na 1
    else:
        # Jeśli aplikacja jest uruchomiona w środowisku Python
        solver = PULP_CBC_CMD(msg=1)  # Zmieniono msg na 1
    
    # Rozwiązanie problemu
    prob.solve(solver)
    
    # Przygotowanie wyników
    results = {
        "status": LpStatus[prob.status],
        "min_logs": value(prob.objective),
        "patterns": {},
        "total_used_length": 0,
        "total_available_length": 0,
        "extra_pieces": {}
    }
    
    if results["min_logs"] is not None:
        total_logs_used = sum(value(pattern_vars[i]) for i in range(len(filtered_patterns)))
        results["min_logs"] = int(round(total_logs_used))  # Zaokrąglamy i konwertujemy na liczbę całkowitą
        results["total_available_length"] = log_length * total_logs_used
        
        total_pieces = {i: 0 for i in range(len(order_lengths))}
        for i in range(len(filtered_patterns)):
            if value(pattern_vars[i]) > 0:
                pattern_count = int(round(value(pattern_vars[i])))  # Zaokrąglamy i konwertujemy na liczbę całkowitą
                results["patterns"][f"Pattern_{i+1}"] = {
                    "count": pattern_count,
                    "cuts": {},
                    "waste": round(pattern_wastes[i] / scale, 2),
                    "efficiency": round(pattern_efficiencies[i] * 100, 2)
                }
                for j in range(len(order_lengths)):
                    if filtered_patterns[i][j] > 0:
                        length = order_lengths[j]
                        pieces = filtered_patterns[i][j]
                        total_pieces[j] += pieces * pattern_count
                        results["patterns"][f"Pattern_{i+1}"]["cuts"][j] = {
                            "length": length,
                            "pieces": pieces
                        }
        
        # Obliczanie dodatkowych kawałków ponad zamówienie
        for i in range(len(order_lengths)):
            extra = total_pieces[i] - order_quantities[i]
            if extra > 0:
                results["extra_pieces"][i] = {
                    "length": order_lengths[i],
                    "quantity": extra
                }
        
        # Obliczanie całkowitej wykorzystanej długości
        total_used_length = 0
        for i, pieces in total_pieces.items():
            total_used_length += pieces * order_lengths[i]
        
        # Poprawione obliczenia uwzględniające zaokrąglenie liczby kłód
        actual_logs_used = int(round(total_logs_used))
        actual_available_length = log_length * actual_logs_used
        results["total_used_length"] = round(total_used_length, 2)
        results["total_available_length"] = round(actual_available_length, 2)
        results["waste"] = round(actual_available_length - total_used_length, 2)
        results["efficiency"] = round((total_used_length / actual_available_length) * 100, 2)
        results["pieces_summary"] = {i: total_pieces[i] for i in range(len(order_lengths))}
    
    return results


def solve_production_problem(objective, constraints, num_vars, integer_vars=None):
    """
    Rozwiązuje problem optymalizacji produkcji.
    Przyjmuje słownik 'objective' opisujący funkcję celu, listę słowników 'constraints'
    z ograniczeniami, liczbę zmiennych 'num_vars' i opcjonalną listę 'integer_vars'
    określającą, które zmienne mają być całkowitoliczbowe.
    """
    prob = LpProblem("Production_Optimization", LpMaximize if objective['type'] == 'max' else LpMinimize)

    # Tworzenie zmiennych decyzyjnych.
    # Domyślnie zmienne są ciągłe, chyba że podano 'integer_vars'.
    x = LpVariable.dicts("Product", range(num_vars), lowBound=0, cat='Integer' if integer_vars else 'Continuous')

    # Funkcja celu
    prob += lpSum(objective['coeffs'][i] * x[i] for i in range(num_vars))

    # Warunki ograniczające
    for constraint in constraints:
        if constraint['type'] == '>=':
            prob += lpSum(constraint['coeffs'][i] * x[i] for i in range(num_vars)) >= constraint['rhs']
        elif constraint['type'] == '<=':
            prob += lpSum(constraint['coeffs'][i] * x[i] for i in range(num_vars)) <= constraint['rhs']
        else:  # constraint['type'] == '='
            prob += lpSum(constraint['coeffs'][i] * x[i] for i in range(num_vars)) == constraint['rhs']
    
    # Użyj ścieżki do solvera
    if getattr(sys, 'frozen', False):
        # Jeśli aplikacja jest uruchomiona jako plik .exe
        solver_path = os.path.join(os.path.dirname(sys.executable), "cbc.exe")
        solver = COIN_CMD(path=solver_path, msg=1)  # Zmieniono msg na 1, aby pulp wyświetlał komunikaty solwera.
    else:
        # Jeśli aplikacja jest uruchomiona w środowisku Python
        solver = PULP_CBC_CMD(msg=1)  # Zmieniono msg na 1

    # Rozwiązanie problemu
    prob.solve(solver)

    results = {
        "status": LpStatus[prob.status],
        "objective_value": value(prob.objective),
        "variables": {},
    }

    for var in x:
        results["variables"][f"Product_{var}"] = value(x[var])  # Zmienione na "Product_i"
    
    return results