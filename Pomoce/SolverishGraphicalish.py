import tkinter as tk
from tkinter import ttk, messagebox
import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from solver_logic import solve_lumber_problem, solve_production_problem
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from mpl_toolkits.mplot3d import Axes3D
import time
import logging
import sys
import os
from production_optimizer_app import ProductionOptimizerApp

# Konfiguracja logowania
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gui_debug.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class AppSelector:
    def __init__(self, root):
        self.root = root
        self.root.title("Optymalizator Zasobów i Produkcji")
        self.root.geometry("600x400")
        
        # Kolory premium
        self.colors = {
            'dark_brown': '#4A3C31',
            'medium_brown': '#785E45',
            'light_brown': '#BFA58E',
            'gold': '#D4AF37',
            'cream': '#F5E6D3',
            'white': '#FFFFFF'
        }
        
        self.root.configure(bg=self.colors['light_brown'])
        
        # Tytuł aplikacji
        title_label = ttk.Label(self.root, text="Optymalizator Zasobów i Produkcji", font=("Helvetica", 18), style='Premium.TLabel')
        title_label.pack(pady=40)
        
        # Kontener na przyciski
        button_frame = ttk.Frame(self.root, style='Premium.TFrame')
        button_frame.pack(pady=20)
        
        # Przycisk do problemu rozkroju
        lumber_button = ttk.Button(button_frame, text="Problem Rozkroju", 
                                 command=self.open_lumber_app, style='Premium.TButton')
        lumber_button.pack(side=tk.LEFT, padx=20)
        
        # Przycisk do optymalizacji produkcji
        production_button = ttk.Button(button_frame, text="Optymalizacja Produkcji",
                                       command=self.open_production_app, style='Premium.TButton')
        production_button.pack(side=tk.LEFT, padx=20)
    
    def open_lumber_app(self):
        lumber_root = ttk.Toplevel(self.root)
        app = WoodCutterApp(lumber_root)
        
    def open_production_app(self):
        production_root = ttk.Toplevel(self.root)
        app = ProductionOptimizerApp(production_root)


class WoodCutterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Premium Wood Cutting Optimizer")
        self.root.geometry("1400x1200")
        
        # Kolory premium
        self.colors = {
            'dark_brown': '#4A3C31',
            'medium_brown': '#785E45',
            'light_brown': '#BFA58E',
            'gold': '#D4AF37',
            'cream': '#F5E6D3',
            'white': '#FFFFFF'
        }
        
        self.root.configure(bg=self.colors['light_brown'])  # Tło aplikacji
        
        # Ramka na górze dla tytułu i przycisku
        top_frame = ttk.Frame(self.root)
        top_frame.pack(side=tk.TOP, fill=tk.X)
        
        # Przycisk resetujący
        reset_button = ttk.Button(top_frame, text="Resetuj", command=self.reset_app, style='Premium.TButton')
        reset_button.pack(side=tk.RIGHT, padx=10, pady=5)
        
        # Tytuł aplikacji
        title_label = ttk.Label(top_frame, text="Premium Wood Cutting Optimizer", font=("Helvetica", 16), style='Premium.TLabel')
        title_label.pack(side=tk.LEFT, padx=10, pady=5)
        
        # Inicjalizacja zmiennych
        self.current_log_length = 2.0  # Domyślna długość kłody
        self.resolution = 10  # Rozdzielczość dla wizualizacji 3D
        self.rotation_active = True
        self.is_rotating = False
        self.zoom_scale = 1.0
        self.last_interaction_time = time.time()
        self.auto_rotation_delay = 3
        self.visualization_enabled = tk.BooleanVar(value=True)
        self.exact_cuts = tk.BooleanVar(value=False)  # Przełącznik "Dokładnie X"
        
        # Główny kontener (najpierw pakujemy!)
        #self.auto_rotation_delay = 3
        #self.visualization_enabled = tk.BooleanVar(value=True) #Przełącznik wizualizacji
        #self.exact_cuts = tk.BooleanVar(value=False) # Przełącznik "Dokładnie X"

        # Główny kontener
        main_frame = ttk.Frame(self.root, style='Premium.TFrame')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))
        
        # Podział na górny i dolny panel
        top_frame = ttk.Frame(main_frame, style='Premium.TFrame')
        top_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Lewa strona górnego panelu - wprowadzanie danych
        input_frame = ttk.Frame(top_frame, style='Premium.TFrame')
        input_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Inicjalizacja pola długości kłody
        log_length_frame = ttk.Frame(input_frame)
        log_length_frame.pack(fill=tk.X, pady=5)
        ttk.Label(log_length_frame, text="Długość kłody (m):", style='Premium.TLabel').pack(side=tk.LEFT)
        self.log_length_var = tk.StringVar(value=str(self.current_log_length))
        self.log_length = ttk.Entry(log_length_frame, width=10, textvariable=self.log_length_var)
        self.log_length.pack(side=tk.LEFT, padx=5)
        self.log_length.bind('<KeyRelease>', self.on_length_change)
        
        # Dodanie przełącznika "Dokładnie X"
        exact_cuts_frame = ttk.Frame(input_frame, style='Premium.TFrame')
        exact_cuts_frame.pack(fill=tk.X, pady=5)
        ttk.Label(exact_cuts_frame, text="Dokładna liczba sztuk:", style='Premium.TLabel').pack(side=tk.LEFT)
        self.exact_cuts_check = ttk.Checkbutton(exact_cuts_frame, variable=self.exact_cuts, style='Premium.TCheckbutton')
        self.exact_cuts_check.pack(side=tk.LEFT, padx=5)
        
        # Scrollowany kontener na zamówienia
        orders_label = ttk.Label(input_frame, text="Zamówienia:", style='Premium.TLabel')
        orders_label.pack(anchor=tk.W, pady=(10,5))
        
        self.orders_canvas = tk.Canvas(input_frame, bg=self.colors['cream'], height=200, bd=0, highlightthickness=0)
        scrollbar = ttk.Scrollbar(input_frame, orient="vertical", command=self.orders_canvas.yview, style='Premium.TScrollbar')
        self.scrollable_frame = ttk.Frame(self.orders_canvas, style='Premium.TFrame')
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.orders_canvas.configure(scrollregion=self.orders_canvas.bbox("all"))
        )
        
        self.orders_canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.orders_canvas.configure(yscrollcommand=scrollbar.set)
        
        self.orders_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Lista zamówień
        self.orders_list = []
        self.add_order_row()
        
        # Przycisk dodawania zamówienia
        add_button = ttk.Button(input_frame, text="Dodaj zamówienie", 
                                command=self.add_order_row, style='Premium.TButton')
        add_button.pack(pady=10)
        
        # Limit kłód (opcjonalnie)
        limit_frame = ttk.Frame(input_frame, style='Premium.TFrame')
        limit_frame.pack(fill=tk.X, pady=5)
        ttk.Label(limit_frame, text="Limit kłód (opcjonalnie):", 
                 style='Premium.TLabel').pack(side=tk.LEFT)
        self.num_logs = ttk.Entry(limit_frame, width=10)
        self.num_logs.pack(side=tk.LEFT, padx=5)
        
        # Przycisk obliczania
        calculate_button = ttk.Button(input_frame, text="Oblicz optymalny podział",
                                       command=self.calculate, style='Premium.TButton')
        calculate_button.pack(pady=10)
        
        # Prawa strona górnego panelu - wyniki
        self.results_text = tk.Text(top_frame, wrap=tk.WORD)
        self.results_text.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Dolny panel - wizualizacja na całą szerokość
        bottom_frame = ttk.Frame(main_frame, style='Premium.TFrame')
        bottom_frame.pack(fill=tk.BOTH, expand=True)
        
        # Kontener na wizualizację, inicjalizacja *przed* rysowaniem
        self.fig = plt.Figure()
        self.ax = self.fig.add_subplot(111, projection='3d')
        self.canvas = FigureCanvasTkAgg(self.fig, master=bottom_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        
        # Inicjalizacja *PO* utworzeniu self.fig i self.ax
        self.init_3d_visualization(bottom_frame)
        
        
        # Obsługa zmiany rozmiaru okna
        self.root.bind('<Configure>', self.on_window_resize)
        
        # Dodanie obsługi myszy
        self.canvas.mpl_connect('button_press_event', self.on_mouse_press)
        self.canvas.mpl_connect('button_release_event', self.on_mouse_release)
        self.canvas.mpl_connect('motion_notify_event', self.on_mouse_move)
        self.canvas.mpl_connect('scroll_event', self.on_scroll)
        
        #Początkowa wizualizacja i rotacja
        self.draw_log(self.current_log_length)  
        self.start_rotation()
        
        # Przycisk resetujący
        reset_button = ttk.Button(main_frame, text="Resetuj", command=self.reset_app, style='Premium.TButton')
        reset_button.pack(side=tk.TOP, anchor=tk.NW, padx=10, pady=10)

        # Przycisk do włączania/wyłączania wizualizacji:
        self.visualization_toggle = ttk.Checkbutton(main_frame, text="Wizualizacja 3D", variable=self.visualization_enabled,
                                                    command=self.toggle_visualization, style='Premium.TCheckbutton')
        self.visualization_toggle.pack(side=tk.BOTTOM, anchor=tk.W, padx=10, pady=10)

    def init_3d_visualization(self, parent_frame):

        # Optymalizacja renderowania
        self.fig.set_facecolor(self.colors['cream'])
        self.ax.set_facecolor(self.colors['cream'])

        # Dodanie obsługi myszy
        self.canvas.mpl_connect('button_press_event', self.on_mouse_press)
        self.canvas.mpl_connect('button_release_event', self.on_mouse_release)
        self.canvas.mpl_connect('motion_notify_event', self.on_mouse_move)
        self.canvas.mpl_connect('scroll_event', self.on_scroll)  # Dodanie obsługi scrolla

        self.is_rotating = False
        self.prev_x = 0
        self.prev_y = 0

        self.draw_log(self.current_log_length)


    def _reset_plot(self):
        self.ax.clear()
        self.ax.set_xlabel('Długość [m]')
        self.ax.set_ylabel('')
        self.ax.set_zlabel('')
        self.ax.xaxis.set_label_coords(0.5, -0.2)
        self.ax.set_facecolor(self.colors['light_brown'])
        self.fig.patch.set_facecolor(self.colors['light_brown'])

    def draw_log(self, length, radius=0.2):
       if self.root.winfo_exists() and self.visualization_enabled.get():  # sprawdza czy okno istnieje, oraz czy wizualizacja ma być włączona
          self._reset_plot()  # Wyczyść i skonfiguruj osie
       phi = np.linspace(0, 2*np.pi, self.resolution)
       x = np.linspace(0, length, self.resolution)
       phi, x = np.meshgrid(phi, x)
        
       y = radius * np.cos(phi)
       z = radius * np.sin(phi)
       # Rysuj powierzcnię
       self.ax.plot_surface(x, y, z, color='brown', alpha=0.7)  # Dodano alpha dla przezroczystości
       #Rysowanie kół na końcach
       self.ax.plot_surface(np.zeros_like(phi), y, z, color='brown', alpha=0.7)
       self.ax.plot_surface(np.full_like(phi, length), y, z, color='brown', alpha=0.7) #drugie koło

       # Dodanie linii wymiarowej
       self.ax.plot([0, length], [-radius*1.2, -radius*1.2], [0, 0], 'k--', alpha=0.5)
       self.ax.text(length/2, -radius*1.4, 0, f'{length}m', ha='center')
    
       # Dodanie wymiarów średnicy
       self.ax.plot([0, 0], [-radius, radius], [0, 0], 'k--', alpha=0.5)
       self.ax.text(0, 0, radius*1.4, f'Ø{radius*2}m', ha='center')

       self.set_plot_properties(length, radius)
       self.on_scroll(type('ScrollEvent', (), {'inaxes': self.ax, 'button': 'up' if self.zoom_scale > 1 else 'down'}))
        
    def draw_cutting_pattern(self, pattern):
       if self.root.winfo_exists() and self.visualization_enabled.get():  # sprawdza czy okno istnieje, oraz czy wizualizacja ma być włączona
          self._reset_plot()
       current_pos = 0
       radius = 0.2
       gap = radius * 0.1
       total_length = pattern.get('total_length', self.current_log_length)
        
       for cut in pattern.get('cuts', []):
          length = cut.get('length', 0)
          self.draw_cylinder(current_pos, length, radius, 'brown')
          current_pos += length + gap

       waste = pattern.get('waste', 0)
       if waste > 0:
            self.draw_cylinder(current_pos, waste, radius, 'gray')

       self.set_plot_properties(total_length + gap * len(pattern.get('cuts', [])), radius)
        
    def draw_cylinder(self, start_pos, length, radius, color):
       phi = np.linspace(0, 2*np.pi, self.resolution)
       x = np.linspace(start_pos, start_pos + length, self.resolution)
       phi, x = np.meshgrid(phi, x)

       y = radius * np.cos(phi)
       z = radius * np.sin(phi)

       self.ax.plot_surface(x, y, z, color=color, alpha=0.9)

    def set_plot_properties(self, length, radius):
      self.ax.set_box_aspect(aspect=[max(length/(radius*4), 1), 1, 1])

      self.ax.set_xlim(0, length*1.1/self.zoom_scale)
      self.ax.set_ylim(-radius*2/self.zoom_scale, radius*2/self.zoom_scale)
      self.ax.set_zlim(-radius*2/self.zoom_scale, radius*2/self.zoom_scale)
      
      self.ax.yaxis.set_ticklabels([])
      self.ax.zaxis.set_ticklabels([])

      self.ax.xaxis.pane.fill = False
      self.ax.yaxis.pane.fill = False
      self.ax.zaxis.pane.fill = False

      self.ax.set_xlabel('Długość [m]')
      self.ax.set_ylabel('')
      self.ax.set_zlabel('')

      self.ax.xaxis.set_label_coords(0.5, -0.2)
      
      self.update_visualization_size()
      self.fig.canvas.draw_idle()

    def start_rotation(self):
        self.rotate()
        
    def rotate(self):
        current_time = time.time()
        if current_time - self.last_interaction_time > self.auto_rotation_delay:
            self.rotation_active = True
            if self.rotation_active:
                current_azim = self.ax.azim
                self.ax.view_init(elev=20, azim=current_azim + 1)
                self.fig.canvas.draw_idle()
        self.root.after(30, self.rotate)
        
    def on_mouse_press(self, event):
        if event.inaxes == self.ax:
            self.is_rotating = True
            self.prev_x = event.xdata
            self.prev_y = event.ydata
            self.rotation_active = False
            self.last_interaction_time = time.time()
            
    def on_mouse_release(self, event):
        self.is_rotating = False
        self.last_interaction_time = time.time()
        
    def on_mouse_move(self, event):
        if self.is_rotating and event.inaxes == self.ax:
            dx = event.xdata - self.prev_x
            dy = event.ydata - self.prev_y
            
            self.ax.view_init(
                elev=self.ax.elev + dy * 1,
                azim=self.ax.azim - dx * 1
            )
            
            self.prev_x = event.xdata
            self.prev_y = event.ydata
            self.canvas.draw()
            self.last_interaction_time = time.time()

    def create_widgets(self, input_frame):
        # Główny kontener
        main_frame = ttk.Frame(self.root, style='Premium.TFrame')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Podział na górny i dolny panel
        top_frame = ttk.Frame(main_frame, style='Premium.TFrame')
        top_frame.pack(fill=tk.X, pady=(0, 10))
        
        bottom_frame = ttk.Frame(main_frame, style='Premium.TFrame')
        bottom_frame.pack(fill=tk.BOTH, expand=True)
        
        # Lewa strona górnego panelu - wprowadzanie danych
        input_frame = ttk.Frame(top_frame, style='Premium.TFrame')
        input_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Prawa strona górnego panelu - wyniki
        results_frame = ttk.Frame(top_frame, style='Premium.TFrame')
        results_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(10, 0))
        
        self.results_text = tk.Text(results_frame, wrap=tk.WORD, width=50)
        self.results_text.pack(fill=tk.BOTH, expand=True)
        
    def display_results(self, results):
        self.results_text.delete(1.0, tk.END)
        
        if results["status"] == "Optimal":
            self.results_text.insert(tk.END, 
                f"Minimalna liczba potrzebnych kłód: {results['min_logs']}\n\n")
            
            self.results_text.insert(tk.END, "Wzory cięcia:\n" + "="*50 + "\n")
            for pattern_id, pattern in results["patterns"].items():
                frame = ttk.Frame(self.results_text)
                
                # Informacje o wzorze
                info_text = (
                    f"\n{pattern_id} (użyty {pattern['count']} razy):\n"
                    f"  Kawałki:\n"
                )
                for cut_id, cut_info in pattern["cuts"].items():
                    info_text += f"    - {cut_info['pieces']} × {cut_info['length']}m\n"
                info_text += f"  Odpad: {pattern['waste']}m\n"
                info_text += f"  Efektywność: {pattern['efficiency']}%\n"
                
                self.results_text.insert(tk.END, info_text)
                
                # Przycisk wizualizacji obok wzoru
                view_button = ttk.Button(
                    frame,
                    text="Pokaż podział",
                    command=lambda p=pattern: self.show_pattern(p)
                )
                view_button.pack(side=tk.RIGHT, padx=5)
                self.results_text.window_create(tk.END, window=frame)
                self.results_text.insert(tk.END, "\n" + "-"*50 + "\n")
            
            if results["extra_pieces"]:
                self.results_text.insert(tk.END, "\nDodatkowe kawałki:\n" + "-"*30 + "\n")
                for length_id, extra in results["extra_pieces"].items():
                    self.results_text.insert(tk.END, 
                        f"  Długość {extra['length']}m: +{extra['quantity']} sztuk\n")
            
            self.results_text.insert(tk.END, "\n" + "="*50 + "\n")
            self.results_text.insert(tk.END, 
                f"Wykorzystana długość: {results['total_used_length']}m\n")
            self.results_text.insert(tk.END, 
                f"Całkowity odpad: {results['waste']}m\n")
            self.results_text.insert(tk.END, 
                f"Efektywność: {results['efficiency']}%\n")
        else:
            self.results_text.insert(tk.END, "Nie znaleziono rozwiązania.")

    def show_pattern(self, pattern):
        # Konwersja wzoru na format dla wizualizacji
        pattern_data = {
            'total_length': self.current_log_length,
            'cuts': [{'length': cut_info['length']} 
                    for cut_info in pattern["cuts"].values()
                    for _ in range(cut_info['pieces'])],
            'waste': pattern['waste']
        }
        self.draw_cutting_pattern(pattern_data)

    def on_length_change(self, event=None):
        try:
            new_length = float(self.log_length_var.get())
            if new_length > 0:
                self.current_log_length = new_length
                self.draw_log(new_length)
                self.canvas.draw()
        except ValueError:
            pass

    def calculate(self):
        try:
            logging.debug("Starting calculation")
            log_length = float(self.log_length_var.get())
            logging.debug(f"Log length: {log_length}")
            self.draw_log(log_length)

            num_logs = self.num_logs.get()
            num_logs = int(num_logs) if num_logs.strip() else None
            logging.debug(f"Number of logs: {num_logs}")

            # Pobranie zamówień
            order_lengths = []
            order_quantities = []

            for length_entry, quantity_entry in self.orders_list:
                if length_entry.winfo_exists() and quantity_entry.winfo_exists():
                    try:
                        length = float(length_entry.get())
                        quantity = int(quantity_entry.get())
                        order_lengths.append(length)
                        order_quantities.append(quantity)
                        logging.debug(f"Added order: length={length}, quantity={quantity}")
                    except ValueError as ve:
                        logging.error(f"Value error in orders: {str(ve)}")
                        messagebox.showerror("Błąd",
                                             "Proszę wprowadzić poprawne wartości numeryczne dla wszystkich zamówień.")
                        return

            logging.debug(f"Final orders: lengths={order_lengths}, quantities={order_quantities}")

            logging.debug("Calling solver")
            results = solve_lumber_problem(log_length, order_lengths,
                                            order_quantities, num_logs, exact=self.exact_cuts.get())
            logging.debug(f"Solver results: {results}")

            self.display_results(results)

            if results["status"] == "Optimal" and results["patterns"]:
                first_pattern = next(iter(results["patterns"].values()))
                pattern_data = {
                    'total_length': log_length,
                    'cuts': [
                        {'length': cut_info['length']}
                        for cut_info in first_pattern["cuts"].values()
                        for _ in range(cut_info['pieces'])
                    ],
                    'waste': first_pattern['waste']
                }
                if self.visualization_enabled.get():  # Rysuj tylko jeśli wizualizacja jest włączona!
                    self.draw_cutting_pattern(pattern_data)

        except Exception as e:
            logging.error(f"Error in calculate: {str(e)}", exc_info=True)
            messagebox.showerror("Błąd", f"Wystąpił błąd: {str(e)}")

    def on_scroll(self, event):
        if event.inaxes == self.ax:
            self.last_interaction_time = time.time()
            zoom_factor = 1.1 if event.button == 'up' else 1/1.1
            self.zoom_scale *= zoom_factor
            self.zoom_scale = max(0.5, min(3.0, self.zoom_scale))
            
            self.ax.set_xlim(0, self.current_log_length*1.1/self.zoom_scale)
            radius = 0.2
            self.ax.set_ylim(-radius*2/self.zoom_scale, radius*2/self.zoom_scale)
            self.ax.set_zlim(-radius*2/self.zoom_scale, radius*2/self.zoom_scale)
            
            self.canvas.draw()

    def on_window_resize(self, event):
        # Aktualizacja rozmiaru wizualizacji przy zmianie rozmiaru okna
        if event.widget == self.root:
            self.update_visualization_size()
            
    def update_visualization_size(self):
        window_width = self.root.winfo_width()
        window_height = self.root.winfo_height()
        
        if window_width <= 1 or window_height <= 1:
            return
            
        # Zwiększenie przestrzeni na wizualizację
        bottom_frame_height = window_height * 0.6
        bottom_frame_width = window_width - 20  # Zmniejszony padding
        
        if bottom_frame_width > 0 and bottom_frame_height > 0:
            self.fig.set_size_inches(
                bottom_frame_width / self.fig.get_dpi(),
                bottom_frame_height / self.fig.get_dpi()
            )
            
            # Maksymalne wykorzystanie przestrzeni
            self.fig.subplots_adjust(left=0.01, right=0.99, bottom=0.01, top=0.99)
            
            self.canvas.draw()

    def add_order_row(self):
        # Tworzenie nowego wiersza zamówienia
        order_frame = ttk.Frame(self.scrollable_frame, style='Premium.TFrame')
        order_frame.pack(fill=tk.X, pady=2)

        ttk.Label(order_frame, text="Długość:", style='Premium.TLabel').pack(side=tk.LEFT, padx=(0, 2))
        length_entry = ttk.Entry(order_frame, width=10)
        length_entry.pack(side=tk.LEFT, padx=5)

        ttk.Label(order_frame, text="Ilość:", style='Premium.TLabel').pack(side=tk.LEFT, padx=(0, 2))
        quantity_entry = ttk.Entry(order_frame, width=10)
        quantity_entry.pack(side=tk.LEFT, padx=5)

        remove_button = ttk.Button(order_frame, text="Usuń", command=lambda: self.remove_order(order_frame), style='Small.TButton') # Zastosowanie stylu Small, by przycisk był mniejszy
        remove_button.pack(side=tk.LEFT, padx=5)

        # Dodanie do listy zamówień
        self.orders_list.append((length_entry, quantity_entry))

    def remove_order(self, order_frame):
        order_frame.destroy()
        self.orders_list = [order for order in self.orders_list if order[0].winfo_toplevel() != order_frame.winfo_toplevel()]

    def reset_app(self):
        # Resetowanie długości kłody
        self.log_length.delete(0, tk.END)
        self.log_length.insert(0, "2.0")  # Ustawienie domyślnej wartości
        self.current_log_length = 2.0
        self.log_length_var.set(str(self.current_log_length))

        # Resetowanie zamówień
        for order_frame in self.scrollable_frame.winfo_children():
            order_frame.destroy()
        self.orders_list.clear()  # Opróżnienie listy zamówień
        self.add_order_row()  # Dodajemy pusty wiersz

        # Resetowanie wyników
        self.results_text.delete(1.0, tk.END)
        # Przywracamy domyślne wartości zmiennych
        self.zoom_scale = 1.0
        self.rotation_active = True
        self.last_interaction_time = time.time()
        self.is_rotating = False
        self.visualization_enabled.set(True)
        if not self.canvas.get_tk_widget().winfo_ismapped():
            self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        self.draw_log(self.current_log_length)  # Ponowne rysowanie po resecie

    def toggle_visualization(self):
        if self.visualization_enabled.get():
            if not self.canvas.get_tk_widget().winfo_ismapped():  # sprawdza czy widget jest widoczny
                self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
                self.draw_log(self.current_log_length)  # Rysuj kłodę po włączeniu
        else:
            self.canvas.get_tk_widget().pack_forget()  # Ukryj widget Canvas


if __name__ == "__main__":
    root = ttk.Window(themename="cosmo")  # Poprawna inicjalizacja
    app = AppSelector(root)
    root.mainloop()

