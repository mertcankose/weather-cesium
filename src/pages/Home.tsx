import React from "react";
import MapComponent from "@/components/map/Map";

const HomePage: React.FC = () => {
  return (
    <div className="relative h-screen w-full">
      <MapComponent />

      {/* Bilgi içeriğini Cesium haritasına entegre ettik, burada ekstra bilgiye gerek yok */}
      {/* İsteğe bağlı: Mini bir başlık/logo bölümü eklenebilir */}
      <div className="absolute top-4 right-4 z-10 bg-white bg-opacity-70 p-1 rounded-lg">
        <h1 className="text-sm font-bold">TürkiyeHava</h1>
      </div>
    </div>
  );
};

export default HomePage;
