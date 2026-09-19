/**
 * ================================================================
 * PIO CHAT - BACKEND (index.js)
 * ================================================================
 * Puerto: 4000
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mysql2 = require("mysql2"); // se usa solo para poder formatear/escapar queries de forma segura

const { realizarQuery } = require("./modulos/mysql");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

/**
 * -----------------------------------------------------------
 * Helper para poder usar "?" como placeholders en las queries,
 * ya que "realizarQuery" solo acepta un string ya armado.
 * mysql2.format() arma el string reemplazando los "?" por los
 * valores, escapándolos correctamente (evita inyección SQL).
 * -----------------------------------------------------------
 */
async function query(sql, params = []) {
	const queryString = mysql2.format(sql, params);
	return await realizarQuery(queryString);
}

/* ================================================================
 *  RUTA DE PRUEBA
 * ================================================================ */
app.get("/", (req, res) => {
	res.json({ mensaje: "entraste pa" });
});

/* ================================================================
 *  AUTENTICACIÓN: REGISTRO Y LOGIN
 * ================================================================ */

// POST /register
app.post("/register", async (req, res) => {
	try {
		const { usuario, email, contraseña, foto_perfil } = req.body;

		if (!usuario || !email || !contraseña) {
			return res.status(400).json({ error: "Faltan datos obligatorios (usuario, email, contraseña)." });
		}

		// Verificar que el email no esté ya registrado
		const existentes = await query("SELECT id_usuario FROM Usuarios WHERE email = ?", [email]);
		if (existentes.length > 0) {
			return res.status(409).json({ error: "Ya existe un usuario registrado con ese email." });
		}

		const resultado = await query(
			"INSERT INTO Usuarios (usuario, contraseña, email, foto_perfil) VALUES (?, ?, ?, ?)",
			[usuario, contraseña, email, foto_perfil || null]
		);

		const nuevoUsuario = {
			id_usuario: resultado.insertId,
			usuario,
			email,
			foto_perfil: foto_perfil || null,
		};

		return res.status(201).json(nuevoUsuario);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Error al registrar el usuario." });
	}
});

// POST /login
app.post("/login", async (req, res) => {
	try {
		const { email, contraseña } = req.body;

		if (!email || !contraseña) {
			return res.status(400).json({ error: "Faltan datos obligatorios (email, contraseña)." });
		}

		const usuarios = await query(
			"SELECT id_usuario, usuario, email, foto_perfil FROM Usuarios WHERE email = ? AND contraseña = ?",
			[email, contraseña]
		);

		if (usuarios.length === 0) {
			return res.status(401).json({ error: "Email o contraseña incorrectos." });
		}

		return res.status(200).json(usuarios[0]);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Error al iniciar sesión." });
	}
});

/* ================================================================
 *  CHATS
 * ================================================================ */

// GET /chats/:id_usuario  -> listado de chats del usuario logueado
app.get("/chats/:id_usuario", async (req, res) => {
	try {
		const { id_usuario } = req.params;

		// Chats en los que participa el usuario
		const chats = await query(
			`SELECT c.id_chat, c.nombre_chat, c.fecha_creacion, c.foto_chat
			 FROM Participantes p
			 JOIN Chats c ON c.id_chat = p.id_chat
			 WHERE p.id_usuario = ?
			 ORDER BY c.fecha_creacion DESC`,
			[id_usuario]
		);

		// Para los chats individuales (nombre_chat NULL) hay que buscar
		// los datos del OTRO participante para mostrar su nombre y foto.
		const chatsCompletos = await Promise.all(
			chats.map(async (chat) => {
				if (chat.nombre_chat) {
					// Chat grupal: se muestra tal cual
					return {
						id_chat: chat.id_chat,
						es_grupal: true,
						nombre: chat.nombre_chat,
						foto: chat.foto_chat || null,
						fecha_creacion: chat.fecha_creacion,
					};
				}

				// Chat individual: buscar al otro participante
				const otro = await query(
					`SELECT u.id_usuario, u.usuario, u.foto_perfil
					 FROM Participantes p
					 JOIN Usuarios u ON u.id_usuario = p.id_usuario
					 WHERE p.id_chat = ? AND p.id_usuario != ?
					 LIMIT 1`,
					[chat.id_chat, id_usuario]
				);

				const contacto = otro[0] || null;

				return {
					id_chat: chat.id_chat,
					es_grupal: false,
					nombre: contacto ? contacto.usuario : "Usuario desconocido",
					foto: contacto ? contacto.foto_perfil : null,
					id_contacto: contacto ? contacto.id_usuario : null,
					fecha_creacion: chat.fecha_creacion,
				};
			})
		);

		return res.status(200).json(chatsCompletos);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Error al obtener los chats." });
	}
});

