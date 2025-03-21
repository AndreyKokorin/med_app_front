import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MainPageUser.css';

const MainPageUser = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const extractUserId = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/');
        return;
      }
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.user_id) {
            localStorage.setItem('user_id', payload.user_id);
          }
        }
      } catch (error) {
        console.error('Ошибка при разборе токена:', error);
      }
    };

    extractUserId();
  }, [navigate]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="main-container">
      <header className="header">
        <h1 className="logo">Медицинский центр</h1>
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className="menu-icon"></span>
        </button>
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/services" className="nav-item">Услуги</Link>
          <Link to="/doctors-list" className="nav-item">Врачи</Link>
          <Link to="/about" className="nav-item">О нас</Link>
          <Link to="/contacts" className="nav-item">Контакты</Link>
          {/* Здесь можно добавить дополнительные ссылки */}
          <Link to="/news" className="nav-item">Новости</Link>
          <Link to="/reviews" className="nav-item">Отзывы</Link>
        </nav>
      </header>

      <main className="content">
        <div className="hero-section">
          <h2 className="welcome-title">Ваше здоровье — наш приоритет</h2>
          <p className="welcome-text">
            Современная медицина, опытные специалисты и индивидуальный подход к каждому пациенту.
          </p>
          <div className="buttons">
            <Link to="/appointment" className="btn primary">Записаться на приём</Link>
            <Link to="/user-profile" className="btn secondary">Личный кабинет</Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 Медицинский центр. Все права защищены.</p>
      </footer>
    </div>
  );
};

export default MainPageUser;