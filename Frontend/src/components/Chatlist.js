"use client"
import styles from "./Chat.module.css";

export default function ChatList({ chats, chatSeleccionadoId, onSelectChat }) {
	if (!chats || chats.length === 0) {
		return <p className={styles.vacio}>Todavía no tenés chats. Creá uno nuevo.</p>;
	}
 
	return (
		<div className={styles.lista}>
			{chats.map((chat) => (
				<ChatItem
					key={chat.id_chat}
					chat={chat}
					seleccionado={chat.id_chat === chatSeleccionadoId}
					onClick={onSelectChat}
				/>
			))}
		</div>
	);
}