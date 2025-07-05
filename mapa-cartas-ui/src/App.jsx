import React, { useState } from 'react';
import Login from './Login.jsx';
import MainMenu from './MainMenu.jsx';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLogin = (userData) => {
    console.log('App recibió userData:', userData);
    setUserData(userData);
    setIsLoggedIn(true);
    
    // Opcional: guardar en localStorage para persistencia
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    setIsLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userData');
  };

  // Opcional: verificar si hay datos guardados al cargar
  React.useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserData(parsed);
        setIsLoggedIn(true);
        console.log('Datos restaurados:', parsed);
      } catch (error) {
        console.error('Error al restaurar datos:', error);
        localStorage.removeItem('userData');
      }
    }
  }, []);

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return <MainMenu userData={userData} onLogout={handleLogout} />;
};

export default App;