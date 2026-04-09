"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
    const t = useTranslations('support');
    const tCommon = useTranslations('common');
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

    const CATEGORIAS_CONSULTA = [
        { id: "general", label: t('categoryGeneral'), icon: FiHelpCircle, color: "#0D601E" },
        { id: "tecnico", label: t('categoryTechnical'), icon: FiTool, color: "#F00808" },
        { id: "cuenta", label: t('categoryAccount'), icon: FiUser, color: "#1A4D2E" },
        { id: "negocio", label: t('categoryBusiness'), icon: FiBriefcase, color: "#B90808" },
        { id: "sugerencia", label: t('categorySuggestion'), icon: FiMessageCircle, color: "#769C7B" },
        { id: "otro", label: t('categoryOther'), icon: FiFlag, color: "#4A4A4A" },
    ];

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
            setError(t('validationError'));
            setIsLoading(false);
            return;
        }

        try {
            const API_BASE = "/api";
            const response = await fetch(`${API_BASE}/support/contact-form`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || "Error al enviar el formulario");
            }

            const data = await response.json();
            setIsSubmitted(true);
            setFormData({ name: "", email: "", countryCode: "+52", phone: "", category: "", subject: "", message: "" });
            setSelectedCategory("");
        } catch (err: any) {
            setError(err.message || "Error al enviar el formulario. Por favor, intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCallRequest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCallLoading(true);
        setCallError("");

        // Validación básica
        if (!callRequestData.name || !callRequestData.phone || !callRequestData.reason) {
            setCallError(t('validationError'));
            setIsCallLoading(false);
            return;
        }

        try {
            const API_BASE = "/api";
            const response = await fetch(`${API_BASE}/support/call-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(callRequestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || "Error al enviar la solicitud");
            }

            const data = await response.json();
            setIsCallSubmitted(true);
            setCallRequestData({ name: "", countryCode: "+52", phone: "", reason: "" });
        } catch (err: any) {
            setCallError(err.message || "Error al enviar la solicitud de llamada. Por favor, intenta de nuevo.");
        } finally {
            setIsCallLoading(false);
        }
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
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.subtitle}>
                        {t('subtitle')}
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
                            <h3 className={styles.cardTitle}>{t('emailCardTitle')}</h3>
                            <p className={styles.cardDescription}>
                                {t('emailCardDescription')}
                            </p>
                            <a href="mailto:pitzbol2026@gmail.com" className={styles.cardLink}>
                                pitzbol2026@gmail.com <FiArrowRight size={16} />
                            </a>
                        </div>

                        {/* Tarjeta Solicitud de Llamada */}
                        <div className={styles.contactCard}>
                            <div className={styles.cardIcon}>
                                <FiPhone size={28} />
                            </div>
                            <h3 className={styles.cardTitle}>{t('callCardTitle')}</h3>
                            <p className={styles.cardDescription}>
                                {t('callCardDescription')}
                            </p>
                            <button
                                onClick={() => {
                                    setActiveTab("call");
                                    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className={styles.cardLink}
                            >
                                {t('requestNow')} <FiArrowRight size={16} />
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
                        <h2 className={styles.formTitle}>{t('howPreferContact')}</h2>
                        
                        {/* Tabs */}
                        <div className={styles.tabContainer}>
                            <button
                                type="button"
                                onClick={() => setActiveTab("message")}
                                className={`${styles.tab} ${activeTab === "message" ? styles.tabActive : ""}`}
                            >
                                <FiMail size={18} />
                                {t('sendMessage')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("call")}
                                className={`${styles.tab} ${activeTab === "call" ? styles.tabActive : ""}`}
                            >
                                <FiPhone size={18} />
                                {t('requestCall')}
                            </button>
                        </div>

                        {/* Contenido de Enviar Mensaje */}
                        {activeTab === "message" && (
                            <>
                                <p className={styles.formSubtitle}>
                                    {t('formDescription')}
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
                                        <h3 className={styles.successTitle}>{t('messageSentTitle')}</h3>
                                        <p className={styles.successText}>
                                            {t('messageSentText')}
                                        </p>
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className={styles.successButton}
                                        >
                                            {t('sendAnother')}
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
                                    <label className={styles.label}>{t('categoryLabel')}</label>
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
                                        <label className={styles.label}>{t('fullName')}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder={t('namePlaceholder')}
                                            className={styles.input}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>{t('email')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder={t('emailPlaceholder')}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>{t('phoneLabel')}</label>
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
                                            placeholder={t('phonePlaceholder')}
                                            className={styles.phoneInput}
                                        />
                                    </div>
                                    <p className={styles.fieldHint}>{t('phoneHint')}</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>{t('subjectLabel')}</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        placeholder={t('subjectPlaceholder')}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>{t('messageLabel')}</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder={t('messagePlaceholder')}
                                        rows={6}
                                        className={styles.textarea}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={styles.submitButton}
                                >
                                    {isLoading ? t('submitting') : t('submitButton')}
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
                                    {t('callFormDescription')}
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
                                        <h3 className={styles.successTitle}>{t('callRequestTitle')}</h3>
                                        <p className={styles.successText}>
                                            {t('callRequestText')}
                                        </p>
                                        <button
                                            onClick={() => setIsCallSubmitted(false)}
                                            className={styles.successButton}
                                        >
                                            {t('newRequest')}
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
                                            <label className={styles.label}>{t('fullName')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={callRequestData.name}
                                                onChange={handleCallInputChange}
                                                placeholder={t('namePlaceholder')}
                                                className={styles.input}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>{t('phoneLabel')}</label>
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
                                                    placeholder={t('phonePlaceholder')}
                                                    className={styles.phoneInput}
                                                />
                                            </div>
                                            <p className={styles.fieldHint}>{t('callHint')}</p>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>{t('callReasonLabel')}</label>
                                            <textarea
                                                name="reason"
                                                value={callRequestData.reason}
                                                onChange={handleCallInputChange}
                                                placeholder={t('callReasonPlaceholder')}
                                                rows={4}
                                                className={styles.textarea}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isCallLoading}
                                            className={styles.submitButton}
                                        >
                                            {isCallLoading ? t('submitting') : t('submitCallButton')}
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
                        <h2 className={styles.faqTitle}>{t('faqTitle')}</h2>
                        <div className={styles.faqGrid}>
                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t('faqQ1')}</h4>
                                <p className={styles.faqAnswer}>
                                    {t('faqA1')}
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t('faqQ2')}</h4>
                                <p className={styles.faqAnswer}>
                                    {t('faqA2')}
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t('faqQ3')}</h4>
                                <p className={styles.faqAnswer}>
                                    {t('faqA3')}
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t('faqQ4')}</h4>
                                <p className={styles.faqAnswer}>
                                    {t('faqA4')}
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t('faqQ5')}</h4>
                                <p className={styles.faqAnswer}>
                                    {t('faqA5')}
                                </p>
                            </div>

                            <div className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t('faqQ6')}</h4>
                                <p className={styles.faqAnswer}>
                                    {t('faqA6')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
