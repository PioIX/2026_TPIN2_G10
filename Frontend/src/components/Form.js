import Button from "./Button";
import Title from "./Title";

export default function Form({ title, buttonText, onButtonClick, inputs = [] }) {
    return (
        <div className="form-container">
            <Title text={title} />
            <div className="form-fields">
                {inputs.map((inputProps, index) => (
                    <div>
                        <h3>Ingrese el {inputProps.name}</h3>
                        <input
                        //crear array de objetos
                        key={inputProps.id || index}
                        type={inputProps.type || "text"}
                        name={inputProps.name}
                        value={inputProps.value}
                        className="input-field"
                    />
                    </div>
                    
                ))}
            </div>
            <Button text={buttonText} onClick={onButtonClick} />
        </div>
    );
}