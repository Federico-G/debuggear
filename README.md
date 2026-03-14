# Debuggear

Debuggear es una aplicación para ayudar a aquellas personas que estan entrando en el espectacular mundo de la programación y la algoritmia. Esta aplicación permite capturar un algoritmo generado a mano, interpretarlo, y permitir ejecutarlo paso a paso.
Puedes probarlo desde [debuggear-web.web.app](https://debuggear-web.web.app/)


## Equipo original (hasta v1.1.1)
Debuggear nació como proyecto final de carrera de un equipo de cuatro estudiantes de ingeniería en informática: Federico Gasior, Florencia Kaucic, Lucia Corleto y Diego Porro.

A partir de la v1.2.0, el proyecto es mantenido por Federico Gasior.


## Consultas y reporte de errores
[Issues de Github](https://github.com/Federico-G/debuggear/issues)


## Tecnologias usadas
- Hosteado en Firebase
- TensorFlow.js: Reconocimiento de formas (local)
- Google Cloud Vision Handwriting OCR: Reconocimiento de texto (via Cloud Functions)
- xcc: Compilador C a WebAssembly — ejecución local de código C en el navegador
- Interact.js: Manipulación de formas en la aplicación
- Nearley.js: Interpretación de los lenguajes en BNF, y su validación
- jQuery v3
- Bootstrap v4 para el diseño del frontend
- Compressor.js para la compresión de imágenes subidas por el usuario
- sql.js (SQLite compilado a WebAssembly) con CodeMirror
- PWA con Service Worker para funcionamiento offline e instalación como app


## Lenguajes soportados
Aunque la aplicación se pensó para soportar varios lenguajes, por ahora sólo soporta C (C99)
