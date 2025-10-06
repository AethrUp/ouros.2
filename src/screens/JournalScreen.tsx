import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { colors, typography } from '../styles';

export const JournalScreen: React.FC<NavigationProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <HeaderBar
        title="Journal"
        rightActions={[
          {
            icon: 'add-outline',
            onPress: () => console.log('Add Entry'),
          },
        ]}
      />
      <View style={styles.content}>
        <Text style={styles.text}>Journal Screen</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.h2,
  },
});
