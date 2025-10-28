// Progress Screen - View progress charts with detail view

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import type { DailyProgress, ResponseType } from '../../types';

const ProgressScreen: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [selectedDate, setSelectedDate] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');

  // Load progress data from SQLite (mock for now)
  useEffect(() => {
    loadProgressData();
  }, [dateRange]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // TODO: Load from database
      // Mock data for demonstration
      const mockData: DailyProgress[] = [
        {
          date: '2024-01-15',
          totalSkills: 10,
          completedSkills: 8,
          yesResponses: 7,
          noResponses: 1,
          noResponseCount: 2,
          successRate: 70,
          sessions: [],
        },
        {
          date: '2024-01-16',
          totalSkills: 10,
          completedSkills: 9,
          yesResponses: 8,
          noResponses: 1,
          noResponseCount: 1,
          successRate: 80,
          sessions: [],
        },
        {
          date: '2024-01-17',
          totalSkills: 10,
          completedSkills: 10,
          yesResponses: 9,
          noResponses: 1,
          noResponseCount: 0,
          successRate: 90,
          sessions: [],
        },
      ];
      
      setProgressData(mockData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return progressData.map((day) => ({
      x: new Date(day.date).toLocaleDateString('tr-TR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      y: day.successRate,
      label: `${day.successRate}%`,
      date: day.date,
    }));
  }, [progressData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (progressData.length === 0) {
      return {
        avgSuccessRate: 0,
        totalSessions: 0,
        totalSkills: 0,
        improvement: 0,
      };
    }

    const totalSuccessRate = progressData.reduce((sum, day) => sum + day.successRate, 0);
    const avgSuccessRate = totalSuccessRate / progressData.length;
    const totalSessions = progressData.reduce((sum, day) => sum + day.sessions.length, 0);
    const totalSkills = progressData.reduce((sum, day) => sum + day.totalSkills, 0);
    
    // Calculate improvement (first vs last)
    const improvement = progressData.length > 1
      ? progressData[progressData.length - 1].successRate - progressData[0].successRate
      : 0;

    return {
      avgSuccessRate: Math.round(avgSuccessRate),
      totalSessions,
      totalSkills,
      improvement: Math.round(improvement),
    };
  }, [progressData]);

  // Handle date tap on chart
  const handleDateTap = (date: string) => {
    const dayData = progressData.find(d => d.date === date);
    if (dayData) {
      setSelectedDate(dayData);
    }
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedDate) return null;

    return (
      <Modal
        visible={selectedDate !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {new Date(selectedDate.date).toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Summary Stats */}
              <View style={styles.summaryRow}>
                <StatCard
                  label={t('progress.totalSkills')}
                  value={String(selectedDate.totalSkills)}
                  color="#4285F4"
                />
                <StatCard
                  label={t('progress.successRate')}
                  value={`${selectedDate.successRate}%`}
                  color="#27ae60"
                />
              </View>

              {/* Response Breakdown */}
              <View style={styles.responseBreakdown}>
                <Text style={styles.sectionTitle}>{t('progress.responses')}</Text>
                <View style={styles.responseItem}>
                  <View style={[styles.responseDot, { backgroundColor: '#27ae60' }]} />
                  <Text style={styles.responseLabel}>{t('progress.yes')}</Text>
                  <Text style={styles.responseValue}>{selectedDate.yesResponses}</Text>
                </View>
                <View style={styles.responseItem}>
                  <View style={[styles.responseDot, { backgroundColor: '#e74c3c' }]} />
                  <Text style={styles.responseLabel}>{t('progress.no')}</Text>
                  <Text style={styles.responseValue}>{selectedDate.noResponses}</Text>
                </View>
                <View style={styles.responseItem}>
                  <View style={[styles.responseDot, { backgroundColor: '#f39c12' }]} />
                  <Text style={styles.responseLabel}>{t('progress.noResponse')}</Text>
                  <Text style={styles.responseValue}>{selectedDate.noResponseCount}</Text>
                </View>
              </View>

              {/* Sessions Detail */}
              <Text style={styles.sectionTitle}>{t('progress.sessions')}</Text>
              {selectedDate.sessions.length === 0 ? (
                <Text style={styles.emptyText}>{t('progress.noSessions')}</Text>
              ) : (
                selectedDate.sessions.map((session, index) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <Text style={styles.sessionTitle}>
                      {t('progress.session')} {index + 1}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {new Date(session.startTime).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {/* TODO: Add skill-level detail */}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>{t('progress.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('progress.title')}</Text>
        
        {/* Date Range Selector */}
        <View style={styles.dateRangeSelector}>
          <TouchableOpacity
            style={[styles.rangeButton, dateRange === 'week' && styles.rangeButtonActive]}
            onPress={() => setDateRange('week')}
          >
            <Text style={[styles.rangeButtonText, dateRange === 'week' && styles.rangeButtonTextActive]}>
              {t('progress.week')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeButton, dateRange === 'month' && styles.rangeButtonActive]}
            onPress={() => setDateRange('month')}
          >
            <Text style={[styles.rangeButtonText, dateRange === 'month' && styles.rangeButtonTextActive]}>
              {t('progress.month')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeButton, dateRange === 'all' && styles.rangeButtonActive]}
            onPress={() => setDateRange('all')}
          >
            <Text style={[styles.rangeButtonText, dateRange === 'all' && styles.rangeButtonTextActive]}>
              {t('progress.all')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            label={t('progress.avgSuccessRate')}
            value={`${stats.avgSuccessRate}%`}
            color="#4285F4"
          />
          <StatCard
            label={t('progress.improvement')}
            value={`${stats.improvement > 0 ? '+' : ''}${stats.improvement}%`}
            color={stats.improvement >= 0 ? '#27ae60' : '#e74c3c'}
          />
          <StatCard
            label={t('progress.totalSessions')}
            value={String(stats.totalSessions)}
            color="#9b59b6"
          />
        </View>

        {/* Chart */}
        {chartData.length === 0 ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>{t('progress.noData')}</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t('progress.successRateTrend')}</Text>
            <VictoryChart
              theme={VictoryTheme.material}
              height={300}
              containerComponent={
                <VictoryVoronoiContainer
                  labels={({ datum }) => datum.label}
                  labelComponent={
                    <VictoryTooltip
                      flyoutStyle={{ fill: '#2D2D2D' }}
                      style={{ fill: '#FFFFFF' }}
                    />
                  }
                  onActivated={(points) => {
                    if (points && points[0]) {
                      handleDateTap(points[0].date);
                    }
                  }}
                />
              }
            >
              <VictoryAxis
                style={{
                  axis: { stroke: '#3D3D3D' },
                  tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  grid: { stroke: '#3D3D3D', strokeDasharray: '3,3' },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: '#3D3D3D' },
                  tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  grid: { stroke: '#3D3D3D', strokeDasharray: '3,3' },
                }}
              />
              <VictoryLine
                data={chartData}
                style={{
                  data: { stroke: '#4285F4', strokeWidth: 3 },
                }}
                interpolation="monotoneX"
              />
            </VictoryChart>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color }]} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
  },
  rangeButtonActive: {
    backgroundColor: '#4285F4',
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#2D2D2D',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyChart: {
    backgroundColor: '#2D2D2D',
    margin: 16,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  modalBody: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  responseBreakdown: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  responseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  responseLabel: {
    flex: 1,
    fontSize: 14,
    color: '#E5E5E5',
  },
  responseValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sessionItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default ProgressScreen;
