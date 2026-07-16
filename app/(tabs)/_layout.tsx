import { Tabs } from 'expo-router';
import { LayoutDashboard, History, PieChart, User } from 'lucide-react-native';
// 1. Import your theme hook
import { useTheme } from '../../context/ThemeContext'; 

export default function TabLayout() {
  // 2. Pull the global colors
  const { colors, darkMode } = useTheme();

  return (
    <Tabs 
      screenOptions={{ 
        // 3. Use dynamic colors for active/inactive states
        tabBarActiveTintColor: '#cf31c2', 
        tabBarInactiveTintColor: darkMode ? '#94a3b8' : '#64748b',
        headerShown: false,
        tabBarStyle: { 
          height: 70, 
          paddingBottom: 10,
          // 4. Dynamic background color!
          backgroundColor: colors.layout, 
          borderTopWidth: darkMode ? 0 : 1, // Cleaner look in dark mode
          borderTopColor: colors.border,
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="transactions" 
        options={{ 
          title: 'History',
          tabBarIcon: ({ color }) => <History size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="reports" 
        options={{ 
          title: 'Reports',
          tabBarIcon: ({ color }) => <PieChart size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}