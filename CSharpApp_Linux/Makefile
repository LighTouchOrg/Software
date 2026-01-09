.PHONY: build clean publish-win publish-linux help check-dotnet

# Variables
PROJECT_DIR = CSharpApp
PROJECT_FILE = $(PROJECT_DIR)/LighTouch.csproj
OUTPUT_DIR = bin
PUBLISH_DIR_WIN = $(OUTPUT_DIR)/publish-win
PUBLISH_DIR_LINUX = $(OUTPUT_DIR)/publish-linux

# Détection du système d'exploitation
ifeq ($(OS),Windows_NT)
    RUNTIME = win-x64
else
    RUNTIME = linux-x64
endif

check-dotnet:
	@command -v dotnet >/dev/null 2>&1 || { \
		echo "Erreur: dotnet n'est pas installé."; \
		echo "Installez le SDK .NET 9.0 depuis: https://dotnet.microsoft.com/download"; \
		exit 1; \
	}
	@echo "dotnet version: $$(dotnet --version)"

help:
	@echo "Commandes disponibles:"
	@echo "  make check-dotnet   - Vérifie si dotnet est installé"
	@echo "  make install-deps   - Installe les dépendances système (Linux)"
	@echo "  make build          - Compile le projet (Debug)"
	@echo "  make run            - Compile et exécute le projet"
	@echo "  make publish-win    - Compile pour Windows (standalone)"
	@echo "  make publish-linux  - Compile pour Linux (standalone)"
	@echo "  make clean          - Nettoie les fichiers générés"

install-deps:
	@echo "Installation des dépendances système..."
	@if [ "$(shell uname)" = "Linux" ]; then \
		echo "Installation de xdotool pour le contrôle souris/clavier..."; \
		sudo apt-get update && sudo apt-get install -y xdotool; \
	else \
		echo "Pas de dépendances système à installer sur cette plateforme"; \
	fi

build: check-dotnet
	@echo "Compilation en mode Debug..."
	dotnet build $(PROJECT_FILE) --configuration Debug

run: build
	@echo "Exécution de l'application..."
	dotnet run --project $(PROJECT_FILE)

publish-win: check-dotnet
	@echo "Compilation pour Windows (standalone)..."
	dotnet publish $(PROJECT_FILE) \
		--configuration Release \
		--runtime win-x64 \
		--self-contained true \
		--output $(PUBLISH_DIR_WIN) \
		/p:PublishSingleFile=true \
		/p:IncludeNativeLibrariesForSelfExtract=true \
		/p:PublishReadyToRun=true \
		/p:EnableCompressionInSingleFile=true

publish-linux: check-dotnet
	@echo "Compilation pour Linux (standalone)..."
	dotnet publish $(PROJECT_FILE) \
		--configuration Release \
		--runtime linux-x64 \
		--self-contained true \
		--output $(PUBLISH_DIR_LINUX) \
		/p:PublishSingleFile=true \
		/p:IncludeNativeLibrariesForSelfExtract=true \
		/p:PublishReadyToRun=true \
		/p:EnableCompressionInSingleFile=true

clean:
	@echo "Nettoyage des fichiers générés..."
	dotnet clean $(PROJECT_FILE)
	rm -rf $(OUTPUT_DIR)
