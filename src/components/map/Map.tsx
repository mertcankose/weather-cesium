import { FC, useEffect, useRef, useState } from "react";
import { Viewer } from "resium";
import {
  Ion,
  Math,
  Viewer as CesiumViewer,
  JulianDate,
  ClockRange,
  ClockStep,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import PrecipitationLayer from "@/components/map/PrecipitationLayer";
import { getWeatherData } from "@/lib/authService";
import { Alert, AlertDescription } from "@/components/ui/alert";

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

// Basit kontrol butonu
const ControlButton: FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ label, active = false, onClick }) => {
  return (
    <button
      className={`px-3 py-1 rounded text-sm ${
        active
          ? "bg-blue-500 text-white"
          : "bg-gray-300 hover:bg-gray-400 text-gray-700"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

const Map: FC = () => {
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(true);
  const [apiData, setApiData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Zaman bazlı animasyon için başlangıç ve bitiş zamanları
  const startTime = JulianDate.fromIso8601("2023-01-01T00:00:00Z");
  const stopTime = JulianDate.fromIso8601("2023-01-02T00:00:00Z");
  const [currentTime, setCurrentTime] = useState<JulianDate>(startTime);

  const viewerRef = useRef<CesiumViewer | null>(null);

  // Fetch weather data when component mounts
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setIsLoading(true);
        const data = await getWeatherData();
        console.log("weather: ", data);
        setApiData(data);
        setApiError(null);
      } catch (error: any) {
        console.error("Error fetching weather data:", error);
        setApiError(
          error.response?.data?.message ||
            "Weather data could not be loaded. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  useEffect(() => {
    // Cesium viewer ayarları
    if (viewerRef.current) {
      // Clock ayarlarını burada yapılandır
      viewerRef.current.clock.startTime = startTime;
      viewerRef.current.clock.stopTime = stopTime;
      viewerRef.current.clock.currentTime = startTime;
      viewerRef.current.clock.multiplier = 3600;
      viewerRef.current.clock.clockRange = ClockRange.LOOP_STOP;
      viewerRef.current.clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;

      // Timeline'ı etkinleştirme
      viewerRef.current.timeline.zoomTo(startTime, stopTime);
      viewerRef.current.forceResize();

      // Zaman güncellemelerini takip et
      viewerRef.current.clock.onTick.addEventListener((clock) => {
        setCurrentTime(clock.currentTime);
      });
    }
  }, [viewerRef.current]);

  // Şehir seçildiğinde bilgi paneli göster
  const handleSelectCity = (city: string) => {
    setSelectedCity(city === selectedCity ? null : city);
  };

  // Şu anki saati hesaplama (0-24 arası)
  const currentHour = Math.floor(
    (JulianDate.secondsDifference(currentTime, startTime) / 3600) % 24
  );

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {apiError && (
        <Alert
          variant="destructive"
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md"
        >
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <Viewer
        full
        ref={(e: any) => {
          if (e && e.cesiumElement) {
            viewerRef.current = e.cesiumElement;
          }
        }}
        shouldAnimate={true}
      >
        <PrecipitationLayer
          show={showWeather}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          currentTime={currentTime}
          showParticles={showParticles}
          showLabels={showLabels}
          apiData={apiData}
        />
      </Viewer>

      {/* Bilgi Paneli */}
      {showInfo && (
        <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-80 p-3 rounded shadow-md max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">Türkiye Hava Durumu</h3>
            <button
              className="text-xs text-gray-500 px-1"
              onClick={() => setShowInfo(false)}
            >
              ✕
            </button>
          </div>
          <div className="text-xs mb-3">
            <p>Saat: {currentHour}:00</p>
            <p>Şehirlere tıklayarak detaylı bilgi alabilirsiniz.</p>
            {isLoading && (
              <p className="text-blue-500">API verisi yükleniyor...</p>
            )}
          </div>
          <div className="text-xs flex flex-wrap gap-2 mt-2">
            <span title="Güneşli">☀️ Güneşli</span>
            <span title="Bulutlu">☁️ Bulutlu</span>
            <span title="Yağmurlu">🌧️ Yağmurlu</span>
            <span title="Karlı">❄️ Karlı</span>
            <span title="Fırtınalı">⛈️ Fırtınalı</span>
          </div>
        </div>
      )}

      {/* Seçilen şehir bilgi paneli */}
      {selectedCity && (
        <div className="absolute bottom-20 right-4 z-10 bg-white bg-opacity-90 p-3 rounded shadow-md max-w-xs">
          <h4 className="text-sm font-bold">{selectedCity}</h4>
          <p className="text-xs text-gray-600">
            Saat {currentHour}:00 itibariyle hava durumu görüntüleniyor.
          </p>
          {apiData && selectedCity && (
            <div className="text-xs mt-1">
              {(() => {
                const cityData = apiData.find(
                  (city: any) => city.name === selectedCity
                );
                if (cityData) {
                  return (
                    <>
                      <p className="font-semibold">
                        Sıcaklık: {cityData.temperature.toFixed(1)}°C
                      </p>
                      <p className="font-semibold">
                        Durum: {getWeatherName(cityData.weather)}
                      </p>
                      <p className="font-semibold">
                        Yağış Olasılığı: {Math.round(cityData.intensity * 100)}%
                      </p>
                    </>
                  );
                }
                return <p>Bu şehir için veri bulunamadı.</p>;
              })()}
            </div>
          )}
        </div>
      )}

      {/* Kontrol Butonları */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        {!showInfo && (
          <ControlButton label="Bilgi" onClick={() => setShowInfo(true)} />
        )}

        <ControlButton
          label={showWeather ? "Hava Durumunu Gizle" : "Hava Durumunu Göster"}
          active={showWeather}
          onClick={() => setShowWeather(!showWeather)}
        />

        <ControlButton
          label={showParticles ? "Parçacıkları Gizle" : "Parçacıkları Göster"}
          active={showParticles}
          onClick={() => setShowParticles(!showParticles)}
        />

        <ControlButton
          label={showLabels ? "Etiketleri Gizle" : "Etiketleri Göster"}
          active={showLabels}
          onClick={() => setShowLabels(!showLabels)}
        />

        {selectedCity && (
          <ControlButton
            label="Genel Görünüm"
            onClick={() => setSelectedCity(null)}
          />
        )}
      </div>
    </div>
  );
};

// Hava durumu Türkçe isimleri - Map içinde de kullanmak için eklendi
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

export default Map;
