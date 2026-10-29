import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { ToastProvider } from './src/components/ui/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
