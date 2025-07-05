import React, { useState } from 'react';
import './styles/animations.css';
import './styles/background.css';
import './styles/screen.css';
import './styles/server-list.css';

const Login = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true); // true = Login, false = Register
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Limpiar mensajes cuando se cambia entre login/register
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: ''
    });
  };

  // Validaciones
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Por favor ingresa un nombre de usuario');
      return false;
    }

    if (formData.username.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }

    if (formData.username.length > 16) {
      setError('El nombre no puede tener más de 16 caracteres');
      return false;
    }

    if (!formData.password) {
      setError('Por favor ingresa una contraseña');
      return false;
    }

    if (formData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return false;
    }

    // Validaciones adicionales para registro
    if (!isLoginMode) {
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }

      if (formData.password.length > 50) {
        setError('La contraseña no puede tener más de 50 caracteres');
        return false;
      }
    }

    return true;
  };

  // Función para registro
  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });

      let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Error parseando respuesta:', e);
            data = {};
        }

        if (response.ok) {
            setSuccess('¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.');
            setError('');
            
           setTimeout(() => {
              setIsLoginMode(true);
              setSuccess('');
              setFormData({
                username: formData.username, // Mantener el username
                password: '',
                confirmPassword: ''
              });
            }, 2000);
        } else {
            console.error('Error registro:', data);
            setError(data.detail || data.error || 'Error al registrar usuario');
        }
    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error de conexión. Por favor intenta de nuevo.');
    }
  };

  // Función para login
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login exitoso:', data.user);
        
        // Preparar datos del usuario para la aplicación
        const userData = {
          id: data.user?.id || data.id || 'unknown',
          username: data.user?.username || data.username || 'unknown',
          loginTime: new Date().toISOString(),
          token: data.token
        };

        onLogin(userData);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Por favor intenta de nuevo.');
    }
  };

  // Manejar submit del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLoginMode) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
    e.target.focus();
  };

  return (
    <div className="login-container fade-in">
      {/* Título principal */}
      <div className="login-title-container">
        <h1 className="login-title rgb-text-effect">
          {(isLoginMode ? 'CYBER LOGIN' : 'CYBER REGISTER').split('').map((char, index) => (
            <span 
              key={index} 
              className="char" 
              style={{'--char-index': index}}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>
        <div className="login-subtitle">
          {isLoginMode 
            ? 'Ingresa tus credenciales para continuar' 
            : 'Crea tu cuenta para comenzar la aventura'
          }
        </div>
      </div>

      {/* Formulario de login/register */}
      <div className="login-form slide-up">
        
        {/* Campo Username */}
        <div className="input-container">
          <label className="input-label rgb-text-effect">
            Username
          </label>
          <div className="cyber-input-wrapper">
            <input
              type="text"
              className="cyber-input"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={handleInputClick}
              placeholder="Ingresa tu nombre..."
              maxLength={16}
              disabled={isLoading}
              autoFocus
              autoComplete="username"
              tabIndex={0}
            />
            <div className="input-border"></div>
          </div>
          <div className="char-counter">
            {formData.username.length}/16
          </div>
        </div>

        {/* Campo Password */}
        <div className="input-container">
          <label className="input-label rgb-text-effect">
            Password
          </label>
          <div className="cyber-input-wrapper">
            <input
              type="password"
              className="cyber-input"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={handleInputClick}
              placeholder="Ingresa tu contraseña..."
              maxLength={50}
              disabled={isLoading}
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              tabIndex={0}
            />
            <div className="input-border"></div>
          </div>
          <div className="char-counter">
            {formData.password.length}/50
          </div>
        </div>

        {/* Campo Confirmar Password (solo en registro) */}
        {!isLoginMode && (
          <div className="input-container">
            <label className="input-label rgb-text-effect">
              Confirmar Password
            </label>
            <div className="cyber-input-wrapper">
              <input
                type="password"
                className="cyber-input"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={handleInputClick}
                placeholder="Confirma tu contraseña..."
                maxLength={50}
                disabled={isLoading}
                autoComplete="new-password"
                tabIndex={0}
              />
              <div className="input-border"></div>
            </div>
            <div className="char-counter">
              {formData.confirmPassword.length}/50
            </div>
          </div>
        )}

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {success}
          </div>
        )}

        {/* Botón principal */}
        <button 
          className={`cybr-btn join-server aggressive-shape small ${isLoading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading || !formData.username.trim() || !formData.password}
          type="button"
          style={{ background: 'transparent' }}
        >
          {isLoading ? (
            <>
              <span className="loading-dots">
                {isLoginMode ? 'Conectando' : 'Registrando'}
              </span>
              <span aria-hidden></span>
              <span aria-hidden className="cybr-btn__glitch">
                {isLoginMode ? 'Iniciando...' : 'Creando...'}
              </span>
              <span aria-hidden className="cybr-btn__tag custom">●●●</span>
            </>
          ) : (
            <>
              {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
              <span aria-hidden></span>
              <span aria-hidden className="cybr-btn__glitch">
                {isLoginMode ? 'CONNECT' : 'CREATE'}
              </span>
              <span aria-hidden className="cybr-btn__tag custom">ENT</span>
            </>
          )}
        </button>

        {/* Botón para cambiar entre login/register */}
        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <button 
            className="cybr-btn special small "
            onClick={toggleMode}
            disabled={isLoading}
            type="button"
            style={{ backgroundColor: 'transparent' }}
          >
            {isLoginMode ? (
              <>
                Regístrate<span aria-hidden></span>
                <span aria-hidden className="cybr-btn__glitch">Sign Up</span>
                <span aria-hidden className="cybr-btn__tag custom">NEW</span>
              </>
            ) : (
              <>
                Inicia Sesión<span aria-hidden></span>
                <span aria-hidden className="cybr-btn__glitch">Sign In</span>
                <span aria-hidden className="cybr-btn__tag custom">LOG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Elementos decorativos */}
      <div className="cyber-grid"></div>
      <div className="scanlines"></div>
      
      {/* Partículas flotantes */}
      <div className="floating-particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
    </div>
  );
};

export default Login;