// REMOVED: Polyfill imports as they likely aren't needed with correct dependencies
// import 'react-native-polyfill-globals';
// import 'core-js/actual/set-immediate';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform, // Keep Platform for potential future platform-specific adjustments
  FlatList,
  ActivityIndicator,
  Alert,
  Linking // Keep Linking for opening settings
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// RESTORED: MapView and Location imports (Ensure dependencies are fixed first!)
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location'; // Use expo-location consistently
// REMOVED: import ErrorUtils from 'react-native/Libraries/Core/ErrorUtils'; // No longer needed

// --- Constants ---
// Defines the color palette used throughout the application.
const COLORS = {
  // Primary colors (Example based on Keio University's palette)
  primary: '#0000FF',     // Keio Blue - for main actions, headers
  secondary: '#000080',   // Navy Blue - for secondary actions, icons
  accent: '#FF0000',      // Keio Red - for highlights, notifications, important elements

  // Supporting colors
  yellow: '#FFD700',      // Keio Yellow - for selection highlights, warnings
  gold: '#FFCC00',        // Keio Gold - for premium features (example)

  // UI colors
  light: '#F5F5F5',       // Light background for sections
  white: '#FFFFFF',       // Standard white background
  gray: '#EEEEEE',        // Light gray for borders, dividers
  darkGray: '#757575',    // Dark gray for secondary text
  black: '#333333',       // Near-black for primary text

  // Functional colors
  success: '#4CAF50',     // Green for success states/buttons
  warning: '#FFC107',     // Amber for warnings
  error: '#E53935',       // Red for errors
  info: '#2196F3'         // Blue for informational elements
};

// Defines icons used in the application (using Emojis here).
const ICONS = {
  calendar: '📅',
  list: '📋',
  bus: '🚌',
  map: '🗺️', // RESTORED
  posts: '📝',
  // card: '💳', // Removed card icon
  add: '➕',
  info: 'ℹ️',
  settings: '⚙️'
};

// --- Screens ---

/**
 * TimetableScreen Component
 * Displays the weekly timetable grid.
 * Allows selecting a day to highlight its column.
 */
