import { useState, useEffect } from 'react';

const CREDENTIALS = {
  username: 'AlQuds',
  password: 'AlQuds@2025!'
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('isAuthenticated');
    return auth === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  const login = (username: string, password: string): boolean => {
    const isValid = username === CREDENTIALS.username && password === CREDENTIALS.password;
    if (isValid) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
    return isValid;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return {
    isAuthenticated,
    login,
    logout
  };
}