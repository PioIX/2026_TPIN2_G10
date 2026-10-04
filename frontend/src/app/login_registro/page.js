"use client"

import Form from "@/components/Form"
import { useState } from "react"
import { useRouter } from "next/navigation"

// Idealmente usar process.env.NEXT_PUBLIC_BACKEND_URL desde un .env.local
const BACKEND_URL = "http://localhost:4000";

export default function LoginRegisterPage() {
    const router = useRouter();

    const [seccion, setSeccion] = useState("registro");
    const [error, setError] = useState(null);

    const registerInputs = [
        { id: "email", type: "email", placeholder: "email" },
        { id: "user", type: "text", placeholder: "username" },
        { id: "pass", type: "password", placeholder: "password" },
        { id: "image", type: "image", placeholder: "userimage" }
    ];

    const loginInputs = [
        { id: "email", type: "email", placeholder: "email" },
        { id: "pass", type: "password", placeholder: "password" }
    ];

    // Guarda al usuario logueado/registrado (sin JWT: el back lo devuelve y acá se persiste)
    function guardarUsuario(usuario) {
        localStorage.setItem("usuario", JSON.stringify(usuario));
    }

    async function HandleRegister(FormData) {
        setError(null);

        let registerdata = {
            email: FormData.get("email"),
            username: FormData.get("user"),
            password: FormData.get("pass"),
            // TODO: FormData.get("image") devuelve un File, pero el backend espera
            // "foto_perfil" como STRING (base64 o URL). Falta resolver:
            //   a) convertir el File a base64 (FileReader), o
            //   b) subirlo aparte y mandar la URL resultante.
            userimage: FormData.get("image")
        };

        try {
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

            if (!response.ok) {
                setError(data.error || "No se pudo completar el registro.");
                return;
            }

            guardarUsuario(data);
            router.push("/"); // ajustar a la ruta real de la lista de chats
        } catch (err) {
            console.log(err);
            setError("No se pudo conectar con el servidor.");
        }
    }

    async function HandleLogin(formdata) {
        setError(null);

        let logindata = {
            email: formdata.get("email"),
            password: formdata.get("pass")
        };

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: logindata.email,
                    contraseña: logindata.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Email o contraseña incorrectos.");
                return;
            }

            guardarUsuario(data);
            router.push("/"); // ajustar a la ruta real de la lista de chats
        } catch (err) {
            console.log(err);
            setError("No se pudo conectar con el servidor.");
        }
    }

    return (
        <>
        <div id="form-container">
            {seccion === "registro" ? (
                <Form
                    title="Registro de usuarios"
                    buttonText="Registrarse"
                    onButtonClick={HandleRegister}
                    inputs={registerInputs}
                />
            ) : (
                <Form
                    title="Iniciar sesión"
                    buttonText="Iniciar sesión"
                    onButtonClick={HandleLogin}
                    inputs={loginInputs}
                />
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button onClick={() => setSeccion(seccion === "registro" ? "login" : "registro")}>
                Cambiar a {seccion === "registro" ? "Iniciar sesión" : "Registro"}
            </button>
        </div>
        </>
    )
}