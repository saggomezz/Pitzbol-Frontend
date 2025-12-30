// lib/pitzbol-engine.ts

export interface Lugar {
  nombre: string;
  categoria: string;
  direccion: string;
  lat: number;
  lng: number;
  tiempoEstancia: number;
  costo: string;
  notaIA: string;
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ordenarPorCercania(lugares: Lugar[], miUbicacion: {lat: number, lng: number}) {
  return [...lugares].sort((a, b) => {
    const distA = calcularDistancia(miUbicacion.lat, miUbicacion.lng, a.lat, a.lng);
    const distB = calcularDistancia(miUbicacion.lat, miUbicacion.lng, b.lat, b.lng);
    return distA - distB;
  });
}

export function generarItinerarioManual(
  baseDatos: Lugar[], 
  intereses: string[], 
  tiempoTotal: number, 
  inicio: {lat: number, lng: number}
) {
  const horaActual = new Date().getHours();
  let momentoDia = horaActual < 12 ? "mañana" : horaActual < 19 ? "tarde" : "noche";

  let disponibles = baseDatos.filter(l => 
    intereses.some(i => l.categoria?.toLowerCase().includes(i.toLowerCase()))
  );

  let plan: Lugar[] = [];
  let tiempoUso = 0;
  let puntoActual = inicio;

  while (tiempoUso < tiempoTotal && disponibles.length > 0) {
    disponibles.sort((a, b) => {
      const distA = calcularDistancia(puntoActual.lat, puntoActual.lng, a.lat, a.lng);
      const distB = calcularDistancia(puntoActual.lat, puntoActual.lng, b.lat, b.lng);
      const bonusA = a.notaIA?.toLowerCase().includes(momentoDia) ? 0.7 : 1;
      const bonusB = b.notaIA?.toLowerCase().includes(momentoDia) ? 0.7 : 1;
      return (distA * bonusA) - (distB * bonusB);
    });

    const proximo = disponibles[0];
    const traslado = 25; 

    if (tiempoUso + proximo.tiempoEstancia + traslado <= tiempoTotal) {
      plan.push(proximo);
      tiempoUso += proximo.tiempoEstancia + traslado;
      puntoActual = { lat: proximo.lat, lng: proximo.lng };
      disponibles.shift();
    } else {
      break;
    }
  }

  if (plan.length === 0) return "No encontré una ruta que se ajuste a tu tiempo actual.";

  let dialogo = `¡Hola! Basado en que es de ${momentoDia}, he trazado esta ruta para ti:\n\n`;
  plan.forEach((l, i) => {
    dialogo += `📍 ${i + 1}. ${l.nombre}\n   ${l.notaIA}\n   (Estancia: ${l.tiempoEstancia} min)\n\n`;
  });

  return dialogo;
}

export function construirItinerarioElegido(lugaresSeleccionados: Lugar[]) {
  if (lugaresSeleccionados.length === 0) return "Aún no has seleccionado lugares.";

  let tiempoTotalEstancia = 0;
  let trasladoTotal = lugaresSeleccionados.length > 1 ? (lugaresSeleccionados.length - 1) * 25 : 0;
  
  let dialogo = `¡Tu plan personalizado está listo!\n\n`;

  lugaresSeleccionados.forEach((l, index) => {
    tiempoTotalEstancia += l.tiempoEstancia;
    dialogo += `✅ ${index + 1}. ${l.nombre}\n`;
    dialogo += `   - Tiempo: ${l.tiempoEstancia} min\n`;
    dialogo += `   - Tip Pitzbol: ${l.notaIA}\n\n`;
  });

  const tiempoFinal = tiempoTotalEstancia + trasladoTotal;
  const horas = Math.floor(tiempoFinal / 60);
  const minutos = tiempoFinal % 60;

  dialogo += `--- \n⏱️ Duración estimada total: ${horas}h ${minutos}min\n`;
  dialogo += `(Considerando ${trasladoTotal} min totales de tráfico en GDL).`;
  
  return dialogo;
}