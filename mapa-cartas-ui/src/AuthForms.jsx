import React, { useState } from 'react';
import { useAuth } from './API/useAuthApi';
import './AuthForms.css';

/**
 * Componente de formulario de inicio de sesión
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Componente de formulario de inicio de sesión
 */
export function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username || !password) {
      setErrorMessage('Por favor, complete todos los campos');
      return;
    }

    try {
      await login(username, password);
      if (onSuccess) onSuccess();
    } catch (error) {
      setErrorMessage(error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Iniciar Sesión</h2>
      {errorMessage && <div className="auth-error">{errorMessage}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Usuario o Email</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}

/**
 * Componente de formulario de registro
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Componente de formulario de registro
 */
export function RegisterForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { register, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage('Por favor, complete todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      await register({ username, email, password });
      if (onSuccess) onSuccess();
    } catch (error) {
      setErrorMessage(error.message || 'Error al registrarse');
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Registro</h2>
      {errorMessage && <div className="auth-error">{errorMessage}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="register-username">Usuario</label>
          <input
            type="text"
            id="register-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            type="email"
            id="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Contraseña</label>
          <input
            type="password"
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Cargando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

/**
 * Componente que muestra información del usuario actual
 * @returns {JSX.Element} - Componente de información de usuario
 */
export function UserInfo() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="user-info">
      <span>Bienvenido, {user.username}</span>
      <button onClick={logout} className="logout-button">
        Cerrar Sesión
      </button>
    </div>
  );
}
