#!/bin/bash

echo "=== Sistema de Matchmaking Distribuido ==="
echo "=========================================="
echo ""
echo "1. Instalar dependencias"
echo "2. Compilar todo"
echo "3. Ejecutar Matchmaking Service"
echo "4. Ejecutar Game Engine"
echo "5. Ejecutar Test Client"
echo "6. Ejecutar sistema completo (auto)"
echo "7. Limpiar archivos compilados"
echo "8. Salir"
echo ""

read -p "Selecciona una opción (1-8): " choice

case $choice in
    1)
        echo ""
        echo "Instalando dependencias para Ubuntu..."
        sudo pacman -Syu
        sudo pacman -S build-essential
        sudo pacman -S nlohmann-json3-dev
        sudo pacman -S libwebsockets-dev
        sudo pacman -S libssl-dev
        echo "✅ Dependencias instaladas correctamente"
        
        # Verificar instalación
        echo ""
        echo "Verificando instalación..."
        if [ -f "/usr/include/nlohmann/json.hpp" ]; then
            echo "✅ nlohmann/json: Instalado"
        else
            echo "❌ nlohmann/json no encontrado"
        fi
        
        if pkg-config --exists libwebsockets; then
            echo "✅ libwebsockets: $(pkg-config --modversion libwebsockets)"
        else
            echo "❌ libwebsockets no encontrado"
        fi
        ;;
    2)
        echo ""
        echo "Compilando Matchmaking Service..."
        cd matchmaking
        make clean
        make
        if [ $? -eq 0 ]; then
            echo "✅ Matchmaking Service compilado"
        else
            echo "❌ Error compilando Matchmaking Service"
            exit 1
        fi
        cd ..
        
        echo ""
        echo "Compilando Game Engine..."
        cd game_engine
        make clean
        make
        if [ $? -eq 0 ]; then
            echo "✅ Game Engine compilado"
        else
            echo "❌ Error compilando Game Engine"
            exit 1
        fi
        cd ..
        ;;
        
    3)
        echo ""
        if [ ! -f "matchmaking/build/matchmaking_service" ]; then
            echo "Matchmaking service no encontrado. Compilando..."
            cd matchmaking && make && cd ..
        fi
        
        echo "Iniciando Matchmaking Service en puerto 9001..."
        echo "(Presiona Ctrl+C para detener)"
        cd matchmaking
        ./build/matchmaking_service
        ;;
    4)
        echo ""
        if [ ! -f "game_engine/game_orchestrator" ]; then
            echo "Game engine no encontrado. Compilando..."
            cd game_engine && make && cd ..
        fi
        
        echo "Iniciando Game Engine..."
        echo "(Presiona Ctrl+C para detener)"
        cd game_engine
        ./game_orchestrator
        ;;
    5)
        echo ""
        
        echo "Iniciando Test Client..."
        echo "Abre tu navegador en http://localhost:8001/cliente_matchmaking.html"
        python3 -m http.server 8001
        ;;
    6)
        echo ""
        echo "Iniciando sistema completo..."
        
        # Verificar que los ejecutables existan
        if [ ! -f "matchmaking/build/matchmaking_service" ] || [ ! -f "game_engine/game_orchestrator" ]; then
            echo "Compilando primero..."
            cd matchmaking && make clean && make && cd ..
            cd game_engine && make clean && make && cd ..
            g++ -std=c++17 -o test_client test_client.cpp -lpthread
        fi
        
        echo ""
        echo "🚀 Iniciando servicios..."
        echo ""
        echo "📋 INSTRUCCIONES:"
        echo "1. Se iniciará el Matchmaking Service en puerto 9001"
        echo "2. Se iniciará el Game Engine en puerto 9002"
        echo "3. Usa el Test Client para probar el sistema"
        echo "4. Presiona Ctrl+C en esta ventana para detener todo"
        echo ""
        
        # Función para cleanup
        cleanup() {
            echo ""
            echo "🛑 Deteniendo servicios..."
            kill $MATCHMAKING_PID 2>/dev/null
            kill $GAME_ENGINE_PID 2>/dev/null
            echo "✅ Sistema detenido"
            exit 0
        }
        
        # Capturar Ctrl+C
        trap cleanup SIGINT
        
        echo "Iniciando Matchmaking Service..."
        cd matchmaking
        ./build/matchmaking_service &
        MATCHMAKING_PID=$!
        cd ..
        
        sleep 3
        
        echo "Iniciando Game Engine..."
        cd game_engine
        ./game_orchestrator &
        GAME_ENGINE_PID=$!
        cd ..
        
        echo ""
        echo "✅ Sistema iniciado correctamente!"
        echo "📊 PIDs: Matchmaking=$MATCHMAKING_PID, GameEngine=$GAME_ENGINE_PID"
        echo ""
        echo "🧪 Para probar el sistema, abre otra terminal y ejecuta:"
        echo "   python3 -m http.server 8000 "
        echo "   Luego abre tu navegador en http://localhost:8000/cliente_matchmaking.html"
        echo ""
        echo "⏹️  Presiona Ctrl+C para detener el sistema..."
        
        # Esperar indefinidamente
        while true; do
            sleep 1
        done
        ;;
    7)
        echo ""
        echo "Limpiando archivos compilados..."
        cd matchmaking && make clean && cd ..
        cd game_engine && make clean && cd ..
        rm -f test_client
        echo "✅ Limpieza completada"
        ;;
    8)
        echo ""
        echo "👋 ¡Gracias por usar el Sistema de Matchmaking Distribuido!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Opción inválida. Por favor selecciona 1-8."
        ;;
esac
