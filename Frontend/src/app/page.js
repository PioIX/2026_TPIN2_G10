'use client';
 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
 
export default function Home() {
  const [usuario, setUsuario] = useState('');
  const [sala, setSala] = useState('');
  const router = useRouter();
 
  const camposCompletos = usuario !== '' && sala !== '';
 
  const handleEntrar = () => {
    if (!camposCompletos) return;
    router.push(`/chat?sala=${sala}&usuario=${usuario}`);
    };  
 
  return (
    <>
      <h1>Bienvenido al Chat</h1>
 
      <div>
        <label>
          Usuario:
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Ingresá tu nombre de usuario"
          />
        </label>
      </div>
 
      <div>
        <label>
          Sala:
          <input
            type="text"
            value={sala}
            onChange={(e) => setSala(e.target.value)}
            placeholder="Ingresá el nombre de la sala"
          />
        </label>
      </div>
 
      {camposCompletos && (
        <button onClick={handleEntrar}>
          Entrar al chat
        </button>
      )}
 
      {!camposCompletos && (
        <div>
          <button disabled>Entrar al chat</button>
          <p >
            Completá usuario y sala para poder entrar.
          </p>
        </div>
      )}
 
      <div >
        <Link href="/socket">Ir a la página de socket</Link>
      </div>
    </>
  );
}
 