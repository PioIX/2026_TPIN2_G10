-- 1. Tabla Usuarios
CREATE TABLE Usuarios(
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- 2. Tabla Chats
CREATE TABLE Chats (
    id_chat INT AUTO_INCREMENT PRIMARY KEY,
    nombre_chat VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla Participantes
CREATE TABLE Participantes (
    id_chat INT,
    id_usuario INT,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_salida TIMESTAMP NULL,
    PRIMARY KEY (id_chat, id_usuario),
    FOREIGN KEY (id_chat) REFERENCES Chats(id_chat),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- 4. Tabla Mensajes
CREATE TABLE Mensajes (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_chat INT,
    id_usuario INT,
    texto_contenido TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_chat) REFERENCES Chats(id_chat),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);