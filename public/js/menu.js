dg.menu = {
	clean: function() {
		document.getElementById('intro').innerHTML = '';
		document.getElementById("buttons").innerHTML = '';
		document.getElementById("shape-container").innerHTML = '';
		document.getElementById("shape-container").style.display = 'none';
		document.getElementById("shape-container").removeEventListener('click', dg.shape.deselect);
		document.getElementById("diagram-bg-image").innerHTML = '';
		document.getElementById("console-container").innerHTML = '';
		$(".popover").remove();
		interact('.shape').unset();
		delete dg.code.pg;
		window.removeEventListener('beforeunload', dg.menu.saveDiagram);
	},

	saveDiagram: function() {
		localStorage.setItem("diagram", dg.shape.export());
	},

	generarFooter: function(opciones) {
		if (!opciones) {
			opciones = [];
		}
		var footer = document.createElement('footer');
		footer.innerHTML = "";
		footer.classList.add("main-color");
		var opcion;
		for (var i = 0; i < opciones.length; i++) {
			opcion = opciones[i];

			if (opcion === 'new') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-plus'></i><br><span>Nuevo</span>";
				button.addEventListener('click', function(e) {
					if (confirm("Todos sus cambios se perderan. ¿Desea continuar?")) {
						dg.step._screen1();
					}
				});

				footer.appendChild(button);
			}

			if (opcion === 'scan_photo') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-camera'></i><br><span>Capturar</span>";
				button.addEventListener('click', function(e) {
					var file = document.createElement('input');
					file.type = 'file';
					file.accept = "image/*";
					file.capture = "environment";
					file.addEventListener('change', function(e) {
						document.getElementById('intro').innerHTML = "<div style='background: #FFF; height: 100%; text-align: center;'><img src='image/black-icon.svg' style='width: 50%; z-index: 1000;' class='animacion_infinito_rotacion' /></div>";
						var tgt = e.target,
							image = tgt.files[0];
						if (!FileReader) {
							return alert("Su navegador no soporta 'File Reader API'. La misma es necesaria para cargar imagenes a la aplicación");
						}
						if (!image) {
							return alert("Error al cargar imagen");
						}

						new Compressor(image, {
							maxWidth: 1200,
							maxHeight: 1200,
							quality: 0.8,
							convertSize: 1,
							success(result) {
								var fr = new FileReader();
								fr.onload = function() {
									localStorage.setItem("currentImage", fr.result);
									var image = new Image();
									image.addEventListener('load', function(e) {
										dg.tf.run(image, dg.step.processImage);
									});
									image.src = fr.result;
								}
								fr.readAsDataURL(result);
							}
						})
					});
					file.click();
				});

				footer.appendChild(button);
			}

			if (opcion === 'scan_image') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-file-image-o'></i><br><span>Seleccionar</span>";
				button.addEventListener('click', function(e) {
					var file = document.createElement('input');
					file.type = 'file';
					file.accept = "image/*";
					file.addEventListener('change', function(e) {
						document.getElementById('intro').innerHTML = "<div style='background: #FFF; height: 100%; text-align: center;'><img src='image/black-icon.svg' style='width: 50%; z-index: 1000;' class='animacion_infinito_rotacion' /></div>";
						var tgt = e.target,
							image = tgt.files[0];
						if (!FileReader) {
							return alert("Su navegador no soporta 'File Reader API'. La misma es necesaria para cargar imagenes a la aplicación");
						}
						if (!image) {
							return alert("Error al cargar imagen");
						}

						new Compressor(image, {
							maxWidth: 1200,
							maxHeight: 1200,
							quality: 0.8,
							convertSize: 1,
							success(result) {
								var fr = new FileReader();
								fr.onload = function() {
									localStorage.setItem("currentImage", fr.result);
									var image = new Image();
									image.addEventListener('load', function(e) {
										dg.tf.run(image, dg.step.processImage);
									});
									image.src = fr.result;
								}
								fr.readAsDataURL(result);
							}
						})
					});
					file.click();
				});

				footer.appendChild(button);
			}

			if (opcion === 'import_diagram') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-upload'></i><br><span>Importar diagrama</span>";
				button.addEventListener('click', dg.shape.import_file);

				footer.appendChild(button);
			}

			if (opcion === 'from_scratch') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-file-o'></i><br><span>Crear vacio</span>";
				button.addEventListener('click', function() {
					localStorage.setItem("diagram", "[]");
					dg.step.check();
				});

				footer.appendChild(button);
			}

			if (opcion === 'export_diagram') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-download'></i><br><span>Exportar diagrama</span>";
				button.addEventListener('click', dg.shape.export_file);

				footer.appendChild(button);
			}

			if (opcion === 'improve_detection') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-line-chart'></i><br><span>Mejoremos detección</span>";
				button.addEventListener('click', function() {
					var currentImage = localStorage.getItem("currentImage");
					if (!currentImage) {
						alert("Se necesita tener cargada una imagen para continuar");
						return;
					}

					if (!confirm(
						"¡Ayudanos a mejorar la detección!\n" + 
						"Se subirá los datos de la imagen del algoritmo junto con las formas detectadas para" +
						" ser utilizadas para mejorar la detección de formas. Le pedimos que las formas hayan" +
						" sido marcadas de forma correcta y que la imagen del algoritmo sea nítida.\n" +
						"¿Desea continuar?"
					)) {
						return;
					}

					dg.menu.saveDiagram();
					var file = JSON.stringify({
						elements: JSON.parse(localStorage.getItem("diagram")),
						image: currentImage
					});

					var storageRef = firebase.storage().ref();
					var fileRef = storageRef.child(Date.now() + ".json");
					fileRef.putString(file).then(function(snapshot) {
						alert("Los datos del algoritmo fueron subidos correctamente. ¡Muchas gracias por su aporte!");
					}).catch(function(e) {
						alert("Hubo un error al cargar los datos :(");
					});
				});

				footer.appendChild(button);
			}

			if (opcion === 'validate_and') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-play'></i><br><span>Validar</span>";
				button.addEventListener('click', function() {
					dg.menu.saveDiagram();
					var diagram_ok = dg.shape.validateDiagram();
					if (diagram_ok) {
						setTimeout(function() {
							var isfunction = dg.shape.getAll()[0].classList.contains("shape-function");
							var message = "El diagrama fue validado correctamente. " + (isfunction ? "¿Desea guardar esta funcion de usuario?" : "¿Desea ejecutarlo?");
							var next = confirm(message);
							if (next) {
								if (isfunction) {
									dg.step.processFunction();
								} else {
									dg.step.generateCode();
								}
							}
						}, 0);
					}
				});

				footer.appendChild(button);
			}

			if (opcion === 'edit') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-pencil'></i><br><span>Editar</span>";
				button.addEventListener('click', function() {
					if (confirm("La ejecución del código se perderá. ¿Está seguro de continuar?")) {
						localStorage.removeItem("code");
						dg.step.check();
					}

				});

				footer.appendChild(button);
			}

			if (opcion === 'export_code') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-file-code-o'></i><br><span>Exportar código</span>";
				button.addEventListener('click', function() {
					var diagram = JSON.parse(localStorage.getItem("diagram"));
					var language = dg.language.CodeToLanguage(dg.step._diagramToCode(diagram));
					var element = document.createElement('a');
					element.setAttribute('href', 'data:text/x-c;charset=utf-8,' + encodeURIComponent(language));
					element.setAttribute('download', "debuggear-code.c");

					element.style.display = 'none';
					document.body.appendChild(element);

					element.click();

					document.body.removeChild(element);
				});

				footer.appendChild(button);
			}

			if (opcion === 'show_symbol_table') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-table'></i><br><span>Símbolos</span>";
				button.addEventListener('click', function() {
					var table = "<table class='table table-striped'><thead><tr><th>Clave</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>";
					for (var i in dg.code.pg.currentSymbolTable.table) {
						table += "<tr><td>" +
							i +
							"</td><td>" +
							dg.code.pg.currentSymbolTable.table[i].type +
							"</td><td>" +
							dg.code.pg.currentSymbolTable.table[i].data +
							"</td></tr>"
					}

					$('#symbol-table .modal-body').html(table + "</tbody></table>");
					$('#symbol-table').modal('show');
				});

				footer.appendChild(button);
			}

			if (opcion === 'exe_next') {
				var button = document.createElement('button');
				button.type = 'button';
				button.id = 'footer_exe_next';
				button.innerHTML = "<i class='fa fa-step-forward'></i><br><span>Siguiente</span>";
				/*
				button.addEventListener('click', function() {
					var node = dg.code.pg.nextStep();
					if (!node) {
						this.disabled = true;
					} else {
						dg.shape.select(node.getElement());
					}
					document.getElementById("console-container").innerHTML =
						"<div>" + dg.code.pg.currentConsole.getHTML() + "</div>";
					document.getElementById("console-container").firstChild.scrollIntoView(false);
					document.getElementById("footer_exe_prev").disabled = false;
				});
				*/
				button.addEventListener('click', function() {
					button.disabled = true;
					var node = dg.code.pg.nextStep();
					setTimeout(function() {
						node = dg.code.pg.currentNode;
						button.disabled = false;
						if (!node) {
							this.disabled = true;
						} else {
							dg.shape.select(node.getElement());
						}
						document.getElementById("console-container").innerHTML =
							"<div>" + dg.code.pg.currentConsole.getHTML() + "</div>";
						document.getElementById("console-container").firstChild.scrollIntoView(false);
						document.getElementById("footer_exe_prev").disabled = false;
					}, 1500);

				});

				footer.appendChild(button);
			}

			if (opcion === 'exe_prev') {
				var button = document.createElement('button');
				button.type = 'button';
				button.id = 'footer_exe_prev';
				button.innerHTML = "<i class='fa fa-step-backward'></i><br><span>Anterior</span>";
				button.addEventListener('click', function() {
					var node = dg.code.pg.prevStep();
					if (!node) {
						this.disabled = true;
					} else {
						dg.shape.select(node.getElement());
					}
					document.getElementById("console-container").innerHTML =
						"<div>" + dg.code.pg.currentConsole.getHTML() + "</div>";
					document.getElementById("console-container").firstChild.scrollIntoView(false);
					document.getElementById("footer_exe_next").disabled = false;
				});

				footer.appendChild(button);
			}
		}

		var old_footer = document.getElementsByTagName("footer")[0];

		old_footer.parentNode.replaceChild(footer, old_footer);

		return footer;
	},

	generarAgregarShape: function() {
		var div = document.createElement('div');
		div.setAttribute('class', 'btn-group dropup drophidden');
		div.id = 'add_shape';

		var button_add = document.createElement('button');
		button_add.type = 'button';
		button_add.setAttribute('class', 'btn btn-primary dropdown-toggle');
		button_add.setAttribute('data-toggle', 'dropdown');
		button_add.setAttribute('aria-haspopup', 'true');
		button_add.setAttribute('aria-expanded', 'false');
		button_add.innerHTML = "<i class='fa fa-plus'></i>";


		var dd = document.createElement('div');
		dd.setAttribute('class', 'dropdown-menu dropdown-menu-right');
		var shapes = ['shape-start', 'shape-end', 'shape-in', 'shape-out', 'shape-op', 'shape-while', 'shape-dowhile', 'shape-for', 'shape-if', 'shape-function'];
		var shapeContents = ['C', 'F', 'type name', '"nombre", name', 'operacion', 'operacion', 'operacion', 'i = 0;\ni < x; i++', 'operacion', 'return_type function_name\n(type param1, type param2)'];
		var shapeNames = ['START', 'END', 'IN', 'OUT', 'OP', 'WHILE', 'DO WHILE', 'FOR', 'IF', 'FUNCTION'];

		var createFnUinew = function(shape, shapeContent) {
			return function(e) {
				dg.shape.uinew(document.getElementById("shape-container"), shape, shapeContent);
			};
		};

		var button_dd;
		for (var i = 0; i < shapes.length; i++) {
			button_dd = document.createElement('button');
			button_dd.type = 'button';
			button_dd.setAttribute('class', 'dropdown-item');
			button_dd.addEventListener('click', createFnUinew(shapes[i], shapeContents[i]));
			button_dd.innerHTML = shapeNames[i];
			dd.appendChild(button_dd);
		}

		div.appendChild(button_add);
		div.appendChild(dd);

		document.getElementById("buttons").appendChild(div);
	},

	generarAgregarShapeTrash: function() {
		var button = document.createElement('button');
		button.type = 'button';
		button.setAttribute('class', 'btn btn-danger');
		button.id = 'trash';
		button.innerHTML = "<i class='fa fa-trash'></i>";
		button.addEventListener('click', dg.shape.removeSelected);

		document.getElementById("buttons").appendChild(button);
	},

	generarBGImage: function() {
		var currentImage = localStorage.getItem("currentImage");

		if (currentImage) {
			var image = document.createElement('img');
			var divBGImage = document.getElementById("diagram-bg-image");
			divBGImage.innerHTML = '';
			divBGImage.appendChild(image);
			image.style.position = 'absolute';
			image.style.width = '100%';
			image.src = currentImage;
		}
	},

	generarAgregarZoom: function() {


		var $todo = $(`<div id="change_zoom" class="dropleft drophidden" style='display: inline-block'>
      <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownZoom" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <i class="fa fa-cog"></i>
      </button>
      <div class="dropdown-menu text-center dropdown-menu-right p-3" style="min-width: 250px; max-width: 400px;">

        <h3>Zoom</h3>
        <div class='row no-gutters' style='align-items: center;'>
          <div class='col col-auto pr-2'>
            <i class="fa fa-font h5"></i>
          </div>
          <div class='col'>
            <input type="range" value="` + dg.config.fontSize + `" min="10" max="60" step="5" class="custom-range d-inline-block" id="fontRange" oninput="dg.menu.cambiarTamañoFuente(this.value);">
          </div>
          <div class='col col-auto pl-2'>
            <i class="fa fa-font h2"></i>
          </div>
        </div>
        
        <div class='row no-gutters mt-3' style='align-items: center;'>
          <div class='col col-auto pr-2'>
            <i class="fa fa-square-o h5"></i>
          </div>
          <div class='col'>
            <input type="range" value="` + Math.log2(dg.config.scale * 10) + `" ` + (dg.config.autoScale ? "disabled " : "") + `min="1" max="5" step="0.125" class="custom-range d-inline-block" id="shapeRange" oninput="dg.menu.cambiarZoom(this.value);">
          </div>
          <div class='col col-auto pl-2'>
            <i class="fa fa-square-o h2"></i>
          </div>
        </div>
        <div class="custom-control custom-switch">
          <input type="checkbox" ` + (dg.config.autoScale ? "checked " : "") + `class="custom-control-input" id="automaticShapeZoom" oninput="dg.menu.cambiarZoomAutomatico(this.checked);">
          <label class="custom-control-label" for="automaticShapeZoom">Automático</label>
        </div>
        
      </div>
    </div>`);

		$("#buttons").append($todo).find('#change_zoom .dropdown-menu').click(function(e) {
			e.stopPropagation();
		});
	},

	generarCrear: function() {
		document.getElementById('intro').innerHTML = '<h1>¡Nuevo!</h1><br>Elija una opción debajo para comenzar';
	},

	generarInfo: function() {
		var html = "<h1 class='mb-3'>Información</h1>";

		html += "<div style='font-size: 20px;'>";

		html += "<p>Bienvenidos/as a Debuggear, una web para ayudarte en la resolución de ejercicios de diagramas de programación y bases de datos con una interfaz amigable, intuitiva y simple! </p>";
		html += "<p>Con Debuggear podrás validar, ejecutar y probar tus algoritmos y queries fácilmente paso a paso. Esto te permitirá aprender el funcionamiento de los algoritmos y sentencias fácilmente.</p>";
		html += "<p>La idea es poder brindar una alternativa interactiva para poder comprender aquellos conceptos que normalmente suelen ser complicados debido a su naturaleza abstracta.</p>";

		html += "<h2 class='my-2'>¿Quiénes somos?</h2>";
		html += "<p>Somos un equipo compuesto por cuatro estudiantes de ingeniería en informática. Debuggear nació como nuestro proyecto final de carrera</p>";
		html += "<div class='row'>";
		html += "<div class='col-6 my-2'><img src='/image/fede.jpg' width='150' height='170' /><div>Federico Gasior</div></div>";
		html += "<div class='col-6 my-2'><img src='/image/flor.jpg' width='150' height='170' /><div>Florencia Kaucic</div></div>";
		html += "<div class='col-6 my-2'><img src='/image/lu.jpg' width='150' height='170' /><div>Lucia Corleto</div></div>";
		html += "<div class='col-6 my-2'><img src='/image/diego.jpg' width='150' height='170' /><div>Diego Porro</div></div>";
		html += "</div>";

		html += "<p class='mt-3'>Para comenzar a escanear acceda a la sección <a href='#' onclick='dg.step.screenMain(); return false;'>Diagrama</a></p>"
		html += "</div>";

		document.getElementById('intro').innerHTML = html;
	},

	generarHelp: function() {
		var html = "<h1 class='mb-3'>Ayuda</h1>";

		html += "<div style='font-size: 20px;'>";

		html += "<h2 class='my-2'>¿Cómo funciona la web?</h2>";
		html += "<p>La web tiene dos módulos principales, uno para trabajar con diagramas de programación y otro para bases de datos.</p>";
		html += "<p>El módulo de diagramas permite sacar una foto de un diagrama realizado a mano, o bien seleccionar el archivo desde el dispositivo. Una vez seleccionado el diagrama, la web realiza un análisis del mismo identificando los elementos y el texto contenido en ellos, ambos editables manualmente. Luego se habilita un debug paso a paso del mismo en donde se visualizan los valores de cada variable hasta ver el resultado final del algoritmo. Por último, se puede descargar el código en lenguaje C para su ejecución.</p>";
		html += "<p>El módulo de bases de datos analiza un diagrama DER, reconoce tablas y atributos, crea las tablas y carga datos genéricos automáticamente. Luego permite subir una sentencia SQL y devuelve la tabla resultante junto con un interesante gráfico que da una ayuda visual para analizar las relaciones y filtros utilizados. También permite descargar las sentencias SQL de creación de las tablas, de carga de datos y almacenar los resultados de las sentencias para que puedan reutilizarse.</p>";

		html += "<h2 class='my-2'>¿Qué tipo de diagramas puedo cargar?</h2>";
		html += "<p>Para algoritmos se pueden cargar los diagramas de programación de la materia elementos de programación. A continuación, algunos ejemplos:</p>";
		html += "<img src='/image/algo1.jpg' style='width: 100%; max-width: 300px;' /><br><br>";
		html += "<img src='/image/algo2.jpg' style='width: 100%; max-width: 300px;' /><br><br>";
		html += "<p>Para SQL deben subirse diagramas básicos DER con el formato: </p>";
		html += "<img src='/image/der1.jpg' style='width: 100%; max-width: 300px;' /><br><br>";
		html += "<img src='/image/der2.jpg' style='width: 100%; max-width: 300px;' /><br><br>";

		html += "<h2 class='my-2'>¿Cómo puedo cargar mi diagrama?</h2>";
		html += "<p>Los diagramas, ya sean algoritmos o DER, pueden obtenerse tomando una foto o bien seleccionando un archivo en el dispositivo donde se esté ejecutando la web.</p>";
		html += "<p>Para ello, puedes tomar una foto seleccionando el botón “Capturar” o si quieres elegir una foto de tu galería, puedes seleccionar el botón “Seleccionar”.</p>";
		html += "<p>Si no tienes un diagrama previamente dibujado, puedes crear uno nuevo seleccionando el botón “Crear vacío”. Allí se te abrirá un lienzo en blanco sobre el que podrás agregar figuras en orden secuencial utilizando el botón “+” que encontrarás en la esquina inferior derecha de la pantalla. Luego solo tienes que acomodar las figuras y escribir las operaciones en su interior.</p>";

		html += "<h2 class='my-2'>¿Puedo guardar diagramas ya analizados?</h2>";
		html += "<p>Sí, la web permite descargar los diagramas que se van utilizando para luego poder reutilizarlos sin necesidad de volver a escanearlos y editarlos manualmente cuando fuera necesario.</p>";
		html += "<p>El botón de descarga de diagramas es: <i class='fa fa-download'></i> Exportar Diagrama</p>";
		html += "<p>Si quieres seleccionar un diagrama exportado previamente, puedes hacerlo seleccionando el botón “Importar diagrama” dentro del menú <b>Nuevo</b>.</p>";

		html += "<h2 class='my-2'>¿Cómo genero el código ejecutable de mi diagrama?</h2>";
		html += "<p>La web permite descargar el código SQL o C dependiendo del diagrama seleccionado para su ejecución automática sin la necesidad de codificarlo manualmente.</p>";
		html += "<p>El botón de generación de código es: <i class='fa fa-file-code-o'></i> Exportar código</p>";

		html += "<h2 class='my-2'>¿Qué consideraciones debo tener en cuenta a la hora de subir un diagrama?</h2>";
		html += "<p>Los diagramas deben realizarse sobre una hoja en blanco, con birome negra o azul, en imprenta, el texto no puede superponerse con la figura y letra imprenta lo más prolija posible.  En el caso de los DER debe utilizarse letra mayúscula para las tablas y minúscula para los campos o atributos de las tablas.</p>";

		html += "<h2 class='my-2'>¿Cómo interactúo con mi diagrama?</h2>";
		html += "<p>Una vez que tengas cargada la foto de tu diagrama, puedes editar todo lo que la aplicación haya reconocido. Solo tienes que seleccionar la forma reconocida y podrás editar el texto que contiene. También puedes agregar las formas que desees si es que no se reconoció alguna que dibujaste o te olvidaste de incluirla en tu dibujo. Para agregar formas utiliza el botón “+” que se encuentra en la esquina inferior derecha de la pantalla. </p>";
		html += "<p>Si ya estás conforme con el diagrama, toca el botón “validar” para detectar si hay algún error. Si se encuentra alguna falla la aplicación lo informará y, sino, avanzará a la siguiente fase: la depuración.</p>";
		html += "<p>En la fase de depuración, podrás ejecutar cada paso de tu algoritmo e ir consultando la tabla de símbolos para ver cómo cambian los valores de tus variables. Y lo mejor es que si no te quedó claro un paso, podrás volver atrás sin necesidad de volver a comenzar toda la ejecución.</p>";
		html += "<p>Si deseas modificar el algoritmo puedes utilizar el botón “Editar”. </p>";
		html += "<p>Si deseas descargar el código fuente C de tu algoritmo, puedes utilizar el botón “Exportar código”. </p>";
		html += "<p>Con el botón “Símbolos” puedes consultar la tabla de símbolos en cualquier momento.</p>";
		html += "<p>Y con los botones “Anterior” y “Siguiente” puedes navegar en la ejecución del algoritmo, avanzando (Siguiente) o retrocediendo (Anterior) en cada operación o sentencia.</p>";

		html += "<h2 class='my-2'>Comentarios, sugerencias, mejoras</h2>";
		html += "<p><a href='https://github.com/Federico-G/debuggear'><i class='fa fa-github'></i> debuggear</a></p>";
		html += "<p><a href='https://www.instagram.com/debuggearApp/'><i class='fa fa-instagram'></i> debuggearApp</a></p>";

		html += "</div>";

		document.getElementById('intro').innerHTML = html;
	},

	generarFunctions: function() {
		var localFunctions = JSON.parse(localStorage.getItem("functions"));
		var html = "<h1>Funciones creadas</h1><br>";

		if (localFunctions) {
			var table = "<table class='table table-striped table-bordered table-sm' style='font-size: 18px;'><thead><tr><th>Retorno</th><th>Nombre</th><th>Parametros</th><th>Opciones</th></tr></thead><tbody>";
			var fn;
			for (var name in localFunctions) {
				fn = localFunctions[name];
				table += "<tr>";
				table += "<td>" + fn.return_type + "</td>";
				table += "<td>" + fn.name + "</td>";
				table += "<td>" + fn.parameters.map(x => x.dataType + " " + x.identifier).reverse().join(", ") + "</td>";
				table += "<td>" +
					"<button type='button' class='btn btn-sm m-1 btn-secondary' onclick='dg.menu.editarFunction(\"" + fn.name + "\");' title='Editar'><i class='fa fa-pencil'></i></button>" +
					"<button type='button' class='btn btn-sm m-1 btn-danger'onclick='dg.menu.borrarFunction(\"" + fn.name + "\");' title='Borrar'><i class='fa fa-trash'></i></button>" +
					"</td>";
			}
			table += "</tbody></table>";
			html += table;
		} else {
			html += "<h3>No hay ninguna función creada aún</h3>";
		}

		$('#intro').html(html);
	},

	editarFunction: function(name) {
		if (localStorage.getItem("diagram") &&
			!confirm("Ya se esta editando un diagrama. ¿Desea descartar los cambios para editar esta función?")) {
			return;
		}

		localStorage.removeItem("code");
		var fn = JSON.parse(localStorage.getItem("functions"))[name];
		localStorage.removeItem("currentImage");
		localStorage.setItem("diagram", JSON.stringify(fn.diagram));
		localStorage.setItem("screen", "main");
		dg.step.check();
	},

	borrarFunction: function(name) {
		if (confirm("¿Está seguro de eliminar la función '" + name + "'?")) {
			var functions = JSON.parse(localStorage.getItem("functions"));
			delete functions[name];
			localStorage.setItem("functions", JSON.stringify(functions));
			dg.step.check();
		}
	},

	cambiarTamañoFuente: function(value) {
		dg.config.fontSize = value;
	},

	cambiarZoom: function(value) {
		$("#automaticShapeZoom").val(false);
		dg.config.scale = 0.1 * Math.pow(2, value);
	},

	cambiarZoomAutomatico: function(value) {
		dg.config.autoScale = value;
		if (value) {
			dg.config.width = 1000;
		}
		$(window).trigger("resize");
		$("#shapeRange").prop("disabled", value);
		$("#shapeRange").val(Math.log2(dg.config.scale * 10));
	}
	
}
