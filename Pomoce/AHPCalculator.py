import tkinter as tk
from tkinter import messagebox, simpledialog, font, ttk
import numpy as np

class AHPCalculator(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Kalkulator AHP")
        self.geometry("600x800")
        self.configure(bg="#f0f0f0")
        
        default_font = font.nametofont("TkDefaultFont")
        default_font.configure(size=12)
        self.option_add("*Font", default_font)
        
        self.number_of_criteria = 0
        self.criteria_names = []
        self.comparison_matrix = None
        self.priorities = None
        self.option_comparison_matrices = None
        self.local_weights = None
        self.global_weights_a = None
        self.global_weights_b = None
        self.global_weights_c = None
        
        self.R_VALUES = {
            2: 0,
            3: 0.52,
            4: 0.89,
            5: 1.11,
            6: 1.25
        }
        
        self.comparison_frame = tk.Frame(self, bg="#f0f0f0")
        self.comparison_frame.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)
        
        style = ttk.Style()
        style.configure("TButton", padding=10, font=('Helvetica', 12))
        
        calculate_button = ttk.Button(self, text="Oblicz priorytety", command=self.calculate_priorities, style="TButton")
        calculate_button.pack(side=tk.BOTTOM, pady=20)
        
        self.ask_for_number_of_criteria()
    
    def ask_for_number_of_criteria(self):
        while True:
            input_value = simpledialog.askstring("Liczba kryteriów", "Podaj liczbę kryteriów (3-6):")
            try:
                self.number_of_criteria = int(input_value)
                if 3 <= self.number_of_criteria <= 6:
                    self.ask_for_criteria_names()
                    break
                else:
                    raise ValueError()
            except:
                messagebox.showerror("Błąd", "Nieprawidłowa liczba kryteriów. Spróbuj ponownie.")
    
    def ask_for_criteria_names(self):
        self.criteria_names = []
        for i in range(self.number_of_criteria):
            name = simpledialog.askstring("Nazwa kryterium", f"Podaj nazwę kryterium {i+1}:")
            self.criteria_names.append(name)
        self.show_comparison_form()
    
    def show_comparison_form(self):
        for widget in self.comparison_frame.winfo_children():
            widget.destroy()
        
        self.comparison_matrix = np.ones((self.number_of_criteria, self.number_of_criteria))
        
        for i in range(self.number_of_criteria):
            for j in range(self.number_of_criteria):
                if i == j:
                    label = tk.Label(self.comparison_frame, text=self.criteria_names[i], bg="#f0f0f0", font=('Helvetica', 10, 'bold'), wraplength=100)
                    label.grid(row=i, column=j, padx=5, pady=5, sticky="nsew")
                elif i < j:
                    self.create_comparison_cell(i, j)
                else:
                    tk.Label(self.comparison_frame, text="", bg="#f0f0f0").grid(row=i, column=j)
        
        # Konfiguracja równych wag dla kolumn i wierszy
        for i in range(self.number_of_criteria):
            self.comparison_frame.grid_columnconfigure(i, weight=1)
            self.comparison_frame.grid_rowconfigure(i, weight=1)
    
    def create_comparison_cell(self, i, j):
        frame = tk.Frame(self.comparison_frame, bg="#e0e0e0", bd=1, relief=tk.RAISED)
        frame.grid(row=i, column=j, padx=5, pady=5, sticky="nsew")
        
        label = tk.Label(frame, text=f"{self.criteria_names[i]} vs {self.criteria_names[j]}", bg="#e0e0e0", font=('Helvetica', 10), wraplength=100)
        label.pack(pady=2)
        
        values = ["1/9", "1/8", "1/7", "1/6", "1/5", "1/4", "1/3", "1/2", "1", "2", "3", "4", "5", "6", "7", "8","9"]
        var = tk.StringVar(frame)
        var.set("1")
        
        def on_change(*args):
            self.update_comparison_matrix(i, j, var.get())
        
        option_menu = ttk.OptionMenu(frame, var, "1", *values)
        option_menu.config(width=3)
        option_menu.pack(pady=2)
        var.trace("w", on_change)
    
    def update_comparison_matrix(self, i, j, value):
        numeric_value = self.parse_input_value(value)
        self.comparison_matrix[i, j] = numeric_value
        self.comparison_matrix[j, i] = 1 / numeric_value
    
    def calculate_priorities(self):
        # Normalizacja macierzy porównań
        normalized_matrix = self.comparison_matrix / self.comparison_matrix.sum(axis=0)
        
        # Obliczenie priorytetów jako średniej z każdego wiersza znormalizowanej macierzy
        self.priorities = normalized_matrix.mean(axis=1)
        
        # Wyświetlenie priorytetów
        priorities_str = "\n".join([f"{name}: {priority:.4f}" for name, priority in zip(self.criteria_names, self.priorities)])
        messagebox.showinfo("Priorytety", f"Obliczone priorytety:\n\n{priorities_str}")
        
        # Przejście do porównania opcji
        self.compare_options()
    
    def compare_options(self):
        # Okno dialogowe do wyboru liczby opcji
        option_count = simpledialog.askinteger("Wybór opcji", "Wybierz liczbę opcji do porównania:\n2. 2 opcje\n3. 3 opcje", minvalue=2, maxvalue=3)
        
        if option_count not in [2, 3]:
            messagebox.showerror("Błąd", "Nieprawidłowy wybór. Wybierz 2 lub 3 opcje.")
            return

        messagebox.showinfo("Porównanie opcji", f"Teraz porównamy {option_count} opcje dla każdego kryterium.")
        
        self.option_comparison_matrices = np.ones((self.number_of_criteria, option_count, option_count))
        self.local_weights = np.zeros((self.number_of_criteria, option_count))
        
        for i, criterion_name in enumerate(self.criteria_names):
            dialog = tk.Toplevel(self)
            dialog.title(f"Porównanie dla kryterium: {criterion_name}")
            dialog.geometry("600x400")
            dialog.configure(bg="#f0f0f0")
            dialog.transient(self)
            dialog.grab_set()
            
            label = tk.Label(dialog, text=f"Porównaj opcje dla kryterium {criterion_name}\n"
                                          "Wprowadź wartość (np. 4 dla A lepsze niż B, 1/3 dla B lepsze niż A):",
                             bg="#f0f0f0", font=('Helvetica', 12), wraplength=550)
            label.pack(pady=20)
            
            self.create_option_comparison_cells(dialog, i, option_count)
            
            ok_button = ttk.Button(dialog, text="OK", command=lambda: self.on_ok(dialog, i, option_count), style="TButton")
            ok_button.pack(pady=20)
            
            dialog.bind('<Return>', lambda event: self.on_ok(dialog, i, option_count))  # Powiązanie klawisza Enter z funkcją on_ok
            
            self.wait_window(dialog)
        
        self.calculate_global_weights()
    
    def create_option_comparison_cells(self, dialog, i, option_count):
        self.option_entries = {}
        options = ['A', 'B', 'C'][:option_count]  # Wybierz odpowiednie opcje

        for j in range(option_count):
            for k in range(j + 1, option_count):
                frame = tk.Frame(dialog, bg="#e0e0e0", bd=1, relief=tk.RAISED)
                frame.pack(pady=5)
                
                label = tk.Label(frame, text=f"Opcja {options[j]} vs Opcja {options[k]}", bg="#e0e0e0", font=('Helvetica', 10))
                label.pack(side=tk.LEFT, padx=5)
                
                entry = tk.Entry(frame, font=("Helvetica", 14), width=10)
                entry.pack(side=tk.RIGHT, padx=5)
                self.option_entries[(j, k)] = entry
    
    def on_ok(self, dialog, i, option_count):
        try:
            # Resetowanie macierzy dla pewności (nie powinno być konieczne, ale dla bezpieczeństwa)
            self.option_comparison_matrices[i] = np.ones((option_count, option_count))

            for (j, k), entry in self.option_entries.items():
                value = self.parse_input_value(entry.get()) if entry.get() else 1.0
                self.option_comparison_matrices[i][j][k] = value
                self.option_comparison_matrices[i][k][j] = 1 / value

            # Obliczanie wag lokalnych po ustawieniu całej macierzy
            normalized_matrix = self.option_comparison_matrices[i] / np.sum(self.option_comparison_matrices[i], axis=0)
            self.local_weights[i] = normalized_matrix.mean(axis=1)  # Użyj średniej z wierszy, jak w przypadku kryteriów

            dialog.destroy()
        except Exception as e:
            messagebox.showerror("Błąd", f"Wystąpił błąd: {str(e)}. Spróbuj ponownie.")
    
    def calculate_global_weights(self):
        self.global_weights_a = np.sum(self.local_weights[:, 0] * self.priorities)
        self.global_weights_b = np.sum(self.local_weights[:, 1] * self.priorities)
        
        if self.local_weights.shape[1] > 2:
            self.global_weights_c = np.sum(self.local_weights[:, 2] * self.priorities)
        else:
            self.global_weights_c = 0
        
        self.display_results()
    
    def display_results(self):
        results_window = tk.Toplevel(self)
        results_window.title("Wyniki AHP")
        results_window.geometry("800x600")
        results_window.configure(bg="#f0f0f0")
        
        results_text = tk.Text(results_window, font=("Courier", 12), bg="#ffffff")
        results_text.pack(expand=True, fill=tk.BOTH, padx=20, pady=20)
        
        results = "Priorytety kryteriów:\n"
        for name, priority in zip(self.criteria_names, self.priorities):
            results += f"{name:<20}: {priority:.4f}\n"
        
        results += "\nMacierz porównań kryteriów:\n"
        for i, row in enumerate(self.comparison_matrix):
            results += f"{self.criteria_names[i]:<20}: " + " ".join(f"{val:6.2f}" for val in row) + "\n"
        
        results += "\nWagi lokalne i globalne:\n"
        for i, name in enumerate(self.criteria_names):
            results += f"{name}:\n"
            results += f"  Opcja A: lokalna={self.local_weights[i,0]:.4f}, globalna={self.local_weights[i,0]*self.priorities[i]:.4f}\n"
            results += f"  Opcja B: lokalna={self.local_weights[i,1]:.4f}, globalna={self.local_weights[i,1]*self.priorities[i]:.4f}\n"
            
            # Dodaj warunek, aby sprawdzić, czy istnieje opcja C
            if self.local_weights.shape[1] > 2:  # Sprawdza, czy są dostępne 3 opcje
                results += f"  Opcja C: lokalna={self.local_weights[i,2]:.4f}, globalna={self.local_weights[i,2]*self.priorities[i]:.4f}\n"
        
        results += "\nSuma wag globalnych:\n"
        results += f"Opcja A: {self.global_weights_a:.4f}\n"
        results += f"Opcja B: {self.global_weights_b:.4f}\n"
        
        # Dodaj warunek, aby sprawdzić, czy istnieje opcja C
        if self.local_weights.shape[1] > 2:  # Sprawdza, czy są dostępne 3 opcje
            results += f"Opcja C: {self.global_weights_c:.4f}\n"
        
        results += "\nWynik końcowy:\n"
        if self.global_weights_a > self.global_weights_b:
            results += f"Opcja A jest lepsza o {(self.global_weights_a-self.global_weights_b)*100:.2f}%"
        elif self.global_weights_b > self.global_weights_a:
            results += f"Opcja B jest lepsza o {(self.global_weights_b-self.global_weights_a)*100:.2f}%"
        else:
            results += "Opcje A i B są równoważne"
        
        # Dodaj obliczenia spójności
        lambda_max, ci, cr = self.calculate_consistency()
        
        results += "\n\nAnaliza spójności:\n"
        results += f"Lambda max: {lambda_max:.4f}\n"
        results += f"Indeks zgodności (CI): {ci:.4f}\n"
        results += f"Współczynnik zgodności (CR): {cr:.4f}\n\n"
        
        # Dodaj interpretację CR
        if cr < 0.1:
            results += "Wartość współczynnika CR jest mniejsza niż 0.1 - wyniki są wiarygodne."
        elif cr <= 0.5:
            results += ("UWAGA: Wartość współczynnika CR przekracza wartość krytyczną 0.1, "
                        "ale jest mniejsza niż 0.5 - wyniki nadal nadają się do interpretacji, "
                        "jednak należy zachować ostrożność.")
        else:
            results += ("UWAGA: Wartość współczynnika CR znacznie przekracza wartość krytyczną 0.1 - "
                        "wyniki są mało wiarygodne i obarczone znacznymi błędami.")
        
        results_text.insert(tk.END, results)
        results_text.config(state=tk.DISABLED)
    
    def calculate_lambda_max(self):
        weighted_sum = np.dot(self.comparison_matrix, self.priorities)
        return np.mean(weighted_sum / self.priorities)
    
    def calculate_consistency(self):
        n = len(self.comparison_matrix)
        lambda_max = self.calculate_lambda_max()
        ci = (lambda_max - n) / (n - 1) if n > 1 else 0
        r = self.R_VALUES.get(n, 1.25)  # domyślna wartość dla n > 6
        cr = ci / r if r != 0 else 0
        return lambda_max, ci, cr
    
    def parse_input_value(self, input_str):
        if not input_str or input_str.isspace():
            return 1.0
        if "/" in input_str:
            num, denom = map(float, input_str.split("/"))
            if denom == 0:
                raise ValueError("Dzielenie przez zero")
            return num / denom
        return float(input_str)

if __name__ == "__main__":
    app = AHPCalculator()
    app.mainloop()