const TimetableScreen = () => {
  const days = ['月', '火', '水', '木', '金', 'その他']; // Monday to Friday + Other
  const periods = [
    { num: 1, startTime: '09:25', endTime: '10:55' }, // 90 min
    { num: 2, startTime: '11:10', endTime: '12:40' }, // 90 min
    { num: 3, startTime: '13:00', endTime: '14:30' }, // 90 min
    { num: 4, startTime: '14:45', endTime: '16:15' }, // 90 min
    { num: 5, startTime: '16:30', endTime: '18:00' }, // 90 min
    { num: 6, startTime: '18:10', endTime: '19:40' }, // 90 min
  ];

  const getCurrentDayIndex = () => {
    const today = new Date().getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    if (today === 0 || today === 6) return 5; // Sunday or Saturday -> 'その他'
    return today - 1; // Monday to Friday -> 0 to 4
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex());

  return (
    <View style={styles.screenContainer}>
      {/* --- Header Row --- */}
      <View style={styles.timetableHeaderContainer}>
        {/* Top-Left Empty Corner (aligns with time column) */}
        <View style={styles.topLeftCorner} />

        {/* Header for selecting the day (aligned with grid columns) */}
        <View style={styles.daysHeaderActual}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.selectedDay,
                // Remove right border for the last button
                index === days.length - 1 && { borderRightWidth: 0 }
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.dayText,
                selectedDay === index && styles.selectedDayText
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* --- Scrollable Grid Content --- */}
      <ScrollView style={styles.scheduleContainer}>
        {periods.map((period, periodIndex) => (
          <View key={periodIndex} style={styles.periodRow}>
            {/* Column for period number and times */}
            <View style={styles.timeColumn}>
              {/* Display start time for EVERY period */}
              <Text style={styles.startTimeLabel}>{period.startTime}</Text>
              <View style={styles.periodCircle}>
                <Text style={styles.periodNumber}>{period.num}</Text>
              </View>
              {/* Display end time for EVERY period */}
              <Text style={styles.endTimeLabel}>{period.endTime}</Text>
            </View>

            {/* Row containing cells for each day in this period */}
            <View style={styles.dayGridRow}>
              {days.map((day, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.classCell,
                    selectedDay === dayIndex && styles.selectedDayCell,
                    // Remove right border for the last cell in the row
                    dayIndex === days.length - 1 && { borderRightWidth: 0 }
                  ]}
                >
                  {/* Content of the class cell (e.g., class name) goes here */}
                  {/* Example: <Text>Class Info</Text> */}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* --- Footer --- */}
      <View style={styles.totalUnitsContainer}>
        <Text style={styles.totalUnitsText}>合計の単位数：0</Text>
        {/* Updated Info Button: Removed circle background */}
        <TouchableOpacity style={styles.infoButton}>
          <Text style={styles.infoButtonText}>{ICONS.info}</Text>
        </TouchableOpacity>
      </View>

      {/* --- Floating Action Button --- */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>{ICONS.add}</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * ClassesScreen Component
 * Displays a list of classes fetched from an API.
 */
const ClassesScreen = () => {
  const [classesData, setClassesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_ENDPOINT = 'https://jsonplaceholder.typicode.com/users'; // Example API

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Add null checks for data transformation
        const formattedData = data.map(user => ({
          id: `U-${user?.id || 'unknown'}`,
          name: user?.name || 'Unknown Name',
          teacher: user?.company?.name || 'Unknown Teacher',
          room: user?.address?.suite || 'Unknown Room'
        }));
        setClassesData(formattedData);
      } catch (e) {
        console.error("Failed to fetch classes:", e);
        setError('授業データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []); // Empty dependency array ensures this runs only once on mount

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>授業データを読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={classesData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.classItem}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classDetail}>担当: {item.teacher}</Text>
          <Text style={styles.classDetail}>教室: {item.room}</Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.centeredMessageContainer}>
          <Text>登録されている授業はありません。</Text>
        </View>
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
};

/**
 * BusScreen Component (Placeholder)
 */
const BusScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text>バス時間</Text>
  </View>
);

/**
 * MapScreen Component - RESTORED (Ensure dependencies are fixed!)
 * Displays an interactive map with user location and markers.
 */
const MapScreen = () => {
  const mapRef = useRef(null);
  // Safe default region (Fujisawa)
  const fujisawaRegion = {
    latitude: 35.3396,
    longitude: 139.4876,
    latitudeDelta: 0.04,
    longitudeDelta: 0.02,
  };

  const [currentRegion, setCurrentRegion] = useState(fujisawaRegion);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false); // Track location fetching state
  const [locationAPIAvailable, setLocationAPIAvailable] = useState(true); // Track if Location API is available

  // Example marker
  const markerLocation = {
    latitude: 35.3660,
    longitude: 139.4315,
    title: "湘南工科大学",
    description: "Shonan Institute of Technology (Approx.)"
  };

  // Check if Location API is available
  useEffect(() => {
    // Verify the Location API is available and properly exported
    if (!Location || typeof Location.requestForegroundPermissionsAsync !== 'function') {
      console.error('Expo Location API is not properly initialized or available');
      setLocationAPIAvailable(false);
      setLocationError('位置情報APIが利用できないか、正しく初期化されていません。');
      return;
    }

    // If Location API is available, proceed with checking permissions
    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermissionGranted(true);
        } else {
          setLocationPermissionGranted(false);
        }
      } catch (error) {
        console.error("Permission check error:", error);
        setLocationError('位置情報の許可状態の確認に失敗しました。');
        setLocationPermissionGranted(false);
      }
    };

    checkPermission();
  }, []);

  // Function to request location permission
  const requestLocationPermission = async () => {
    // Verify Location API is available before attempting to use it
    if (!locationAPIAvailable) {
      setLocationError('位置情報APIが利用できません。アプリを再起動してください。');
      return false;
    }

    setLocationError(null); // Clear previous errors
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('位置情報の許可が必要です。アプリの設定から許可してください。');
        setLocationPermissionGranted(false);
        Alert.alert(
            "許可が必要",
            "地図機能を利用するには位置情報の許可が必要です。設定画面を開きますか？",
            [
                { text: "キャンセル", style: "cancel" },
                { text: "設定を開く", onPress: () => Linking.openSettings() }
            ]
        );
        return false;
      }
      setLocationPermissionGranted(true);
      return true;
    } catch (error) {
      console.error("Permission request error:", error);
      setLocationError('位置情報の許可の確認中にエラーが発生しました。');
      setLocationPermissionGranted(false);
      return false;
    }
  };

  // Function to get the user's current location and center the map
  const getCurrentLocation = async () => {
    // Verify Location API is available
    if (!locationAPIAvailable) {
      setLocationError('位置情報APIが利用できません。アプリを再起動してください。');
      return;
    }

    // Check permission status first
    let granted = locationPermissionGranted;
    if (!granted) {
      // If not already granted, try requesting again
      granted = await requestLocationPermission();
      if (!granted) {
          // If still not granted after request, exit
          return;
      }
    }

    // If permission is granted, proceed to get location
    setLocationError(null); // Clear previous errors
    setIsGettingLocation(true); // Indicate loading

    try {
      // Safely use Location API with proper checks
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy ? Location.Accuracy.High : 5, // Fallback if enum not available
      });

      if (!location || !location.coords) {
        throw new Error('位置情報の取得に失敗しました。位置データが不完全です。');
      }

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01, // Zoom in closer
        longitudeDelta: 0.005,
      };

      setCurrentRegion(newRegion); // Update region state (optional, if map is controlled)

      // Safely animate map to the new location
      if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        mapRef.current.animateToRegion(newRegion, 1000); // 1 second animation
      }

    } catch (error) {
      console.error("Get location error:", error);
      let message = '位置情報の取得に失敗しました。';
      // Handle specific expo-location errors if needed (codes might differ from react-native-geolocation-service)
      if (error.code === 'E_LOCATION_TIMEOUT') {
        message = '位置情報の取得がタイムアウトしました。電波の良い場所で再度お試しください。';
      } else if (error.message && error.message.includes("Location services are disabled")) {
         message = "位置情報サービスが無効になっています。端末の設定を確認してください。";
      }
      setLocationError(message);
      Alert.alert("位置情報エラー", message);
    } finally {
      setIsGettingLocation(false); // Stop loading indicator
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={fujisawaRegion}
        // region={currentRegion} // Uncomment if you want map strictly controlled by state
        showsUserLocation={locationPermissionGranted} // Show blue dot only if permitted
        showsMyLocationButton={false} // Hide default button
        showsCompass={true}
        zoomControlEnabled={true}
      >
        {/* Only render UrlTile if it's available */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
          shouldReplaceMapContent={true}
        />
        <Marker
          coordinate={markerLocation}
          title={markerLocation.title}
          description={markerLocation.description}
          pinColor={COLORS.primary}
        />
      </MapView>

      {/* Display error if Location API is unavailable */}
      {!locationAPIAvailable && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTextSmall}>
            位置情報APIが利用できません。アプリを再インストールするか、開発者にお問い合わせください。
          </Text>
        </View>
      )}

      {/* Overlay to display location errors */}
      {locationError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTextSmall}>{locationError}</Text>
          {/* Show link to settings if error suggests permission/service issues */}
          {(locationError.includes("許可") || locationError.includes("無効")) && (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsLink}>設定を開く</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Container for custom map action buttons */}
      <View style={styles.mapButtonContainer}>
        {/* Button to get current location (or request permission if needed) */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={locationAPIAvailable ?
            (locationPermissionGranted ? getCurrentLocation : requestLocationPermission) :
            () => Alert.alert("エラー", "位置情報APIが利用できません。")}
          disabled={isGettingLocation || !locationAPIAvailable} // Disable button when API unavailable or fetching location
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.mapButtonText}>
              {locationPermissionGranted ? '現在地を表示' : '位置情報を許可'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};


