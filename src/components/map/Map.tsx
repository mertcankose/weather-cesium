import React, { useEffect, useRef, useState } from "react";
import { Viewer, Clock } from "resium";
import {
  Ion,
  Cartesian3,
  Math as CesiumMath,
  Viewer as CesiumViewer,
  JulianDate,
  ClockRange,
  ClockStep,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import PrecipitationLayer from "@/components/map/PrecipitationLayer";

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

const Map: React.FC = () => {
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<JulianDate>(
    JulianDate.fromIso8601("2023-01-01T00:00:00Z")
  );
  const viewerRef = useRef<CesiumViewer | null>(null);

  // Zaman bazlı animasyon için başlangıç ve bitiş zamanları
  const startTime = JulianDate.fromIso8601("2023-01-01T00:00:00Z");
  const stopTime = JulianDate.fromIso8601("2023-01-02T00:00:00Z");

  useEffect(() => {
    // Cesium viewer oluşturulduktan sonra Türkiye'ye odaklanma
    if (viewerRef.current) {
      // Daha yakın ve daha doğru bir açıyla Türkiye'ye odaklanma
      viewerRef.current.camera.flyTo({
        destination: Cartesian3.fromDegrees(35.2433, 38.9637, 2500000),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-45),
          roll: 0.0,
        },
        duration: 2,
      });

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

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <Viewer
        full
        ref={(e) => {
          if (e && e.cesiumElement) {
            viewerRef.current = e.cesiumElement;
          }
        }}
        shouldAnimate={true}
      >
        {/* Zaman bazlı animasyon için saat ayarları */}
        <Clock
          startTime={startTime}
          stopTime={stopTime}
          currentTime={startTime}
          multiplier={3600}
          clockRange={ClockRange.LOOP_STOP}
          clockStep={ClockStep.SYSTEM_CLOCK_MULTIPLIER}
        />

        <PrecipitationLayer
          show={showWeather}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          currentTime={currentTime}
        />
      </Viewer>

      {/* Minimal Bilgi Paneli */}
      {showInfo && (
        <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-80 p-2 rounded shadow-md max-w-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold">Türkiye Hava Durumu</h3>
            <button
              className="text-xs text-gray-500 px-1"
              onClick={() => setShowInfo(false)}
            >
              ✕
            </button>
          </div>
          <div className="text-xs mt-1 flex flex-wrap gap-1">
            <span>🌧️</span>
            <span>☀️</span>
            <span>☁️</span>
            <span>❄️</span>
            <span>⛈️</span>
          </div>
        </div>
      )}

      {/* Seçilen şehir bilgi paneli (çok daha minimal) */}
      {selectedCity && (
        <div className="absolute bottom-20 right-4 z-10 bg-white bg-opacity-90 p-2 rounded shadow-md max-w-xs">
          <h4 className="text-sm font-bold">{selectedCity}</h4>
          <p className="text-xs text-gray-600">
            Günün ilerleyen saatlerini görmek için zaman çubuğunu kullanın.
          </p>
        </div>
      )}

      {/* Kontrol Butonları */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        {!showInfo && (
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-1 px-2 rounded"
            onClick={() => setShowInfo(true)}
          >
            ℹ️
          </button>
        )}

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded"
          onClick={() => setShowWeather(!showWeather)}
        >
          {showWeather ? "Hava Durumunu Gizle" : "Hava Durumunu Göster"}
        </button>

        {selectedCity && (
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-1 px-2 rounded"
            onClick={() => setSelectedCity(null)}
          >
            Genel Görünüm
          </button>
        )}
      </div>
    </div>
  );
};

export default Map;
