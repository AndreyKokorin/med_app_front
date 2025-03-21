import React from 'react';
import { jwtDecode } from "jwt-decode";
import MainPageUser from '../user/mainPage/MainPageUser'
import MainPageDoctor from "../user/mainPageDoctor/MainPageDoctor"


const RoleBasedComponent = () => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    return <h1>Требуется авторизация</h1>;
  }

  try {
    const decoded = jwtDecode(token);
    const { role } = decoded;
    
    switch (role) {
      case 'admin':
        return <MainPageUser />;
      case 'doctor':
        return <MainPageDoctor />;
      case 'user':
        return <MainPageUser />;
      default:
        return <h1>Неизвестная роль</h1>;
    }
  } catch (error) {
    return <h1>Ошибка при разборе токена</h1>;
  }
};

export default RoleBasedComponent;
