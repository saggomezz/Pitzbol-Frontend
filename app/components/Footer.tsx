import Image from "next/image";
import Link from "next/link";
import imglogo from "./logoPitzbol.png";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="bg-[#F6F0E6] border-t border-[#1A4D2E]/10 pt-16 pb-8 px-6 md:px-20 text-[#1A4D2E]">
            {/* LADO IZQUIERDO: LOGO Y SIGNIFICADO */}
            <div className="lg:col-span-5 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                    <Image src={imglogo} alt="Pitzbol Logo" fill className="object-contain" />
                </div>
                <div className="flex flex-col gap-3">
                    <h2 className="text-3xl font-black uppercase leading-none" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                        PITZ<span className="text-[#F00808]">BOL</span>
                    </h2>
                    <p className="text-sm leading-relaxed text-[#1A4D2E]/80">
                        Nuestra identidad nace del <strong className="text-[#0D601E]">"Pitz"</strong>, término maya que consagra el juego de pelota como un acto ritual y cosmogónico. 
                        Más que un escudo, nuestro emblema es un diálogo visual entre el ancestral <span className="font-semibold italic">"Ollamaliztli"</span> —donde la vida y el cosmos se decidían en el campo— y la euforia del fútbol contemporáneo. 
                        Encarnamos el movimiento perpetuo de la esfera de caucho, una herencia de honor y comunidad que hoy, bajo nuestra bandera, vuelve a unir a México con el mundo.
                    </p>
                </div>
            </div>

            {/* LÍNEA FINAL */}
            <div className="mt-16 pt-8 border-t border-[#1A4D2E]/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#769C7B]">
                <p>© {currentYear} PITZBOL PROJECT - CAMINO AL MUNDIAL 2026</p>
                <div className="flex gap-6">
                    <Link href="#" className="hover:text-[#F00808] transition-colors">Política de privacidad</Link>
                </div>
            </div>
        </footer>
    );
}
