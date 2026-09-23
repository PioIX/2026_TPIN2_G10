"use client"
import styles from "./Message.module.css";
 
function formatearHora(fecha) {
	return new Date(fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
 
export default function Message({ mensaje, esPropio }) {
	return (
		<div className={`${styles.fila} ${esPropio ? styles.filaPropia : styles.filaAjena}`}>
			<div className={`${styles.burbuja} ${esPropio ? styles.burbujaPropia : styles.burbujaAjena}`}>
				{!esPropio && <span className={styles.autor}>{mensaje.usuario}</span>}
				<p className={styles.texto}>{mensaje.texto_contenido}</p>
				<span className={styles.hora}>{formatearHora(mensaje.fecha_envio)}</span>
			</div>
		</div>
	);
}
 

