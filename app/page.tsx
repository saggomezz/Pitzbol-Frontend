import Image from "next/image";
import { FiUser, FiSearch, FiMenu } from "react-icons/fi";

export default function Home() {
  
  const categories = [
    { name: "Fútbol", img: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070" },
    { name: "Gastronomía", img: "https://images.unsplash.com/photo-1711306722944-70b776bb4394?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1528" },
    { name: "Arte", img: "https://images.unsplash.com/photo-1597371437435-a029b8fa9cfc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070" },
    { name: "Cultura", img: "https://images.unsplash.com/photo-1564762332974-5bf63a654c9d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1932" },
    // --- IMAGEN DE EVENTOS ACTUALIZADA ---
    { name: "Eventos", img: "https://campestre.media/wp-content/uploads/2020/09/EDITORIAL.jpg" },
  ];

  const dates = [
    { day: "10", weekday: "MIE", fullDate: "2026-06-10", isGdlMatch: false, isActive: false },
    { day: "11", weekday: "JUE", fullDate: "2026-06-11", isGdlMatch: true, isActive: true },
    { day: "12", weekday: "VIE", fullDate: "2026-06-12", isGdlMatch: false, isActive: false },
    { day: "13", weekday: "SAB", fullDate: "2026-06-13", isGdlMatch: false, isActive: false },
    { day: "14", weekday: "DOM", fullDate: "2026-06-14", isGdlMatch: false, isActive: false },
    { day: "15", weekday: "LUN", fullDate: "2026-06-15", isGdlMatch: false, isActive: false },
    { day: "16", weekday: "MAR", fullDate: "2026-06-16", isGdlMatch: false, isActive: false },
    { day: "17", weekday: "MIE", fullDate: "2026-06-17", isGdlMatch: false, isActive: false },
    { day: "18", weekday: "JUE", fullDate: "2026-06-18", isGdlMatch: true, isActive: false },
    { day: "19", weekday: "VIE", fullDate: "2026-06-19", isGdlMatch: false, isActive: false },
    { day: "20", weekday: "SAB", fullDate: "2026-06-20", isGdlMatch: false, isActive: false },
    { day: "21", weekday: "DOM", fullDate: "2026-06-21", isGdlMatch: false, isActive: false },
    { day: "22", weekday: "LUN", fullDate: "2026-06-22", isGdlMatch: false, isActive: false },
    { day: "23", weekday: "MAR", fullDate: "2026-06-23", isGdlMatch: true, isActive: false },
    { day: "24", weekday: "MIE", fullDate: "2026-06-24", isGdlMatch: false, isActive: false },
  ];

  const recommendations = [
    { name: "Palacio de Bellas Artes", img: "https://images.unsplash.com/photo-1640213725723-956b31f11cec?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1287" },
    { name: "Museo Soumaya", img: "https://images.unsplash.com/photo-1571554033689-3d35dd6a7ef2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1335" },
    { name: "Museo Universitario Arte Contemporáneo", img: null },
  ];

  return (
    <div className="min-h-screen bg-white md:bg-[#f5f5f5] font-sans">
      
      {/* NAVBAR */}
      <nav className="flex justify-between items-center bg-[#0B2C3D] text-white px-4 md:px-8 py-4 shadow-md sticky top-0 z-50">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-white">PITZ</span>
          <span className="text-red-600">BOL</span>
        </h1>
        <div className="hidden md:flex items-center gap-6">
          <button className="text-sm font-medium hover:text-red-500 transition-colors duration-300">
            Identifícate
          </button>
          <button className="p-2 rounded-full hover:bg-[#143f56] transition-colors duration-300">
            <FiSearch size={20} />
          </button>
        </div>
        <div className="flex md:hidden items-center gap-3">
          <button className="p-2 rounded-full hover:bg-[#143f56] transition-colors duration-300">
            <FiUser size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-[#143f56] transition-colors duration-300">
            <FiSearch size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-[#143f56] transition-colors duration-300">
            <FiMenu size={20} />
          </button>
        </div>
      </nav>

      {/* TÍTULO CATEGORÍAS (Solo en móvil) */}
      <h2 className="text-2xl font-bold px-4 pt-6 md:hidden">
        Categorías
      </h2>

      {/* SECCIÓN CATEGORÍAS (Carrusel en móvil, Fila en desktop) */}
      <section className="flex gap-4 p-4 md:py-6 md:px-8 overflow-x-auto md:justify-center bg-white shadow-sm md:shadow-none">
        {categories.map((category) => (
          <div
            key={category.name}
            className="relative w-40 h-24 md:w-56 md:h-28 rounded-xl overflow-hidden shadow-lg cursor-pointer group flex-shrink-0 transition-transform duration-300 md:hover:scale-105"
          >
            <Image
              src={category.img}
              alt={category.name}
              layout="fill"
              objectFit="cover"
              priority={category.name === "Fútbol"}
            />
            <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <span className="text-white text-xl font-bold text-center drop-shadow-md">{category.name}</span>
            </div>
          </div>
        ))}
      </section>


      {/* FECHAS (Deslizable y centrado en desktop) */}
      <div className="bg-gray-100 md:bg-gray-200">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap md:justify-center">
          {dates.map((date) => (
            <div
              key={date.fullDate}
              className={`relative px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex-shrink-0 transition-colors
                ${
                  date.isGdlMatch
                    ? "bg-green-600 text-white"
                    : date.isActive
                    ? "bg-red-500 text-white"
                    : "bg-gray-300 md:bg-gray-400 text-gray-700 md:text-white hover:bg-gray-400"
                }
              `}
            >
              <div className="font-bold text-center">{date.day}</div>
              <div className="text-xs uppercase">{date.weekday}</div>
              {date.isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex flex-col md:flex-row gap-8 py-6 md:py-10 px-4 md:px-8">
        
        {/* === COLUMNA IZQUIERDA (Partido + Itinerario) === */}
        {/* Mantenemos el 40% (md:w-2/5) para darle más espacio */}
        <div className="flex flex-col gap-4 w-full md:w-2/5 flex-shrink-0">
          
          {/* Banner Partido */}
          <div className="flex items-center justify-between bg-[#9C0000] text-white rounded-lg px-4 py-3 shadow-md">
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/1024px-Flag_of_Mexico.svg.png"
                  alt="Bandera de México"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-sm md:text-base">México</span>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-bold">19:00</div>
              <div className="text-xs font-medium">hrs</div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm md:text-base">Alemania</span>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                 <Image
                  src="https://img.freepik.com/fotos-premium/bandera-alemana-alemania_469558-8411.jpg"
                  alt="Bandera de Alemania"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Itinerario de hoy */}
          <div className="bg-white rounded-lg p-4 shadow-md min-h-[180px] border border-gray-100">
            <h2 className="font-bold mb-2 text-gray-800">Itinerario de hoy:</h2>
            <div className="h-40 bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-500 text-center pt-10">
                (Aquí puedes mostrar los eventos del día)
              </p>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA / SECCIÓN INFERIOR (Recomendaciones) === */}
        {/* Mantenemos el 60% (md:w-3/5) para que las imágenes sean más chicas */}
        <div className="flex flex-col w-full md:w-3/5">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Recomendaciones
          </h2>
          
          <div className="flex overflow-x-auto md:overflow-visible md:grid md:grid-cols-3 gap-6">
            
            {recommendations.map((place) => (
              <div
                key={place.name}
                className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 w-64 md:w-auto group transition-transform duration-300 md:hover:scale-105"
              >
                <div className="w-full relative overflow-hidden pb-[56.25%] md:pb-[100%]">
                  {place.img ? (
                    <div className="absolute inset-0">
                      <Image
                        src={place.img}
                        alt={place.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Sin imagen</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 z-10">
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg 
                                     opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Ubicar
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">{place.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}