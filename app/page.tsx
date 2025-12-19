import Image from "next/image";
import { FiMenu, FiSearch } from "react-icons/fi";
import imglogo from "./components/logoPitzbol.png";
import imgPasto from "./components/pastoVerde.png";

type Category = { name: string; img: string; };
type DateInfo = { day: string; weekday: string; fullDate: string; isGdlMatch: boolean; isActive: boolean; };
type Recommendation = { name: string; img: string | null; };

const categories: Category[] = [
  { name: "Fútbol", img: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=2070" },
  { name: "Gastronomía", img: "https://images.unsplash.com/photo-1711306722944-70b776bb4394?auto=format&fit=crop&q=80&w=1528" },
  { name: "Arte", img: "https://museocabanas.jalisco.gob.mx/wp-content/uploads/2024/08/1.png" },
  { name: "Cultura", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Voladores_de_Papantla.png/1200px-Voladores_de_Papantla.png" },
  { name: "Eventos", img: "https://www.debate.com.mx/img/2020/09/01/reabre_expo_gdl_invierten_25__1180283_crop1598978065412.jpg?__scale=w:1200,h:675,t:2,fpx:519,fpy:533" },
];

const dates: DateInfo[] = [
  { day: "10", weekday: "MIE", fullDate: "2026-06-10", isGdlMatch: false, isActive: false },
  { day: "11", weekday: "JUE", fullDate: "2026-06-11", isGdlMatch: true, isActive: true },
  { day: "12", weekday: "VIE", fullDate: "2026-06-12", isGdlMatch: false, isActive: false },
  { day: "13", weekday: "SAB", fullDate: "2026-06-13", isGdlMatch: false, isActive: false },
  { day: "14", weekday: "DOM", fullDate: "2026-06-14", isGdlMatch: false, isActive: false },
];

const recommendations: Recommendation[] = [
  { name: "Centro de Guadalajara", img: "https://www.liderempresarial.com/wp-content/uploads/2025/07/Asi-se-transformara-el-centro-de-Guadalajara-%C2%BFcuando-estara-listo.jpg" },
  { name: "Tlaquepaque", img: "https://image-tc.galaxy.tf/wijpeg-5ifzorsfl8d2dm64kutj586du/tlaquepaque.jpg" },
  { name: "Tequila, Jalisco", img: "https://visitmexico.com/media/usercontent/67fd7d33baf74-Tequila-2_gmxdot_jpeg" },
];

const Header = () => (
  <nav className="flex justify-between items-center bg-[#F6F0E6] px-2 md:px-8 h-20 md:h-24 sticky top-0 z-50 shadow-sm overflow-hidden">
    <div className="flex items-center h-full max-w-[80%] md:max-w-none">
      {/* 1. LOGO:*/}
      <div className="relative h-24 w-24 md:h-32 md:w-32 right-2 md:right-5 flex-shrink-0">
        <Image
          src={imglogo}
          alt="logoPitzbol"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* 2. CONTENEDOR NOMBRE + PASTO */}
      <div className="relative flex items-center h-full ml-1 md:ml-2">
        <div className="absolute inset-y-0 -left-6 sm:-left-6 md:-left-9 md:top-10 top-6 z-0 flex items-center w-[120%] min-w-[200px] sm:min-w-[120px] md:min-w-[350px]">
          <Image
            src={imgPasto}
            alt="pastoVerde"
            className="object-contain"
          />
        </div>

        { /* TEXTO PITZBOL */ }
        <h1
          className="relative z-10 text-[40px] xs:text-[35px] sm:text-[50px] md:text-[70px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] md:drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]" 
          style={{ fontFamily: "'Jockey One', sans-serif" }}
        >
          <span className="text-[#FFFFFF]">PITZ</span>
          <span className="text-[#F00808]">BOL</span>
        </h1>
      </div>
    </div>

    {/* 3. LADO DERECHO (Buscador y Menú) */}
    <div className="flex items-center gap-1 md:gap-6">
      <div className="hidden md:flex items-center gap-6 text-[18px]">
        <button className="text-[#1A4D2E] font-bold hover:text-[#F00808] transition-colors">Calendario</button>
        <button className="text-[#1A4D2E] font-bold hover:text-[#F00808] transition-colors">Identifícate</button>
      </div>

      {/* Lupa: Un poco más pequeña en móvil */}
      <button className="p-2 md:p-6 text-[#1A4D2E]">
        <FiSearch size={22} className="md:w-8 md:h-8" />
      </button>

      {/* Menú Hamburguesa: Solo visible en móvil para ahorrar espacio */}
      <button className="md:hidden p-2 text-[#1A4D2E]">
        <FiMenu size={24} />
      </button>
    </div>
  </nav>
);

const CategoryCarousel = ({ categories }: { categories: Category[] }) => (
  <section className="flex gap-4 p-4 md:py-6 md:px-8 overflow-x-auto md:justify-center bg-white">
    {categories.map((category) => (
      <div key={category.name} className="relative w-40 h-24 md:w-56 md:h-28 rounded-xl overflow-hidden shadow-lg cursor-pointer group flex-shrink-0 transition-transform duration-300 md:hover:scale-105">
        <Image
          src={category.img}
          alt={category.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <span className="text-white text-xl font-bold text-center drop-shadow-md">{category.name}</span>
        </div>
      </div>
    ))}
  </section>
);

const DateSlider = ({ dates }: { dates: DateInfo[] }) => (
  <div className="bg-gray-100 md:bg-gray-200">
    <div className="flex gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap md:justify-center">
      {dates.map((date) => (
        <div key={date.fullDate} className={`relative px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex-shrink-0 transition-colors ${date.isGdlMatch ? "bg-green-600 text-white" : date.isActive ? "bg-red-500 text-white" : "bg-gray-300 md:bg-gray-400 text-gray-700 md:text-white hover:bg-gray-400"}`}>
          <div className="font-bold text-center">{date.day}</div>
          <div className="text-xs uppercase">{date.weekday}</div>
          {date.isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>}
        </div>
      ))}
    </div>
  </div>
);

const MatchBanner = () => (
  <div className="flex items-center justify-between bg-[#A89F9F] text-white rounded-lg px-4 py-3 shadow-md">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/20">
        <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/1024px-Flag_of_Mexico.svg.png" alt="MX" fill className="object-cover" />
      </div>
      <span className="font-semibold text-sm md:text-base ">México</span>
    </div>
    <div className="text-center"><div className="text-sm font-bold text-[#000000] ">19:00</div><div className="text-xs font-medium text-[#000000] ">hrs</div></div>
    <div className="flex items-center gap-2">
      <span className="font-semibold text-sm md:text-base">Alemania</span>
      <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/20">
        <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Flag_of_Germany.svg/1024px-Flag_of_Germany.svg.png" alt="DE" fill className="object-cover" />
      </div>
    </div>
  </div>
);

const Recommendations = ({ recommendations }: { recommendations: Recommendation[] }) => (
  <div className="flex flex-col w-full md:w-3/5">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Recomendaciones</h2>
    <div className="flex overflow-x-auto md:overflow-visible md:grid md:grid-cols-3 gap-6">
      {recommendations.map((place) => (
        <div key={place.name} className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 w-64 md:w-auto group transition-transform duration-300 md:hover:scale-105">
          <div className="w-full relative overflow-hidden pb-[56.25%] md:pb-[100%]">
            {place.img ? <div className="absolute inset-0"><Image src={place.img} alt={place.name} fill className="object-cover" /></div> : <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500 text-sm">Sin imagen</div>}
            <div className="absolute bottom-2 right-2 z-10"><button className="text-xs bg-[#0B2C3D] text-white px-3 py-1 rounded-full shadow-lg">Ubicar</button></div>
          </div>
          <div className="p-4"><h3 className="font-semibold text-gray-800 truncate text-center">{place.name}</h3></div>
        </div>
      ))}
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white md:bg-[#f5f5f5] font-sans">
      <Header />
      <CategoryCarousel categories={categories} />
      <DateSlider dates={dates} />
      <main className="flex flex-col md:flex-row gap-8 py-6 md:py-10 px-4 md:px-8">
        <div className="flex flex-col gap-4 w-full md:w-2/5 flex-shrink-0">
          <MatchBanner />
          <div className="bg-[#FAF9F2] rounded-lg p-4 shadow-sm min-h-[180px] border border-gray-200">
            <h2 className="font-bold mb-2 text-gray-800">Itinerario de hoy:</h2>
            <div className="h-40 border-t border-gray-100 p-3 text-sm text-gray-500 text-center pt-10">Cargando itinerario...</div>
          </div>
        </div>
        <Recommendations recommendations={recommendations} />
      </main>
    </div>
  );
}