import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.pitzbol.me:8443";
const EMAILS_ADMIN = ["cua@hotmail.com", "pilarmorag2004@hotmail.com"];

const DESCRIPCIONES: Record<string, string> = {
  "Instituto Cultural Cabañas, Guadalajara": "Patrimonio de la Humanidad por la UNESCO. Fundado en 1810, alberga los murales de José Clemente Orozco con el icónico Hombre de Fuego en su cúpula central.",
  "Teatro Degollado, Guadalajara": "El principal recinto escénico de Guadalajara inaugurado en 1866. Sede de la Orquesta Filarmónica y el Ballet Folklórico de la UdeG; su fachada neoclásica es Patrimonio Cultural.",
  "Teatro Degollado, Guadalajara ": "El principal recinto escénico de Guadalajara inaugurado en 1866. Sede de la Orquesta Filarmónica y el Ballet Folklórico de la UdeG; su fachada neoclásica es Patrimonio Cultural.",
  "Catedral Metropolitana, Guadalajara": "La catedral más importante de Jalisco construida entre 1561 y 1618. Sus torres gemelas y vitrales europeos la convierten en el símbolo más reconocible de Guadalajara.",
  "Palacio de Gobierno de Jalisco, Guadalajara": "Sede del gobierno estatal con los famosos murales de Orozco que retratan al cura Hidalgo. Acceso gratuito para admirar su arquitectura barroca colonial.",
  "Rotonda de los Jaliscienses Ilustres, Guadalajara": "Mausoleo circular que honra a los grandes personajes de Jalisco. Sus columnas dóricas y jardines junto a la Catedral crean uno de los espacios más fotogénicos del centro.",
  "Museo del Periodismo y las Artes Gráficas, Guadalajara": "Instalado en la Casa de los Perros, edificio barroco del siglo XVIII. Exhibe la historia del periodismo y la imprenta en México con valiosas piezas históricas originales.",
  "Expiatorio del Santísimo Sacramento, Guadalajara": "Majestuosa iglesia neogótica construida entre 1897 y 1972. Sus rosetones y vitrales alemanes la convierten en una de las más bellas y fotografiadas de Guadalajara.",
  "Centro Histórico de Tlaquepaque, Guadalajara": "Pueblo Mágico y corazón artesanal de Jalisco. Calles empedradas con galerías de arte, talleres artesanales, restaurantes y vida nocturna a minutos de Guadalajara.",
  "El Parián de Tlaquepaque, Guadalajara": "Recinto gastronómico y cultural en el corazón de Tlaquepaque. Mariachis en vivo, birria y tequila en un espacio colonial; visita obligada para cualquier turista.",
  "Plaza de Armas, Guadalajara": "La plaza principal de Guadalajara desde el siglo XVI. Su quiosco modernista de hierro francés es una joya fotográfica rodeada por la Catedral y el Palacio de Gobierno.",
  "Glorieta de la Minerva, Guadalajara": "Icónico monumento en honor a la diosa Minerva. Punto de referencia tapatío en la avenida Vallarta y símbolo de la identidad de la ciudad.",
  "Estadio Akron, Guadalajara": "Sede oficial del Mundial 2026 en Guadalajara con capacidad para 49,850 aficionados. Casa del Club Deportivo Guadalajara y escenario de partidos internacionales.",
  "Bosque Colomos, Guadalajara": "Pulmón verde de Guadalajara con 90 hectáreas de bosque urbano. Alberga el jardín japonés más grande de América Latina; ideal para caminatas y desconexión.",
  "Parque Agua Azul, Guadalajara": "El parque más grande del centro de Guadalajara. Jardines tropicales, orquideario, mariposario y espacios culturales en un oasis verde de acceso libre.",
  "Museo Chivas, Guadalajara": "Museo interactivo del Club Deportivo Guadalajara. Recorre la historia del equipo más campeón de México con exhibiciones de trofeos y jerseys históricos.",
  "La Gran Plaza Fashion Mall, Guadalajara": "Uno de los centros comerciales más grandes de Latinoamérica con más de 300 tiendas, restaurantes y entretenimiento en la zona metropolitana.",
  // ── Gastronomía ──────────────────────────────────────────────────────────────
  "Karne Garibaldi (Santa Tere), Guadalajara": "Récord Guinness al servicio de restaurante más rápido del mundo. Carne en su jugo servida en tiempo récord; una experiencia única de la gastronomía tapatía.",
  "Karne Garibaldi Sucursal Tlaquepaque, Guadalajara": "Sucursal del famoso Récord Guinness cerca de Tlaquepaque. Carne en su jugo a velocidad récord; imperdible antes de explorar las artesanías del Pueblo Mágico.",
  "Karne Garibaldi Sucursal Plaza Del Sol, Guadalajara": "Sucursal del icónico Récord Guinness en Plaza del Sol. Carne en su jugo en tiempo récord; parada obligada en el sur de la ciudad.",
  "La Chata, Guadalajara": "Institución gastronómica de Guadalajara desde 1942. Pozole, birria y sopes en el centro histórico; referencia obligada para conocer la cocina tapatía auténtica.",
  "La Chata Terranova, Guadalajara": "Sucursal de la institución gastronómica desde 1942. Los mismos sabores clásicos de pozole rojo y birria en la zona Providencia; tradicional desde el desayuno.",
  "Birriería Las Nueve Esquinas, Guadalajara": "La birria de chivo más emblemática de Guadalajara en el barrio de las Nueve Esquinas. Receta familiar con más de 80 años de tradición jalisciense.",
  "Cantina La Fuente, Guadalajara": "Una de las cantinas más antiguas del Centro Histórico, fundada en 1921. Botanas sin costo, música en vivo y la mejor selección de tequilas jaliscienses.",
  "El Sacromonte, Guadalajara": "Cocina mexicana de autor en el barrio Americana. Ingredientes locales con presentaciones contemporáneas que preservan los sabores jaliscienses en ambiente elegante.",
  "Santo Coyote Real, Guadalajara": "Icónico restaurante mexicano creativo en un jardín encantador con fuentes y velas. Famoso por su sopa Azteca y ambiente bohemio; una experiencia sensorial completa.",
  "Santo Coyote, Guadalajara": "Cocina mexicana creativa con ambiente bohemio y jardín en la Colonia Americana. Perfecto para una cena especial en Guadalajara.",
  "La Bodega de León, Guadalajara": "Cocina mexicana contemporánea en un espacio íntimo y elegante. Menú variado con ingredientes locales; ideal para cenas románticas en el barrio Americana.",
  "Mutante Restaurante, Guadalajara": "Restaurante de cocina mexicana de autor con música en vivo y ambiente vanguardista. Menú rotativo con ingredientes de temporada en la vibrante Colonia Americana.",
  "Los Famosos Equipales, Guadalajara": "Cocina tapatía auténtica en sillas de madera y cuero típicas de Jalisco. Birria de res y platillos regionales con el ambiente más genuino del norte de la ciudad.",
  "Tacos Providencia, Guadalajara": "Tacos de guisado casero en la zona Providencia; punto de encuentro de tapatíos para un almuerzo rápido y auténtico con salsas caseras.",
  "Tacos Providencia Ruben Daria, Guadalajara": "Tacos de guisado en estilo casero tapatío sobre la avenida Rubén Darío. Sabores reconfortantes de la cocina diaria de Guadalajara.",
  "Los Laureles (Av. México), Guadalajara": "Cocina mexicana casera y reconfortante sobre la avenida México. Caldos y guisados con técnica tradicional en porciones generosas; favorito de familias tapatías.",
  "Restaurante Casa Luna, Guadalajara": "Ambiente romántico y colonial en el corazón de Tlaquepaque con cocina mexicana artesanal. Música en vivo y postres de autor; ideal para una cena especial.",
  "Tortas Ahogadas \"El Güerito\", Guadalajara": "Pan birote bañado en salsa de chile de árbol: el antojito más representativo de Guadalajara. Un clásico imperdible cerca del Centro Histórico.",
  "Tortas Ahogadas Don Jose El De La Bicicleta, Guadalajara": "Uno de los puestos más populares de tortas ahogadas en Guadalajara. Tradición familiar y receta auténtica que ha conquistado generaciones de tapatíos.",
  "Pozole El Pollo, Guadalajara": "Pozole rojo de pollo con receta casera en el barrio Santa Teresita. Tortillas hechas a mano y todas las guarniciones tradicionales; contundente y económico.",
  "Tikuun comedor, Guadalajara": "Cocina mexicana gourmet inspirada en raíces prehispánicas. Técnicas modernas con ingredientes nativos en un ambiente íntimo; experiencia culinaria única en Guadalajara.",
  "Rosarito, Guadalajara": "Ambiente vibrante en Chapultepec con cocina mexicana y mariscos. Terraza popular para cenar en una de las zonas más animadas de Guadalajara.",
  "Restaurante Casa Caborca Asador de Carnes Zapopan, Guadalajara": "Asador de cortes sonorenses en Zapopan. Carnes de primera calidad al estilo norteño; favorito de familias los fines de semana.",
  "La Boca Parrilla Rustica, Guadalajara": "Parrilla rústica con cortes de carne premium en la Colonia Americana. Carnes al carbón con guarniciones generosas; ideal para carnívoros exigentes.",
  "CRAFT Americana, Guadalajara": "Hamburguesas artesanales y cervezas craft en la Colonia Americana. Ambiente informal y animado; perfecto para un almuerzo o cena entre amigos.",
  "Argento Americana, Guadalajara": "Cocina argentina con toque mexicano en el barrio Americana. Empanadas crujientes y carnes a la parrilla en un ambiente tranquilo y acogedor.",
  "PINOCCHIO - Pedro Moreno, Guadalajara": "Cocina italiana contemporánea en el corredor gastronómico de Pedro Moreno. Pastas artesanales y antipastos en un espacio moderno y animado.",
  "Romea, Guadalajara": "Restaurante mediterráneo con ambiente sofisticado en Vallarta. Mariscos frescos y sabores del sur de Europa con coctelería de diseño y música en vivo.",
  "Tyrano, Guadalajara": "Cocina de autor y coctelería de diseño en el corazón de Guadalajara. Ambiente elegante ideal para cenas largas con música seleccionada.",
  "Hueso Restaurante, Guadalajara": "Restaurante de alta cocina con diseño único rodeado de referencias óseas. Una experiencia gastronómica y visual única en el barrio Americana.",
  "De La O Cantina, Guadalajara": "Cantina moderna con ambiente artístico en Santa Teresita. Cócteles creativos y botanas de autor; punto de encuentro de creativos y noctámbulos tapatíos.",
  "Taberna Central, Guadalajara": "Cocina de mercado y cervezas artesanales en el Centro de Guadalajara. Ambiente relajado que mezcla tradición e innovación.",
  "Angelina Bistro, Guadalajara": "Bistró de cocina europea con toque mexicano en el poniente de Guadalajara. Brunch los fines de semana y cenas románticas entre semana con música en vivo.",
  "Ay! Caguamas Ciudad Granja, Guadalajara": "El spot para botanas y caguamas en Ciudad Granja. Ambiente relajado y festivo muy popular entre jóvenes tapatíos para una tarde-noche.",
  "Cuerno Andares": "Cocina mexicana moderna en el exclusivo desarrollo Andares. Ambiente sofisticado con sabores contemporáneos.",
  "Mantela Restaurante": "Restaurante de chef con cocina mexicana de temporada en Andares. Ingredientes frescos y presentaciones de arte culinario en un marco elegante.",
  "Mochomos Guadalajara": "Cocina sonorense con los mejores cortes de carne de la ciudad. Carne asada y burritos norteños en ambiente festivo; perfecto para grupos grandes.",
  "Cotidiano - Restaurante en La Perla": "Cocina de mercado en La Perla Tapatía con menú diario de ingredientes frescos. Ambiente acogedor; reflejo genuino de la comida cotidiana de calidad.",
  "Casa Prime Puerta de Hierro": "Restaurante de cortes premium en la exclusiva zona de Andares. Carnes importadas y locales en un ambiente íntimo y refinado.",
  "Tía Ofe Pozole Vegano, Guadalajara": "Pozole vegano con caldo rico y todas las guarniciones tradicionales. Una opción saludable y auténtica que conquista también a los más carnívoros.",
  "Choclo y Maiz Cocina Vegana": "Cocina vegana mexicana con platillos creativos a base de maíz. Sabores que sorprenden incluso a los más carnívoros.",
  "El Vegano": "Restaurante 100% vegano con opciones de cocina mexicana e internacional. Menú variado que satisface tanto a veganos convencidos como a curiosos.",
  "Nieves Chapalita Tepeyac, Guadalajara": "Nieves artesanales de garrafa elaboradas con métodos tradicionales. Sabores únicos como mamey, guanábana y rompope en un negocio familiar.",
  "Nieves de Garrafa Chapalita Juárez, Guadalajara": "Nieves de garrafa artesanales en Tlaquepaque. Sabores regionales únicos como chongos y chilacayote que solo encuentras en puestos tradicionales jaliscienses.",
  "Nieves de Garrafa Chapalita Gourmet, Guadalajara": "Versión gourmet de las tradicionales nieves de garrafa jaliscienses. Sabores creativos y de temporada en Tlaquepaque; el postre perfecto del recorrido.",
  "Churros \"La Bombilla\", Guadalajara": "Churros artesanales crujientes con chocolate caliente en el corazón de Guadalajara. Una tradición dulce para rematar un día de turismo por el Centro Histórico.",
  "Dulces Regionales \"Nuestros Dulces\", Guadalajara": "Tienda de dulces típicos jaliscienses en el Centro Histórico. Mazapanes, ates de membrillo y cajeta artesanal; el mejor souvenir comestible de Guadalajara.",
  "Café Sinergia, Guadalajara": "Cafetería acogedora en la Colonia Americana muy popular entre trabajadores y estudiantes. Bebidas de especialidad y desayunos en un ambiente creativo.",
  "Café Rozita, Guadalajara": "Cafetería con carácter cerca del barrio San Juan de Dios. Bebidas especiales y repostería artesanal; favorita de artistas y creativos locales.",
  "Café Boutique Teatro Degollado, Guadalajara": "Pequeña joya junto al Teatro Degollado. El lugar ideal para una pausa cultural con café artesanal antes o después de un espectáculo.",
  "Fragante Café, Guadalajara": "Café de especialidad en el Centro Histórico. Granos de origen con métodos de preparación alternativos para los amantes del café serio.",
  "Happy Coffee, Guadalajara": "Cafetería colorida y animada en Zapopan. Bebidas especiales y desayunos en un ambiente festivo que llena de energía el día.",
  "Moka Moments Cafetería, Guadalajara": "Cafetería acogedora en el norte de la ciudad. Bebidas calientes y frías con repostería artesanal para pausar el día con estilo.",
  "Aloó Café, Guadalajara": "Café de especialidad en la Colonia Ladrón de Guevara. Ambiente minimalista con bebidas de autor y repostería fresca; ideal para iniciar bien la mañana.",
  "Kalido Café, Guadalajara": "Cafetería moderna en la Colonia Americana con bebidas creativas y leches vegetales. Opciones para dietas especiales en un espacio luminoso.",
  "Gufo Café, Guadalajara": "Café de especialidad en la zona Chapultepec. Granos de origen y métodos alternativos en un ambiente tranquilo.",
  "Fika, Guadalajara": "Cafetería inspirada en la tradición escandinava del fika. Café artesanal con repostería nórdica en el sur de Guadalajara; una experiencia diferente.",
  "Estresso Café, Guadalajara": "Cafetería en Providencia especializada en espresso. Bebidas rápidas de calidad para el ritmo acelerado del norte de la ciudad.",
  "El Terrible Juan Café La Estancia, Guadalajara": "Cafetería rústica en la zona de Andares. Desayunos completos y café de origen en un ambiente familiar con terraza.",
  "Entre Matices Café, Guadalajara": "Café de especialidad en Chapalita con métodos alternativos. Granos seleccionados y opciones de temporada en un espacio íntimo.",
  "Jardín Cafeto Providencia, Guadalajara": "La cadena más querida de Guadalajara en Providencia. Jardín al aire libre con café de especialidad y desayunos desde las 7:30 am.",
  "Jardín Cafeto La Americana, Guadalajara": "Jardín Cafeto en la Colonia Americana. Café de especialidad en ambiente de jardín; referencia del desayuno tapatío.",
  "Jardín Cafeto Chapalita, Guadalajara": "Sucursal de Jardín Cafeto en Chapalita. Jardín característico con café artesanal y atención cálida.",
  "The Coffee Aledén Puerta, Guadalajara": "Cafetería The Coffee en Zapopan. Bebidas frías y calientes en ambiente moderno en la zona universitaria.",
  "The Coffee Legacy Tower, Guadalajara": "The Coffee en la imponente Legacy Tower. Café de calidad con vistas espectaculares del skyline tapatío.",
  "The Coffee Cd. Granja, Guadalajara": "The Coffee en Ciudad Granja. Bebidas de especialidad para los habitantes del poniente de Guadalajara.",
  "The Spot Café, Guadalajara": "Cafetería moderna en Providencia. Bebidas de autor en un espacio tranquilo ideal para trabajar o reunirse con amigos.",
  "Recoleta Confitería Argentina Tepeyac, Guadalajara": "Confitería argentina en Chapalita. Medialunas auténticas y café estilo Buenos Aires; un pedazo de Argentina en Guadalajara.",
  "Recoleta Confitería Argentina La Perla, Guadalajara": "Confitería argentina en La Perla Tapatía. Facturas y medialunas con café; el sabor de Buenos Aires en el sur de Guadalajara.",
};

