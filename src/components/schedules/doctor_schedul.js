import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './doctor_schedul_style.css';
import { FaStethoscope, FaNotesMedical, FaFileMedical, FaPlus  } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa'; 


const DoctorSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [patientsInfo, setPatientsInfo] = useState([]);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    time: '',
    status: ''
  });
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: ''
  });
  const [newRecord, setNewRecord] = useState({
    diagnosis: '',
    recomendation: '',
    anamnesis: ''
  });
  const [expandedDates, setExpandedDates] = useState({});
  const navigate = useNavigate();

  const BASE_URL = 'http://localhost:8088/api/v1';
  const userId = localStorage.getItem('userId');

  const formatTimeForAPI = (time) => {
    if (!time) return undefined;
    return `${time}:00`;
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/shared/schedules`, {
        params: {
          doctor_id: userId,
          date: filters.date || undefined,
          time: formatTimeForAPI(filters.time),
          status: filters.status || undefined
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules(response.data.data || []);
    } catch (err) {
      if (err.response && err.response.status === 404 && err.response.data.message === "No schedules found") {
        setSchedules([]);
      } else {
        setError('Ошибка загрузки расписания');
        setIsErrorModalOpen(true);
        console.error(err);
      }
    }
  };

  const fetchPatientInfo = async (patientId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/shared/users/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      console.error('Ошибка загрузки данных пациента:', err);
      return null;
    }
  };

  const fetchAppointments = async (scheduleId, bookedCount) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/shared/appointments`, {
        params: {
          schedule_id: scheduleId,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const appointmentsData = response.data.data || [];
  
      if (!appointmentsData.length || bookedCount === 0) {
        setPatientsInfo([]);
        setCurrentScheduleId(scheduleId);
        setIsAppointmentsModalOpen(true);
        return;
      }
  
      const patientsData = await Promise.all(
        appointmentsData.map(async (appointment) => {
          try {
            const patientInfo = await fetchPatientInfo(appointment.patient_id);
            return {
              ...appointment,
              patientInfo: patientInfo || {
                name: 'Неизвестно',
                age: 'N/A',
                gender: 'N/A',
                email: 'N/A',
                avatar_url: '/default-avatar.png'
              }
            };
          } catch (patientErr) {
            console.error(`Ошибка загрузки данных пациента ${appointment.patient_id}:`, patientErr);
            return {
              ...appointment,
              patientInfo: {
                name: 'Ошибка загрузки',
                age: 'N/A',
                gender: 'N/A',
                email: 'N/A',
                avatar_url: '/default-avatar.png'
              }
            };
          }
        })
      );
  
      setPatientsInfo(patientsData);
      setCurrentScheduleId(scheduleId);
      setIsAppointmentsModalOpen(true);
    } catch (err) {
      console.error('Ошибка при загрузке записей:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки записей пациентов');
      setPatientsInfo([]);
      setCurrentScheduleId(scheduleId);
      setIsAppointmentsModalOpen(true);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${BASE_URL}/shared/appointments/${appointmentId}/${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments(currentScheduleId, patientsInfo.length); // Обновляем данные после изменения статуса
    } catch (err) {
      console.error('Ошибка при изменении статуса записи:', err);
      setError('Ошибка при изменении статуса записи');
      setIsErrorModalOpen(true);
    }
  };

  const fetchMedicalHistory = async (patientId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/shared/users/${patientId}/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Если данные пришли, но они пустые, или если сервер вернул ошибку "medical records not found"
      if (response.data.err === "medical records not found" || !response.data.length) {
        setMedicalHistory([]); // Очищаем историю
        setIsHistoryModalOpen(true); // Открываем модальное окно
      } else {
        setMedicalHistory(response.data); // Устанавливаем данные
        setIsHistoryModalOpen(true); // Открываем модальное окно
      }
    } catch (err) {
      console.error('Ошибка загрузки истории болезни:', err);
      if (err.response && err.response.data.err === "medical records not found") {
        setMedicalHistory([]); // Очищаем историю
        setIsHistoryModalOpen(true); // Открываем модальное окно
      } else {
        setError('Ошибка загрузки истории болезни');
        setIsErrorModalOpen(true);
      }
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const patientId = Number(currentPatientId);
      const doctorId = Number(userId);
      const timeslotId = Number(currentScheduleId);
  
      if (isNaN(patientId) || isNaN(doctorId) || isNaN(timeslotId)) {
        throw new Error('Некорректные данные для patient_id, doctor_id или timeslot_id');
      }
  
      const response = await axios.post(`${BASE_URL}/doctors/records`, {
        patient_id: patientId,
        doctor_id: doctorId,
        diagnosis: newRecord.diagnosis,
        recomendation: newRecord.recomendation,
        anamnesis: newRecord.anamnesis,
        timeslot_id: timeslotId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.status === 201) {
        setIsRecordModalOpen(false);
        setNewRecord({ diagnosis: '', recomendation: '', anamnesis: '' });
        alert('Запись о приеме успешно добавлена');
      }
    } catch (err) {
      setError(err.message || 'Ошибка при добавлении записи о приеме');
      setIsErrorModalOpen(true);
      console.error(err);
    }
  };

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    fetchSchedules();
  }, [userId, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      date: '',
      time: '',
      status: ''
    });
  };

  const handleNewScheduleChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const startTimeISO = `${newSchedule.date}T${newSchedule.startTime}:00Z`;
      const endTimeISO = `${newSchedule.date}T${newSchedule.endTime}:00Z`;

      await axios.post(`${BASE_URL}/doctors/schedules`, {
        doctor_id: Number(userId),
        start_time: startTimeISO,
        end_time: endTimeISO,
        capacity: Number(newSchedule.capacity)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewSchedule({ date: '', startTime: '', endTime: '', capacity: '' });
      setIsAddModalOpen(false);
      fetchSchedules();
    } catch (err) {
      setError('Ошибка при добавлении расписания');
      setIsErrorModalOpen(true);
      console.error(err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const timePart = isoString.split('T')[1].replace('Z', '');
    const [hours, minutes] = timePart.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const [year, month, day] = isoString.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  const groupSchedulesByDate = () => {
    const grouped = {};
    schedules.forEach(schedule => {
      const date = formatDate(schedule.start_time);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(schedule);
    });
    return grouped;
  };

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/'); 
  };

  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const getScheduleColor = (index) => {
    const colors = [
      '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5', '#FFEBEE'
    ];
    return colors[index % colors.length];
  };

  const groupedSchedules = groupSchedulesByDate();

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
          <div className="schedule-header">
            <h2>Расписание врача</h2>
            <button className="add-button" onClick={() => setIsAddModalOpen(true)}>
              Добавить расписание
            </button>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="date">Дата (YYYY-MM-DD):</label>
              <input
                type="date"
                id="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="time">Время:</label>
              <input
                type="time"
                id="time"
                name="time"
                value={filters.time}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="status">Статус:</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">Все</option>
                <option value="active">Активные</option>
                <option value="archived">Архивные</option>
              </select>
            </div>
            <button className="reset-button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>

          <div className="schedules-section">
            {Object.keys(groupedSchedules).length > 0 ? (
              Object.entries(groupedSchedules).map(([date, dateSchedules]) => (
                <div key={date} className="date-group">
                  <div
                    className="date-header"
                    onClick={() => toggleDate(date)}
                  >
                    <span>{date}</span>
                    <span className={`toggle-icon ${expandedDates[date] ? 'expanded' : ''}`}>
                      {expandedDates[date] ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedDates[date] && (
                    <div className="schedule-list">
                      {dateSchedules.map((schedule, index) => (
                        <div
                          key={schedule.id}
                          className={`schedule-card ${schedule.status === 'active' ? 'active' : 'archived'}`}
                          style={{ backgroundColor: getScheduleColor(index) }}
                        >
                          <div className="schedule-time">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </div>
                          <div className="schedule-details">
                            <span className="capacity">
                              Мест: {schedule.booked_count}/{schedule.capacity}
                            </span>
                            <span className="status">
                              {schedule.status === 'active' ? 'Активно' : 'В архиве'}
                            </span>
                          </div>
                          {schedule.booked_count > 0 && (
                            <button
                              className="view-appointments-button"
                              onClick={() => fetchAppointments(schedule.id, schedule.booked_count)}
                            >
                              Показать записи ({schedule.booked_count})
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-schedules">Нету таких расписаний</p>
            )}
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Добавить расписание</h2>
            <form onSubmit={handleAddSchedule} className="add-schedule-form">
              <div className="form-group">
                <label htmlFor="newDate">Дата:</label>
                <input
                  type="date"
                  id="newDate"
                  name="date"
                  value={newSchedule.date}
                  onChange={handleNewScheduleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="startTime">Время начала:</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={newSchedule.startTime}
                  onChange={handleNewScheduleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">Время окончания:</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={newSchedule.endTime}
                  onChange={handleNewScheduleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Вместимость:</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={newSchedule.capacity}
                  onChange={handleNewScheduleChange}
                  min="1"
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={() => setIsAddModalOpen(false)}>Отмена</button>
                <button type="submit">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAppointmentsModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Записанные пациенты</h2>
            {patientsInfo.length > 0 ? (
              <div className="patients-list">
                {patientsInfo.map((appointment) => (
                  // Внутри компонента, где отображается карточка пациента:
<div key={appointment.appointment_id} className="patient-item">
  <div className="patient-avatar">
    <img src={appointment.patientInfo.avatar_url} alt="Аватар" />
  </div>
  <div className="patient-details">
    <p><strong>Имя:</strong> {appointment.patientInfo.name}</p>
    <p><strong>Возраст:</strong> {appointment.patientInfo.age}</p>
    <p><strong>Пол:</strong> {appointment.patientInfo.gender === 'male' ? 'Мужской' : 'Женский'}</p>
    <p><strong>Email:</strong> {appointment.patientInfo.email}</p>
    <p><strong>Телефон:</strong> {appointment.patientInfo.phone_number || 'Не указан'}</p>
    <p><strong>Адрес:</strong> {appointment.patientInfo.address || 'Не указан'}</p>
    <p><strong>Время записи:</strong> {formatTime(appointment.slot_start_time)}</p>
    <div className="appointment-status">
      <label><strong>Статус:</strong></label>
      <select
        value={appointment.appointment_status}
        onChange={(e) => updateAppointmentStatus(appointment.appointment_id, e.target.value)}
      >
        <option value="Pending">Ожидание</option>
        <option value="Confirmed">Подтверждено</option>
        <option value="Completed">Завершено</option>
        <option value="Cancel">Отменено</option>
      </select>
    </div>
    <button
      className="add-record-button"
      onClick={() => {
        setCurrentPatientId(appointment.patient_id);
        setIsRecordModalOpen(true);
      }}
    >
       <FaPlus />
      Добавить запись о приеме
    </button>
    <button
  className="view-history-button"
  onClick={() => fetchMedicalHistory(appointment.patient_id)}
>
  Посмотреть историю болезни
</button>
  </div>
</div>
                ))}
              </div>
            ) : (
              <p>Нет записанных пациентов.</p>
            )}
            <button
              className="close-modal-button"
              onClick={() => setIsAppointmentsModalOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

{isRecordModalOpen && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Добавить запись о приеме</h2>
      <form onSubmit={handleAddRecord} className="add-record-form">
      <div className="form-group">
          <label htmlFor="anamnesis">
            <FaFileMedical /> Анамнез
          </label>
          <textarea
            id="anamnesis"
            name="anamnesis"
            value={newRecord.anamnesis}
            onChange={handleRecordChange}
            placeholder="Введите анамнез"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="diagnosis">
            <FaStethoscope /> Диагноз
          </label>
          <input
            type="text"
            id="diagnosis"
            name="diagnosis"
            value={newRecord.diagnosis}
            onChange={handleRecordChange}
            placeholder="Введите диагноз"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="recomendation">
            <FaNotesMedical /> Рекомендации
          </label>
          <textarea
            id="recomendation"
            name="recomendation"
            value={newRecord.recomendation}
            onChange={handleRecordChange}
            placeholder="Введите рекомендации"
            required
          />
        </div>
        <div className="modal-buttons">
          <button type="button" onClick={() => setIsRecordModalOpen(false)}>
            Отмена
          </button>
          <button type="submit">Добавить</button>
        </div>
      </form>
    </div>
  </div>
)}

{isHistoryModalOpen && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>История болезни</h2>
      {medicalHistory.length > 0 ? (
        <div className="medical-history-list">
          {medicalHistory.map((record, index) => (
            <div key={index} className="medical-history-item">
              <p><strong>Дата:</strong> {formatDate(record.created_time)}</p>
              <p><strong>Диагноз:</strong> {record.diagnosis}</p>
              <p><strong>Рекомендации:</strong> {record.recomendation}</p>
              <p><strong>Врач:</strong> {record.doctor.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Записи отсутствуют.</p> 
      )}
      <button
        className="close-modal-button"
        onClick={() => setIsHistoryModalOpen(false)}
      >
        Закрыть
      </button>
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

export default DoctorSchedule;