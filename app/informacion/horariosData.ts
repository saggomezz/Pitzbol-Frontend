export type DaySchedule = { apertura: string; cierre: string } | 'cerrado';

export interface Horario {
  lunes: DaySchedule;
  martes: DaySchedule;
  miercoles: DaySchedule;
  jueves: DaySchedule;
  viernes: DaySchedule;
  sabado: DaySchedule;
  domingo: DaySchedule;
}

export const DIAS_ES = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
export type DiaSemana = typeof DIAS_ES[number];

// Genera horario igual todos los días excepto los cerrados
function todos(a: string, c: string, cerrados: DiaSemana[] = []): Horario {
  const s: DaySchedule = { apertura: a, cierre: c };
  return {
    lunes:    cerrados.includes('lunes')    ? 'cerrado' : s,
    martes:   cerrados.includes('martes')   ? 'cerrado' : s,
    miercoles:cerrados.includes('miercoles')? 'cerrado' : s,
    jueves:   cerrados.includes('jueves')   ? 'cerrado' : s,
    viernes:  cerrados.includes('viernes')  ? 'cerrado' : s,
    sabado:   cerrados.includes('sabado')   ? 'cerrado' : s,
    domingo:  cerrados.includes('domingo')  ? 'cerrado' : s,
  };
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

const RAW: [string, Horario][] = [
  ['Estadio Akron',                              todos('09:00','22:00')],
  ['Museo Chivas',                               todos('10:30','16:30')],
  ['El Gallo Cantina',                           todos('12:00','00:00')],
  ['La Gran Plaza Fashion Mall',                 todos('10:00','19:00')],
  ['Tortas Ahogadas El Güerito',                 todos('09:30','18:30')],
  ['Centro Histórico de Tlaquepaque',            todos('09:00','19:00')],
  ['Santo Coyote Real',                          todos('08:00','00:00')],
  ['Santo Coyote',                               todos('08:00','00:00')],
  ['La Bodega de León',                          todos('14:00','23:00',['lunes'])],
  ['Mutante Restaurante',                        todos('14:00','00:00',['lunes'])],
  ['Plaza de Armas',                             todos('00:00','23:59')],
  ['Karne Garibaldi (Santa Tere)',               todos('11:00','23:00')],
  ['Karne Garibaldi Sucursal Tlaquepaque',       todos('11:00','23:00')],
  ['Karne Garibaldi Sucursal Plaza Del Sol',     todos('11:00','23:00')],
  ['El Sacromonte',                              todos('13:30','23:00')],
  ['Los Famosos Equipales',                      todos('12:00','01:00',['lunes','martes'])],
  ['La Chata',                                   todos('07:00','00:00')],
  ['La Chata Terranova',                         todos('08:30','00:00')],
  ['Birriería Las Nueve Esquinas',               todos('09:00','22:00')],
  ['Tacos Providencia',                          todos('13:00','23:00',['martes'])],
  ['Tacos Providencia Ruben Daria',              todos('13:00','23:00',['martes'])],
  ['Los Laureles (Av. México)',                  todos('08:00','22:30')],
  ['Restaurante Casa Luna',                      todos('12:00','23:00')],
  ['Tortas Ahogadas Don Jose El De La Bicicleta',todos('09:00','17:30')],
  ['Cantina La Fuente',                          todos('12:00','22:00',['domingo'])],
  ['Pozole El Pollo',                            todos('09:00','20:00')],
  ['El Parián de Tlaquepaque',                   todos('12:00','23:00')],
  ['Instituto Cultural Cabañas',                 todos('10:00','17:00',['lunes'])],
  ['Teatro Degollado',                           todos('10:00','18:00',['lunes'])],
  ['Catedral Metropolitana',                     todos('07:00','19:30')],
  ['Palacio de Gobierno de Jalisco',             todos('09:00','18:00',['lunes'])],
  ['Rotonda de los Jaliscienses Ilustres',       todos('00:00','23:59')],
  ['Museo del Periodismo y las Artes Gráficas',  todos('10:00','18:00')],
  ['Expiatorio del Santísimo Sacramento',        todos('06:30','22:00')],
  ['Nieves Chapalita Tepeyac',                   todos('10:00','22:00')],
  ['Nieves de Garrafa Chapalita Juárez',         todos('10:00','22:00')],
  ['Nieves de Garrafa Chapalita Nueva Escocia',  todos('10:00','22:00')],
  ['Nieves de Garrafa Chapalita Gourmet',        todos('10:00','22:00')],
  ['Churros La Bombilla',                        todos('17:30','23:00',['martes'])],
  ['Dulces Regionales Nuestros Dulces',          todos('10:00','19:00')],
  ['El Gallo Altanero', {
    lunes:    'cerrado',
    martes:   'cerrado',
    miercoles:{ apertura:'18:00', cierre:'00:00' },
    jueves:   { apertura:'18:00', cierre:'00:00' },
    viernes:  { apertura:'18:00', cierre:'02:00' },
    sabado:   { apertura:'18:00', cierre:'02:00' },
    domingo:  { apertura:'17:00', cierre:'01:00' },
  }],
  ['Gallo Cervecero Sportsbar',                  todos('12:00','00:00')],
  ['Osteria 10',                                 todos('14:00','23:30',['lunes','domingo'])],
  ['Bosque Colomos',                             todos('06:00','20:00')],
  ['La Boca Parrilla Rustica', {
    lunes:    { apertura:'13:00', cierre:'00:00' },
    martes:   { apertura:'13:00', cierre:'00:00' },
    miercoles:{ apertura:'13:00', cierre:'00:00' },
    jueves:   { apertura:'13:00', cierre:'00:00' },
    viernes:  { apertura:'13:00', cierre:'00:00' },
    sabado:   { apertura:'13:00', cierre:'00:00' },
    domingo:  { apertura:'13:00', cierre:'19:00' },
  }],
  ['CRAFT Americana',                            todos('12:00','00:00',['lunes'])],
  ['Argento Americana',                          todos('13:00','23:00')],
  ['PINOCCHIO - Pedro Moreno',                   todos('13:00','01:00')],
  ['Romea', {
    lunes:    { apertura:'17:00', cierre:'00:00' },
    martes:   { apertura:'17:00', cierre:'00:00' },
    miercoles:{ apertura:'17:00', cierre:'00:00' },
    jueves:   { apertura:'17:00', cierre:'01:00' },
    viernes:  { apertura:'13:00', cierre:'01:00' },
    sabado:   { apertura:'09:00', cierre:'01:00' },
    domingo:  { apertura:'09:00', cierre:'15:00' },
  }],
  ['Andador Americano',                          todos('00:00','23:59')],
  ['Casa Dolores - Av. Chapultepec',             todos('08:00','22:00')],
  ['Tikuun comedor',                             todos('14:00','23:00')],
  ['Rosarito',                                   todos('14:00','02:00')],
  ['Tyrano',                                     todos('14:00','01:00',['lunes'])],
  ['De La O Cantina',                            todos('13:00','01:00',['martes'])],
  ['Hueso Restaurante',                          todos('19:30','01:00',['lunes','domingo'])],
  ['Parque Agua Azul',                           todos('10:00','18:00',['lunes'])],
  ['Restaurante Casa Caborca Asador de Carnes Zapopan', todos('13:00','23:00',['lunes'])],
  ['Cuerno Andares',                             todos('12:30','02:00')],
  ['Mantela Restaurante',                        todos('13:00','23:00',['lunes'])],
  ['Mochomos Guadalajara',                       todos('13:00','02:00')],
  ['Cotidiano - Restaurante en La Perla', {
    lunes:    { apertura:'08:00', cierre:'21:00' },
    martes:   { apertura:'08:00', cierre:'21:00' },
    miercoles:{ apertura:'08:00', cierre:'21:00' },
    jueves:   { apertura:'08:00', cierre:'21:00' },
    viernes:  { apertura:'08:00', cierre:'21:00' },
    sabado:   { apertura:'08:00', cierre:'21:00' },
    domingo:  { apertura:'09:00', cierre:'14:00' },
  }],
  ['Casa Prime Puerta de Hierro',                todos('13:00','23:00')],
  ['Ay! Caguamas Ciudad Granja',                 todos('13:00','00:00')],
  ['Punto crema',                                todos('08:00','21:00')],
  ['Angelina Bistro',                            todos('09:00','23:00',['lunes'])],
  ['Taberna Central',                            todos('13:00','00:00')],
  ['Tía Ofe Pozole Vegano',                      todos('18:00','23:00')],
  ['Jamaica Records', {
    lunes:    'cerrado',
    martes:   { apertura:'18:00', cierre:'01:00' },
    miercoles:{ apertura:'18:00', cierre:'01:00' },
    jueves:   { apertura:'18:00', cierre:'01:00' },
    viernes:  { apertura:'18:00', cierre:'01:00' },
    sabado:   { apertura:'13:00', cierre:'01:00' },
    domingo:  { apertura:'13:00', cierre:'23:00' },
  }],
  ['Choclo y Maiz Cocina Vegana',                todos('09:00','19:00',['miercoles'])],
  ['Café Sinergia',                              todos('08:00','21:00')],
];

const HORARIOS: Record<string, Horario> = Object.fromEntries(
  RAW.map(([nombre, h]) => [norm(nombre as string), h])
);

export function getHorario(nombre: string): Horario | null {
  return HORARIOS[norm(nombre)] ?? null;
}

// Devuelve el índice de día (0=lunes … 6=domingo) según JS Date.getDay()
export function getDiaIdx(): DiaSemana {
  const jsDay = new Date().getDay(); // 0=dom,1=lun,...,6=sab
  return DIAS_ES[jsDay === 0 ? 6 : jsDay - 1];
}

export function formatHoraGM(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === 0 && m === 0) return '12 a.m.';
  if (h === 23 && m === 59) return '11:59 p.m.';
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

export function formatRango(d: DaySchedule): string {
  if (d === 'cerrado') return 'Cerrado';
  if (d.apertura === '00:00' && d.cierre === '23:59') return 'Abierto 24 horas';
  return `${formatHoraGM(d.apertura)} – ${formatHoraGM(d.cierre)}`;
}

export const NOMBRE_DIA: Record<DiaSemana, string> = {
  lunes:    'Lunes',
  martes:   'Martes',
  miercoles:'Miércoles',
  jueves:   'Jueves',
  viernes:  'Viernes',
  sabado:   'Sábado',
  domingo:  'Domingo',
};
