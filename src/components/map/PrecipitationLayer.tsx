import React from "react";
import { Entity, CustomDataSource, Camera } from "resium";
import {
  Cartesian3,
  Color,
  JulianDate,
  Math as CesiumMath,
  HorizontalOrigin,
  VerticalOrigin,
} from "cesium";

interface RainData {
  lon: number;
  lat: number;
  name: string;
  intensity: number;
  temperature: number;
  weather: "rainy" | "sunny" | "cloudy" | "snowy" | "stormy";
}

interface PrecipitationLayerProps {
  show: boolean;
  selectedCity: string | null;
  onSelectCity: (city: string) => void;
  currentTime: JulianDate;
  showParticles?: boolean;
  showLabels?: boolean;
  apiData?: any;
}

// Fallback data in case API data is not available
const fallbackWeatherData: RainData[] = [
  {
    lon: 28.9784,
    lat: 41.0082,
    name: "İstanbul",
    intensity: 0.8,
    temperature: 18,
    weather: "rainy",
  },
  // ... other fallback data points
];

// Zamanla değişecek olan hava durumu simülasyonu için başlangıç ve bitiş zamanları
const start = JulianDate.fromIso8601("2023-01-01T00:00:00Z");

const PrecipitationLayer: React.FC<PrecipitationLayerProps> = ({
  show,
  selectedCity,
  onSelectCity,
  currentTime,
  showParticles = true,
  showLabels = true,
  apiData,
}) => {
  if (!show) return null;

  // Use API data if available, otherwise use fallback data
  const weatherData = apiData || fallbackWeatherData;

  // Zaman geçişine göre hava durumu hesaplaması
  const getTimeBasedWeather = (
    baseWeather: string,
    intensity: number,
    time: JulianDate
  ) => {
    // Günün hangi saatindeyiz?
    const hourOfDay = (JulianDate.secondsDifference(time, start) / 3600) % 24;

    // Basit zaman bazlı hava durumu değişimi
    if (baseWeather === "cloudy") {
      if (hourOfDay > 8 && hourOfDay < 12 && intensity < 0.4) {
        return "sunny";
      } else if (hourOfDay > 14 && hourOfDay < 18 && intensity > 0.6) {
        return "rainy";
      }
    } else if (baseWeather === "sunny") {
      if (hourOfDay > 15 && hourOfDay < 20 && intensity > 0.5) {
        return "cloudy";
      }
    } else if (baseWeather === "rainy") {
      if (hourOfDay > 7 && hourOfDay < 11 && intensity < 0.7) {
        return "cloudy";
      }
    }

    return baseWeather;
  };

  // Sıcaklık da saat bazında değişim gösterir
  const getTimeBasedTemperature = (baseTemp: number, time: JulianDate) => {
    const hourOfDay = (JulianDate.secondsDifference(time, start) / 3600) % 24;
    const timeMultiplier = Math.sin(((hourOfDay - 3) / 24) * 2 * Math.PI);
    return baseTemp + timeMultiplier * 5; // ±5 derece değişim
  };

  // Seçilen şehrin pozisyonu
  const selectedCityData = selectedCity
    ? weatherData.find((city: any) => city.name === selectedCity)
    : null;

  return (
    <CustomDataSource name="weather-data">
      {/* Kamera ile seçilen şehre odaklanma */}
      {selectedCityData && (
        <Camera
          position={Cartesian3.fromDegrees(
            selectedCityData.lon,
            selectedCityData.lat,
            200000
          )}
          heading={CesiumMath.toRadians(0)}
          pitch={CesiumMath.toRadians(-45)}
          roll={0}
        />
      )}

      {/* Hava durumu göstergeleri */}
      {weatherData.map((location: any, index: number) => {
        // Zaman bazlı hava durumu ve sıcaklık hesaplaması
        const timeBasedWeather = getTimeBasedWeather(
          location.weather,
          location.intensity,
          currentTime
        );
        const timeBasedTemperature = getTimeBasedTemperature(
          location.temperature,
          currentTime
        );

        // Hava durumuna göre renk belirleme
        let pointColor;
        switch (timeBasedWeather) {
          case "rainy":
            pointColor = Color.BLUE;
            break;
          case "sunny":
            pointColor = Color.YELLOW;
            break;
          case "cloudy":
            pointColor = Color.LIGHTGRAY;
            break;
          case "snowy":
            pointColor = Color.WHITE;
            break;
          case "stormy":
            pointColor = Color.DARKGRAY;
            break;
          default:
            pointColor = Color.BLUE;
        }

        // Simge boyutu hava yoğunluğuna göre değişir
        const pointSize = 15 + location.intensity * 15;

        return (
          <Entity
            key={index}
            name={location.name}
            position={Cartesian3.fromDegrees(
              location.lon,
              location.lat,
              30000 + location.intensity * 10000
            )}
            point={{
              pixelSize: pointSize,
              color: pointColor.withAlpha(0.7),
              outlineColor: Color.WHITE,
              outlineWidth: 2,
            }}
            description={`
              <h2>${location.name}</h2>
              <p><strong>Sıcaklık:</strong> ${Math.round(
                timeBasedTemperature
              )}°C</p>
              <p><strong>Yağış Olasılığı:</strong> ${Math.round(
                location.intensity * 100
              )}%</p>
              <p><strong>Hava Durumu:</strong> ${getWeatherName(
                timeBasedWeather
              )}</p>
            `}
            onClick={() => onSelectCity(location.name)}
          />
        );
      })}

      {/* Yağmur efekti için ek parçacıklar */}
      {showParticles &&
        weatherData
          .filter((location: any) => {
            const timeBasedWeather = getTimeBasedWeather(
              location.weather,
              location.intensity,
              currentTime
            );
            return (
              timeBasedWeather === "rainy" || timeBasedWeather === "stormy"
            );
          })
          .map((location: any, index: number) => {
            // Yağmur damlaları oluştur (sınırlı sayıda)
            const drops = [];
            const dropCount = Math.min(5, Math.floor(5 * location.intensity));

            for (let i = 0; i < dropCount; i++) {
              const offsetLon = (Math.random() - 0.5) * 0.05;
              const offsetLat = (Math.random() - 0.5) * 0.05;

              drops.push(
                <Entity
                  key={`rain-${index}-${i}`}
                  position={Cartesian3.fromDegrees(
                    location.lon + offsetLon,
                    location.lat + offsetLat,
                    25000 - i * 5000
                  )}
                  point={{
                    pixelSize: 3,
                    color: Color.CYAN.withAlpha(0.7),
                    outlineColor: Color.WHITE,
                    outlineWidth: 1,
                  }}
                />
              );
            }

            return drops;
          })}

      {/* Kar efekti için ek parçacıklar */}
      {showParticles &&
        weatherData
          .filter((location: any) => {
            const timeBasedWeather = getTimeBasedWeather(
              location.weather,
              location.intensity,
              currentTime
            );
            return timeBasedWeather === "snowy";
          })
          .map((location: any, index: number) => {
            const snowflakes = [];
            const flakeCount = Math.min(5, Math.floor(5 * location.intensity));

            for (let i = 0; i < flakeCount; i++) {
              const offsetLon = (Math.random() - 0.5) * 0.05;
              const offsetLat = (Math.random() - 0.5) * 0.05;

              snowflakes.push(
                <Entity
                  key={`snow-${index}-${i}`}
                  position={Cartesian3.fromDegrees(
                    location.lon + offsetLon,
                    location.lat + offsetLat,
                    25000 - i * 5000
                  )}
                  point={{
                    pixelSize: 4,
                    color: Color.WHITE,
                    outlineColor: Color.LIGHTBLUE,
                    outlineWidth: 1,
                  }}
                />
              );
            }

            return snowflakes;
          })}

      {/* Şehir etiketleri */}
      {showLabels &&
        weatherData.map((location: any, index: number) => {
          const timeBasedWeather = getTimeBasedWeather(
            location.weather,
            location.intensity,
            currentTime
          );
          const timeBasedTemperature = Math.round(
            getTimeBasedTemperature(location.temperature, currentTime)
          );

          return (
            <Entity
              key={`label-${index}`}
              position={Cartesian3.fromDegrees(
                location.lon,
                location.lat,
                10000
              )}
              label={{
                text:
                  selectedCity === location.name
                    ? `${
                        location.name
                      }\n${timeBasedTemperature}°C\n${getWeatherEmoji(
                        timeBasedWeather
                      )}`
                    : location.name,
                font:
                  selectedCity === location.name
                    ? "18px sans-serif"
                    : "14px sans-serif",
                style: 0,
                outlineWidth: 2,
                outlineColor: Color.BLACK,
                fillColor: Color.WHITE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                horizontalOrigin: HorizontalOrigin.CENTER,
                pixelOffset: new Cartesian3(0, -5, 0),
                showBackground: selectedCity === location.name,
                backgroundColor: new Color(0, 0, 0, 0.5),
              }}
            />
          );
        })}

      {/* Seçilen şehir için emoji gösterimi */}
      {selectedCity && selectedCityData && showLabels && (
        <Entity
          position={Cartesian3.fromDegrees(
            selectedCityData.lon,
            selectedCityData.lat,
            40000
          )}
          point={{
            pixelSize: 0, // Görünmez nokta (sadece etiket için)
          }}
          label={{
            text: getWeatherEmoji(
              getTimeBasedWeather(
                selectedCityData.weather,
                selectedCityData.intensity,
                currentTime
              )
            ),
            font: "32px sans-serif",
            style: 0,
            verticalOrigin: VerticalOrigin.CENTER,
            horizontalOrigin: HorizontalOrigin.CENTER,
          }}
        />
      )}
    </CustomDataSource>
  );
};

// Hava durumu emoji'leri
function getWeatherEmoji(weather: string): string {
  switch (weather) {
    case "rainy":
      return "🌧️";
    case "sunny":
      return "☀️";
    case "cloudy":
      return "☁️";
    case "snowy":
      return "❄️";
    case "stormy":
      return "⛈️";
    default:
      return "☁️";
  }
}

// Hava durumu Türkçe isimleri
function getWeatherName(weather: string): string {
  switch (weather) {
    case "rainy":
      return "Yağmurlu";
    case "sunny":
      return "Güneşli";
    case "cloudy":
      return "Bulutlu";
    case "snowy":
      return "Karlı";
    case "stormy":
      return "Fırtınalı";
    default:
      return "Belirsiz";
  }
}

export default PrecipitationLayer;
