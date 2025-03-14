import pygame
import sys

# Inicjalizacja Pygame
pygame.init()

# Ustawienia okna gry
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Echoes of Darkness")

# Kolory
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)

# Klasa Gracza
class Player(pygame.sprite.Sprite):
    def __init__(self, x, y, size):
        super().__init__()
        self.image = pygame.Surface([size, size])  # Tymczasowy obraz gracza (kwadrat)
        self.image.fill(WHITE)  # Kolor gracza
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.speed = 5  # Prędkość gracza

    def update(self):
        # Obsługa ruchu gracza (na razie brak implementacji)
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            self.rect.x -= self.speed
        if keys[pygame.K_RIGHT]:
            self.rect.x += self.speed
        if keys[pygame.K_UP]:
            self.rect.y -= self.speed
        if keys[pygame.K_DOWN]:
            self.rect.y += self.speed

        # Ograniczenie ruchu gracza do granic ekranu
        if self.rect.left < 0:
            self.rect.left = 0
        if self.rect.right > SCREEN_WIDTH:
            self.rect.right = SCREEN_WIDTH
        if self.rect.top < 0:
            self.rect.top = 0
        if self.rect.bottom > SCREEN_HEIGHT:
            self.rect.bottom = SCREEN_HEIGHT


# Grupy Sprite
all_sprites = pygame.sprite.Group()
player_group = pygame.sprite.Group()  # Oddzielna grupa dla gracza (potrzebne później)

# Inicjalizacja gracza
player = Player(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2, 20)  # Gracz na środku ekranu, rozmiar 20x20
all_sprites.add(player)
player_group.add(player)

# Pętla Gry
running = True
clock = pygame.time.Clock()  # Kontrola FPS

while running:
    # Obsługa zdarzeń
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        # Dodatkowe zdarzenia (np. klawisze) dodajemy tutaj

    # Aktualizacja
    all_sprites.update()

    # Renderowanie
    screen.fill(BLACK)  # Wyczyść ekran (na czarno)
    all_sprites.draw(screen)  # Narysuj wszystkie sprite'y
    pygame.display.flip()  # Aktualizuj ekran

    # Kontrola FPS
    clock.tick(60)  # Ustaw FPS na 60

# Zakończenie Pygame
pygame.quit()
sys.exit()