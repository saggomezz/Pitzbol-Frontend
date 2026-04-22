export interface Horario {
  apertura: string;
  cierre: string;
  cerrado: string;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/,\s*(guadalajara|zapopan|tlaquepaque|tonala)[^,]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const RAW: [string, string, string, string][] = [
  ['Estadio Akron', '09:00', '22:00', 'ninguno'],
  ['Museo Chivas', '10:30', '16:30', 'ninguno'],
  ['El Gallo Cantina', '12:00', '00:00', 'ninguno'],
  ['La Gran Plaza Fashion Mall', '10:00', '19:00', 'ninguno'],
  ['Tortas Ahogadas El Güerito', '09:30', '18:30', 'ninguno'],
  ['Centro Histórico de Tlaquepaque', '09:00', '19:00', 'ninguno'],
  ['Santo Coyote Real', '08:00', '00:00', 'ninguno'],
  ['Santo Coyote', '08:00', '00:00', 'ninguno'],
  ['La Bodega de León', '14:00', '23:00', 'lunes'],
  ['Mutante Restaurante', '14:00', '00:00', 'lunes'],
  ['Plaza de Armas', '00:00', '23:59', 'ninguno'],
  ['Karne Garibaldi (Santa Tere)', '11:00', '23:00', 'ninguno'],
  ['Karne Garibaldi Sucursal Tlaquepaque', '11:00', '23:00', 'ninguno'],
  ['Karne Garibaldi Sucursal Plaza Del Sol', '11:00', '23:00', 'ninguno'],
  ['El Sacromonte', '13:30', '23:00', 'ninguno'],
  ['Los Famosos Equipales', '12:00', '01:00', 'lunes, martes'],
  ['La Chata', '07:00', '00:00', 'ninguno'],
  ['La Chata Terranova', '08:30', '00:00', 'ninguno'],
  ['Birriería Las Nueve Esquinas', '09:00', '22:00', 'ninguno'],
  ['Tacos Providencia', '13:00', '23:00', 'martes'],
  ['Tacos Providencia Ruben Daria', '13:00', '23:00', 'martes'],
  ['Los Laureles (Av. México)', '08:00', '22:30', 'ninguno'],
  ['Restaurante Casa Luna', '12:00', '23:00', 'ninguno'],
  ['Tortas Ahogadas Don Jose El De La Bicicleta', '09:00', '17:30', 'ninguno'],
  ['Cantina La Fuente', '12:00', '22:00', 'domingo'],
  ['Pozole El Pollo', '09:00', '20:00', 'ninguno'],
  ['El Parián de Tlaquepaque', '12:00', '23:00', 'ninguno'],
  ['Instituto Cultural Cabañas', '10:00', '17:00', 'lunes'],
  ['Teatro Degollado', '10:00', '18:00', 'lunes'],
  ['Catedral Metropolitana', '07:00', '19:30', 'ninguno'],
  ['Palacio de Gobierno de Jalisco', '09:00', '18:00', 'lunes'],
  ['Rotonda de los Jaliscienses Ilustres', '00:00', '23:59', 'ninguno'],
  ['Museo del Periodismo y las Artes Gráficas', '10:00', '18:00', 'ninguno'],
  ['Expiatorio del Santísimo Sacramento', '06:30', '22:00', 'ninguno'],
  ['Nieves Chapalita Tepeyac', '10:00', '22:00', 'ninguno'],
  ['Nieves de Garrafa Chapalita Juárez', '10:00', '22:00', 'ninguno'],
  ['Nieves de Garrafa Chapalita Nueva Escocia', '10:00', '22:00', 'ninguno'],
  ['Nieves de Garrafa Chapalita Gourmet', '10:00', '22:00', 'ninguno'],
  ['Churros La Bombilla', '17:30', '23:00', 'martes'],
  ['Dulces Regionales Nuestros Dulces', '10:00', '19:00', 'ninguno'],
  ['El Gallo Altanero', '18:00', '02:00', 'lunes, martes'],
  ['Gallo Cervecero Sportsbar', '12:00', '00:00', 'ninguno'],
  ['Osteria 10', '14:00', '23:30', 'lunes, domingo'],
  ['Bosque Colomos', '06:00', '20:00', 'ninguno'],
  ['La Boca Parrilla Rustica', '13:00', '00:00', 'ninguno'],
  ['CRAFT Americana', '12:00', '00:00', 'lunes'],
  ['Argento Americana', '13:00', '23:00', 'ninguno'],
  ['PINOCCHIO - Pedro Moreno', '13:00', '01:00', 'ninguno'],
  ['Romea', '09:00', '01:00', 'ninguno'],
  ['Andador Americano', '00:00', '23:59', 'ninguno'],
  ['Casa Dolores - Av. Chapultepec', '08:00', '22:00', 'ninguno'],
  ['Tikuun comedor', '14:00', '23:00', 'ninguno'],
  ['Rosarito', '14:00', '02:00', 'ninguno'],
  ['Tyrano', '14:00', '01:00', 'lunes'],
  ['De La O Cantina', '13:00', '01:00', 'martes'],
  ['Hueso Restaurante', '19:30', '01:00', 'lunes, domingo'],
  ['Parque Agua Azul', '10:00', '18:00', 'lunes'],
  ['Restaurante Casa Caborca Asador de Carnes Zapopan', '13:00', '23:00', 'lunes'],
  ['Cuerno Andares', '12:30', '02:00', 'ninguno'],
  ['Mantela Restaurante', '13:00', '23:00', 'lunes'],
  ['Mochomos Guadalajara', '13:00', '02:00', 'ninguno'],
  ['Cotidiano - Restaurante en La Perla', '08:00', '21:00', 'ninguno'],
  ['Casa Prime Puerta de Hierro', '13:00', '23:00', 'ninguno'],
  ['Ay! Caguamas Ciudad Granja', '13:00', '00:00', 'ninguno'],
  ['Punto crema', '08:00', '21:00', 'ninguno'],
  ['Angelina Bistro', '09:00', '23:00', 'lunes'],
  ['Taberna Central', '13:00', '00:00', 'ninguno'],
  ['Tía Ofe Pozole Vegano', '18:00', '23:00', 'ninguno'],
  ['Jamaica Records', '12:00', '01:00', 'lunes'],
  ['Choclo y Maiz Cocina Vegana', '09:00', '19:00', 'miércoles'],
  ['Café Sinergia', '08:00', '21:00', 'ninguno'],
];

const HORARIOS: Record<string, Horario> = Object.fromEntries(
  RAW.map(([nombre, apertura, cierre, cerrado]) => [
    norm(nombre),
    { apertura, cierre, cerrado },
  ])
);

export function getHorario(nombre: string): Horario | null {
  return HORARIOS[norm(nombre)] ?? null;
}

export function formatHora(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === 0 && m === 0) return '12:00 AM';
  if (h === 23 && m === 59) return '11:59 PM';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatCerrado(cerrado: string): string {
  if (!cerrado || cerrado === 'ninguno') return 'Abierto todos los días';
  const dias = cerrado.split(',').map(d => {
    const d2 = d.trim();
    return d2.charAt(0).toUpperCase() + d2.slice(1);
  });
  if (dias.length === 1) return `Cerrado los ${dias[0].toLowerCase()}`;
  return `Cerrado: ${dias.join(' y ')}`;
}