/**
 * PostsScreen Component (Placeholder)
 */
const PostsScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text>投稿</Text>
  </View>
);

// REMOVED: StudentDiscountScreen Component is no longer needed
// const StudentDiscountScreen = () => (
//   <View style={styles.placeholderScreen}>
//     <Text>学割</Text>
//   </View>
// );


// --- Navigation Setup ---
const SwipeableTabs = createMaterialTopTabNavigator();

/**
 * SwipeableTabsWithBottomBar Component
 * Manages the main app layout with swipeable top tabs and a custom bottom tab bar.
 * ADDED: App header, Profile placeholder in tab bar, Margin above tabs.
 * REMOVED: Student Discount tab.
 * NOTE: MapScreen restored, ensure dependencies are fixed first!
 */
const SwipeableTabsWithBottomBar = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Updated screens array: Removed '学割', MapScreen component restored
  const screens = [
    { name: '時間割', component: TimetableScreen, icon: ICONS.calendar },
    { name: '授業一覧', component: ClassesScreen, icon: ICONS.list },
    { name: 'バス', component: BusScreen, icon: ICONS.bus },
    // RESTORED MapScreen - Ensure dependencies are fixed via `npx expo install --fix`
    { name: 'マップ', component: MapScreen, icon: ICONS.map },
    { name: '投稿', component: PostsScreen, icon: ICONS.posts },
    // { name: '学割', component: StudentDiscountScreen, icon: ICONS.card }, // Removed
  ];

  /**
   * TabNavigationState Component (Helper)
   * Observes navigation state to update the active index for the custom bottom bar.
   */
  const TabNavigationState = ({ state }) => {
    useEffect(() => {
      if (state && typeof state.index === 'number') {
        setActiveIndex(state.index);
      }
    }, [state]);
    return null; // Renders nothing
  };

  // Function to handle settings icon press
  const handleSettingsPress = () => {
    // Placeholder for settings action
    Alert.alert("Settings", "Settings menu would open here.");
    console.log("Settings icon pressed");
  };

  // Function to handle profile icon press
  const handleProfilePress = () => {
    // Placeholder for profile action
    Alert.alert("Profile", "Profile screen/modal would open here.");
    console.log("Profile icon pressed");
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* --- App Header --- */}
      <View style={styles.appHeaderContainer}>
        <Text style={styles.appHeaderTitle}>Kamo 🦆</Text>
        <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsIconTouchable}>
          <Text style={styles.settingsIconText}>{ICONS.settings}</Text>
        </TouchableOpacity>
      </View>

      {/* --- Main Content (Tabs) --- */}
      <View style={{ flex: 1, marginTop: 10 }}>
        <SwipeableTabs.Navigator
          tabBar={(props) => <TabNavigationState state={props.state} />} // Inject state observer
          screenOptions={{
             swipeEnabled: true,
             tabBarShowLabel: false,
             tabBarIndicatorStyle: { backgroundColor: 'transparent', height: 0 },
             tabBarStyle: { height: 0 }
          }}
          initialRouteName="時間割"
        >
          {screens.map((screen) => (
            <SwipeableTabs.Screen
              key={screen.name}
              name={screen.name}
              component={screen.component}
            />
          ))}
        </SwipeableTabs.Navigator>
      </View>

      {/* --- Custom Bottom Tab Bar --- */}
      <View style={styles.tabBar}>
        {screens.map((screen, index) => {
          const TabButton = () => {
            const navigation = useNavigation();
            const isActive = activeIndex === index;

            return (
              <TouchableOpacity
                key={screen.name}
                style={styles.tabBarItem}
                onPress={() => {
                  if (navigation && typeof navigation.navigate === 'function') {
                    navigation.navigate(screen.name);
                  } else {
                    console.error('Navigation is not available');
                  }
                }}
                accessibilityLabel={screen.name}
              >
                <Text style={[styles.iconText, isActive && { color: COLORS.primary }]}>
                  {screen.icon}
                </Text>
                <Text style={[
                  styles.tabBarLabel,
                  isActive && { color: COLORS.primary, fontWeight: 'bold' }
                ]}>
                  {screen.name}
                </Text>
              </TouchableOpacity>
            );
          };
          return <TabButton key={screen.name} />;
        })}

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={handleProfilePress}
          accessibilityLabel="Profile"
        >
          <View style={styles.profilePlaceholderCircle} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- App Entry Point ---
