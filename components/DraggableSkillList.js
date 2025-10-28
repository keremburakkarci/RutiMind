import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const ITEM_HEIGHT = 70;

const DraggableSkillList = ({ skills = [], onReorder = () => {}, onRemove = () => {} }) => {
  const positions = skills.map((_, index) => useSharedValue(index * ITEM_HEIGHT));
  const isDragging = useSharedValue(-1);
  const scale = useSharedValue(1);

  const [totalTime, setTotalTime] = useState('');
  const [skillTimes, setSkillTimes] = useState({});

  const calculateCurrentTotal = () => Object.values(skillTimes).reduce((acc, t) => acc + (parseInt(t, 10) || 0), 0);

  const handleSave = () => {
    const total = parseInt(totalTime, 10) || 0;
    const current = calculateCurrentTotal();
    if (total !== current) {
      Alert.alert(
        'Hata',
        `Toplam süre (${total} dk) ile becerilere ayrılan sürelerin toplamı (${current} dk) eşit olmalıdır.`
      );
      return;
    }
    Alert.alert('Başarılı', 'Değişiklikler kaydedildi!');
  };

  const handleRemoveSkill = (skill) => {
    // Beceriyi listeden kaldır ve ilgili süreyi sil
    setSkillTimes((prev) => {
      const newTimes = { ...prev };
      delete newTimes[skill];
      return newTimes;
    });
    onRemove(skill);
  };

  const onGestureEvent = (index) => {
    return (event) => {
      'worklet';
      const { translationY } = event.nativeEvent;

      if (isDragging.value === -1) {
        isDragging.value = index;
        scale.value = withSpring(1.05);
      }

      const newPosition = index * ITEM_HEIGHT + translationY;
      positions[index].value = newPosition;

      // Hedef pozisyonu hesapla
      const currentPos = Math.round(newPosition / ITEM_HEIGHT);
      const targetPos = Math.max(0, Math.min(skills.length - 1, currentPos));

      // Sadece pozisyon değiştiğinde diğer öğeleri kaydır
      if (targetPos !== index) {
        for (let i = 0; i < skills.length; i++) {
          if (i === index) continue;
          
          if (targetPos > index) {
            // Aşağı sürükleme
            if (i > index && i <= targetPos) {
              positions[i].value = withSpring((i - 1) * ITEM_HEIGHT);
            } else {
              positions[i].value = withSpring(i * ITEM_HEIGHT);
            }
          } else {
            // Yukarı sürükleme
            if (i < index && i >= targetPos) {
              positions[i].value = withSpring((i + 1) * ITEM_HEIGHT);
            } else {
              positions[i].value = withSpring(i * ITEM_HEIGHT);
            }
          }
        }
      }
    };
  };

  const onGestureEnd = (index) => {
    return () => {
      'worklet';
      const finalPosition = Math.round(positions[index].value / ITEM_HEIGHT);
      const targetIndex = Math.max(0, Math.min(skills.length - 1, finalPosition));

      if (targetIndex !== index) {
        // İlk önce animasyonları tamamla
        for (let i = 0; i < skills.length; i++) {
          if (i === index) continue;
          
          if (targetIndex > index) {
            // Aşağı sürükleme
            if (i > index && i <= targetIndex) {
              positions[i].value = withSpring((i - 1) * ITEM_HEIGHT);
            } else {
              positions[i].value = withSpring(i * ITEM_HEIGHT);
            }
          } else {
            // Yukarı sürükleme
            if (i < index && i >= targetIndex) {
              positions[i].value = withSpring((i + 1) * ITEM_HEIGHT);
            } else {
              positions[i].value = withSpring(i * ITEM_HEIGHT);
            }
          }
        }

        // Sürüklenen öğeyi hedef konuma taşı
        positions[index].value = withSpring(targetIndex * ITEM_HEIGHT, {}, () => {
          runOnJS(onReorder)(index, targetIndex);
        });
      } else {
        // Pozisyon değişmedi, orijinal konuma geri dön
        positions[index].value = withSpring(index * ITEM_HEIGHT);
      }

      // Ölçeği ve sürükleme durumunu sıfırla
      scale.value = withSpring(1);
      isDragging.value = -1;
    };
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.headerText}>Seçili Beceriler</Text>
        <View style={styles.totalTimeContainer}>
          <Text style={styles.totalTimeLabel}>Toplam Süre:</Text>
          <TextInput
            style={styles.totalTimeInput}
            value={totalTime}
            onChangeText={(t) => setTotalTime(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#64b5f6"
            maxLength={4}
          />
          <Text style={styles.timeUnit}>dk</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {skills.map((skill, index) => {
          const animatedItemStyle = useAnimatedStyle(() => ({
            transform: [
              { translateY: positions[index].value },
              { scale: isDragging.value === index ? scale.value : 1 },
            ],
            zIndex: isDragging.value === index ? 999 : 0,
            // Use boxShadow for web; avoid animated shadow* props on web (deprecated)
            boxShadow: isDragging.value === index ? '0 20px 20px rgba(0,0,0,0.5)' : '0 12px 12px rgba(0,0,0,0.12)',
            elevation: isDragging.value === index ? 12 : 8,
            opacity: isDragging.value === index ? 1 : 0.95,
            backgroundColor: isDragging.value === index ? '#34495e' : '#2c3e50',
          }));

          return (
            <PanGestureHandler key={skill} onGestureEvent={onGestureEvent(index)} onEnded={onGestureEnd(index)}>
              <Animated.View style={[styles.skillItem, animatedItemStyle]}>
                <View style={styles.skillContent}>
                  {/* Skill Number Badge */}
                  <View style={styles.skillNumberBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  
                  {/* Skill Name */}
                  <Text style={styles.skillText}>{skill}</Text>
                  
                  {/* Time Input */}
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeIcon}>⏱️</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={String(skillTimes[skill] || '')}
                      onChangeText={(text) => setSkillTimes((prev) => ({ ...prev, [skill]: text.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#64b5f6"
                      maxLength={4}
                    />
                    <Text style={styles.timeUnit}>dk</Text>
                  </View>
                  
                  {/* Remove Button */}
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveSkill(skill)}>
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </PanGestureHandler>
          );
        })}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#1a1a1a'
  },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }),
  },
  headerText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  totalTimeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#34495e',
    padding: 8,
    borderRadius: 8
  },
  totalTimeLabel: { 
    color: '#fff', 
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  totalTimeInput: { 
    backgroundColor: '#2c3e50', 
    borderRadius: 8, 
    padding: 8, 
    width: 70, 
    color: '#fff', 
    textAlign: 'center', 
    borderWidth: 1, 
    borderColor: '#64b5f6',
    fontSize: 16,
    fontWeight: 'bold'
  },
  timeUnit: { 
    color: '#64b5f6', 
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500'
  },
  listContainer: { 
    flex: 1, 
    marginTop: 12,
    paddingTop: 8
  },
  skillItem: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    height: ITEM_HEIGHT, 
    backgroundColor: '#2c3e50', 
    borderRadius: 16, 
    padding: 12,
    marginVertical: 4,
    borderWidth: 2, 
    borderColor: '#3D3D3D',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.14)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }),
    overflow: 'hidden'
  },
  skillContent: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 10
  },
  skillNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(66,133,244,0.18)' }
      : { shadowColor: '#4285f4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 }),
  },
  indexText: { 
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
  skillText: { 
    flex: 1, 
    color: '#fff', 
    fontSize: 15,
    fontWeight: '600'
  },
  timeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#363636',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#4D4D4D'
  },
  timeIcon: {
    fontSize: 16
  },
  timeInput: { 
    backgroundColor: '#2D2D2D', 
    borderRadius: 6, 
    paddingHorizontal: 8,
    paddingVertical: 4, 
    width: 50, 
    color: '#fff', 
    textAlign: 'center', 
    borderWidth: 1, 
    borderColor: '#4285f4',
    fontSize: 14,
    fontWeight: '600'
  },
  timeUnit: { 
    color: '#64b5f6', 
    fontSize: 13,
    fontWeight: '600'
  },
  removeButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#e74c3c', 
    justifyContent: 'center', 
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(231,76,60,0.18)' }
      : { shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 }),
  },
  removeButtonText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20
  },
  saveButton: { 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    backgroundColor: '#4285f4', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }),
  },
  saveButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
});

export default DraggableSkillList;
