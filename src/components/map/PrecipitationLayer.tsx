import React from "react";
import { Entity, CustomDataSource, Camera } from "resium";
import {
  Cartesian3,
  Color,
  HeightReference,
  JulianDate,
  CallbackProperty,
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
}

// Genişletilmiş ve anlamlı hava durumu verileri
const weatherData: RainData[] = [
  {
    lon: 28.9784,
    lat: 41.0082,
    name: "İstanbul",
    intensity: 0.8,
    temperature: 18,
    weather: "rainy",
  },
  {
    lon: 32.8597,
    lat: 39.9334,
    name: "Ankara",
    intensity: 0.2,
    temperature: 15,
    weather: "cloudy",
  },
  {
    lon: 27.1428,
    lat: 38.4237,
    name: "İzmir",
    intensity: 0.5,
    temperature: 23,
    weather: "cloudy",
  },
  {
    lon: 29.0609,
    lat: 37.7765,
    name: "Denizli",
    intensity: 0.3,
    temperature: 21,
    weather: "sunny",
  },
  {
    lon: 35.3308,
    lat: 37.0,
    name: "Adana",
    intensity: 0.9,
    temperature: 26,
    weather: "rainy",
  },
  {
    lon: 39.75,
    lat: 41.0,
    name: "Erzurum",
    intensity: 0.1,
    temperature: 5,
    weather: "snowy",
  },
  {
    lon: 30.7133,
    lat: 36.8969,
    name: "Antalya",
    intensity: 0.7,
    temperature: 27,
    weather: "sunny",
  },
  {
    lon: 38.7312,
    lat: 35.4787,
    name: "Kayseri",
    intensity: 0.4,
    temperature: 14,
    weather: "cloudy",
  },
  {
    lon: 29.4535,
    lat: 40.1885,
    name: "Bursa",
    intensity: 0.6,
    temperature: 19,
    weather: "rainy",
  },
  {
    lon: 37.3826,
    lat: 37.0662,
    name: "Gaziantep",
    intensity: 0.5,
    temperature: 22,
    weather: "cloudy",
  },
  {
    lon: 41.2867,
    lat: 39.9075,
    name: "Trabzon",
    intensity: 0.8,
    temperature: 17,
    weather: "stormy",
  },
];

// Zamanla değişecek olan hava durumu simülasyonu için başlangıç ve bitiş zamanları
const start = JulianDate.fromIso8601("2023-01-01T00:00:00Z");
const stop = JulianDate.fromIso8601("2023-01-02T00:00:00Z");