/**
 * App Component
 * The root component of the application.
 */
export default function App() {
  // Add error boundary to catch runtime errors
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // Simple error boundary implementation
  useEffect(() => {
    // Access ErrorUtils globally (if available)
    const defaultErrorHandler = global.ErrorUtils?.getGlobalHandler();

    if (global.ErrorUtils) {
        global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('Global error caught:', error, isFatal);
        setHasError(true);
        setErrorInfo({
          message: error?.message || 'An unknown error occurred',
        });

        if (defaultErrorHandler) {
          defaultErrorHandler(error, isFatal);
        }
      });
    } else {
        console.warn("Global ErrorUtils not available. Cannot set global error handler.");
    }

    return () => {
      if (defaultErrorHandler && global.ErrorUtils) {
        global.ErrorUtils.setGlobalHandler(defaultErrorHandler);
      }
    };
  }, []);


  // If there's an error, show a fallback UI
  if (hasError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>アプリにエラーが発生しました</Text>
        <Text style={styles.errorMessage}>{errorInfo?.message}</Text>
        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => {
            setHasError(false);
            setErrorInfo(null);
          }}
        >
          <Text style={styles.restartButtonText}>リロードを試す</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    // Required wrapper for gesture handling
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <SwipeableTabsWithBottomBar />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // --- App Header Styles ---
  appHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 50,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  settingsIconTouchable: {
    padding: 2,
  },
  settingsIconText: {
    fontSize: 24,
    color: COLORS.darkGray,
  },
  // --- Screen Container ---
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // --- Timetable Screen Styles ---
  timetableHeaderContainer: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  topLeftCorner: {
    width: 60, // Reduced width
    borderRightWidth: 1,
    borderRightColor: COLORS.gray,
  },
  daysHeaderActual: {
    flex: 1,
    flexDirection: 'row',
  },
  dayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray,
  },
  selectedDay: {
    backgroundColor: COLORS.yellow,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  selectedDayText: {
    color: COLORS.black,
    fontWeight: 'bold',
  },
  scheduleContainer: {
    flex: 1,
  },
  periodRow: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  timeColumn: {
    width: 60, // Reduced width
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray,
    backgroundColor: COLORS.light,
    position: 'relative',
  },
  startTimeLabel: {
    fontSize: 11,
    color: COLORS.darkGray,
    position: 'absolute',
    top: 5,
  },
  endTimeLabel: {
    fontSize: 11,
    color: COLORS.darkGray,
    position: 'absolute',
    bottom: 5,
  },
  periodCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
   periodNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  dayGridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  classCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDayCell: {
    backgroundColor: '#FFF9E6',
  },
  totalUnitsContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    height: 40,
    backgroundColor: COLORS.light,
  },
  totalUnitsText: {
    fontSize: 14,
    color: COLORS.black,
    marginRight: 8,
  },
  infoButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 55 + 5, // Lowered further
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // --- Bottom Tab Bar Styles ---
  tabBar: {
    flexDirection: 'row',
    height: 55,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 22,
    marginBottom: 2,
    color: COLORS.darkGray,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  profilePlaceholderCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray,
  },
  // --- Placeholder & Message Styles ---
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  // --- Class List Screen Styles ---
  listContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  classItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  className: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 5,
  },
  classDetail: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  // --- Map Screen Styles ---
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(229, 57, 53, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  errorTextSmall: {
    color: COLORS.white,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  settingsLink: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  mapButtonContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  mapButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  // --- App-Level Error Boundary Screen Styles ---
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.light,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 25,
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  restartButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});