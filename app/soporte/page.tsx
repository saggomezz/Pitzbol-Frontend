"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    FiArrowRight,
    FiCheck,
    FiMail,
    FiPhone,
    FiAlertCircle,
    FiChevronDown,
    FiHelpCircle,
    FiTool,
    FiUser,
    FiBriefcase,
    FiMessageCircle,
    FiFlag
} from "react-icons/fi";
import styles from "./soporte.module.css";

const ALL_COUNTRIES = [
  { name: "Alemania", lada: "+49" }, { name: "Argentina", lada: "+54" },
  { name: "Australia", lada: "+61" }, { name: "Brasil", lada: "+55" },
  { name: "Canadá", lada: "+1" }, { name: "Chile", lada: "+56" },
  { name: "Colombia", lada: "+57" }, { name: "Corea del Sur", lada: "+82" },
  { name: "Dinamarca", lada: "+45" }, { name: "España", lada: "+34" },
  { name: "Estados Unidos", lada: "+1" }, { name: "Francia", lada: "+33" },
  { name: "Italia", lada: "+39" }, { name: "Japón", lada: "+81" },
  { name: "México", lada: "+52" }, { name: "Países Bajos", lada: "+31" },
  { name: "Perú", lada: "+51" }, { name: "Portugal", lada: "+351" },
  { name: "Reino Unido", lada: "+44" }, { name: "Uruguay", lada: "+598" },
].sort((a, b) => a.name.localeCompare(b.name));

const CATEGORIAS_CONSULTA = [
    { id: "general", label: "Consulta General", icon: FiHelpCircle, color: "#0D601E" },
    { id: "tecnico", label: "Problema Técnico", icon: FiTool, color: "#F00808" },
    { id: "cuenta", label: "Mi Cuenta", icon: FiUser, color: "#1A4D2E" },
    { id: "negocio", label: "Alianzas Comerciales", icon: FiBriefcase, color: "#B90808" },
    { id: "sugerencia", label: "Sugerencia", icon: FiMessageCircle, color: "#769C7B" },
    { id: "otro", label: "Otro", icon: FiFlag, color: "#4A4A4A" },
];

interface FormData {
    name: string;
    email: string;
    countryCode: string;
    phone: string;
    category: string;
    subject: string;
    message: string;
}

interface CallRequestData {
    name: string;
    countryCode: string;
    phone: string;
    reason: string;
}

