dg.menu = {
	clean: function() {
		document.getElementById('intro').innerHTML = '';
		document.getElementById("buttons").innerHTML = '';
		document.getElementById("shape-container").innerHTML = '';
		document.getElementById("shape-container").removeEventListener('click', shape.deselect);
		document.getElementById("diagram-bg-image").innerHTML = '';
		document.getElementById("console-container").innerHTML = '';
		interact('.shape').unset();
		delete dg.code.pg;
		window.removeEventListener('beforeunload', dg.menu.saveDiagram);
	},

	saveDiagram: function() {
		localStorage.setItem("diagram", shape.export());
	},

	generarFooter: function(opciones) {
		var footer = document.createElement('footer');
		footer.innerHTML = "";
		var opcion;
		for (var i = 0; i < opciones.length; i++) {
			opcion = opciones[i];

			if (opcion === 'new') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-home'></i><br><span>Nuevo</span>";
				button.addEventListener('click', function(e) {
					if (!(localStorage.getItem("diagram") || localStorage.getItem("code")) ||
						confirm("Todos sus cambios se perderan. ¿Desea continuar?")) {
						dg.step.screen1();
					}
				});

				footer.appendChild(button);
			}

			if (opcion === 'info') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-info'></i><br><span>Info</span>";
				button.addEventListener('click', function(e) {
					dg.step.screen0();
				});

				footer.appendChild(button);
			}

			if (opcion === 'scan_photo') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-camera'></i><br><span>Tomar foto</span>";
				button.addEventListener('click', function(e) {
					var file = document.createElement('input');
					file.type = 'file';
					file.accept = "image/*";
					file.capture = "environment";
					file.addEventListener('change', function(e) {
						document.getElementById('intro').innerHTML = "<div style='background: #FFF; height: 100%; text-align: center;'><img src='image/black-icon.svg' style='width: 50%; z-index: 1000;' class='animacion_infinito_rotacion' /></div>";
						var tgt = e.target, image = tgt.files[0];
						if (!FileReader) {
							return alert("Su navegador no soporta una función clave para correr esta app");
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
				button.innerHTML = "<i class='fa fa-file-image-o'></i><br><span>Elegir imagen</span>";
				button.addEventListener('click', function(e) {
					var file = document.createElement('input');
					file.type = 'file';
					file.accept = "image/*";
					file.addEventListener('change', function(e) {
						document.getElementById('intro').innerHTML = "<div style='background: #FFF; height: 100%; text-align: center;'><img src='image/black-icon.svg' style='width: 50%; z-index: 1000;' class='animacion_infinito_rotacion' /></div>";
						var tgt = e.target || window.event.srcElement,
							files = tgt.files;

						if (FileReader && files && files.length) {
							var fr = new FileReader();
							fr.onload = function() {
								// TODO size too big, see another way to capture image, or compress af
								try {
									localStorage.setItem("currentImage", fr.result);
								} catch (error) {
									console.error(error);
								}
								var image = document.createElement('img');
								var divBGImage = document.getElementById("diagram-bg-image");
								divBGImage.innerHTML = '';
								divBGImage.appendChild(image);
								image.style.position = 'absolute';
								image.style.width = '100%';
								image.src = fr.result;
								image.addEventListener('load', function(e) {
									dg.tf.run(image, dg.step.processImage);
								});
							}
							fr.readAsDataURL(files[0]);
						}
					});
					file.click();
				});

				footer.appendChild(button);
			}

			if (opcion === 'import_diagram') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-upload'></i><br><span>Importar diagrama</span>";
				button.addEventListener('click', shape.import_file);

				footer.appendChild(button);
			}

			if (opcion === 'export_diagram') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-download'></i><br><span>Exportar diagrama</span>";
				button.addEventListener('click', shape.export_file);

				footer.appendChild(button);
			}

			if (opcion === 'execute') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-play'></i><br><span>¡Ejecutar!</span>";
				button.addEventListener('click', function() {
					dg.menu.saveDiagram();
					dg.step.generateCode();
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

			if (opcion === 'export_ccode') {
				// TODO
			}

			if (opcion === 'exe_next') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-step-forward'></i><br><span>Siguiente</span>";
				button.addEventListener('click', function() {
					var node = dg.code.pg.nextStep();
					shape.select(node.getElement());
					document.getElementById("console-container").innerHTML = 
						"<div>" + dg.code.pg.currentConsole.getLines().join("<br>") + "</div>";
					document.getElementById("console-container").firstChild.scrollIntoView(false);
				});

				footer.appendChild(button);
			}

			if (opcion === 'exe_prev') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-step-backward'></i><br><span>Anteior</span>";
				button.addEventListener('click', function() {
					var node = dg.code.pg.prevStep();
					shape.select(node.getElement());
					document.getElementById("console-container").innerHTML = 
						"<div>" + dg.code.pg.currentConsole.getLines().join("<br>") + "</div>";
					document.getElementById("console-container").firstChild.scrollIntoView(false);
				});

				footer.appendChild(button);
			}

			if (opcion === 'install') {
				var button = document.createElement('button');
				button.type = 'button';
				button.style.display = 'none';
				button.innerHTML = "<i class='fa fa-mobile'></i><br><span>Instalar</span>";

				footer.appendChild(button);

				var deferredPrompt;
				// TODO remove event listener, with an outside function
				window.addEventListener('beforeinstallprompt', function(e) {
					e.preventDefault();
					deferredPrompt = e;
					button.style.display = 'block';
				});

				button.addEventListener('click', function(e) {
					deferredPrompt.prompt();
					deferredPrompt.userChoice.then(choiceResult => {
						if (choiceResult.outcome === 'accepted') {
							button.style.display = 'none';
						}
						deferredPrompt = null;
					});

					return false;
				});
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
		var shapes = ['shape-in', 'shape-out', 'shape-op', 'shape-while', 'shape-dowhile', 'shape-for', 'shape-if'];
		var shapes_name = ['IN', 'OUT', 'OP', 'WHILE', 'DO WHILE', 'FOR', 'IF'];

		var createFnUinew = function(s) {
			return function(e) {
				shape.uinew(document.getElementById("shape-container"), s);
			};
		};

		var button_dd;
		for (var i = 0; i < shapes.length; i++) {
			button_dd = document.createElement('button');
			button_dd.type = 'button';
			button_dd.setAttribute('class', 'dropdown-item');
			button_dd.addEventListener('click', createFnUinew(shapes[i]));
			button_dd.innerHTML = shapes_name[i];
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
		button.addEventListener('click', shape.removeSelected);

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

	// TODO remover
	generarConsole: function() {
		var divConsole = document.getElementById("console-container");
		// divConsole
		//
	},


	generarCrear: function() {
		document.getElementById('intro').innerHTML = '<h1>¡Nuevo!</h1><br>Elija una opción debajo para comenzar';
	},


	generarInfo: function() {
		document.getElementById('intro').innerHTML = '<h1>¡Holis!</h1><br>Proximamente aquí podrá encontrar información de como utilizar esta aplicación, sus autores, y como poder contribuir para mejorarla';
	}
}