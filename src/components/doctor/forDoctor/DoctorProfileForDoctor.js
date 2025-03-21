import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './doctorProfileForDoctor.css';
import { FaUserCircle } from 'react-icons/fa';  // Подключите стили

const DoctorProfileForDoctor = () => {
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const BASE_URL = 'http://localhost:8088/api/v1';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BASE_URL}/shared/doctors/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctor(response.data.data);
      } catch (err) {
        setError('Ошибка загрузки профиля врача');
        setIsErrorModalOpen(true);
        console.error(err);
      }
    };

    fetchDoctor();
  }, [userId]);

  const openModal = () => {
    setIsModalOpen(true);
    // Форма остается пустой при открытии
    setFormData({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/'); 
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
  
      // Формируем объект для обновления базовых данных
      const basicData = {};
      if (formData.name) basicData.name = formData.name;
      if (formData.email) basicData.email = formData.email;
      if (formData.age) basicData.age = Number(formData.age);
  
      // Формируем объект для обновления врачебных данных
      const doctorData = {};
      if (formData.education) doctorData.education = formData.education;
      if (formData.experience) doctorData.experience = Number(formData.experience);
      if (formData.specialty) doctorData.specialty = formData.specialty;
  
      // Обрабатываем список языков
      if (formData.languages) {
        // Разделяем строку по запятым и убираем лишние пробелы
        doctorData.languages = formData.languages
          .split(',')
          .map((lang) => lang.trim())
          .filter((lang) => lang.length > 0); // Убираем пустые строки
      }
  
      // Отправляем базовые данные, если они есть
      if (Object.keys(basicData).length > 0) {
        await axios.put(`${BASE_URL}/shared/users/update`, basicData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
  
      // Отправляем врачебные данные, если они есть
      if (Object.keys(doctorData).length > 0) {
        await axios.put(`${BASE_URL}/doctors/update`, doctorData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
  
      // Обновляем данные профиля после успешного обновления
      const response = await axios.get(`${BASE_URL}/shared/doctors/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctor(response.data.data);
  
      closeModal();
    } catch (err) {
      setError('Ошибка обновления данных');
      setIsErrorModalOpen(true);
      console.error(err);
    }
  };

  return (
    <div className="main-container no-scroll">
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

      <div className="profile-page no-scroll">
        <button className="back-button" onClick={() => navigate(-1)}>← Назад</button>
        <div className="profile-container">
          {doctor ? (
            <>
              <div className="profile-header">
                <div className="avatar-section">
                  <img
                    src={doctor.avatar_url || 'https://via.placeholder.com/150'}
                    alt={doctor.name}
                    className="profile-avatar"
                  />
                </div>
                <div className="profile-title">
                  <h1>{doctor.name}</h1>
                  <span className="doctor-specialty">{doctor.specialty || 'Не указана'}</span>
                </div>
              </div>

              <div className="profile-info">
                <h3>Ваш профиль врача</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{doctor.email || 'Не указан'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Стаж:</span>
                    <span className="info-value">{doctor.experience || 0} лет</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Образование:</span>
                    <span className="info-value">{doctor.education || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Языки:</span>
                    <span className="info-value">
                      {doctor.languages?.length > 0 ? doctor.languages.join(', ') : 'Не указаны'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Возраст:</span>
                    <span className="info-value">{doctor.age || 'Не указан'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Пол:</span>
                    <span className="info-value">
                      {doctor.gender === 'male' ? 'Мужской' : 'Женский'}
                    </span>
                  </div>
                </div>
              </div>

              <button className="edit-button" onClick={openModal}>
                <span role="img" aria-label="edit">✏️</span> Редактировать профиль
              </button>
            </>
          ) : (
            <h1 className="loading-message">Загрузка...</h1>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Редактировать профиль</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Имя:
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Возраст:
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Образование:
                <input
                  type="text"
                  name="education"
                  value={formData.education || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Стаж:
                <input
                  type="number"
                  name="experience"
                  value={formData.experience || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Специальность:
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Языки:
                <input
                  type="text"
                  name="languages"
                  value={formData.languages || ''}
                  onChange={handleInputChange}
                />
              </label>
              <div className="modal-buttons">
                <button type="button" onClick={closeModal}>Отмена</button>
                <button type="submit">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isErrorModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Ошибка</h2>
            <p>{error}</p>
            <button onClick={() => setIsErrorModalOpen(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfileForDoctor;