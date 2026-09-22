"use client"
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import ChatList from "@/components/Chat";
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
	const [foto, setFoto] = useState(null); // ver TODO más abajo
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
					// TODO: igual que con la foto de perfil del registro, el backend espera
					// "foto_chat" como STRING (base64 o URL), no el File crudo que devuelve
					// el <input type="file">. Falta resolver la conversión/subida acá.
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
	const [usuario, setUsuario] = useState(null);
	const [chats, setChats] = useState([]);
	const [chatSeleccionado, setChatSeleccionado] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const usuarioGuardado = localStorage.getItem("usuario");
		if (!usuarioGuardado) {
			router.push("/login_registro");
			return;
		}
		setUsuario(JSON.parse(usuarioGuardado));
	}, [router]);

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

	function handleChatCreado(nuevoChat) {
		setChats((prev) => {
			const yaExiste = prev.some((c) => c.id_chat === nuevoChat.id_chat);
			return yaExiste ? prev : [nuevoChat, ...prev];
		});
		setChatSeleccionado(nuevoChat);
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
					// TODO (Ejercicio 5): acá va el historial de mensajes + input para
					// enviar mensajes en tiempo real con Socket.IO, usando chatSeleccionado.id_chat.
					<div className={styles.placeholder}>
						<h2>{chatSeleccionado.nombre}</h2>
						<p>Acá se va a mostrar la conversación (Ejercicio 5).</p>
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