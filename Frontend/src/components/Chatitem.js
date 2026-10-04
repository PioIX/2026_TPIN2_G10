"use client"
import styles from "./Chat.module.css";

const FOTO_POR_DEFECTO = "/default-avatar.png";

export function ChatItem({ chat, seleccionado, onClick }) {
	return (
		<div
			className={`${styles.chatItem} ${seleccionado ? styles.seleccionado : ""}`}
			onClick={() => onClick(chat)}
		>
			{/* Si no hay foto o falla la carga, se usa la foto por defecto */}
			<img
				className={styles.foto}
				src={chat.foto || FOTO_POR_DEFECTO}
				alt={chat.nombre}
				onError={(e) => { e.currentTarget.src = FOTO_POR_DEFECTO; }}
			/>
			<div className={styles.info}>
				<span className={styles.nombre}>
					{chat.nombre}
					{chat.es_grupal && <span className={styles.badgeGrupo}>Grupo</span>}
				</span>
			</div>
		</div>
	);
}