function normName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export async function GET(req: NextRequest) {
  // Verificar admin via token
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    // Verificar que el usuario es admin
    const meRes = await fetch(`${BACKEND}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    const meData = await meRes.json();
    if (!EMAILS_ADMIN.includes(meData.user?.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener todos los lugares
    const lugaresRes = await fetch(`${BACKEND}/api/lugares`);
    const lugaresData = await lugaresRes.json();
    const lugares = lugaresData.lugares || [];

    const resultados: string[] = [];
    let actualizados = 0;

    for (const lugar of lugares) {
      const nombre: string = lugar.nombre || "";
      if (!nombre || lugar.descripcion?.trim()) continue; // ya tiene descripción, saltar

      // Buscar coincidencia normalizada
      let desc = DESCRIPCIONES[nombre];
      if (!desc) {
        const normNombre = normName(nombre);
        for (const key of Object.keys(DESCRIPCIONES)) {
          if (normName(key) === normNombre) { desc = DESCRIPCIONES[key]; break; }
        }
      }
      if (!desc) {
        // Intentar sin ciudad
        const sinCiudad = nombre.replace(/,\s*(Guadalajara|Zapopan|Tlaquepaque|Tonalá|Tonala)[^,]*/i, "").trim();
        desc = DESCRIPCIONES[sinCiudad];
        if (!desc) {
          for (const key of Object.keys(DESCRIPCIONES)) {
            if (normName(key) === normName(sinCiudad)) { desc = DESCRIPCIONES[key]; break; }
          }
        }
      }

      if (!desc) continue;

      // Guardar descripción en Firestore via backend
      const patchRes = await fetch(
        `${BACKEND}/api/lugares/${encodeURIComponent(nombre)}/info`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ descripcion: desc }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (patchRes.ok) {
        resultados.push(`✓ ${nombre}`);
        actualizados++;
      } else {
        resultados.push(`✗ ${nombre} (${patchRes.status})`);
      }
    }

    return NextResponse.json({
      actualizados,
      total: lugares.length,
      resultados,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
