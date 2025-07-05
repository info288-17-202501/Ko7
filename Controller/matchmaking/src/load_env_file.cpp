#include <fstream>
#include <string>
#include <cstdlib>

void loadEnvFile(const std::string& filename = ".env") {
    std::ifstream file(filename);
    if (!file.is_open()) {
        return; // No hacer nada si el archivo no existe
    }
    
    std::string line;
    while (std::getline(file, line)) {
        // Ignorar líneas vacías y comentarios
        if (line.empty() || line[0] == '#') {
            continue;
        }
        
        // Buscar el signo =
        size_t pos = line.find('=');
        if (pos == std::string::npos) {
            continue;
        }
        
        std::string key = line.substr(0, pos);
        std::string value = line.substr(pos + 1);
        
        // Remover espacios en blanco
        key.erase(0, key.find_first_not_of(" \t"));
        key.erase(key.find_last_not_of(" \t") + 1);
        value.erase(0, value.find_first_not_of(" \t"));
        value.erase(value.find_last_not_of(" \t") + 1);
        
        // Establecer variable de entorno
#ifdef _WIN32
        _putenv_s(key.c_str(), value.c_str());
#else
        setenv(key.c_str(), value.c_str(), 1);
#endif
    }
    
    file.close();
}
