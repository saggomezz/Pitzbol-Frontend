# Reporte: Sistema de Rutas y Geolocalización — Pitzbol

## 1. Fuente del trazado de rutas — OSRM

El trazado geométrico usa **OSRM** (`router.project-osrm.org`), que es open-source y gratuito. OSRM aporta:

- La **geometría real** de la ruta sobre la red vial (calles reales de OpenStreetMap)
- La **distancia en km**
- La **duración base** de conducción sin tráfico

OSRM **no da datos de tráfico en tiempo real**. Todo lo que es tráfico y tiempo estimado lo calcula Pitzbol internamente.

---

## 2. Modelo de tráfico — Solo horario estimado

No hay ninguna API de tráfico real. El sistema usa un modelo por **hora del día** basado en patrones de rush hour:

| Horario        | Descripción    | Factor |
|----------------|----------------|--------|
| 7:00 – 9:00    | Rush mañana    | ×1.8   |
| 14:00 – 17:00  | Tarde media    | ×1.3   |
| 17:00 – 20:00  | Rush tarde     | ×2.2   |
| Resto del día  | Flujo libre    | ×1.0   |

El factor se ajusta por modo de transporte. La moto recibe solo el **45 %** de la penalización del auto:

```
factor_moto = 1 + (factor_auto - 1) × 0.45
```

Peatón y bicicleta no reciben penalización (factor = 1.0 siempre).

---

## 3. Velocidades base y cálculo del tiempo

Los tiempos estimados **no vienen de OSRM** — Pitzbol los descarta y recalcula con estas velocidades promedio urbanas fijas:

| Modo        | Velocidad base |
|-------------|----------------|
| Automóvil   | 30 km/h        |
| Motocicleta | 34 km/h        |
| A pie       | 5 km/h         |
| Bicicleta   | 15 km/h        |

**Fórmula:**

```
ETA (min) = ⌈ (distancia_km / (velocidad_kmh / factor)) × 60 ⌉
```

Ejemplo: 7.8 km a las 18:00 en auto (factor 2.2):
```
ETA = ⌈ (7.8 / (30 / 2.2)) × 60 ⌉ = ⌈ (7.8 / 13.6) × 60 ⌉ = ⌈ 34.4 ⌉ = 35 min
```

---

## 4. Segmentos de tráfico coloreados

OSRM devuelve la ruta dividida en **steps** (giros/tramos). Por cada step, Pitzbol calcula qué color mostrar:

| Condición                                       | Color   | Etiqueta |
|-------------------------------------------------|---------|----------|
| rush factor ≥ 1.8  ó  velocidad < 12 km/h     | Rojo    | Tráfico  |
| rush factor ≥ 1.3  ó  velocidad < 24 km/h     | Naranja | Lento    |
| Todo lo demás                                   | Verde   | Libre    |

El `speedKmh` por tramo se obtiene de `distance_step / duration_step` que entrega OSRM (velocidad esperada de esa calle según OpenStreetMap).

---

## 5. Velocidad en km/h durante navegación viva

Proviene del **GPS del dispositivo**.

**Fuente preferida** → `pos.coords.speed` (dato nativo del GPS del navegador, en m/s).

**Fallback** → si el GPS no da velocidad, se calcula como:

```
v = distancia_haversine(posición_anterior, posición_actual) / tiempo_transcurrido_s
```

Aplica solo si: `elapsed ≥ 1.5 s`, `moved ≥ 4 m`, precisión GPS `≤ 80 m`.

Después se **suaviza con EMA** para evitar saltos bruscos:
```
velocidad_suavizada = prev × 0.65 + nueva × 0.35
```

Velocidades absurdas se descartan con límites por modo:

| Modo        | Límite máximo |
|-------------|---------------|
| Automóvil   | ~198 km/h     |
| Motocicleta | ~180 km/h     |
| A pie       | ~11 km/h      |
| Bicicleta   | ~54 km/h      |

---

## 6. Tiempo restante durante navegación

El campo **"Tiempo"** durante navegación activa se recalcula en tiempo real, no usa el ETA previo:

```
Tiempo restante = ⌈ distancia_restante_en_ruta_m / (velocidad_rolling_m/s × 60) ⌉
```

La distancia restante se calcula **proyectando la posición GPS sobre la polilínea** (snap-to-route), no en línea recta al destino.

---

## 7. Rutas alternativas

Cuando OSRM solo devuelve 1 ruta, Pitzbol genera un waypoint artificial desplazado **perpendicular** al punto medio de la ruta (offset ~18 % de la distancia total) y vuelve a llamar a OSRM forzando el paso por ese punto. Máximo **2 rutas** en total.

---

## 8. Resumen de dependencias

| Componente                        | Fuente                                    |
|-----------------------------------|-------------------------------------------|
| Geometría de la ruta              | **OSRM** (open-source, gratuito)          |
| Tráfico                           | **Modelo propio** por hora del día        |
| Tiempos estimados (preview)       | **Fórmula interna** (velocidad ÷ factor)  |
| Velocidad durante navegación      | **GPS del dispositivo**                   |
| Tiempo restante durante navegación| **GPS + Haversine sobre polilínea**       |
