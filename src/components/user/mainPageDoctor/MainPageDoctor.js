import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MainPageUser.css';
import { FaUserCircle } from 'react-icons/fa'; 


const MainPageDoctor = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const extractDoctorId = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/doctor-login');
        return;
      }
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.doctor_id) {
            localStorage.setItem('doctor_id', payload.doctor_id);
          }
        }
      } catch (error) {
        console.error('Ошибка при разборе токена:', error);
      }
    };

    extractDoctorId();
  }, [navigate]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/'); 
  };

  return (
    <div className="main-container">
       <header className="header">
              <div className="logo">Медицинский центр</div>
              <nav className="nav-menu">
                <Link to="/services" className="nav-item">Услуги</Link>
                <Link to="/doctors-list" className="nav-item">Врачи</Link>
                <Link to="/about" className="nav-item">О нас</Link>
                <Link to="/contacts" className="nav-item">Контакты</Link>
                <div className="profile-icon" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <FaUserCircle size={24} />
                {isProfileMenuOpen && (
                  <div className="profile-dropdown">
                    <Link to="/doctor-profile-for-doctors" className="dropdown-item">Профиль</Link>
                    <button onClick={handleLogout} className="dropdown-item">Выйти</button>
                  </div>
                )}
              </div>
              </nav>
            </header>

      <main className="content">
        <div className="hero-section">
          <h2 className="welcome-title">Ваш профессиональный портал</h2>
          <p className="welcome-text">
            Удобный доступ к расписанию, медицинским данным и инструментам для эффективной работы.
          </p>
          <div className="buttons">
            <Link to="/doctor-schedule" className="btn primary">Моё расписание</Link>
            <Link to="/doctor-profile-for-doctors" className="btn secondary">Ваш профиль врача</Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 Медицинский центр. Портал для врачей.</p>
      </footer>
    </div>
  );
};

export default MainPageDoctor;