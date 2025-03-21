import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorsList.css';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://localhost:8088/api/v1/shared/doctors', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(response.data.doctors);
        setFilteredDoctors(response.data.doctors);

        // Собираем уникальные специальности
        const uniqueSpecialties = [...new Set(response.data.doctors.map(doctor => doctor.specialty))];
        setSpecialties(uniqueSpecialties);
      } catch (err) {
        setError('Ошибка загрузки списка врачей');
        console.error(err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter(doctor => {
      const matchesName = doctor.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesSpecialty = specialtyFilter ? doctor.specialty === specialtyFilter : true;
      return matchesName && matchesSpecialty;
    });
    setFilteredDoctors(filtered);
  }, [nameFilter, specialtyFilter, doctors]);

  return (
    <div className="main-container no-scroll">
      <header className="header">
        <div className="logo">Медицинский центр</div>
        <nav className="nav-menu">
          <Link to="/services" className="nav-item">Услуги</Link>
          <Link to="/doctors-list" className="nav-item">Врачи</Link>
          <Link to="/about" className="nav-item">О нас</Link>
          <Link to="/contacts" className="nav-item">Контакты</Link>
        </nav>
      </header>

      <div className="doctors-page no-scroll">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <div className="doctors-container">
          <h1 className="doctors-title">Наши врачи</h1>
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="nameFilter">Поиск по имени:</label>
              <input
                type="text"
                id="nameFilter"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Введите имя"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="specialtyFilter">Специальность:</label>
              <select
                id="specialtyFilter"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
              >
                <option value="">Все специальности</option>
                {specialties.map((specialty, index) => (
                  <option key={index} value={specialty}>
                    {specialty || 'Не указана'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error ? (
            <h1 className="error-message">{error}</h1>
          ) : filteredDoctors.length > 0 ? (
            <div className="doctors-list">
              {filteredDoctors.map((doctor) => (
                <Link
                  key={doctor.user_id}
                  to={`/doctors/${doctor.user_id}`}
                  className="doctor-card"
                >
                  <img
                    src={doctor.avatar_url || 'https://via.placeholder.com/100'}
                    alt={doctor.name}
                    className="doctor-avatar"
                  />
                  <div className="doctor-info">
                    <h3>{doctor.name}</h3>
                    <p><strong>Специальность:</strong> {doctor.specialty || 'Не указана'}</p>
                    <p><strong>Стаж:</strong> {doctor.experience} лет</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <h1 className="loading-message">Загрузка...</h1>
          )}
        </div>
      </div>
    </div>

    
  );
};

export default DoctorsList;