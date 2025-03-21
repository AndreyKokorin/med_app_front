import React, { useState } from 'react';
import axios from 'axios';
import './AuthComponent.css';
import { useNavigate } from "react-router-dom";


const API_BASE_URL = 'http://localhost:8088/api/v1';

const AuthComponent = () => {
  // Состояния для форм и токенов
  const [activeTab, setActiveTab] = useState('login'); // login, register, reset, change
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    age: 0
  });
  const [resetEmail, setResetEmail] = useState('');
  const [changeData, setChangeData] = useState({ 
    email: '', 
    code: '', 
    newPassword: 0
  });
  const [tokens, setTokens] = useState({ access: '', refresh: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Обработчики ввода
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({ 
      ...registerData, 
      [name]: name === "age" ? Number(value) : value 
    });
  };
  
  const handleResetChange = (e) => {
    setResetEmail(e.target.value);
  };

  const handleChangePasswordChange = (e) => {
    setChangeData({ ...changeData, [e.target.name]: e.target.value });
  };

  // Функция для обновления access-токена
  const refreshToken = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/refresh`, {
        refresh: tokens.refresh
      });
      setTokens({ ...tokens, access: response.data.access });
      return response.data.access;
    } catch (err) {
      setError('Срок действия токена истек. Пожалуйста, войдите заново.');
      setTokens({ access: '', refresh: '' });
      throw err;
    }
  };

  // Axios интерцептор для обработки истекших токенов
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && tokens.refresh) {
        try {
          const newAccessToken = await refreshToken();
          error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  // Обработчик входа
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      const accessToken = response.data["Access-token"];
      const refreshToken = response.data["Refresh-token"];
      
      // Сохраняем токены в состояние
      setTokens({
        access: accessToken,
        refresh: refreshToken
      });
      
      // Сохраняем токены в localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Декодируем access token для получения user_id
      const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = decodedToken.user_id || decodedToken.id; // Зависит от структуры вашего токена
      
      // Сохраняем user_id в localStorage как userId
      localStorage.setItem('userId', userId);
      localStorage.setItem('user_id', userId);

      setSuccess('Успешный вход в систему!');
      setLoginData({ email: '', password: '' });
      
      // Перенаправление на RoleBasedComponent
      navigate('/role-based');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    }
  };
  
  // Обработчик регистрации
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      setSuccess('Регистрация прошла успешно! Теперь вы можете войти.');
      setRegisterData({ name: '', email: '', password: '', age: '' });
      setActiveTab('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  // Обработчик отправки запроса на сброс пароля
  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/auth/password/reset`, { email: resetEmail });
      setSuccess('Код для сброса пароля отправлен на ваш email!');
      setResetEmail('');
      setActiveTab('change');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке кода');
    }
  };

  // Обработчик смены пароля
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/auth/password/change`, changeData);
      setSuccess('Пароль успешно изменен! Теперь вы можете войти.');
      setChangeData({ email: '', code: '', newPassword: '' });
      setActiveTab('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при смене пароля');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Медицинский центр</h2>
        
        {/* Вкладки */}
        <div className="tabs">
          <button 
            className={activeTab === 'login' ? 'active' : ''} 
            onClick={() => setActiveTab('login')}
          >
            Вход
          </button>
          <button 
            className={activeTab === 'register' ? 'active' : ''} 
            onClick={() => setActiveTab('register')}
          >
            Регистрация
          </button>
          <button 
            className={activeTab === 'reset' ? 'active' : ''} 
            onClick={() => setActiveTab('reset')}
          >
            Сброс пароля
          </button>
        </div>

        {/* Форма входа */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              name="email"
              value={loginData.email}
              onChange={handleLoginChange}
              placeholder="Email"
              required
            />
            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              placeholder="Пароль"
              required
            />
            <button type="submit">Войти</button>
          </form>
        )}

        {/* Форма регистрации */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <input
              type="text"
              name="name"
              value={registerData.name}
              onChange={handleRegisterChange}
              placeholder="Имя"
              required
            />
            <input
              type="email"
              name="email"
              value={registerData.email}
              onChange={handleRegisterChange}
              placeholder="Email"
              required
            />
            <input
              type="password"
              name="password"
              value={registerData.password}
              onChange={handleRegisterChange}
              placeholder="Пароль"
              required
            />
            <input
              type="number"
              name="age"
              value={registerData.age}
              onChange={handleRegisterChange}
              placeholder="Возраст"
              required
            />
            <button type="submit">Зарегистрироваться</button>
          </form>
        )}

        {/* Форма сброса пароля */}
        {activeTab === 'reset' && (
          <form onSubmit={handleResetRequest} className="auth-form">
            <input
              type="email"
              value={resetEmail}
              onChange={handleResetChange}
              placeholder="Введите ваш email"
              required
            />
            <button type="submit">Отправить код</button>
          </form>
        )}

        {/* Форма смены пароля */}
        {activeTab === 'change' && (
          <form onSubmit={handleChangePassword} className="auth-form">
            <input
              type="email"
              name="email"
              value={changeData.email}
              onChange={handleChangePasswordChange}
              placeholder="Email"
              required
            />
            <input
              type="text"
              name="code"
              value={changeData.code}
              onChange={handleChangePasswordChange}
              placeholder="Код из email"
              required
            />
            <input
              type="password"
              name="newPassword"
              value={changeData.newPassword}
              onChange={handleChangePasswordChange}
              placeholder="Новый пароль"
              required
            />
            <button type="submit">Сменить пароль</button>
          </form>
        )}

        {/* Сообщения */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    </div>
  );
};

export default AuthComponent;