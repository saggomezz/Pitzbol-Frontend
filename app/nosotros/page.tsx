import Link from "next/link";
import { FiTarget, FiEye, FiHeart, FiUsers, FiGlobe, FiTrendingUp, FiAward, FiMapPin } from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi";
import styles from "./nosotros.module.css";

export default function Nosotros() {
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HERO SECTION */}
                <div className={styles.hero}>
                    <span className={styles.badge}>Camino al Mundial 2026</span>
                    <h1 className={styles.title}>
                        SOBRE <span className={styles.titleAccent}>PITZBOL</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Conectando el pasado maya con el futuro del fútbol mundial
                    </p>
                </div>

                {/* MISSION & VISION */}
                <div className={styles.missionVision}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <div className={styles.icon}>
                                <FiTarget />
                            </div>
                            Nuestra Misión
                        </h2>
                        <div className={styles.cardContent}>
                            <p>
                                En <strong>PITZBOL</strong>, nuestra misión es transformar la experiencia de los aficionados al fútbol durante el Mundial 2026 en México. 
                                Creamos conexiones significativas entre los visitantes y la rica cultura deportiva mexicana, facilitando el descubrimiento de lugares emblemáticos, 
                                experiencias auténticas y eventos únicos que celebran nuestra herencia futbolística.
                            </p>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <div className={styles.icon}>
                                <FiEye />
                            </div>
                            Nuestra Visión
                        </h2>
                        <div className={styles.cardContent}>
                            <p>
                                Ser la plataforma líder que une la pasión por el fútbol con el turismo cultural en México, 
                                posicionándonos como el puente esencial entre los visitantes internacionales y las experiencias locales auténticas. 
                                Aspiramos a que cada aficionado que visite México viva una experiencia inolvidable que trascienda el estadio.
                            </p>
                        </div>
                    </div>
                </div>

                {/* STORY SECTION */}
                <div className={styles.story}>
                    <h2 className={styles.storyTitle}>Nuestra Historia</h2>
                    <div className={styles.storyContent}>
                        <p>
                            <strong>PITZBOL</strong> nace de una visión profunda que conecta dos mundos: el antiguo juego de pelota maya, 
                            el <em>"Pitz"</em>, y el fútbol moderno que apasiona al planeta entero. Nuestro nombre no es casualidad; 
                            es un homenaje a la rica tradición deportiva mesoamericana que veía en el juego un acto sagrado, 
                            un ritual que unía comunidades y celebraba la vida.
                        </p>
                        
                        <div className={styles.highlight}>
                            "Más que un escudo, nuestro emblema es un diálogo visual entre el ancestral Ollamaliztli 
                            —donde la vida y el cosmos se decidían en el campo— y la euforia del fútbol contemporáneo."
                        </div>

                        <p>
                            Con la llegada del Mundial 2026, vimos una oportunidad única: crear una plataforma que no solo 
                            guiara a los visitantes hacia los estadios, sino que los sumergiera en la experiencia cultural 
                            completa que México tiene para ofrecer. Cada partido es una puerta de entrada a la gastronomía, 
                            el arte, la música y las tradiciones que hacen de nuestro país un destino extraordinario.
                        </p>

                        <p>
                            Desarrollada por estudiantes del CETI Colomos comprometidos con la innovación tecnológica y el 
                            orgullo nacional, PITZBOL representa el movimiento perpetuo de la esfera de caucho: una herencia 
                            de honor y comunidad que hoy, bajo nuestra bandera digital, vuelve a unir a México con el mundo.
                        </p>
                    </div>
                </div>

                {/* VALUES SECTION */}
                <div className={styles.values}>
                    <h2 className={styles.valuesTitle}>Nuestros Valores</h2>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiHeart />
                            </div>
                            <h3 className={styles.valueTitle}>Pasión</h3>
                            <p className={styles.valueDescription}>
                                Amamos el fútbol y nuestra cultura. Esta pasión impulsa cada funcionalidad de nuestra plataforma.
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiGlobe />
                            </div>
                            <h3 className={styles.valueTitle}>Inclusión</h3>
                            <p className={styles.valueDescription}>
                                Creemos en un fútbol que une a todas las personas, sin importar su origen o idioma.
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiAward />
                            </div>
                            <h3 className={styles.valueTitle}>Excelencia</h3>
                            <p className={styles.valueDescription}>
                                Nos esforzamos por ofrecer la mejor experiencia posible en cada interacción.
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <GiSoccerBall />
                            </div>
                            <h3 className={styles.valueTitle}>Tradición</h3>
                            <p className={styles.valueDescription}>
                                Honramos nuestras raíces mientras abrazamos el futuro del deporte.
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiUsers />
                            </div>
                            <h3 className={styles.valueTitle}>Comunidad</h3>
                            <p className={styles.valueDescription}>
                                Construimos puentes entre visitantes y locales para crear conexiones auténticas.
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiTrendingUp />
                            </div>
                            <h3 className={styles.valueTitle}>Innovación</h3>
                            <p className={styles.valueDescription}>
                                Utilizamos tecnología de vanguardia para mejorar constantemente nuestra plataforma.
                            </p>
                        </div>
                    </div>
                </div>

                {/* TEAM & STATS SECTION */}
                <div className={styles.team}>
                    <h2 className={styles.teamTitle}>El Equipo PITZBOL</h2>
                    <p className={styles.teamDescription}>
                        Somos un equipo de estudiantes apasionados del CETI Colomos, unidos por el amor al fútbol 
                        y el orgullo por México. Nuestro proyecto nace del deseo de mostrar al mundo la riqueza 
                        cultural de nuestro país durante el Mundial 2026.
                    </p>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <div className={styles.statNumber}>2026</div>
                            <div className={styles.statLabel}>Año del Mundial</div>
                        </div>
                        <div className={styles.stat}>
                            <div className={styles.statNumber}>100+</div>
                            <div className={styles.statLabel}>Lugares Destacados</div>
                        </div>
                        <div className={styles.stat}>
                            <div className={styles.statNumber}>3</div>
                            <div className={styles.statLabel}>Países Anfitriones</div>
                        </div>
                    </div>
                </div>

                {/* CTA SECTION */}
                <div className={styles.cta}>
                    <h2 className={styles.ctaTitle}>Únete a la Experiencia</h2>
                    <p className={styles.ctaDescription}>
                        Descubre todo lo que México tiene para ofrecer durante el Mundial 2026
                    </p>
                    <Link href="/mapa" className={styles.ctaButton}>
                        <FiMapPin />
                        Explorar Lugares
                    </Link>
                </div>
            </div>
        </div>
    );
}
