"use client"
import Form from "@/components/Form"
export default function LoginPage() {
    const formInputs = [
        { id: "email", type: "email", value: "email" },
        { id: "pass", type: "password", value: "password" }
    ];


    return (
        <>
            <Form
                title="Inicio de sesion"
                buttonText="Iniciar sesion"
                onButtonClick="Handlelogin"
                inputs={formInputs}
        
        />



        </>
    )



}