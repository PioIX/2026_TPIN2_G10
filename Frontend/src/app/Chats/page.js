"use client"
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

import ChatList from "@/components/Chat";
import Message from "@/components/Message";
import { useSocket } from "@/hooks/useSocket";
import styles from "./chats.module.css";

const BACKEND_URL = "http://localhost:4000";

/* ------------------------------------------------------------------ */
/* Popup: crear chat individual a partir de un email                  */
/* ------------------------------------------------------------------ */
function NuevoChatPopup({ idUsuario, onChatCreado }) {
	const popupRef = useRef();
	const [email, setEmail] = useState("");
	const [error, setError] = useState(null);
	const [cargando, setCargando] = useState(false);

	function limpiarYCerrar() {
		setEmail("");
		setError(null);
		popupRef.current?.close();
	}

	async function handleCrear() {
		if (!email.trim()) {
			setError("Ingresá un email.");
			return;
		}
		setCargando(true);
		setError(null);
		try {
			const response = await fetch(`${BACKEND_URL}/chats`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id_usuario: idUsuario, email: email.trim() }),
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.error || "No se pudo crear el chat.");
				return;
			}
			onChatCreado(data);
			limpiarYCerrar();
		} catch (err) {
			console.log(err);
			setError("No se pudo conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	}

	return (
		<Popup
			ref={popupRef}
			trigger={<button className={styles.botonAbrir}>+ Nuevo chat</button>}
			modal
			onClose={() => { setEmail(""); setError(null); }}
		>
			<div className={styles.popupContenido}>
				<h3>Nuevo chat</h3>
				<input
					type="email"
					className={styles.input}
					placeholder="Email del contacto"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				{error && <p className={styles.error}>{error}</p>}
				<button className={styles.botonAccion} onClick={handleCrear} disabled={cargando}>
					{cargando ? "Creando..." : "Crear chat"}
				</button>
			</div>
		</Popup>
	);
}

/* ------------------------------------------------------------------ */
/* Popup: crear chat grupal con múltiples emails, nombre y foto       */
/* ------------------------------------------------------------------ */
function NuevoGrupoPopup({ idUsuario, onChatCreado }) {
	const popupRef = useRef();
	const [nombreChat, setNombreChat] = useState("");
	const [emailsTexto, setEmailsTexto] = useState("");
	const [foto, setFoto] = useState(null);
	const [error, setError] = useState(null);
	const [cargando, setCargando] = useState(false);

	function limpiarYCerrar() {
		setNombreChat("");
		setEmailsTexto("");
		setFoto(null);
		setError(null);
		popupRef.current?.close();
	}

	async function handleCrear() {
		const emails = emailsTexto.split(",").map((e) => e.trim()).filter((e) => e.length > 0);

		if (!nombreChat.trim()) {
			setError("Ingresá un nombre para el grupo.");
			return;
		}
		if (emails.length === 0) {
			setError("Ingresá al menos un email, separados por coma.");
			return;
		}

		setCargando(true);
		setError(null);
		try {
			const response = await fetch(`${BACKEND_URL}/chats/grupo`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id_usuario: idUsuario,
					nombre_chat: nombreChat.trim(),
					// TODO: el backend espera "foto_chat" como STRING (base64 o URL), no el
					// File crudo del <input type="file">. JSON.stringify de un File da {},
					// así que la foto no llega. Falta resolver la conversión/subida.
					foto_chat: foto,
					emails,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.error || "No se pudo crear el grupo.");
				return;
			}
			onChatCreado(data);
			limpiarYCerrar();
		} catch (err) {
			console.log(err);
			setError("No se pudo conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	}

	return (
		<Popup
			ref={popupRef}
			trigger={<button className={styles.botonAbrir}>+ Nuevo grupo</button>}
			modal
			onClose={() => { setNombreChat(""); setEmailsTexto(""); setFoto(null); setError(null); }}
		>
			<div className={styles.popupContenido}>
				<h3>Nuevo grupo</h3>
				<input
					type="text"
					className={styles.input}
					placeholder="Nombre del grupo"
					value={nombreChat}
					onChange={(e) => setNombreChat(e.target.value)}
				/>
				<textarea
					className={styles.textarea}
					placeholder="Emails de los integrantes, separados por coma"
					value={emailsTexto}
					onChange={(e) => setEmailsTexto(e.target.value)}
				/>
				<input
					type="file"
					accept="image/*"
					className={styles.input}
					onChange={(e) => setFoto(e.target.files[0])}
				/>
				{error && <p className={styles.error}>{error}</p>}
				<button className={styles.botonAccion} onClick={handleCrear} disabled={cargando}>
					{cargando ? "Creando..." : "Crear grupo"}
				</button>
			</div>
		</Popup>
	);
}

/* ------------------------------------------------------------------ */
/* Página principal de chats                                          */
/* ------------------------------------------------------------------ */
export default function ChatsPage() {
	const router = useRouter();

	const { socket, isConnected } = useSocket();
	const [usuario, setUsuario] = useState(null);
	const [chats, setChats] = useState([]);
	const [chatSeleccionado, setChatSeleccionado] = useState(null);
	const [mensajes, setMensajes] = useState([]);
	const [textoNuevoMensaje, setTextoNuevoMensaje] = useState("");
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const finMensajesRef = useRef(null);

	// Lee al usuario guardado en el login; si no hay, vuelve al login/registro
	useEffect(() => {
		const usuarioGuardado = localStorage.getItem("usuario");
		if (!usuarioGuardado) {
			router.push("/login_registro");
			return;
		}
		setUsuario(JSON.parse(usuarioGuardado));
	}, [router]);

	// Carga la lista de chats del usuario desde el backend
	useEffect(() => {
		if (!usuario) return;

		async function cargarChats() {
			try {
				setCargando(true);
				const response = await fetch(`${BACKEND_URL}/chats/${usuario.id_usuario}`);
				const data = await response.json();
				if (!response.ok) {
					setError(data.error || "No se pudieron cargar los chats.");
					return;
				}
				setChats(data);
			} catch (err) {
				console.log(err);
				setError("No se pudo conectar con el servidor.");
			} finally {
				setCargando(false);
			}
		}

		cargarChats();
	}, [usuario]);

	// Carga el historial cada vez que se selecciona un chat distinto
	useEffect(() => {
		if (!chatSeleccionado) {
			setMensajes([]);
			return;
		}

		async function cargarHistorial() {
			try {
				const response = await fetch(`${BACKEND_URL}/mensajes/${chatSeleccionado.id_chat}`);
				const data = await response.json();
				setMensajes(response.ok ? data : []);
			} catch (err) {
				console.log(err);
				setMensajes([]);
			}
		}

		cargarHistorial();
	}, [chatSeleccionado]);

	// Se une a la room del chat seleccionado y escucha sus mensajes nuevos
	useEffect(() => {
		if (!socket || !chatSeleccionado) return;

		socket.emit("unirseChat", chatSeleccionado.id_chat);

		function handleNuevoMensaje(mensaje) {
			if (mensaje.id_chat === chatSeleccionado.id_chat) {
				setMensajes((prev) => [...prev, mensaje]);
			}
		}

		socket.on("nuevoMensaje", handleNuevoMensaje);

		return () => {
			socket.emit("salirChat", chatSeleccionado.id_chat);
			socket.off("nuevoMensaje", handleNuevoMensaje);
		};
	}, [socket, chatSeleccionado]);

	// Scroll automático al último mensaje
	useEffect(() => {
		finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [mensajes]);

	// Agrega el chat nuevo a la lista (sin duplicar) y lo abre
	function handleChatCreado(nuevoChat) {
		setChats((prev) => {
			const yaExiste = prev.some((c) => c.id_chat === nuevoChat.id_chat);
			return yaExiste ? prev : [nuevoChat, ...prev];
		});
		setChatSeleccionado(nuevoChat);
	}

	function handleEnviarMensaje(e) {
		e.preventDefault();
		if (!textoNuevoMensaje.trim() || !chatSeleccionado || !socket) return;

		socket.emit("enviarMensaje", {
			id_chat: chatSeleccionado.id_chat,
			id_usuario: usuario.id_usuario,
			texto_contenido: textoNuevoMensaje.trim(),
		});

		setTextoNuevoMensaje("");
	}

	if (!usuario) return null;

	return (
		<div className={styles.container}>
			<aside className={styles.sidebar}>
				<div className={styles.header}>
					<span className={styles.tituloApp}>Pio Chat</span>
					<div className={styles.botones}>
						<NuevoChatPopup idUsuario={usuario.id_usuario} onChatCreado={handleChatCreado} />
						<NuevoGrupoPopup idUsuario={usuario.id_usuario} onChatCreado={handleChatCreado} />
					</div>
				</div>

				{cargando && <p className={styles.mensaje}>Cargando chats...</p>}
				{error && <p className={styles.mensajeError}>{error}</p>}

				{!cargando && !error && (
					<ChatList
						chats={chats}
						chatSeleccionadoId={chatSeleccionado?.id_chat}
						onSelectChat={setChatSeleccionado}
					/>
				)}
			</aside>

			<main className={styles.chatWindow}>
				{chatSeleccionado ? (
					<div className={styles.conversacion}>
						<div className={styles.encabezadoChat}>
							{/* /default-avatar.png tiene que existir en frontend/public */}
							<img
								className={styles.fotoEncabezado}
								src={chatSeleccionado.foto || "/default-avatar.png"}
								alt={chatSeleccionado.nombre}
								onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
							/>
							<h2 className={styles.nombreEncabezado}>{chatSeleccionado.nombre}</h2>
							{!isConnected && <span className={styles.avisoDesconectado}>Reconectando...</span>}
						</div>

						<div className={styles.listaMensajes}>
							{mensajes.map((mensaje) => (
								<Message
									key={mensaje.id_mensaje}
									mensaje={mensaje}
									esPropio={mensaje.id_usuario === usuario.id_usuario}
								/>
							))}
							<div ref={finMensajesRef} />
						</div>

						<form className={styles.formEnvio} onSubmit={handleEnviarMensaje}>
							<input
								type="text"
								className={styles.inputMensaje}
								placeholder="Escribí un mensaje..."
								value={textoNuevoMensaje}
								onChange={(e) => setTextoNuevoMensaje(e.target.value)}
							/>
							<button type="submit" className={styles.botonEnviar}>Enviar</button>
						</form>
					</div>
				) : (
					<div className={styles.placeholder}>
						<p>Seleccioná un chat para comenzar, o creá uno nuevo.</p>
					</div>
				)}
			</main>
		</div>
	);
}