const PrecipitationLayer: React.FC<PrecipitationLayerProps> = ({
  show,
  selectedCity,
  onSelectCity,
  currentTime,
}) => {
  if (!show) return null;

  // Seçilen şehrin pozisyonu (eğer bir şehir seçilmişse)
  const selectedCityData = selectedCity
    ? weatherData.find((city) => city.name === selectedCity)
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
      {weatherData.map((location, index) => {
        // Zaman bazlı animasyon için callback property
        const position = new CallbackProperty((time) => {
          // Zamanla hafif yükseklik değişimi (dalgalanma efekti)
          const secondsSinceStart = JulianDate.secondsDifference(time!, start); // Add non-null assertion
          const oscillation = Math.sin(secondsSinceStart / 120) * 5000; // 2 dakikalık döngü

          return Cartesian3.fromDegrees(
            location.lon,
            location.lat,
            30000 + location.intensity * 10000 + oscillation
          );
        }, false);

        // Hava durumuna göre görsel özellikler belirleme
        let primitiveProps;
        let colorValue;

        switch (location.weather) {
          case "rainy":
            // Yağmur için mavi silindir
            primitiveProps = {
              cylinder: {
                length: 50000 + location.intensity * 30000,
                topRadius: 20000,
                bottomRadius: 40000,
                slices: 32,
                material: Color.BLUE.withAlpha(0.6),
                outline: true,
                outlineColor: Color.WHITE,
              },
            };
            colorValue = Color.BLUE;
            break;

          case "sunny":
            // Güneş için sarı küre
            primitiveProps = {
              ellipsoid: {
                radii: new Cartesian3(25000, 25000, 25000),
                material: Color.YELLOW.withAlpha(0.8),
                outline: true,
                outlineColor: Color.ORANGE,
                outlineWidth: 2,
              },
            };
            colorValue = Color.YELLOW;
            break;

          case "cloudy":
            // Bulut için gri elipsoid
            primitiveProps = {
              ellipsoid: {
                radii: new Cartesian3(
                  30000 + location.intensity * 10000,
                  20000 + location.intensity * 10000,
                  15000 + location.intensity * 5000
                ),
                material: Color.LIGHTGRAY.withAlpha(0.7),
                outline: true,
                outlineColor: Color.WHITE,
              },
            };
            colorValue = Color.LIGHTGRAY;
            break;

          case "snowy":
            // Kar için beyaz yarım küre
            primitiveProps = {
              ellipsoid: {
                radii: new Cartesian3(25000, 25000, 15000),
                material: Color.WHITE.withAlpha(0.8),
                outline: true,
                outlineColor: Color.LIGHTBLUE,
              },
            };
            colorValue = Color.WHITE;
            break;

          case "stormy":
            // Fırtına için koyu gri piramit (kutu)
            primitiveProps = {
              box: {
                dimensions: new Cartesian3(
                  35000,
                  35000,
                  50000 + location.intensity * 20000
                ),
                material: Color.DARKGRAY.withAlpha(0.8),
                outline: true,
                outlineColor: Color.YELLOW.withAlpha(0.5), // Şimşek efekti
                outlineWidth: 2,
              },
            };
            colorValue = Color.DARKGRAY;
            break;

          default:
            // Varsayılan
            primitiveProps = {
              cylinder: {
                length: 40000,
                topRadius: 20000,
                bottomRadius: 20000,
                material: Color.BLUE.withAlpha(0.6),
              },
            };
            colorValue = Color.BLUE;
        }

        // Zamanla değişen ölçek (animasyon için)
        const scale = new CallbackProperty((time) => {
          const secondsSinceStart = JulianDate.secondsDifference(time!, start); // Add non-null assertion
          const pulseFactor = 0.95 + Math.sin(secondsSinceStart / 60) * 0.05; // Boyut değişimi
          return pulseFactor;
        }, false);

        return (
          <Entity
            key={index}
            name={location.name}
            position={position}
            // Hava durumuna göre belirlenmiş primitive'leri ekle
            {...primitiveProps}
            scale={scale}
            description={`
              <h2>${location.name}</h2>
              <p><strong>Sıcaklık:</strong> ${location.temperature}°C</p>
              <p><strong>Yağış Olasılığı:</strong> ${Math.round(
                location.intensity * 100
              )}%</p>
              <p><strong>Hava Durumu:</strong> ${getWeatherName(
                location.weather
              )}</p>
            `}
            onClick={() => onSelectCity(location.name)}
          />
        );
      })}

      {/* Yağmur efekti için ek parçacıklar (sadece yağmurlu yerler için) */}
      {weatherData
        .filter(
          (location) =>
            location.weather === "rainy" || location.weather === "stormy"
        )
        .map((location, index) => {
          // Yağmur damlaları oluştur
          const drops = [];
          const dropCount = Math.floor(10 * location.intensity);

          for (let i = 0; i < dropCount; i++) {
            // Rastgele pozisyon ofsetleri
            const offsetLon = (Math.random() - 0.5) * 0.05;
            const offsetLat = (Math.random() - 0.5) * 0.05;

            // Zaman bazlı hareket (yağmur düşme animasyonu)
            const dropPosition = new CallbackProperty((time) => {
              const secondsSinceStart = JulianDate.secondsDifference(
                time!,
                start
              ); // Add non-null assertion
              const cyclePosition = (secondsSinceStart / 5) % 1; // 5 saniyelik döngü

              // Yükseklikten aşağı düşen damlalar
              const height =
                30000 + location.intensity * 10000 - cyclePosition * 30000;

              return Cartesian3.fromDegrees(
                location.lon + offsetLon,
                location.lat + offsetLat,
                height
              );
            }, false);

            drops.push(
              <Entity
                key={`rain-${index}-${i}`}
                position={dropPosition}
                point={{
                  pixelSize: 3,
                  color:
                    location.weather === "stormy"
                      ? Color.LIGHTBLUE.withAlpha(0.7)
                      : Color.CYAN.withAlpha(0.7),
                  outlineColor: Color.WHITE,
                  outlineWidth: 1,
                }}
              />
            );
          }

          return drops;
        })}

      {/* Kar efekti için ek parçacıklar (sadece karlı yerler için) */}
      {weatherData
        .filter((location) => location.weather === "snowy")
        .map((location, index) => {
          // Kar taneleri oluştur
          const snowflakes = [];
          const flakeCount = Math.floor(15 * location.intensity);

          for (let i = 0; i < flakeCount; i++) {
            // Rastgele pozisyon ofsetleri
            const offsetLon = (Math.random() - 0.5) * 0.08;
            const offsetLat = (Math.random() - 0.5) * 0.08;

            // Zaman bazlı hareket (kar düşme ve uçuşma animasyonu)
            const flakePosition = new CallbackProperty((time) => {
              const secondsSinceStart = JulianDate.secondsDifference(
                time!,
                start
              ); // Add non-null assertion
              const cyclePosition = (secondsSinceStart / 8) % 1; // 8 saniyelik döngü

              // Yavaşça düşen ve hafif sağa-sola savrulan kar taneleri
              const height = 30000 - cyclePosition * 25000;
              const waveOffset = Math.sin(secondsSinceStart / 2 + i) * 0.01;

              return Cartesian3.fromDegrees(
                location.lon + offsetLon + waveOffset,
                location.lat + offsetLat,
                height
              );
            }, false);

            snowflakes.push(
              <Entity
                key={`snow-${index}-${i}`}
                position={flakePosition}
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

      {/* Şehir etiketleri ve hava durumu */}
      {weatherData.map((location, index) => (
        <Entity
          key={`label-${index}`}
          position={Cartesian3.fromDegrees(location.lon, location.lat, 0)}
          label={{
            text:
              selectedCity === location.name
                ? `${location.name}\n${
                    location.temperature
                  }°C\n${getWeatherEmoji(location.weather)}`
                : location.name,
            font:
              selectedCity === location.name
                ? "18px sans-serif"
                : "14px sans-serif",
            style: 0, // FILL
            outlineWidth: 2,
            outlineColor: Color.BLACK,
            fillColor: Color.WHITE,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.CENTER,
            pixelOffset: new Cartesian3(0, -5, 0),
            showBackground: selectedCity === location.name,
            backgroundColor: new Color(0, 0, 0, 0.5),
          }}
        />
      ))}

      {selectedCity && selectedCityData && (
        <Entity
          position={Cartesian3.fromDegrees(
            selectedCityData.lon,
            selectedCityData.lat,
            50000 // Göstergeden yukarıda olsun
          )}
          billboard={{
            image: getWeatherIconUrl(selectedCityData.weather),
            width: 48,
            height: 48,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.CENTER,
          }}
        />
      )}
    </CustomDataSource>
  );
};

function getWeatherIconUrl(weather: string): string {
  // Burada gerçekte hava durumu simgelerinin URL'lerini belirtmeniz gerekir
  // Basitlik için varsayılan simgeler kullanıyoruz
  switch (weather) {
    case "rainy":
      return "/api/placeholder/48/48"; // Yağmur simgesi
    case "sunny":
      return "/api/placeholder/48/48"; // Güneş simgesi
    case "cloudy":
      return "/api/placeholder/48/48"; // Bulut simgesi
    case "snowy":
      return "/api/placeholder/48/48"; // Kar simgesi
    case "stormy":
      return "/api/placeholder/48/48"; // Fırtına simgesi
    default:
      return "/api/placeholder/48/48"; // Varsayılan simge
  }
}

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
