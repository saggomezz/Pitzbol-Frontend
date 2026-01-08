import { FiShield, FiEye, FiLock, FiDatabase, FiShare2, FiAlertCircle, FiMail } from "react-icons/fi";
import styles from "./politica-privacidad.module.css";

export default function PoliticaPrivacidad() {
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HEADER */}
                <div className={styles.header}>
                    <span className={styles.badge}>Actualizado Enero 2026</span>
                    <h1 className={styles.title}>
                        POLÍTICA DE <span className={styles.titleAccent}>PRIVACIDAD</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Tu privacidad es nuestra prioridad
                    </p>
                </div>

                {/* MAIN CARD */}
                <div className={styles.card}>
                    {/* INTRODUCCIÓN */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiShield />
                            </div>
                            Compromiso con tu privacidad
                        </div>
                        <div className={styles.content}>
                            <p>
                                En <strong>PITZBOL</strong>, respetamos y protegemos la privacidad de todos nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, compartimos y protegemos tu información personal cuando utilizas nuestra plataforma.
                            </p>
                        </div>
                    </section>

                    {/* INFORMACIÓN QUE RECOPILAMOS */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiEye />
                            </div>
                            Información que recopilamos
                        </div>
                        <div className={styles.content}>
                            <p>Para brindarte la mejor experiencia, recopilamos los siguientes tipos de información:</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>
                                    <strong>Información de cuenta:</strong> Nombre, correo electrónico, número de teléfono y contraseña cifrada.
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Información de uso:</strong> Interacciones con la plataforma, búsquedas realizadas, lugares favoritos y calendario de eventos.
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Información de ubicación:</strong> Con tu consentimiento, podemos acceder a tu ubicación para mostrarte lugares cercanos.
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo y cookies de sesión.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* CÓMO USAMOS TU INFORMACIÓN */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiDatabase />
                            </div>
                            Cómo usamos tu información
                        </div>
                        <div className={styles.content}>
                            <p>Utilizamos tu información personal para los siguientes propósitos:</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>
                                    Crear y gestionar tu cuenta de usuario
                                </li>
                                <li className={styles.listItem}>
                                    Personalizar tu experiencia en la plataforma
                                </li>
                                <li className={styles.listItem}>
                                    Proporcionar recomendaciones de lugares y eventos deportivos
                                </li>
                                <li className={styles.listItem}>
                                    Procesar tus favoritos y gestionar tu calendario
                                </li>
                                <li className={styles.listItem}>
                                    Mejorar nuestros servicios mediante análisis de uso
                                </li>
                                <li className={styles.listItem}>
                                    Comunicarnos contigo sobre actualizaciones y novedades
                                </li>
                                <li className={styles.listItem}>
                                    Garantizar la seguridad y prevenir fraudes
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* COMPARTIR INFORMACIÓN */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiShare2 />
                            </div>
                            Compartir información
                        </div>
                        <div className={styles.content}>
                            <p>
                                No vendemos ni alquilamos tu información personal a terceros. Solo compartimos información en los siguientes casos:
                            </p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>
                                    <strong>Proveedores de servicios:</strong> Con empresas que nos ayudan a operar la plataforma (hosting, análisis, soporte técnico).
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Socios comerciales:</strong> Con negocios y guías afiliados que aparecen en la plataforma, solo para facilitar tus reservas y consultas.
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* SEGURIDAD */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiLock />
                            </div>
                            Seguridad de tus datos
                        </div>
                        <div className={styles.content}>
                            <p>
                                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra accesos no autorizados, pérdida o alteración.
                            </p>
                            <div className={styles.highlight}>
                                <div className={styles.highlightTitle}>🔐 Medidas de seguridad implementadas:</div>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}>Cifrado de contraseñas mediante algoritmos seguros</li>
                                    <li className={styles.listItem}>Conexiones seguras HTTPS en toda la plataforma</li>
                                    <li className={styles.listItem}>Autenticación mediante Firebase Authentication</li>
                                    <li className={styles.listItem}>Monitoreo continuo de actividades sospechosas</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* TUS DERECHOS */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiAlertCircle />
                            </div>
                            Tus derechos
                        </div>
                        <div className={styles.content}>
                            <p>Como usuario de PITZBOL, tienes los siguientes derechos:</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>
                                    <strong>Acceso:</strong> Solicitar una copia de tu información personal
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Rectificación:</strong> Corregir información inexacta o incompleta
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Eliminación:</strong> Solicitar la eliminación de tu cuenta y datos personales
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado
                                </li>
                                <li className={styles.listItem}>
                                    <strong>Oposición:</strong> Oponerte al procesamiento de tus datos para ciertos fines
                                </li>
                            </ul>
                            <p style={{ marginTop: '1rem' }}>
                                Para ejercer cualquiera de estos derechos, contáctanos a través de nuestro correo de soporte.
                            </p>
                        </div>
                    </section>

                    {/* COOKIES */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiDatabase />
                            </div>
                            Uso de cookies
                        </div>
                        <div className={styles.content}>
                            <p>
                                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, recordar tus preferencias y analizar el uso de nuestra plataforma. Puedes gestionar tus preferencias de cookies desde la configuración de tu navegador.
                            </p>
                        </div>
                    </section>

                    {/* CONTACTO */}
                    <div className={styles.contactInfo}>
                        <div className={styles.contactTitle}>
                            <FiMail style={{ display: 'inline', marginRight: '0.5rem' }} />
                            ¿Dudas sobre tu privacidad?
                        </div>
                        <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                            Estamos aquí para ayudarte
                        </p>
                        <a href="mailto:pitzbol2026@gmail.com" className={styles.email}>
                            pitzbol2026@gmail.com
                        </a>
                    </div>

                    {/* FOOTER */}
                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            Esta política puede ser actualizada periódicamente para reflejar cambios en nuestras prácticas.
                        </p>
                        <span className={styles.updateDate}>
                            Última actualización: Enero 5, 2026
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
