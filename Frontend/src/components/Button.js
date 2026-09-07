export default function Button({ onClick, text }) {
    return (
        <button onClick={onClick} className="btn">
            {text}
        </button>
    );
}