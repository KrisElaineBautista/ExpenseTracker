import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => {},
  colors: { 
    bg: '#f8fafc', 
    card: '#ffffff', 
    text: '#1e293b', 
    text2: '#1e293b', 
    text3: '#1e293b', 
    subText: '#64748b', 
    border: '#f1f5f9',
    card2: '#1565d6',
    layout: '#e2e8f0',
    icon1: '#1e293b',
    card3: '#e2e8f0',
    modal1: '#e7eaee',
    border1: '#e2e8f0',  
    border2: '#e2e8f0',
    subtext1: '#64748b',
    card4: '#ffffff',
    card5: '#f1f5f9',
    // --- ADDED SHADOW DEFAULTS ---
    shadowColor: '#000000',
    shadowOpacity: 0.1,
  }
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => setDarkMode(!darkMode);

  const colors = {
    // Backgrounds
    bg: darkMode ? '#0f172a' : '#f8fafc',      // Midnight Slate
    card: darkMode ? '#204177' : '#ffffff',    // Deep Slate Card
    card2: darkMode ? '#1b2457' : '#f1f5f9',   // search
    card3: darkMode ? '#7a8392' : '#e2e8f0',   // background for modal 
    layout: darkMode ? '#000000' : '#e2e8f0',   // for the layput

    //input text n background
    modal1: darkMode ? '#7a8392' : '#e2e8f0',   //background modal
    border1: darkMode ? '#d7dae0' : '#dadce0',   //input  color 
    border2: darkMode ? '#830303' : '#830303',   //cancel button background
    subtext1: darkMode ? '#4b4a4a' : '#413f3f', // for input text /the hint
    

    //card for recent activity
    card4: darkMode ? '#230b5c' : '#ffffff',    // card for recent activity
    card5: darkMode ? '#0f0fb6' : '#f1f5f9',    // card for budget goal


    // Text Variants
    text: darkMode ? '#ffffff' : '#1e293b',    // Main Headings (White / Dark)
    text2: darkMode ? '#ffffff' : '#334155',   // Slightly softer text
    text3: darkMode ? '#e2e8f0' : '#1e293b',   

    //icon color
    icon1: darkMode ? '#ffffff' : '#0a0a0a', //icons in the app
    subText: darkMode ? '#ffffff' : '#64748b', //subtext homepage and transactions
    border: darkMode ? '#334155' : '#e2e8f0',  
    accent: '#00f2ff', // Neon Sky Blue

    // --- ADDED DYNAMIC SHADOWS ---
    shadowColor: darkMode ? '#333232' : '#000000',
    shadowOpacity: darkMode ? 0.4 : 0.1, // Stronger glow for dark mode
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);