import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "@/components/map/Map";
import { Button } from "@/components/ui/button";
import { getUsername, logout } from "@/lib/authService";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const currentUsername = getUsername();
    setUsername(currentUsername);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="relative h-screen w-full">
      <MapComponent />

      {/* Bilgi paneli */}
      <div className="absolute top-4 right-4 z-10 bg-white bg-opacity-70 p-2 rounded-lg flex items-center gap-2">
        <h1 className="text-sm font-bold">TürkiyeHava</h1>
        {username && <div className="text-xs text-gray-600">| {username}</div>}
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 text-xs py-1 h-auto"
          onClick={handleLogout}
        >
          Çıkış
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
