<div align="center">
  
  # 🏍️ MotoGuard AI
  **Tu celular se convierte en un Copiloto Inteligente que salva vidas.**
  
  Un proyecto creado por el equipo **ChaoMundo** 🚀
  
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
  ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)
  ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

</div>

---

## 🔴 El Problema
En Colombia y Latinoamérica, la conducción de motocicletas presenta altísimas tasas de accidentalidad. Las aseguradoras y empresas de flotas (delivery, logística) pierden billones en siniestros. Actualmente, **no existe una segmentación real del riesgo**: el buen conductor paga exactamente la misma prima costosa que el conductor imprudente.

## 🟢 Nuestra Solución
**MotoGuard AI** es una solución de movilidad e *InsurTech* que convierte el celular del motociclista en un sistema de prevención de accidentes. Usando los sensores nativos del dispositivo y el poder de la Inteligencia Artificial, analizamos el comportamiento de manejo en tiempo real, sin necesidad de hardware costoso.

---

## ✨ Características Principales

*   **Copiloto IA (Mobile-First):** Una Web App interactiva diseñada para sentirse como una app nativa. Usa GPS, acelerómetro y giroscopio.
*   **Alertas Predictivas por Voz:** El piloto recibe alertas de zonas de alta accidentalidad, frenadas bruscas o excesos de velocidad sin tener que apartar los ojos de la vía.
*   **Score Dinámico en Tiempo Real:** Un algoritmo evalúa constantemente la conducción, sumando puntos por buenas prácticas y restando por eventos de riesgo.
*   **Protocolo de Emergencias automático:** Si el sistema detecta un impacto o accidente, inicia una cuenta regresiva que, si no es cancelada, envía coordenadas precisas a servicios de emergencia.
*   **Dashboard B2B:** Un panel ejecutivo para empresas con mapa de calor de zonas de riesgo y control del bienestar de su flota.
*   **Seguros Dinámicos:** Módulo *InsurTech* donde las aseguradoras visualizan tarifas de SOAT/pólizas personalizadas, ofreciendo descuentos monetarios reales a los conductores seguros.

---

## ¿Cómo funciona el Score Asegurador? (Influencia de los días)

El problema de los seguros actuales es que penalizan a los conductores por eventos aislados. MotoGuard AI introduce un **Modelo de Tendencias**, lo que significa que **tu score no se destruye por tener un solo "mal día"**.

Nuestra IA calcula una prima justa combinando tu comportamiento histórico con tu desempeño reciente a través de esta fórmula de suavización:

`Score Asegurador = (0.7 × Score Histórico Acumulado) + (0.3 × Score del Día)`

**¿Cómo afectan realmente los días a tu score?**
1. **Días atípicos (mal día aislado):** Si tienes un excelente historial pero un día cometes una imprudencia grave, el peso del historial (70%) actuará como un "colchón". Tu score del día bajará, pero tu Score Asegurador a largo plazo se mantendrá estable casi por completo. *No pierdes tu descuento por un error aislado.*
2. **Días crónicamente riesgosos (patrón repetitivo):** Si empiezas a tener malos días de forma consecutiva (por ejemplo, manejas con exceso de velocidad durante 3 o 4 días seguidos), la fórmula detectará la caída repetitiva en el 30% del score diario, lo que erosionará tu "colchón" histórico y tu Score Asegurador comenzará a bajar significativamente. *Solo penalizamos cuando hay un deterioro real de comportamiento.*
3. **Días de consistencia constante:** Si mantienes trayectos seguros (rating > 75) consistentemente, el sistema te premiará incrementando tu "mejor racha", mitigando de forma anticipada posibles errores en el futuro, y haciéndote dueño del mejor nivel de prima posible.

---

## Stack Tecnológico

Hemos construido este proyecto priorizando la compatibilidad universal, el mínimo tiempo de carga y la nula fricción (no requiere instalación), manteniendo un nivel estético Premium (Glassmorphism, Dark UI).

*   **Frontend Vanilla:** HTML5 Semántico, CSS3 Puro (con *Custom Properties* y layout Mobile-First flex/grid), y JavaScript ES6+.
*   **Integración de Mapas:** `Leaflet.js` con mapas de *CartoDB Dark Matter*.
*   **Visualización de Datos:** `Chart.js` para analítica de conductores.
*   **Iconografía:** `Lucide Icons`.
*   **APIs Nativas:** API de Geolocalización (con modo *fallback* a entorno simulado para pitcheo) y API de Síntesis de Voz (SpeechSynthesis).

---

## Cómo correr el proyecto (Modo Local)

La magia de MotoGuard AI es que no compila, no pesa y corre en cualquier navegador móvil o de escritorio moderno.

1. Clona este repositorio o descarga los archivos.
2. Abre la carpeta del proyecto en VSCode.
3. Utiliza la extensión **Live Server** de VSCode (clic derecho en `index.html` > *Open with Live Server*).
4. **Para la mejor experiencia:** Abre la URL local desde tu **celular**, conéctate a la misma red WiFi, y otorga permisos de GPS para ver tu ubicación real funcionando contra el Score IA.

> **Hackathon Tip (Modo Demo):** Si abres el proyecto o deniegas los permisos de ubicación, la aplicación entrará en "Modo Simulación", ubicándote en Bogotá y generando una ruta aleatoria con eventos de IA prefabricados, ¡perfecto para una presentación frente a jurados!

---

## Impacto Esperado (Modelo SaaS B2B)

*   **Para la Aseguradora:** -35% en costos de siniestralidad.
*   **Para la Empresa de Delivery:** Monitoreo en tiempo real y reducción de incapacidades.
*   **Para el Motociclista:** Un copiloto que cuida su vida y rebajas de hasta -35% en el costo del seguro por manejar bien.

<div align="center">
  <br>
  <i>Hecho con ☕ y 🏍️ por el equipo <b>ChaoMundo</b> para proteger vidas.</i>
</div>
