// Progress Screen - View progress charts with detail view

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import GlobalTopActions from '../../components/GlobalTopActions';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryScatter,
  VictoryLabel,
} from 'victory-native';
import type { DailyProgress } from '../../types';
import { useSkillsStore } from '../../store/skillsStore';
import { useAuthStore } from '../../store/authStore';
import { getResponsesByDate } from '../../services/responseService';
// Lightweight local date helpers to avoid extra dependency in the runtime environment
const addDaysLocal = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

const startOfWeekLocal = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  // Convert so Monday is start of week
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonthLocal = (d: Date) => {
  const date = new Date(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfMonthLocal = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
};

const ProgressScreen: React.FC = () => {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) => {
    try {
      const res = t(key);
      if (!res || res === key) return fallback;
      return res;
    } catch (e) {
      return fallback;
    }
  };

  // State
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [selectedDate, setSelectedDate] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(new Date()); // used for day/week/month navigation
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [viewDate, setViewDate] = useState<Date>(new Date(anchorDate));
  const { selectedSkills } = useSkillsStore();
  const authUser = useAuthStore(state => state.user);
  const [skillGrid, setSkillGrid] = useState<Array<{ date: string; cells: Array<{ skillId: string; skillName: string; value: string | null }> }>>([]);
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});

  // Load progress data from SQLite (mock for now)
  useEffect(() => {
    loadProgressData();
  }, [selectedRange, anchorDate]);

  const getDatesForRange = (range: typeof selectedRange, anchor: Date) => {
    const dates: string[] = [];
    if (range === 'day') {
      dates.push(new Date(anchor).toISOString().split('T')[0]);
      return dates;
    }
    if (range === 'week') {
      const start = startOfWeekLocal(anchor); // Monday
      for (let i = 0; i < 7; i++) {
        const d = addDaysLocal(start, i);
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    }
    if (range === 'month') {
      const start = startOfMonthLocal(anchor);
      const end = endOfMonthLocal(anchor);
      for (let d = new Date(start); d <= end; d = addDaysLocal(d, 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    }
    // all: for now use last 90 days as a safe default to avoid huge loads
    const last = 90;
    for (let i = last - 1; i >= 0; i--) {
      const d = addDaysLocal(anchor, -i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const uid = authUser?.uid || 'guest';
      // compute target dates based on selectedRange and anchorDate
      const targetDates = getDatesForRange(selectedRange, anchorDate);
      const newProgress: DailyProgress[] = [];
      const grid: typeof skillGrid = [];

      for (const date of targetDates) {
        // fetch responses for this date
        const rows = await getResponsesByDate(uid, date).catch(() => []);
        const yes = rows.filter(r => r.response === 'yes').length;
        const no = rows.filter(r => r.response === 'no').length;
        const noResp = rows.filter(r => r.response === 'no-response').length;
        // map of latest response per skillId for the date
        const map = new Map<string, string>();
        for (const r of rows) map.set(r.skillId, r.response as string);

        // If every selected skill for this date was responded 'yes', treat as 100%
        const selCount = (selectedSkills || []).length;
        let percent = 0;
        if (selCount > 0) {
          const allYes = (selectedSkills || []).every((s: any) => map.get(s.skillId) === 'yes');
          if (allYes) {
            percent = 100;
          } else {
            // compute percent based on yes responses over selected skills
            const yesCount = (selectedSkills || []).reduce((acc: number, s: any) => acc + (map.get(s.skillId) === 'yes' ? 1 : 0), 0);
            percent = Math.round((yesCount / selCount) * 100);
          }
        } else {
          // fallback to raw ratio if no selectedSkills metadata
          const total = yes + no + noResp;
          percent = total > 0 ? Math.round((yes / total) * 100) : 0;
        }
        // cap at 100%
        percent = Math.min(100, percent);

        newProgress.push({
          date,
          totalSkills: selCount,
          completedSkills: yes + no,
          yesResponses: yes,
          noResponses: no,
          noResponseCount: noResp,
          successRate: percent,
          sessions: [],
        });

        // build skill cells for this date
        const cells = (selectedSkills || []).map((s: any) => ({ skillId: s.skillId, skillName: s.skillName, value: map.get(s.skillId) || null }));
        grid.push({ date, cells });
      }

      setProgressData(newProgress);
      setSkillGrid(grid);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare series: daily correct counts (yesResponses)
  const correctSeries = useMemo(() => {
    // Use the already-computed and capped successRate from loadProgressData.
    // This preserves the "all selected skills = 100%" special case and the 0..100 cap.
    return progressData.map((day) => {
      const raw = typeof day.successRate === 'number' ? day.successRate : 0;
      const val = Math.min(100, Math.max(0, Math.round(raw)));
      return {
        x: new Date(day.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        y: val,
        rawCount: day.yesResponses,
        date: day.date,
        label: `${val}%`,
      };
    });
  }, [progressData]);

  // Web chart layout state for drawing a connected line in web fallback
  const [webChartWidth, setWebChartWidth] = useState<number>(0);
  // Raised height so the percent ticks and labels have more breathing room on web
  const webChartHeight = 220;
  const webPoints = useMemo(() => {
    const n = correctSeries.length;
    if (n === 0 || webChartWidth <= 0) return [] as Array<any>;
  const leftPad = 20;
  const rightPad = 20;
  const topPad = 28;
  const bottomPad = 28;
    const usableW = Math.max(1, webChartWidth - leftPad - rightPad);
    const usableH = Math.max(1, webChartHeight - topPad - bottomPad);
    return correctSeries.map((d, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = leftPad + t * usableW;
      // Clamp plotted value to 0..100 again to guard against any data issues
      const pct = Math.min(100, Math.max(0, d.y));
      const y = topPad + (1 - (pct / 100)) * usableH;
      return { x, y, label: `${pct}%`, rawCount: d.rawCount, date: d.date };
    });
  }, [correctSeries, webChartWidth]);

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
                <Text style={styles.sectionTitle}>{tx('progress.responses', 'Cevaplar')}</Text>
                <View style={styles.responseItem}>
                  <View style={[styles.responseDot, { backgroundColor: '#27ae60' }]} />
                  <Text style={styles.responseLabel}>{tx('progress.yes', 'Evet')}</Text>
                  <Text style={styles.responseValue}>{selectedDate.yesResponses}</Text>
                </View>
                <View style={styles.responseItem}>
                  <View style={[styles.responseDot, { backgroundColor: '#e74c3c' }]} />
                  <Text style={styles.responseLabel}>{tx('progress.no', 'Hayır')}</Text>
                  <Text style={styles.responseValue}>{selectedDate.noResponses}</Text>
                </View>
                <View style={styles.responseItem}>
                  <View style={[styles.responseDot, { backgroundColor: '#f39c12' }]} />
                  <Text style={styles.responseLabel}>{tx('progress.noResponse', 'Yanıtsız')}</Text>
                  <Text style={styles.responseValue}>{selectedDate.noResponseCount}</Text>
                </View>
              </View>

              {/* Sessions Detail */}
              <Text style={styles.sectionTitle}>{tx('progress.sessions', 'Oturumlar')}</Text>
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

  // Calendar modal for selecting a single day when in 'day' mode
  const renderCalendarModal = () => {
    // Build month grid from viewDate
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const totalDays = end.getDate();
    const leadingEmpty = (start.getDay() + 6) % 7; // Monday start
    const weeks: Array<Array<number | null>> = [];
    let day = 1 - leadingEmpty;
    while (day <= totalDays) {
      const week: Array<number | null> = [];
      for (let i = 0; i < 7; i++, day++) {
        week.push(day > 0 && day <= totalDays ? day : null);
      }
      weeks.push(week);
    }

    return (
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 360, maxWidth: '95%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{new Date(viewDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</Text>
              <View style={{ width: 32 }} />
            </View>

            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={styles.smallBtn}>
                  <Text style={{ color: '#fff' }}>{'<'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={styles.smallBtn}>
                  <Text style={{ color: '#fff' }}>{'>'}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }}>
                {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d) => (
                  <Text key={d} style={{ width: 40, textAlign: 'center', color: '#9CA3AF' }}>{d}</Text>
                ))}
              </View>

              {weeks.map((week, wi) => (
                <View key={`w-${wi}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 8 }}>
                  {week.map((d, di) => {
                    const isSelected = d && viewDate.getFullYear() === anchorDate.getFullYear() && viewDate.getMonth() === anchorDate.getMonth() && d === anchorDate.getDate();
                    return (
                      <TouchableOpacity
                        key={`d-${di}`}
                        style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: isSelected ? '#4285F4' : 'transparent' }}
                        disabled={!d}
                        onPress={() => {
                          if (!d) return;
                          const picked = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                          setAnchorDate(picked);
                          setShowCalendar(false);
                        }}
                      >
                        <Text style={{ color: isSelected ? '#fff' : '#fff' }}>{d || ''}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e']}
          style={styles.gradientBackground}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>{tx('progress.loading', 'Yükleniyor...')}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Global top actions + spacer */}
  <GlobalTopActions title={tx('progress.title', 'Gelişim Grafiği')} showBack />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        <View style={styles.headerSpacer}>
        {/* Date Range Selector (moved below top bar) */}
        <View style={styles.dateRangeSelector}>
          <TouchableOpacity
            style={[styles.rangeButton, selectedRange === 'day' && styles.rangeButtonActive]}
            onPress={() => setSelectedRange('day')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'day' && styles.rangeButtonTextActive]}>
              {tx('progress.day', 'Günlük')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeButton, selectedRange === 'week' && styles.rangeButtonActive]}
            onPress={() => setSelectedRange('week')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'week' && styles.rangeButtonTextActive]}>
              {tx('progress.week', 'Hafta')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeButton, selectedRange === 'month' && styles.rangeButtonActive]}
            onPress={() => setSelectedRange('month')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'month' && styles.rangeButtonTextActive]}>
              {tx('progress.month', 'Ay')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeButton, selectedRange === 'all' && styles.rangeButtonActive]}
            onPress={() => setSelectedRange('all')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'all' && styles.rangeButtonTextActive]}>
              {tx('progress.all', 'Tümü')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* If day mode is selected show a date picker trigger */}
        {selectedRange === 'day' && (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setViewDate(new Date(anchorDate));
                setShowCalendar(true);
              }}
              style={styles.datePickButton}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{new Date(anchorDate).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            label={tx('progress.avgSuccessRate', 'Ortalama Başarı Oranı')}
            value={`${stats.avgSuccessRate}%`}
            color="#4285F4"
          />
          <StatCard
            label={tx('progress.improvement', 'Gelişim')}
            value={`${stats.improvement > 0 ? '+' : ''}${stats.improvement}%`}
            color={stats.improvement >= 0 ? '#27ae60' : '#e74c3c'}
          />
          <StatCard
            label={tx('progress.totalSessions', 'Toplam Oturumlar')}
            value={String(stats.totalSessions)}
            color="#9b59b6"
          />
        </View>

        {/* Skill vs Date matrix: y = skills, x = dates (placed above charts) */}
        {skillGrid && skillGrid.length > 0 && (selectedSkills && selectedSkills.length > 0) && (
          <View style={[styles.chartContainer, { marginHorizontal: 16, marginTop: 12 }]}>
            <Text style={styles.chartTitle}>{'Beceriler / Tarihler'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* Left column: skill names vertical stack */}
                <View style={{ width: 140, paddingRight: 8 }}>
                  <View style={{ height: 28 }} />
                  {selectedSkills.map((s: any) => {
                    const expanded = !!expandedSkills[s.skillId];
                    return (
                      <TouchableOpacity
                        key={s.skillId}
                        onPress={() => setExpandedSkills(prev => ({ ...prev, [s.skillId]: !prev[s.skillId] }))}
                        style={{ height: 40, justifyContent: 'center' }}
                      >
                        <Text style={{ color: '#fff', flexWrap: 'wrap' }} numberOfLines={expanded ? undefined : 1}>{s.skillName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Dates columns */}
                {skillGrid.map((col) => (
                  <View key={col.date} style={{ minWidth: 120, paddingLeft: 8, paddingRight: 8 }}>
                    <View style={{ height: 28, justifyContent: 'center' }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>{new Date(col.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    {col.cells.map((cell) => {
                      const isAnswered = cell.value !== null && cell.value !== undefined;
                      const innerColor = cell.value === 'yes' ? '#27ae60' : cell.value === 'no' ? '#e74c3c' : cell.value === 'no-response' ? '#f39c12' : '#3D3D3D';
                      return (
                        <View key={`${col.date}-${cell.skillId}`} style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
                          <View style={{
                            width: 32,
                            height: 24,
                            borderRadius: 6,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: isAnswered ? 1 : 0,
                            borderColor: isAnswered ? '#f39c12' : 'transparent',
                            padding: isAnswered ? 2 : 0,
                            backgroundColor: isAnswered ? 'transparent' : innerColor,
                          }}>
                            {isAnswered ? (
                              <View style={{ flex: 1, width: '100%', borderRadius: 4, backgroundColor: innerColor }} />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <View style={{ width: 12, height: 6, backgroundColor: '#27ae60', marginRight: 6 }} />
                <Text style={{ color: '#fff' }}>Evet</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <View style={{ width: 12, height: 6, backgroundColor: '#e74c3c', marginRight: 6 }} />
                <Text style={{ color: '#fff' }}>Hayır</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 6, backgroundColor: '#f39c12', marginRight: 6 }} />
                <Text style={{ color: '#fff' }}>Yanıtsız</Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily correct (yes) count chart */}
        {correctSeries.length === 0 ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>{tx('progress.noData', 'Veri yok')}</Text>
          </View>
        ) : (
          Platform.OS === 'web' ? (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{tx('progress.dailyCorrect', 'Günlük Doğru Sayısı')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                {/* Left axis labels - render every 10% (100..0) and position to match dashed guide lines */}
                <View style={{ width: 48, paddingRight: 8, height: webChartHeight + 8, position: 'relative' }}>
                  {Array.from({ length: 11 }).map((_, idx) => {
                    const v = 100 - idx * 10;
                    const topPad = 28;
                    const bottomPad = 28;
                    const usableH = Math.max(1, webChartHeight - topPad - bottomPad);
                    const y = topPad + (1 - v / 100) * usableH;
                    return (
                      <Text key={`lbl-${v}`} style={{ position: 'absolute', left: 0, top: y - 10, color: '#9CA3AF', fontSize: 12 }}>{`${v}%`}</Text>
                    );
                  })}
                </View>

                {/* Plot area */}
                <View style={{ flex: 1 }}>
                  <View
                    onLayout={(e) => setWebChartWidth(e.nativeEvent.layout.width)}
                    style={{ height: webChartHeight, position: 'relative' }}
                  >
                    {webPoints.length > 0 && (
                      <>
                        {/* horizontal dashed guide lines at 0..100 step 10 */}
                        {Array.from({ length: 11 }).map((_, idx) => {
                          const v = 100 - idx * 10; // from 100 down to 0
                          const y = (() => {
                            const topPad = 28;
                            const bottomPad = 28;
                            const usableH = Math.max(1, webChartHeight - topPad - bottomPad);
                            return topPad + (1 - v / 100) * usableH;
                          })();
                          return (
                            <View key={`hline-${v}`} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)' }} />
                          );
                        })}

                        {webPoints.slice(0, -1).map((p, i) => {
                          const p2 = webPoints[i + 1];
                          const dx = p2.x - p.x;
                          const dy = p2.y - p.y;
                          const len = Math.hypot(dx, dy);
                          const angle = Math.atan2(dy, dx);
                          return (
                            <View
                              key={`line-${i}`}
                              style={{
                                position: 'absolute',
                                left: p.x,
                                top: p.y,
                                width: len,
                                height: 2,
                                backgroundColor: '#4285F4',
                                transform: [{ rotate: `${angle}rad` }],
                                transformOrigin: '0 0',
                              }}
                            />
                          );
                        })}

                        {webPoints.map((p, i) => (
                          <React.Fragment key={`pt-${i}`}>
                            <View style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' }} />
                            <Text style={{ position: 'absolute', left: p.x - 16, top: p.y - 30, color: '#fff', fontSize: 13, fontWeight: '600' }}>{`${p.label}`}</Text>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    {correctSeries.map((d) => (
                      <Text key={d.date} style={{ color: '#9CA3AF', fontSize: 12 }}>{d.x}</Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{tx('progress.dailyCorrect', 'Günlük Doğru Sayısı')}</Text>
              <VictoryChart
                theme={VictoryTheme.material}
                height={300}
                padding={{ left: 60, right: 40, top: 20, bottom: 60 }}
                domain={{ y: [0, 100] }}
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
                    axis: { stroke: '#000' },
                    tickLabels: { fill: '#000', fontSize: 12 },
                    grid: { stroke: '#eee' },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: '#000' },
                    tickLabels: { fill: '#000', fontSize: 12 },
                    grid: { stroke: 'rgba(255,255,255,0.12)', strokeDasharray: '4,6' },
                  }}
                  tickValues={[0,10,20,30,40,50,60,70,80,90,100]}
                  tickFormat={(t) => `${t}%`}
                />
                <VictoryLine
                  data={correctSeries}
                  style={{ data: { stroke: '#4285F4', strokeWidth: 3 } }}
                  interpolation="monotoneX"
                />
                <VictoryScatter
                  data={correctSeries}
                  size={4}
                  style={{ data: { fill: '#e74c3c' } }}
                />
                <VictoryScatter
                  data={correctSeries}
                  labels={({ datum }) => String(datum.y)}
                  labelComponent={<VictoryLabel dy={-14} style={{ fill: '#000', fontSize: 12 }} />}
                />
              </VictoryChart>
            </View>
          )
        )}

        {/* (original skill grid moved earlier) */}
      </ScrollView>

      {/* Detail Modal */}
      {renderCalendarModal()}
      {renderDetailModal()}
      </LinearGradient>
    </View>
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
    backgroundColor: '#000000',
  },
  gradientBackground: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 88 : 72,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  headerSpacer: {
    height: Platform.OS === 'web' ? 140 : 72,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
    justifyContent: 'center',
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
    marginTop: Platform.OS === 'web' ? 12 : 0,
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
  datePickButton: {
    backgroundColor: '#2D2D2D',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallBtn: {
    backgroundColor: '#2D2D2D',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
