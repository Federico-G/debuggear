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
							convertSize: 500000,
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
							convertSize: 500000,
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
					}, 2000);

				});

				footer.appendChild(button);
			}

			if (opcion === 'exe_prev') {
				var button = document.createElement('button');
				button.type = 'button';
				button.id = 'footer_exe_prev';
				button.innerHTML = "<i class='fa fa-step-backward'></i><br><span>Anteior</span>";
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

	/*
	generarConsole: function() {
		var divConsole = document.getElementById("console-container");
		// divConsole
		//
	},
	*/


	generarCrear: function() {
		document.getElementById('intro').innerHTML = '<h1>¡Nuevo!</h1><br>Elija una opción debajo para comenzar';
	},


	generarInfo: function() {
		var html = "<h1 class='mb-3'>Información</h1><p>Proximamente aquí podrá encontrar información de los autores de la aplicación, y como poder contribuir para mejorarla</p>";

		html += "<p>Para comenzar a escanear acceda a la sección <a href='#' onclick='dg.step.screenMain(); return false;'>Diagrama</a></p>"
		document.getElementById('intro').innerHTML = html;
	},

	generarHelp: function() {
		document.getElementById('intro').innerHTML = '<h1>¡Holis!</h1><br>Proximamente aquí podrá encontrar información de como utilizar esta aplicación';
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
	}
}
