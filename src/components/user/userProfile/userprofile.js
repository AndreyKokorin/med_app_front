import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const BASE_URL = 'http://localhost:8088/api/v1';
  const userId = localStorage.getItem('userId');

  const genderTranslations = {
    male: 'Мужской',
    female: 'Женский',
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/shared/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      localStorage.setItem('userId', response.data.id);
    } catch {
      setError('Ошибка загрузки профиля');
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/shared/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userAppointments = response.data.data.filter(
        (appointment) => appointment.patient_id === Number(userId)
      );
      setAppointments(userAppointments);

      const doctorIds = [...new Set(userAppointments.map((app) => app.doctor_id))];
      const doctorPromises = doctorIds.map((doctorId) =>
        axios.get(`${BASE_URL}/shared/doctors/${doctorId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const doctorResponses = await Promise.all(doctorPromises);
      const doctorsData = doctorResponses.reduce((acc, res) => {
        const doctor = res.data.data;
        acc[doctor.user_id] = doctor;
        return acc;
      }, {});
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Ошибка загрузки записей или данных врачей:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${BASE_URL}/shared/users/avatar`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      window.location.reload();
    } catch {
      setError('Ошибка загрузки аватара');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
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

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    return isoString.replace('T', ' ').replace('Z', '');
  };

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  const formatInputDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const updatedData = {};

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== '' && formData[key] !== undefined && formData[key] !== null) {
          if (key === 'age') {
            updatedData[key] = Number(formData[key]);
          } else if (key === 'date_of_birth') {
            updatedData[key] = formatInputDateToDDMMYYYY(formData[key]);
          } else {
            updatedData[key] = formData[key];
          }
        }
      });

      if (updatedData.gender && !['male', 'female'].includes(updatedData.gender)) {
        delete updatedData.gender;
      }

      await axios.put(`${BASE_URL}/shared/users/update`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchProfile();
      closeModal();
    } catch (err) {
      setError('Ошибка обновления данных');
      console.error(err);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Пользователь не авторизован');
        setIsErrorModalOpen(true);
        return;
      }

      await axios.put(
        `${BASE_URL}/shared/appointments/${appointmentId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const appointmentsResponse = await axios.get(`${BASE_URL}/shared/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userAppointments = appointmentsResponse.data.data.filter(
        (appointment) => appointment.patient_id === Number(userId)
      );
      setAppointments(userAppointments);

      setIsSuccessModalOpen(true);
    } catch (err) {
      setError('Ошибка удаления записи');
      setIsErrorModalOpen(true);
      console.error(err);
    }
  };

  const groupAppointmentsByDate = (appointments) => {
    const groupedAppointments = {};
    appointments.forEach((appointment) => {
      const date = appointment.slot_start_time.split('T')[0];
      if (!groupedAppointments[date]) {
        groupedAppointments[date] = [];
      }
      groupedAppointments[date].push(appointment);
    });
    return groupedAppointments;
  };

  const groupedAppointments = groupAppointmentsByDate(appointments);

  return (
    <div className="main-container no-scroll">
      {/* Шапка остается без изменений */}
      <header className="header">
        <div className="logo">Медицинский центр</div>
        <nav className="nav-menu">
          <Link to="/services" className="nav-item">Услуги</Link>
          <Link to="/doctors-" className="nav-item">Врачи</Link>
          <Link to="/about" className="nav-item">О нас</Link>
          <Link to="/contacts" className="nav-item">Контакты</Link>
        </nav>
      </header>

      <div className="profile-page no-scroll">
        <button className="back-button" onClick={() => navigate(-1)}>← Назад</button>
        <div className="profile-container">
          {error && !profile ? (
            <h1 className="error-message">{error}</h1>
          ) : profile ? (
            <>
              <div className="profile-header">
                <div className="avatar-section">
                  <img
                    src={profile.avatar_url || 'https://via.placeholder.com/150'}
                    alt="Аватар"
                    className="profile-avatar"
                  />
                  <label className="upload-button">
                    {loading ? 'Загрузка...' : 'Изменить фото'}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                  </label>
                </div>
                <div className="profile-title">
                  <h1>{profile.name}</h1>
                  <button className="edit-button" onClick={openModal}>
                    <span role="img" aria-label="edit">✏️</span> Редактировать
                  </button>
                </div>
              </div>

              <div className="profile-info">
                <div className="info-card">
                  <h3>Контактные данные</h3>
                  <p><strong>Email:</strong> {profile.email || 'Не указан'}</p>
                  <p><strong>Телефон:</strong> {profile.phone_number || 'Не указан'}</p>
                  <p><strong>Адрес:</strong> {profile.address || 'Не указан'}</p>
                </div>
                <div className="info-card">
                  <h3>Личные данные</h3>
                  <p><strong>Возраст:</strong> {profile.age || 'Не указан'}</p>
                  <p><strong>Пол:</strong> {genderTranslations[profile.gender] || 'Не указан'}</p>
                  <p><strong>Дата рождения:</strong> {profile.date_of_birth ? formatDateToDDMMYYYY(profile.date_of_birth) : 'Не указана'}</p>
                </div>
              </div>

              {/* Слоты записи остаются без изменений */}
              <div className="appointments-section">
                <h3>Ваши записи на прием</h3>
                {Object.keys(groupedAppointments).length > 0 ? (
                  Object.keys(groupedAppointments).map((date) => (
                    <div key={date} className="date-section">
                      <h4>{formatDateToDDMMYYYY(date)}</h4>
                      <div className="appointments-list">
                        {groupedAppointments[date].map((appointment) => {
                          const doctor = doctors[appointment.doctor_id] || {};
                          return (
                            <div key={appointment.appointment_id} className="appointment-card">
                              <div className="appointment-left">
                                <div className="appointment-time-status">
                                  <span className="appointment-time">
                                    {formatDateTime(appointment.slot_start_time)}
                                  </span>
                                  <span
                                    className={`appointment-status ${
                                      appointment.appointment_status === 'Pending' ? 'pending' : 'cancelled'
                                    }`}
                                  >
                                    {appointment.appointment_status === 'Pending' ? 'Ожидает' : 'Отменено'}
                                  </span>
                                </div>
                              </div>
                              <div className="appointment-right">
                                <div className="appointment-doctor">
                                  <span className="doctor-name">{doctor.name || 'Неизвестно'}</span>
                                  <span className="doctor-info">
                                    {doctor.specialty || 'Не указана'} | Стаж: {doctor.experience || 0} лет
                                  </span>
                                  <span className="doctor-id">ID: {appointment.doctor_id}</span>
                                </div>
                                {appointment.appointment_status !== 'Cancel' && (
                                  <button
                                    className="cancel-button"
                                    onClick={() => handleCancelAppointment(appointment.appointment_id)}
                                  >
                                    Отменить
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-appointments">Нет записей на прием</p>
                )}
              </div>
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
                Пол:
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Выберите</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </label>
              <label>
                Дата рождения:
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Телефон:
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Адрес:
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
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

      {isSuccessModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Успешно!</h2>
            <p>Запись успешно удалена</p>
            <button onClick={() => setIsSuccessModalOpen(false)}>Закрыть</button>
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

export default UserProfile;