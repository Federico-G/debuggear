dg.sql.types = {
	"lorem.paragraph": {
		name: "Párrafo",
		sqliteType: "TEXT",
		group: "Texto"
	},
	"lorem.sentence": {
		name: "Oración",
		sqliteType: "TEXT",
		group: "Texto"
	},
	"lorem.word": {
		name: "Palabra",
		sqliteType: "TEXT",
		group: "Texto"
	},
	"random.alphaNumeric": {
		name: "Caracter",
		sqliteType: "TEXT",
		group: "Texto"
	},
	"unique.unique": {
		name: "ID (autoincremental)",
		sqliteType: "INTEGER",
		group: "Número"
	},
	"date.past": {
		name: "Fecha pasada",
		sqliteType: "TEXT",
		group: "Número"
	},
	"date.future": {
		name: "Fecha futura",
		sqliteType: "TEXT",
		group: "Número"
	},
	"random.number": {
		name: "Número 5",
		sqliteType: "INTEGER",
		group: "Número"
	},
	"finance.account": {
		name: "Número 8",
		sqliteType: "INTEGER",
		group: "Número"
	},
	"system.semver": {
		name: "Versión",
		sqliteType: "TEXT",
		group: "Número"
	},
	"phone.phoneNumber": {
		name: "Número teléfono",
		sqliteType: "TEXT",
		group: "Número"
	},
	"name.firstName": {
		name: "Nombre",
		sqliteType: "TEXT",
		group: "Persona"
	},
	"name.lastName": {
		name: "Apellido",
		sqliteType: "TEXT",
		group: "Persona"
	},
	"name.findName": {
		name: "Nombre Completo",
		sqliteType: "TEXT",
		group: "Persona"
	},
	"name.sex": {
		name: "Sexo",
		sqliteType: "TEXT",
		group: "Persona"
	},
	"name.title": {
		name: "Título",
		sqliteType: "TEXT",
		group: "Persona"
	},
	"name.jobType": {
		name: "Puesto",
		sqliteType: "TEXT",
		group: "Persona"
	},
	"internet.avatar": {
		name: "Avatar",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"internet.email": {
		name: "Email",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"internet.userName": {
		name: "Username",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"internet.url": {
		name: "URL",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"internet.ip": {
		name: "IP",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"internet.password": {
		name: "Password",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"internet.color": {
		name: "Color Hex",
		sqliteType: "TEXT",
		group: "Internet"
	},
	"address.zipCode": {
		name: "Codigo postal",
		sqliteType: "TEXT",
		group: "Ubicación"
	},
	"address.city": {
		name: "Ciudad",
		sqliteType: "TEXT",
		group: "Ubicación"
	},
	"address.streetAddress": {
		name: "Dirección",
		sqliteType: "TEXT",
		group: "Ubicación"
	},
	"address.country": {
		name: "País",
		sqliteType: "TEXT",
		group: "Ubicación"
	},
	"address.latitude": {
		name: "Latitud",
		sqliteType: "TEXT",
		group: "Ubicación"
	},
	"address.longitude": {
		name: "Longitud",
		sqliteType: "TEXT",
		group: "Ubicación"
	},
	"commerce.color": {
		name: "Color",
		sqliteType: "TEXT",
		group: "Otros"
	},
	"commerce.product": {
		name: "Producto",
		sqliteType: "TEXT",
		group: "Otros"
	},
	"system.fileName": {
		name: "Archivo",
		sqliteType: "TEXT",
		group: "Otros"
	},
	"random.boolean": {
		name: "Booleano",
		sqliteType: "INTEGER",
		group: "Otros"
	}
}

dg.sql.groupTypes = {};
for (var type in dg.sql.types) {
	var item = dg.sql.types[type];
	var group = (dg.sql.groupTypes[item.group] || []);
	group.push({
		text: item.name,
		value: type
	});
	dg.sql.groupTypes[item.group] = group;
}
