import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center bg-[#0B2C3D] text-white px-8 py-4 shadow-md">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-white">PITZ</span>
          <span className="text-red-600">BOL</span>
        </h1>

        <div className="flex items-center gap-4">
          <button className="hover:text-red-500 transition">Identifícate</button>
          <button className="p-2 rounded-full hover:bg-[#143f56] transition">
            🔍
          </button>
        </div>
      </nav>

      {/* CATEGORÍAS */}
      <section className="flex flex-wrap justify-center gap-6 py-8 bg-white">
        {["Fútbol", "Gastronomía", "Arte", "Cultura"].map((categoria) => (
          <div
            key={categoria}
            className="relative w-56 h-28 rounded-xl overflow-hidden shadow-lg cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-white text-xl font-bold group-hover:opacity-80 transition">
              {/* Aquí iría la imagen de fondo */}
              {categoria}
            </div>
          </div>
        ))}
      </section>

      {/* FECHAS */}
      <div className="flex justify-center gap-4 py-2 bg-gray-200">
        {["10 MIE", "11 JUE", "12 VIE", "13 SAB", "14 DOM", "15 LUN", "16 MAR"].map(
          (fecha, index) => (
            <div
              key={fecha}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                index === 1 ? "bg-red-500 text-white" : "bg-gray-400 text-white"
              }`}
            >
              {fecha}
            </div>
          )
        )}
      </div>

      {/* PARTIDO */}
      <section className="flex flex-col md:flex-row items-start justify-center gap-8 py-10 px-8">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex items-center justify-between bg-red-700 text-white rounded-lg px-4 py-3 shadow-md">
            <div className="flex items-center gap-2">
              {/* Bandera México */}
              <a
                href="https://www.callfour.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-13 h-13 rounded-full overflow-hidden"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/1024px-Flag_of_Mexico.svg.png"
                  alt="Bandera de México"
                  className="w-full h-full object-cover"
                />
              </a>
              <span className="font-semibold">México</span>
            </div>
            <div className="text-sm font-medium">19:00 hrs</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Alemania</span>
              {/* Bandera Alemania */}
              <a
                href="https://www.callfour.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-13 h-13 rounded-full overflow-hidden"
              >
                <img
                  src="https://img.freepik.com/fotos-premium/bandera-alemana-alemania_469558-8411.jpg"
                  alt="Bandera de Alemania"
                  className="w-full h-full object-cover"
                />
              </a>
            </div>
          </div>

          <div className="bg-[#F8F3EB] rounded-lg p-4 shadow-inner min-h-[180px]">
            <h2 className="font-semibold mb-2 text-gray-800">Itinerario de hoy:</h2>
            <p className="text-sm text-gray-500">
              (Aquí puedes mostrar los eventos, partidos o actividades del día)
            </p>
          </div>
        </div>

        {/* SECCIÓN DE ARTE */}
        <div className="flex flex-col w-full max-w-xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Arte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              "Palacio de Bellas Artes",
              "Museo Soumaya",
              "MUSEO MUXC",
            ].map((lugar) => (
              <div
                key={lugar}
                className="w-full h-48 bg-gray-300 rounded-lg flex items-center justify-center text-center font-semibold shadow-md hover:scale-105 transition"
              >
                {/* Aquí iría la imagen de cada lugar */}
                {lugar}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
