import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthComponent from './components/auth/AuthComponent';
import RoleBasedComponent from './components/RoleBasedComponent/RoleBasedComponent';
import UserProfile from './components/user/userProfile/userprofile';
import DoctorsList from './components/doctor/DoctorsList';
import DoctorProfile from './components/doctor/DoctorProfile';
import DoctorProfileForDoctor from "./components/doctor/forDoctor/DoctorProfileForDoctor"
import DoctorSchedule from "./components/schedules/doctor_schedul"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthComponent />} />
        <Route path="/role-based" element={<RoleBasedComponent />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/doctors-list" element={<DoctorsList/>} />
        <Route path="//doctors/:id" element={<DoctorProfile/>} />
        <Route path='/doctor-profile-for-doctors' element={<DoctorProfileForDoctor/>}/>
        <Route path='/doctor-schedule' element={<DoctorSchedule/>}/>
      </Routes>
    </Router>
  );
}

export default App;


