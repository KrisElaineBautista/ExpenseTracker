import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit'; 
import { auth } from '../../firebaseConfig';
import { subscribeToTransactions } from '../../services/firestore';
import { PieChart as PieIcon, TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'week' | 'month'>('month');
  const user = auth.currentUser;
  const { colors, darkMode } = useTheme();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(user.uid, setTransactions);
    return () => unsubscribe();
  }, [user]);

  const filteredTransactions = transactions.filter(t => {
    const tDate = t.date?.toDate ? t.date.toDate() : new Date();
    const now = new Date();
    if (filter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return tDate >= oneWeekAgo;
    } else {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = (() => {
    const categories: { [key: string]: number } = {};
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return [];
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const palette = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#f97316'];
    
    return Object.keys(categories).map((name, index) => ({
      name,
      amount: categories[name],
      color: palette[index % palette.length],
      legendFontColor: colors.subText,
      legendFontSize: 12
    }));
  })();

  const weeklyData = (() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();
    
    const spendingByDay: { [key: string]: number } = {};
    last7Days.forEach(day => spendingByDay[day] = 0);
    
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const date = t.date?.toDate ? t.date.toDate() : new Date();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      if (spendingByDay[dayName] !== undefined) spendingByDay[dayName] += t.amount;
    });
    
    return {
      labels: last7Days,
      datasets: [{ data: last7Days.map(day => spendingByDay[day]) }]
    };
  })();

  const topCategory = chartData.length > 0 
    ? chartData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <PieIcon color="#00f2ff" size={28} />
        <Text style={[styles.title, { color: colors.text }]}>Financial Analytics</Text>
      </View>

      <View style={[styles.filterContainer, { backgroundColor: darkMode ? '#1e293b' : '#e2e8f0' }]}>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'week' && (darkMode ? {backgroundColor: '#334155'} : styles.filterBtnActive)]} 
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.filterBtnText, filter === 'week' && { color: colors.text }]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'month' && (darkMode ? {backgroundColor: '#334155'} : styles.filterBtnActive)]} 
          onPress={() => setFilter('month')}
        >
          <Text style={[styles.filterBtnText, filter === 'month' && { color: colors.text }]}>This Month</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.miniCard, { backgroundColor: darkMode ? '#064e3b' : '#ecfdf5', shadowColor: colors.shadowColor }]}>
          <TrendingUp color="#10b981" size={20} />
          <Text style={[styles.miniLabel, { color: darkMode ? '#a7f3d0' : '#64748b' }]}>Income</Text>
          <Text style={[styles.miniValue, { color: darkMode ? '#32b885' : '#29a07a' }]}>₱{totalIncome.toLocaleString()}</Text>
        </View>

        <View style={[styles.miniCard, { backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2', shadowColor: colors.shadowColor }]}>
          <TrendingDown color="#ef4444" size={20} />
          <Text style={[styles.miniLabel, { color: darkMode ? '#fecaca' : '#64748b' }]}>Spent</Text>
          <Text style={[styles.miniValue, { color: darkMode ? '#f87171' : '#dc2626' }]}>₱{totalExpense.toLocaleString()}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card4, shadowColor: colors.shadowColor, borderWidth: darkMode ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <BarChart3 color="#f59e0b" size={20} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 10, marginBottom: 0 }]}>Spending Trend</Text>
        </View>
        <BarChart
          data={weeklyData}
          width={screenWidth - 70}
          height={200}
          yAxisLabel="₱"
          chartConfig={{
            backgroundColor: colors.card4,
            backgroundGradientFrom: colors.card4,
            backgroundGradientTo: colors.card4,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 242, 255, ${opacity})`,
            labelColor: (opacity = 1) => colors.subText,
            propsForDots: { r: "6", strokeWidth: "2", stroke: "#00f2ff" }
          }}
          verticalLabelRotation={0}
          style={{ marginLeft: -10, borderRadius: 16 }}
        />
      </View>

      {topCategory && (
        <View style={[styles.card, { backgroundColor: colors.card4, shadowColor: colors.shadowColor, borderWidth: darkMode ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Wallet color="#14b8a6" size={20} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 10, marginBottom: 0 }]}>Highest Spending</Text>
          </View>
          <Text style={[styles.topCatText, { color: colors.subText }]}>
            You spent the most on <Text style={{ color: '#00f2ff', fontWeight: 'bold' }}>{topCategory.name}</Text> {filter === 'week' ? 'this week' : 'this month'}.
          </Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card4, shadowColor: colors.shadowColor, borderWidth: darkMode ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Expense Distribution</Text>
        {chartData.length > 0 ? (
          <PieChart
            data={chartData}
            width={screenWidth - 60}
            height={200}
            chartConfig={{ color: (opacity = 1) => colors.text }}
            accessor={"amount"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : (
          <Text style={[styles.emptyText, { color: colors.subText }]}>No data for {filter === 'week' ? 'this week' : 'this month'}.</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card4, marginBottom: 120, shadowColor: colors.shadowColor, borderWidth: darkMode ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Savings Overview</Text>
        
        {(() => {
          const savings = totalIncome - totalExpense;
          const spendPercentage = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
          
          let barColor = '#10b981';
          if (spendPercentage >= 90) barColor = '#ef4444';
          else if (spendPercentage >= 75) barColor = '#f59e0b';

          return (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.subText, fontSize: 14 }}>Total Saved</Text>
                <Text style={{ color: savings >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: 16 }}>
                  {savings >= 0 ? '+' : '-'}₱{Math.abs(savings).toLocaleString()}
                </Text>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: colors.border, marginTop: 5 }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min(spendPercentage, 100)}%`, backgroundColor: barColor } 
                  ]} 
                />
              </View>
              
              <Text style={[styles.progressLabel, { color: colors.subText, marginTop: 8 }]}>
                You have spent <Text style={{fontWeight: 'bold', color: barColor}}>{spendPercentage.toFixed(1)}%</Text> of your income.
                {spendPercentage >= 100 && " You are over budget!"}
              </Text>
            </>
          );
        })()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  filterContainer: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 20, elevation: 3 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: { backgroundColor: 'white', elevation: 2 },
  filterBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  miniCard: { width: '48%', padding: 16, borderRadius: 20, elevation: 4 },
  miniLabel: { fontSize: 12, marginTop: 5 },
  miniValue: { fontSize: 16, fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 24, marginBottom: 20, elevation: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  topCatText: { fontSize: 15, marginTop: 10, lineHeight: 22 },
  progressBarBg: { height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 10 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressLabel: { fontSize: 13, marginTop: 10, lineHeight: 20 },
  emptyText: { textAlign: 'center', padding: 40 },
});