// POST /chats -> crear (o reutilizar) un chat individual a partir del mail de otro usuario
app.post("/chats", async (req, res) => {
	try {
		const { id_usuario, email } = req.body;

		if (!id_usuario || !email) {
			return res.status(400).json({ error: "Faltan datos obligatorios (id_usuario, email)." });
		}

		const otroUsuario = await query("SELECT id_usuario, usuario, foto_perfil FROM Usuarios WHERE email = ?", [email]);

		if (otroUsuario.length === 0) {
			return res.status(404).json({ error: "No existe ningún usuario registrado con ese email." });
		}

		const idOtroUsuario = otroUsuario[0].id_usuario;

		if (Number(idOtroUsuario) === Number(id_usuario)) {
			return res.status(400).json({ error: "No podés crear un chat con vos mismo." });
		}

		// Ver si ya existe un chat individual entre ambos usuarios
		const chatExistente = await query(
			`SELECT c.id_chat
			 FROM Participantes p1
			 JOIN Participantes p2 ON p1.id_chat = p2.id_chat
			 JOIN Chats c ON c.id_chat = p1.id_chat
			 WHERE p1.id_usuario = ? AND p2.id_usuario = ? AND c.nombre_chat IS NULL
			 LIMIT 1`,
			[id_usuario, idOtroUsuario]
		);

		let idChat;

		if (chatExistente.length > 0) {
			idChat = chatExistente[0].id_chat;
		} else {
			const nuevoChat = await query(
				"INSERT INTO Chats (nombre_chat, fecha_creacion, foto_chat) VALUES (NULL, NOW(), NULL)"
			);
			idChat = nuevoChat.insertId;

			await query(
				`INSERT INTO Participantes (id_chat, id_usuario, fecha_ingreso) VALUES
				 (?, ?, NOW()), (?, ?, NOW())`,
				[idChat, id_usuario, idChat, idOtroUsuario]
			);
		}

		return res.status(201).json({
			id_chat: idChat,
			es_grupal: false,
			nombre: otroUsuario[0].usuario,
			foto: otroUsuario[0].foto_perfil,
			id_contacto: idOtroUsuario,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Error al crear el chat." });
	}
});

// POST /chats/grupo -> crear un chat grupal a partir de múltiples mails
app.post("/chats/grupo", async (req, res) => {
	try {
		const { id_usuario, nombre_chat, foto_chat, emails } = req.body;

		if (!id_usuario || !nombre_chat || !Array.isArray(emails) || emails.length === 0) {
			return res.status(400).json({ error: "Faltan datos obligatorios (id_usuario, nombre_chat, emails)." });
		}

		// Validar que todos los emails existan ANTES de crear nada
		const idsParticipantes = [];
		for (const email of emails) {
			const usuarios = await query("SELECT id_usuario FROM Usuarios WHERE email = ?", [email]);
			if (usuarios.length === 0) {
				return res.status(400).json({ error: `No existe ningún usuario registrado con el email: ${email}` });
			}
			idsParticipantes.push(usuarios[0].id_usuario);
		}

		// Crear el chat grupal
		const nuevoChat = await query(
			"INSERT INTO Chats (nombre_chat, fecha_creacion, foto_chat) VALUES (?, NOW(), ?)",
			[nombre_chat, foto_chat || null]
		);
		const idChat = nuevoChat.insertId;

		// Agregar al creador + a todos los participantes validados (sin duplicar al creador)
		const todosLosIds = [...new Set([Number(id_usuario), ...idsParticipantes.map(Number)])];

		const valoresParticipantes = todosLosIds.map((id) => [idChat, id, new Date()]);
		const placeholders = valoresParticipantes.map(() => "(?, ?, ?)").join(", ");
		const flatValues = valoresParticipantes.flat();

		await query(
			`INSERT INTO Participantes (id_chat, id_usuario, fecha_ingreso) VALUES ${placeholders}`,
			flatValues
		);

		return res.status(201).json({
			id_chat: idChat,
			es_grupal: true,
			nombre: nombre_chat,
			foto: foto_chat || null,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Error al crear el chat grupal." });
	}
});

/* ================================================================
 *  MENSAJES
 * ================================================================ */

// GET /mensajes/:id_chat -> historial de mensajes de un chat
app.get("/mensajes/:id_chat", async (req, res) => {
	try {
		const { id_chat } = req.params;

		const mensajes = await query(
			`SELECT m.id_mensaje, m.id_chat, m.id_usuario, u.usuario, u.foto_perfil,
			        m.texto_contenido, m.fecha_envio
			 FROM Mensajes m
			 JOIN Usuarios u ON u.id_usuario = m.id_usuario
			 WHERE m.id_chat = ?
			 ORDER BY m.fecha_envio ASC`,
			[id_chat]
		);

		return res.status(200).json(mensajes);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Error al obtener el historial de mensajes." });
	}
});

/* ================================================================
 *  SOCKET.IO -> comunicación en tiempo real dentro de un chat
 * ================================================================
 * Eventos que espera el frontend:
 *   - "unirseChat"  (id_chat)                -> se une a la room del chat
 *   - "salirChat"   (id_chat)                -> deja la room del chat
 *   - "enviarMensaje" ({id_chat, id_usuario, texto_contenido})
 *
 * Eventos que emite el backend:
 *   - "nuevoMensaje" (mensaje) -> a todos los conectados a esa room
 *   - "errorMensaje" (mensaje de error) -> solo al que envió
 * ================================================================ */
io.on("connection", (socket) => {
	console.log(`Cliente conectado: ${socket.id}`);

	// El cliente se une a la "room" del chat que tiene abierto
	socket.on("unirseChat", (id_chat) => {
		socket.join(`chat_${id_chat}`);
	});

	// El cliente deja el chat que tenía abierto (por ej. al cerrar la conversación)
	socket.on("salirChat", (id_chat) => {
		socket.leave(`chat_${id_chat}`);
	});

	// Envío de un mensaje nuevo
	socket.on("enviarMensaje", async ({ id_chat, id_usuario, texto_contenido }) => {
		try {
			if (!id_chat || !id_usuario || !texto_contenido || !texto_contenido.trim()) {
				socket.emit("errorMensaje", "Faltan datos para enviar el mensaje.");
				return;
			}

			const fechaEnvio = new Date();

			const resultado = await query(
				"INSERT INTO Mensajes (id_chat, id_usuario, texto_contenido, fecha_envio) VALUES (?, ?, ?, ?)",
				[id_chat, id_usuario, texto_contenido, fechaEnvio]
			);

			// Se busca el nombre del usuario para armar el mensaje completo
			const usuarioRows = await query("SELECT usuario, foto_perfil FROM Usuarios WHERE id_usuario = ?", [id_usuario]);

			const mensajeCompleto = {
				id_mensaje: resultado.insertId,
				id_chat,
				id_usuario,
				usuario: usuarioRows[0]?.usuario || null,
				foto_perfil: usuarioRows[0]?.foto_perfil || null,
				texto_contenido,
				fecha_envio: fechaEnvio,
			};

			// Se emite a TODOS los participantes conectados a esa room (incluido quien lo envió,
			// así el mensaje se muestra igual en todos los clientes con ese chat abierto)
			io.to(`chat_${id_chat}`).emit("nuevoMensaje", mensajeCompleto);
		} catch (error) {
			console.log(error);
			socket.emit("errorMensaje", "Error al enviar el mensaje.");
		}
	});

	socket.on("disconnect", () => {
		console.log(`Cliente desconectado: ${socket.id}`);
	});
});

/* ================================================================
 *  LEVANTAR SERVIDOR
 * ================================================================ */
server.listen(PORT, () => {
	console.log(`Servidor Pio Chat escuchando en el puerto ${PORT}`);
});