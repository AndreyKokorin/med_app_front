import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './doctorProfile.css';

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const BASE_URL = 'http://localhost:8088/api/v1';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BASE_URL}/shared/doctors/${id}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctor(response.data.data);
      } catch (err) {
        setError('Ошибка загрузки профиля врача');
        setIsErrorModalOpen(true);
        console.error(err);
      }
    };

    const fetchSlots = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BASE_URL}/shared/doctors/${id}/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSlots(response.data.data);
      } catch (err) {
        setError('Ошибка загрузки слотов времени');
        setIsErrorModalOpen(true);
        console.error(err);
      }
    };

    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BASE_URL}/shared/appointments`, {
          params: { doctor_id: id },
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(response.data.data);
      } catch (err) {
        console.error('Ошибка загрузки записей:', err);
      }
    };

    fetchDoctor();
    fetchSlots();
    fetchAppointments();
  }, [id]);

  const formatTime = (isoString) => {
    return isoString.replace('T', ' ').replace('Z', '');
  };

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  const groupSlotsByDate = (slots) => {
    const groupedSlots = {};
    slots.forEach((slot) => {
      const date = slot.start_time.split('T')[0];
      if (!groupedSlots[date]) {
        groupedSlots[date] = [];
      }
      groupedSlots[date].push(slot);
    });
    return groupedSlots;
  };

  const isCurrentUserBooked = (slotId) => {
    return appointments.some(
      (appointment) =>
        appointment.slot_id === slotId &&
        appointment.patient_id === Number(userId) &&
        appointment.appointment_status !== 'Cancel'
    );
  };

  const isSlotBookedByOther = (slotId) => {
    return appointments.some(
      (appointment) =>
        appointment.slot_id === slotId &&
        appointment.patient_id !== Number(userId) &&
        appointment.appointment_status !== 'Cancel'
    );
  };

  const isCurrentUserCancelled = (slotId) => {
    return appointments.some(
      (appointment) =>
        appointment.slot_id === slotId &&
        appointment.patient_id === Number(userId) &&
        appointment.appointment_status === 'Cancel'
    );
  };

  const handleBookAppointment = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!userId) {
        setError('Пользователь не авторизован');
        setIsErrorModalOpen(true);
        return;
      }

      const patientIdInt = Number(userId);
      const slotIdInt = Number(selectedSlot.id);
      const scheduleIdInt = Number(selectedSlot.schedule_id);

      await axios.post(
        `${BASE_URL}/shared/appointments`,
        {
          patient_id: patientIdInt,
          slot_id: slotIdInt,
          schedule_id: scheduleIdInt,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const slotsResponse = await axios.get(`${BASE_URL}/shared/doctors/${id}/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(slotsResponse.data.data);

      const appointmentsResponse = await axios.get(`${BASE_URL}/shared/appointments`, {
        params: { doctor_id: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(appointmentsResponse.data.data);

      setIsConfirmationModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('Запись на этот слот уже существует. Запишитесь на прием в другой день.');
      } else {
        setError('Ошибка записи на прием');
      }
      setIsErrorModalOpen(true);
      console.error(err);
    } finally {
      setIsConfirmationModalOpen(false);
    }
  };

  const handleCancelAppointment = async (slotId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Пользователь не авторизован');
        setIsErrorModalOpen(true);
        return;
      }

      const appointment = appointments.find(
        (app) => app.slot_id === slotId && app.patient_id === Number(userId) && app.appointment_status !== 'Cancel'
      );

      if (!appointment) {
        setError('Активная запись не найдена');
        setIsErrorModalOpen(true);
        return;
      }

      await axios.put(
        `${BASE_URL}/shared/appointments/${appointment.appointment_id}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const slotsResponse = await axios.get(`${BASE_URL}/shared/doctors/${id}/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(slotsResponse.data.data);

      const appointmentsResponse = await axios.get(`${BASE_URL}/shared/appointments`, {
        params: { doctor_id: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(appointmentsResponse.data.data);

      setIsSuccessModalOpen(true);
    } catch (err) {
      setError('Ошибка отмены записи');
      setIsErrorModalOpen(true);
      console.error(err);
    }
  };

  const groupedSlots = groupSlotsByDate(slots);

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
                <h3>Информация о враче</h3>
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

              <div className="slots-section">
                <h3>Доступные слоты для записи</h3>
                {Object.keys(groupedSlots).length > 0 ? (
                  Object.keys(groupedSlots).map((date) => (
                    <div key={date} className="date-section">
                      <h4>{formatDateToDDMMYYYY(date)}</h4>
                      <div className="slots-list">
                        {groupedSlots[date].map((slot) => (
                          <div key={slot.id} className="slot-card">
                            <div className="slot-time">{formatTime(slot.start_time)}</div>
                            <div className="slot-status">
                              {isCurrentUserBooked(slot.id)
                                ? 'Вы записаны'
                                : isSlotBookedByOther(slot.id)
                                ? 'Занято'
                                : isCurrentUserCancelled(slot.id)
                                ? 'Вы отменили'
                                : slot.status === 'available'
                                ? 'Доступно'
                                : 'Занято'}
                            </div>
                            {isCurrentUserBooked(slot.id) ? (
                              <button
                                className="cancel-button"
                                onClick={() => handleCancelAppointment(slot.id)}
                              >
                                Отменить
                              </button>
                            ) : slot.status === 'available' && !isSlotBookedByOther(slot.id) ? (
                              <button
                                className="book-button"
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setIsConfirmationModalOpen(true);
                                }}
                              >
                                Записаться
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-slots">Нет доступных слотов</p>
                )}
              </div>
            </>
          ) : (
            <h1 className="loading-message">Загрузка...</h1>
          )}
        </div>
      </div>

      {isConfirmationModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Подтверждение записи</h2>
            <p>Вы уверены, что хотите записаться на выбранный слот?</p>
            <div className="modal-buttons">
              <button onClick={() => setIsConfirmationModalOpen(false)}>Отмена</button>
              <button onClick={handleBookAppointment}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Успешно!</h2>
            <p>Вы успешно записаны на прием.</p>
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

export default DoctorProfile;