export default function SoportePage() {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        countryCode: "+52",
        phone: "",
        category: "",
        subject: "",
        message: ""
    });
    const [callRequestData, setCallRequestData] = useState<CallRequestData>({
        name: "",
        countryCode: "+52",
        phone: "",
        reason: ""
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCallSubmitted, setIsCallSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCallLoading, setIsCallLoading] = useState(false);
    const [error, setError] = useState("");
    const [callError, setCallError] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [activeTab, setActiveTab] = useState<"message" | "call">("message");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCallInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCallRequestData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setFormData(prev => ({
            ...prev,
            category: categoryId
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validación básica
        if (!formData.name || !formData.email || !formData.phone || !formData.category || !formData.subject || !formData.message) {
            setError("Por favor, completa todos los campos.");
            setIsLoading(false);
            return;
        }

        // Simular envío (reemplazar con tu endpoint real)
        setTimeout(() => {
            setIsSubmitted(true);
            setFormData({ name: "", email: "", countryCode: "+52", phone: "", category: "", subject: "", message: "" });
            setSelectedCategory("");
            setIsLoading(false);
        }, 1500);
    };

    const handleCallRequest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCallLoading(true);
        setCallError("");

        // Validación básica
        if (!callRequestData.name || !callRequestData.phone || !callRequestData.reason) {
            setCallError("Por favor, completa todos los campos.");
            setIsCallLoading(false);
            return;
        }

        // Simular envío (reemplazar con tu endpoint real)
        setTimeout(() => {
            setIsCallSubmitted(true);
            setCallRequestData({ name: "", countryCode: "+52", phone: "", reason: "" });
            setIsCallLoading(false);
        }, 1500);
    };

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                {/* Sección de encabezado */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={styles.header}
                >
                    <h1 className={styles.title}>Soporte y Contacto</h1>
                    <p className={styles.subtitle}>
                        ¿Tienes dudas o necesitas ayuda? Nos encantaría escucharte. Contacta con nosotros a través de cualquier canal disponible.
                    </p>
                </motion.div>

                <div className={styles.content}>
                    {/* Tarjetas de contacto */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className={styles.contactGrid}
                    >
                        {/* Tarjeta Email */}
                        <div className={styles.contactCard}>
                            <div className={styles.cardIcon}>
                                <FiMail size={28} />
                            </div>
                            <h3 className={styles.cardTitle}>Correo Electrónico</h3>
                            <p className={styles.cardDescription}>
                                Envíanos un email y te responderemos en las próximas 24 horas.
                            </p>
                            <a href="mailto:soporte@pitzbol.com" className={styles.cardLink}>
                                pitzbol2026@gmail.com <FiArrowRight size={16} />
                            </a>
                        </div>

                        {/* Tarjeta Solicitud de Llamada */}
                        <div className={styles.contactCard}>
                            <div className={styles.cardIcon}>
                                <FiPhone size={28} />
                            </div>
                            <h3 className={styles.cardTitle}>Solicitar Llamada</h3>
                            <p className={styles.cardDescription}>
                                Completa el formulario con tu número y motivo. Te contactaremos en nuestro horario de atención: Lunes a Viernes 9am-6pm.
                            </p>
                            <button
                                onClick={() => {
                                    setActiveTab("call");
                                    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className={styles.cardLink}
                            >
                                Solicitar ahora <FiArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Formulario de contacto con tabs */}
                    <motion.div
                        id="contact-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={styles.formContainer}
                    >
                        <h2 className={styles.formTitle}>¿Cómo prefieres contactarnos?</h2>
                        
                        {/* Tabs */}
                        <div className={styles.tabContainer}>
                            <button
                                type="button"
                                onClick={() => setActiveTab("message")}
                                className={`${styles.tab} ${activeTab === "message" ? styles.tabActive : ""}`}
                            >
                                <FiMail size={18} />
                                Enviar Mensaje
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("call")}
                                className={`${styles.tab} ${activeTab === "call" ? styles.tabActive : ""}`}
                            >
                                <FiPhone size={18} />
                                Solicitar Llamada
                            </button>
                        </div>

                        {/* Contenido de Enviar Mensaje */}
                        {activeTab === "message" && (
                            <>
                                <p className={styles.formSubtitle}>
                                    Completa el formulario y nos pondremos en contacto contigo lo antes posible.
                                </p>

                                {isSubmitted && !isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={styles.successMessage}
                                    >
                                        <div className={styles.successIcon}>
                                            <FiCheck size={24} />
                                        </div>
                                        <h3 className={styles.successTitle}>¡Mensaje enviado!</h3>
                                        <p className={styles.successText}>
                                            Gracias por contactarnos. Nos comunicaremos contigo en breve.
                                        </p>
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className={styles.successButton}
                                        >
                                            Enviar otro mensaje
                                        </button>
                                    </motion.div>
                                )}

                        {!isSubmitted && (
                            <form onSubmit={handleSubmit} className={styles.form}>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={styles.errorMessage}
                                    >
                                        <FiAlertCircle size={18} />
                                        {error}
                                    </motion.div>
                                )}

                                {/* Categorías de Consulta */}
                                <div className={styles.categorySection}>
                                    <label className={styles.label}>Categoría de Consulta</label>
                                    <div className={styles.categoryGrid}>
                                        {CATEGORIAS_CONSULTA.map((cat) => {
                                            const IconComponent = cat.icon;
                                            const isSelected = selectedCategory === cat.id;
                                            return (
                                                <motion.button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleCategorySelect(cat.id)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`${styles.categoryCard} ${isSelected ? styles.categoryCardSelected : ''}`}
                                                    style={{
                                                        borderColor: isSelected ? cat.color : '#f6f0e6',
                                                        backgroundColor: isSelected ? `${cat.color}10` : 'white'
                                                    }}
                                                >
                                                    <div 
                                                        className={styles.categoryIcon}
                                                        style={{ 
                                                            backgroundColor: isSelected ? cat.color : '#f0f8f4',
                                                            color: isSelected ? 'white' : cat.color
                                                        }}
                                                    >
                                                        <IconComponent size={20} />
                                                    </div>
                                                    <span 
                                                        className={styles.categoryLabel}
                                                        style={{ color: isSelected ? cat.color : '#1a4d2e' }}
                                                    >
                                                        {cat.label}
                                                    </span>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className={styles.categoryCheck}
                                                            style={{ backgroundColor: cat.color }}
                                                        >
                                                            <FiCheck size={12} color="white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Nombre Completo</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Tu nombre"
                                            className={styles.input}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Correo Electrónico</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="tu@email.com"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Teléfono de Contacto</label>
                                    <div className={styles.phoneInputContainer}>
                                        <div className={styles.phoneCodeWrapper}>
                                            <select
                                                name="countryCode"
                                                value={formData.countryCode}
                                                onChange={handleInputChange}
                                                className={styles.phoneCodeSelect}
                                            >
                                                {ALL_COUNTRIES.map(c => (
                                                    <option key={c.name} value={c.lada}>
                                                        {c.lada} {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <FiChevronDown className={styles.selectIcon} />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="123 456 7890"
                                            className={styles.phoneInput}
                                        />
                                    </div>
                                    <p className={styles.fieldHint}>Te contactaremos a este número en nuestro horario de atención.</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Asunto</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        placeholder="¿Cuál es tu consulta?"
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Mensaje</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Cuéntanos más detalles sobre tu consulta..."
                                        rows={6}
                                        className={styles.textarea}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={styles.submitButton}
                                >
                                    {isLoading ? "Enviando..." : "Enviar Mensaje"}
                                    {!isLoading && <FiArrowRight size={16} />}
                                </button>
                            </form>
                        )}
                        </>
                        )}

                        {/* Contenido de Solicitar Llamada */}
                        {activeTab === "call" && (
                            <>
                                <p className={styles.formSubtitle}>
                                    Déjanos tus datos y te contactaremos telefónicamente en nuestro horario de atención (Lun-Vie 9am-6pm).
                                </p>

                                {isCallSubmitted && !isCallLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={styles.successMessage}
                                    >
                                        <div className={styles.successIcon}>
                                            <FiCheck size={24} />
                                        </div>
                                        <h3 className={styles.successTitle}>¡Solicitud recibida!</h3>
                                        <p className={styles.successText}>
                                            Te contactaremos pronto al número proporcionado.
                                        </p>
                                        <button
                                            onClick={() => setIsCallSubmitted(false)}
                                            className={styles.successButton}
                                        >
                                            Nueva solicitud
                                        </button>
                                    </motion.div>
                                )}

                                {!isCallSubmitted && (
                                    <form onSubmit={handleCallRequest} className={styles.form}>
                                        {callError && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={styles.errorMessage}
                                            >
                                                <FiAlertCircle size={18} />
                                                {callError}
                                            </motion.div>
                                        )}

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Nombre Completo</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={callRequestData.name}
                                                onChange={handleCallInputChange}
                                                placeholder="Tu nombre"
                                                className={styles.input}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Teléfono de Contacto</label>
                                            <div className={styles.phoneInputContainer}>
                                                <div className={styles.phoneCodeWrapper}>
                                                    <select
                                                        name="countryCode"
                                                        value={callRequestData.countryCode}
                                                        onChange={handleCallInputChange}
                                                        className={styles.phoneCodeSelect}
                                                    >
                                                        {ALL_COUNTRIES.map(c => (
                                                            <option key={c.name} value={c.lada}>
                                                                {c.lada} {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <FiChevronDown className={styles.selectIcon} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={callRequestData.phone}
                                                    onChange={handleCallInputChange}
                                                    placeholder="123 456 7890"
                                                    className={styles.phoneInput}
                                                />
                                            </div>
                                            <p className={styles.fieldHint}>Te llamaremos a este número en horario hábil.</p>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Motivo de la Llamada</label>
                                            <textarea
                                                name="reason"
                                                value={callRequestData.reason}
                                                onChange={handleCallInputChange}
                                                placeholder="Cuéntanos brevemente el motivo de tu llamada..."
                                                rows={4}
                                                className={styles.textarea}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isCallLoading}
                                            className={styles.submitButton}
                                        >
                                            {isCallLoading ? "Enviando..." : "Solicitar Llamada"}
                                            {!isCallLoading && <FiArrowRight size={16} />}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </motion.div>

                    {/* Preguntas frecuentes */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={styles.faqContainer}
                    >
                        <h2 className={styles.faqTitle}>Preguntas Frecuentes</h2>
                        <div className={styles.faqGrid}>
                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>¿Cómo puedo crear una cuenta?</h4>
                                <p className={styles.faqAnswer}>
                                    Haz clic en "Identificarse" en el menú de la página principal y sigue los pasos para registrarte. Es completamente gratis.
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>¿Cuándo recibiré una respuesta?</h4>
                                <p className={styles.faqAnswer}>
                                    Normalmente respondemos en menos de 24 horas durante días hábiles. Para consultas urgentes, selecciona "Solicitar Llamada".
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>¿Qué categoría de consulta debo elegir?</h4>
                                <p className={styles.faqAnswer}>
                                    Selecciona la categoría que mejor describa tu consulta. Si no estás seguro, elige "Consulta General" o "Otro".
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>¿Dónde puedo reportar un problema técnico?</h4>
                                <p className={styles.faqAnswer}>
                                    Usa el formulario de contacto y selecciona "Problema Técnico". Describe con detalle el error que encontraste.
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>¿Cuál es el horario de atención telefónica?</h4>
                                <p className={styles.faqAnswer}>
                                    Nuestro equipo está disponible de lunes a viernes, 9:00 AM a 6:00 PM (Hora de Guadalajara).
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>¿Puedo solicitar alianzas comerciales?</h4>
                                <p className={styles.faqAnswer}>
                                    ¡Claro! Selecciona "Alianzas Comerciales" en el formulario y cuéntanos sobre tu negocio o propuesta.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
