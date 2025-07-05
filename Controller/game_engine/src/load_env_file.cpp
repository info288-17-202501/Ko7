#pragma once
#include <string>
#include <fstream>
#include <iostream>
#include <cstdlib>

// Carga variables desde archivo .env
void loadEnvFile(const std::string& filename = ".env") {
    std::ifstream file(filename);
    std::string line;
    
    while (std::getline(file, line)) {
        // Ignorar líneas comentadas o vacías
        if (line.empty() || line[0] == '#' || line[0] == '/') continue;
        
        // Buscar el signo =
        auto pos = line.find('=');
        if (pos != std::string::npos) {
            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);
            
            // En Windows
            #ifdef _WIN32
            _putenv_s(key.c_str(), value.c_str());
            // En Unix/Linux
            #else
            setenv(key.c_str(), value.c_str(), 1);
            #endif
        }
    }
}