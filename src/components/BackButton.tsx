import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
};

const BackButton: React.FC<Props> = ({ onPress, label, accessibilityLabel = 'go-back' }) => {
  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>‹</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  icon: {
    fontSize: 22,
    color: '#FFFFFF',
    marginRight: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BackButton;
