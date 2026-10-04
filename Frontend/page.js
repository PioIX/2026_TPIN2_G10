// =====================================================================
// CONSIGNA: Ejercicio 3 — Frontend: Login y Registro
// Este archivo es la página de login y registro (3-a y 3-b).
// Los comentarios "CONSIGNA" indican qué punto del PDF cumple cada parte.
// =====================================================================

// NOTA (Introducción del PDF): todo archivo que use hooks (useState, useEffect,
// useSocket) debe comenzar con "use client".
"use client";

// CONSIGNA 3-d: "Crear o reutilizar los componentes que vea necesario.
// Como mínimo crear componentes Input y Button."
// Form es el componente reutilizable. Verificar que internamente use los
// componentes Input y Button, porque el PDF pide que existan.
import Form from "@/components/Form";
import { useState } from "react";
import { useRouter } from "next/navigation";

// CONSIGNA (Modalidad): "Backend: propio de cada grupo. Corre en el puerto 4000."
// Por eso la URL apunta a localhost:4000.
// Ajustar esta URL si el backend corre en otro host/puerto,
// o mejor: usar process.env.NEXT_PUBLIC_BACKEND_URL desde un .env.local del frontend.
const BACKEND_URL = "http://localhost:4000";

export default function LoginRegisterPage() {
  const router = useRouter();

  // CONSIGNA 3-b: "(puede ser la misma página que cambie con conditional
  // rendering si el usuario selecciona 'Registrarse')".
  // El estado "seccion" decide si se muestra el registro o el login.
  const [seccion, setSeccion] = useState("registro");
  const [error, setError] = useState(null);

  // CONSIGNA 3-b: Registro con username, mail, password y una foto del contacto.
  const registerInputs = [
    { id: "email", type: "email", placeholder: "email" },
    { id: "user", type: "text", placeholder: "username" },
    { id: "pass", type: "password", placeholder: "password" },
    { id: "image", type: "image", placeholder: "userimage" },
  ];

  // CONSIGNA 3-a: "Página Login con mail y password."
  const loginInputs = [
    { id: "email", type: "email", placeholder: "email" },
    { id: "pass", type: "password", placeholder: "password" },
  ];

  // CONSIGNA 3-c: "...guardar al usuario logueado/registrado."
  // Guarda al usuario logueado/registrado para reenviarlo en las próximas requests
  // (enfoque simple sin JWT: el back devuelve el usuario y acá lo persistimos).
  // Se usa después en el Ejercicio 4 para pedir la lista de chats de este usuario.
  function guardarUsuario(usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
  }

  // CONSIGNA 3-b: lógica del REGISTRO.
  // CONSIGNA 3-c: valida contra el backend (llama a POST /register, que pide el
  // Ejercicio 2-b) y guarda al usuario registrado.
  async function HandleRegister(FormData) {
    setError(null);

    // CONSIGNA 3-b: los 4 datos del registro (username, mail, password, foto).
    let registerdata = {
      email: FormData.get("email"),
      username: FormData.get("user"),
      password: FormData.get("pass"),
      // TODO: FormData.get("image") devuelve un File (o lo que arme el componente Form
      // para el input tipo "image"). El endpoint POST /register del backend espera
      // "foto_perfil" como un STRING (por ejemplo, base64 o una URL ya subida a algún
      // lado), no un File crudo. Falta decidir e implementar acá:
      //   a) convertir el File a base64 (FileReader) antes de mandarlo, o
      //   b) subirlo aparte (multipart/form-data) a un endpoint que devuelva una URL,
      //      y mandar esa URL como foto_perfil.
      // Por ahora se manda tal cual llega (probablemente no funcione hasta resolver esto).
      // (Este TODO no viene del PDF: lo agregó el grupo.)
      userimage: FormData.get("image"),
    };

    try {
      // CONSIGNA 2-b: endpoint "POST /register" del backend.
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: registerdata.username,
          email: registerdata.email,
          contraseña: registerdata.password,
          foto_perfil: registerdata.userimage, // ver TODO de arriba
        }),
      });

      const data = await response.json();

      // CONSIGNA 3-c: si el backend rechaza el registro, se muestra el error
      // y no se avanza.
      if (!response.ok) {
        setError(data.error || "No se pudo completar el registro.");
        return;
      }

      // CONSIGNA 3-c: "guardar al usuario logueado/registrado".
      guardarUsuario(data);
      // CONSIGNA Ejercicio 4: tras registrarse se pasa a la lista de chats.
      router.push("/"); // ajustar a la ruta real de la lista de chats
    } catch (err) {
      console.log(err);
      setError("No se pudo conectar con el servidor.");
    }
  }

  // CONSIGNA 3-a: lógica del LOGIN (mail y password).
  // CONSIGNA 3-c: valida contra el backend (llama a POST /login, que pide el
  // Ejercicio 2-b) y guarda al usuario logueado.
  async function HandleLogin(formdata) {
    setError(null);

    // CONSIGNA 3-a: solo mail y password.
    let logindata = {
      email: formdata.get("email"),
      password: formdata.get("pass"),
    };

    try {
      // CONSIGNA 2-b: endpoint "POST /login" del backend.
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: logindata.email,
          contraseña: logindata.password,
        }),
      });

      const data = await response.json();

      // CONSIGNA 3-c: "Validar las credenciales contra el backend".
      // Si son incorrectas, se muestra el error y no se avanza.
      // (El backend debe responder con un status de error real, por ej. 401.)
      if (!response.ok) {
        setError(data.error || "Email o contraseña incorrectos.");
        return;
      }

      // CONSIGNA 3-c: "guardar al usuario logueado/registrado".
      guardarUsuario(data);
      // CONSIGNA Ejercicio 4: tras loguearse se pasa a la lista de chats.
      router.push("/"); // ajustar a la ruta real de la lista de chats
    } catch (err) {
      console.log(err);
      setError("No se pudo conectar con el servidor.");
    }
  }

  return (
    <>
      <div id="form-container">
        {/* CONSIGNA 3-b: conditional rendering entre Registro y Login. */}
        {seccion === "registro" ? (
          // CONSIGNA 3-b: formulario de Registro.
          <Form
            title="Registro de usuarios"
            buttonText="Registrarse"
            onButtonClick={HandleRegister}
            inputs={registerInputs}
          />
        ) : (
          // CONSIGNA 3-a: formulario de Login.
          <Form
            title="Iniciar sesión"
            buttonText="Iniciar sesión"
            onButtonClick={HandleLogin}
            inputs={loginInputs}
          />
        )}

        {/* Mensaje de error de la validación (3-c). */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* CONSIGNA 3-b: botón que cambia entre "Registrarse" e "Iniciar sesión". */}
        <button
          onClick={() =>
            setSeccion(seccion === "registro" ? "login" : "registro")
          }
        >
          Cambiar a {seccion === "registro" ? "Iniciar sesión" : "Registro"}
        </button>
      </div>
    </>
  );
}
