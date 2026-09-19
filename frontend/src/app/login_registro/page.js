"use client"
import Form from "@/components/Form"
import { useState } from "react"
import { useRouter } from "next/navigation"

// Ajustar esta URL si el backend corre en otro host/puerto,
// o mejor: usar process.env.NEXT_PUBLIC_BACKEND_URL desde un .env.local del frontend.
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

    // Guarda al usuario logueado/registrado para reenviarlo en las próximas requests
    // (enfoque simple sin JWT: el back devuelve el usuario y acá lo persistimos).
    function guardarUsuario(usuario) {
        localStorage.setItem("usuario", JSON.stringify(usuario));
    }

    async function HandleRegister(FormData) {
        setError(null);

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