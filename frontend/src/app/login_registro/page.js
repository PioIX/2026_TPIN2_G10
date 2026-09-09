"use client"
import Form from "@/components/Form"
export default function LoginRegisterPage() {
    
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

    let seccion = "registro";

    function HandleRegister(FormData) {
        let registerdata = {
            email: FormData.get("email"),
            username: FormData.get("user"),
            password: FormData.get("pass"),
            userimage: FormData.get("image")
        };
        console.log(registerdata);
    }

    function HandleLogin(formdata) {
        let logindata = {
            email: formdata.get("email"),
            password: formdata.get("pass")
        };
        console.log(logindata);
        fetch
    }
    return (
        <>
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
            <button onClick={() => (seccion = seccion === "registro" ? "login" : "registro")}>
                Cambiar a {seccion === "registro" ? "Iniciar sesión" : "Registro"}
            </button>
        </>
    )
}