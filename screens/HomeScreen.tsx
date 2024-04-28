import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import {theme} from '../theme';
import {MagnifyingGlassIcon} from 'react-native-heroicons/outline';
import {CalendarDaysIcon, MapPinIcon} from 'react-native-heroicons/solid';
import {debounce, set} from 'lodash';
import {fetchLocations, fetchWeatherForecast} from '../api/weather';
import {weatherImages} from '../constants';
import * as Progress from 'react-native-progress';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';

export default function HomeScreen() {
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);

  const [currlocation, setcurrLocation] = useState(null);
  const [placeName, setPlaceName] = useState(null);

  useEffect(() => {
    // Request permission to access location
    Geolocation.requestAuthorization();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    Geolocation.getCurrentPosition(

      async position => {
        const { latitude, longitude } = position.coords;
     //   const { latitude, longitude } = position.coords;
       // setLocation({ latitude, longitude });
       await fetchPlaceName(latitude, longitude);
        setcurrLocation({ latitude, longitude });
      },
      error => Alert.alert(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  console.log('currlocation', currlocation)

  const fetchPlaceName = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      const address = response.data.results[0].formatted_address;
      console.log('address', address);
      setPlaceName(address);
    } catch (error) {
      console.error('Error fetching place name:', error);
    }
  };

  console.log('placeName', placeName)

  const handleLocation = (loc: any) => {
    console.log(loc);
    setLocations([]);
    toggleSearch(false);
    setLoading(true);
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7',
    }).then(data => {
      setWeather(data);
      setLoading(false);
      console.log('got weather forecast', data);
    });
  };

  const handleSearch = (value: string | any[]) => {
    console.log(value);
    if (value.length > 2) {
      fetchLocations({cityName: value}).then(data => {
        console.log('got locations', data);
        setLocations(data);
      });
    }
  };

  useEffect(() => {
    fetchMyWeatherData();
  }, [placeName]);

  const fetchMyWeatherData = async () => {
    fetchWeatherForecast({
      cityName: placeName,
      days: '7',
    }).then(data => {
      setWeather(data);
      if(placeName){
      setLoading(false);
      }
      console.log('got weather forecast', data);
    });
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

  const {current, location} = weather;

  return (
    <View className="flex-1 relative">
      <StatusBar barStyle={'light-content'} />
      <Image
        blurRadius={70}
        source={require('../assets/images/bg.png')}
        className="absolute h-full w-full"
      />
      {loading ? (
        <View className="flex-1 flex-row justify-center items-center">
          <Progress.CircleSnail
            color={['#0bb3b2', '#fff', '#0bb3b2']}
            size={140}
            thickness={10}
          />
        </View>
      ) : (
        <KeyboardAvoidingView behavior="padding" className="flex flex-1 pb-4">
          {/* Search Section */}
          <View style={{height: '7%'}} className="mx-4 relative z-50">
            <View
              className="flex-row justify-end item-center rounded-full mt-2"
              style={{
                backgroundColor: showSearch
                  ? theme.bgWhite(0.2)
                  : 'transparent',
              }}>
              {showSearch ? (
                <TextInput
                  onChangeText={handleTextDebounce}
                  placeholder="Search city"
                  placeholderTextColor={'lightgray'}
                  className="pl-6 h-10 pb-1 flex-1 text-base text-white pt-4"
                />
              ) : null}

              <TouchableOpacity
                onPress={() => toggleSearch(!showSearch)}
                style={{backgroundColor: theme.bgWhite(0.3)}}
                className="rounded-full p-3 m-1">
                <MagnifyingGlassIcon size="25" color="white" />
              </TouchableOpacity>
            </View>
            {locations.length > 0 && showSearch ? (
              <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                {locations.map((loc, index) => {
                  let showBorder = index + 1 != locations.length;
                  let borderClass = showBorder
                    ? 'border-b-2 border-b-gray-400'
                    : '';
                  return (
                    <TouchableOpacity
                      onPress={() => handleLocation(loc)}
                      key={index}
                      className={
                        'flex-row items-center border-0 p-3 px-4 mb-1 ' +
                        borderClass
                      }>
                      <MapPinIcon size="20" color="gray" />
                      <Text className="text-black text-lg ml-2">
                        {loc?.name}, {loc?.country}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
          {/* forecast section */}
          {showSearch ? null : (
            <View className="mx-4 flex justify-around flex-1 mb-2">
              {/*location */}
              <Text className="text-white text-center text-2xl font-bold">
                {location?.name},
                <Text className="text-lg font-semibold text-gray-300">
                  {' '}
                  {location?.country}
                </Text>
              </Text>
              {/* weather image */}
              <View className="flex-row justify-center">
                <Image
                  source={
                    weatherImages[
                      current?.condition?.text as keyof typeof weatherImages
                    ]
                  }
                  className="w-52 h-52"
                />
              </View>
              {/* degree celcius */}
              <View className="space-y-2">
                <Text className="text-center font-bold text-white text-6xl ml-5">
                  {current?.temp_c}&#176;
                </Text>
                <Text className="text-center text-white text-xl tracking-widest">
                  {current?.condition?.text}
                </Text>
              </View>
              {/* other stats */}
              <View className="flex-row justify-between mx-4">
                <View className="flex-row space-x-2 items-center">
                  <Image
                    source={require('../assets/images/wind.png')}
                    className="w-6 h-6"
                  />
                  <Text className="text-white font-semibold text-base">
                    {current?.wind_kph}km/h
                  </Text>
                </View>
                <View className="flex-row space-x-2 items-center">
                  <Image
                    source={require('../assets/images/drop.png')}
                    className="w-6 h-6"
                  />
                  <Text className="text-white font-semibold text-base">
                    {current?.humidity}%
                  </Text>
                </View>
                <View className="flex-row space-x-2 items-center">
                  <Image
                    source={require('../assets/images/sun.png')}
                    className="w-6 h-6"
                  />
                  <Text className="text-white font-semibold text-base">
                    {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* forecast for next days */}
          {showSearch ? null : (
            <View className="mb-2 space-y-3">
              <View className="flex-row items-center mx-5 space-x-2">
                <CalendarDaysIcon size="22" color="white" />
                <Text className="text-white text-base">Daily forecast</Text>
              </View>
              <ScrollView
                horizontal
                contentContainerStyle={{paddingHorizontal: 15}}
                showsHorizontalScrollIndicator={false}>
                {weather?.forecast?.forecastday?.map(
                  (
                    item: {
                      date: string | number | Date;
                      day: {
                        condition: {text: string};
                        avgtemp_c:
                          | string
                          | number
                          | boolean
                          | React.ReactElement<
                              any,
                              string | React.JSXElementConstructor<any>
                            >
                          | Iterable<React.ReactNode>
                          | React.ReactPortal
                          | null
                          | undefined;
                      };
                    },
                    index: React.Key | null | undefined,
                  ) => {
                    let date = new Date(item?.date);
                    let options = {weekday: 'long' as const};
                    let dayName = date.toLocaleDateString('en-US', options);
                    dayName = dayName.split(',')[0];
                    return (
                      <View
                        key={index}
                        className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
                        style={{backgroundColor: theme.bgWhite(0.15)}}>
                        <Image
                          source={{uri: 'https:' + item?.day?.condition?.icon}}
                          // source={weatherImages[item?.day?.condition?.text as keyof typeof weatherImages]}
                          className="w-11 h-11"
                        />
                        <Text className="text-white">{dayName}</Text>
                        <Text className="text-white text-xl font-semibold">
                          {item?.day?.avgtemp_c}&#176;
                        </Text>
                      </View>
                    );
                  },
                )}
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
