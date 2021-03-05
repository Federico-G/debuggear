# debuggear

Debuggear es una aplicación para ayudar a aquellas personas que estan entrando en el espectacular mundo de la programación y la algoritmia. Esta aplicación permite capturar un algoritmo generado a mano, interpretarlo, y permitir ejecutarlo paso a paso


## ¿Quiénes somos?
Somos un equipo compuesto por cuatro estudiantes de ingeniería en informática. Debuggear nació como nuestro proyecto final de carrera



## Consultas y reporte de errores
[Issues de Github](https://github.com/Federico-G/debuggear/issues)



## Tecnologias usadas:
- Hosteado en Firebase
- Tensorflowjs: Reconocimiento de formas (local)
- Google Cloud Vision Handwriting OCR: Reconocimiento de texto (via nodejs)
- Interactjs: Manipulación de formas en la aplicación
- Nearleyjs: Interpretación de los lenguajes en BNF, y su validación
- Rextester: Ejecución de cada paso sobre el lenguaje aplicado
- Jquery v3
- Bootstrap v4 para el diseño del frontend
- Compressorjs para la compresión de imagenes subidas por el usuario
- Basado en estandares de PWA para funcionar también como aplicación movil


## Lenguajes soportados
Aunque la aplicación se pensó para soportar varios lenguajes, por ahora sólo soporta C (C99)


## Próximos pasos
- Mejorar forma de compartir (Ya que reconocer extensiones de archivos para la aplicación como PWA esta ["demorado"](https://github.com/w3c/manifest/issues/626)
- Migrar a Bootstrap v5 y quitar Jquery
- Mejorar cosas de TODO
