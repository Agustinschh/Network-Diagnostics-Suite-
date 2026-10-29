// Mock de react-native-get-random-values
jest.mock('react-native-get-random-values', () => ({}));

// Mock de lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        return function MockIcon(props) {
          return React.createElement('Icon', { testID: `icon-${String(prop)}`, ...props });
        };
      },
    }
  );
});

// Mock de react-native-udp
jest.mock('react-native-udp', () => ({
  createSocket: jest.fn(() => ({
    bind: jest.fn((port, cb) => cb && cb(null)),
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    address: jest.fn(() => ({ port: 12345 })),
  })),
}));

// Mock de react-native-tcp-socket
jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn(() => ({
    destroy: jest.fn(),
    setTimeout: jest.fn(),
    on: jest.fn(),
    write: jest.fn(),
  })),
}));

// Mock de react-native-zeroconf
jest.mock('react-native-zeroconf', () => {
  return jest.fn().mockImplementation(() => ({
    scan: jest.fn(),
    stop: jest.fn(),
    on: jest.fn(),
    removeDeviceListeners: jest.fn(),
  }));
});

// Mock de react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() =>
    Promise.resolve({ username: 'smoke_user', password: 'smoke_password' })
  ),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
  SECURITY_LEVEL: { SECURE_HARDWARE: 'SecureHardware', ANY: 'Any' },
}));

// Mock de @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        ipAddress: '192.168.1.50',
        subnet: '255.255.255.0',
        ssid: 'TestNetwork',
      },
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock de react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  VisionCamera: {
    cameraPermissionStatus: 'authorized',
    requestCameraPermission: jest.fn(() => Promise.resolve(true)),
  },
  Camera: () => null,
  useCameraDevice: jest.fn(),
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  })),
  useCodeScanner: jest.fn(),
}));

// Mock de @dylankenneally/react-native-ssh-sftp
jest.mock('@dylankenneally/react-native-ssh-sftp', () => ({
  connectWithPassword: jest.fn(() => Promise.resolve()),
  execute: jest.fn(() => Promise.resolve('ok')),
  disconnect: jest.fn(),
}));

// Mock de react-native-html-to-pdf
jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(() =>
    Promise.resolve({ filePath: '/mock/path/smoke_test.pdf' })
  ),
}));

// Mock de @dr.pogodin/react-native-fs
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  readFile: jest.fn(() => Promise.resolve('mock_base64')),
  writeFile: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
}));

// Mock de react-native-share
jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock de react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  openSettings: jest.fn(() => Promise.resolve()),
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
}));

// Mock de react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: {
        latitude: -34.6037,
        longitude: -58.3816,
        accuracy: 10,
        altitude: 25,
      },
      timestamp: Date.now(),
    })
  ),
}));

// Mock de @bam.tech/react-native-image-resizer
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn(() =>
    Promise.resolve({
      uri: 'file:///mock/resized.jpg',
      width: 1600,
      height: 1200,
      size: 350000,
    })
  ),
}));
