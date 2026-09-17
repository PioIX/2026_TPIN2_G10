"use client"
import Form from "@/components/Form"
export default function LoginPage() {
    
    const formInputs = [
        { id: "email", type: "email", placeholder: "email" },
        { id: "user", type: "text", placeholder: "username" },
        { id: "pass", type: "password", placeholder: "password" },
        { id: "image", type: "image", placeholder: "userimage" }
    ];


    return (
        <>
            <Form
                title="Registro de usuarios"
                buttonText="Registrarse"
                onButtonClick="HandleRegister"
                inputs={formInputs}
        
        />



        </>
    )



}