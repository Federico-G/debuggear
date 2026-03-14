# Changelog

## 1.0.0-alpha
- Primer release


## 1.0.0
- Se agrega sección de SQL


## 1.0.1
- Se agregan ejemplos
- Se corrige un bug donde fallaba si la consulta SQL no generaba ninguna fila
- Se mejora la detección de formas
- Se agregan las imagenes originales de entrenamiento


## 1.0.2
- Se agrega analytics al proyecto
- Se agrega la posibilidad de subir diagrama con sus formas para ayudar a mejorar la detección de formas
- Se agregan funciones de procesamiento al repositorio


## 1.1.0
- Se agrega la capacidad de cambiar el tamaño de letra y de desactivar el ajuste automático de escala, junto con la capacidad de elegirlo manualmente
- Se agrega api_key para compilador de C
- Se agrega evento de guardado de diagrama en los cambios de menú internos


## 1.1.1
- Se mejora escala y se agrega la imagen en la consideración de escalas
- Se corrige posición de texto en if para soportar distintos tamaños de fuente


## 1.2.0
### Compilador C local
- Se reemplaza Rextester (API remota) por xcc, un compilador C a WebAssembly que corre 100% en el navegador
  - El compilador se ejecuta en un Web Worker separado para no bloquear la UI
  - Se implementa con WASI Preview 1 (filesystem virtual + 14 funciones del estándar)
  - Se agrega pre-warm del compilador al entrar a la pantalla de ejecución

### PWA y offline
- Se reescribe el Service Worker: estrategia network-first con cache dinámico para same-origin
- Se agrega precache completo al instalar la PWA (click en "Instalar")

### Infraestructura
- Se agrega GitHub Action para deploy automático a Pages en cada release

### Otros
- Se elimina la sección "nosotros" de la aplicación
- Se corrige la ejecución async de nextStep (se elimina el hack de setTimeout)
- La versión es visible en mobile (fuera del collapse del navbar)


