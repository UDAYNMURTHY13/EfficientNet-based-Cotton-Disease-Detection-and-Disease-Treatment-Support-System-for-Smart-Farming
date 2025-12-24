import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);

  const value = {
    cases,
    setCases,
    users,
    setUsers,
    analytics,
    setAnalytics,
    loading,
    setLoading,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
