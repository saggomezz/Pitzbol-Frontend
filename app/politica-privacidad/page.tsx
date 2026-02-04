"use client";
import { useTranslations } from "next-intl";
import { FiShield, FiEye, FiLock, FiDatabase, FiShare2, FiAlertCircle, FiMail } from "react-icons/fi";
import styles from "./politica-privacidad.module.css";

export default function PoliticaPrivacidad() {
    const t = useTranslations('privacyPolicy');
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HEADER */}
                <div className={styles.header}>
                    <span className={styles.badge}>{t('badge')}</span>
                    <h1 className={styles.title}>
                        {t('heroTitle')} <span className={styles.titleAccent}>{t('heroAccent')}</span>
                    </h1>
                    <p className={styles.subtitle}>
                        {t('heroSubtitle')}
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
                            {t('commitmentTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t.rich('commitmentContent', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}</p>
                        </div>
                    </section>

                    {/* INFORMACIÓN QUE RECOPILAMOS */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiEye />
                            </div>
                            {t('collectionTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t('collectionIntro')}</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>{t.rich('collectionAccount', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('collectionUsage', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('collectionLocation', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('collectionTechnical', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                            </ul>
                        </div>
                    </section>

                    {/* CÓMO USAMOS TU INFORMACIÓN */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiDatabase />
                            </div>
                            {t('usageTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t('usageIntro')}</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>{t('usage1')}</li>
                                <li className={styles.listItem}>{t('usage2')}</li>
                                <li className={styles.listItem}>{t('usage3')}</li>
                                <li className={styles.listItem}>{t('usage4')}</li>
                                <li className={styles.listItem}>{t('usage5')}</li>
                                <li className={styles.listItem}>{t('usage6')}</li>
                                <li className={styles.listItem}>{t('usage7')}</li>
                            </ul>
                        </div>
                    </section>

                    {/* COMPARTIR INFORMACIÓN */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiShare2 />
                            </div>
                            {t('sharingTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t('sharingIntro')}</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>{t.rich('sharingProviders', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('sharingPartners', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('sharingLegal', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                            </ul>
                        </div>
                    </section>

                    {/* SEGURIDAD */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiLock />
                            </div>
                            {t('securityTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t('securityContent')}</p>
                            <div className={styles.highlight}>
                                <div className={styles.highlightTitle}>{t('securityHighlightTitle')}</div>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}>{t('security1')}</li>
                                    <li className={styles.listItem}>{t('security2')}</li>
                                    <li className={styles.listItem}>{t('security3')}</li>
                                    <li className={styles.listItem}>{t('security4')}</li>
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
                            {t('rightsTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t('rightsIntro')}</p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}>{t.rich('rightsAccess', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('rightsRectification', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('rightsDeletion', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('rightsPortability', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li className={styles.listItem}>{t.rich('rightsObjection', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                            </ul>
                            <p style={{ marginTop: '1rem' }}>
                                {t('rightsContact')}
                            </p>
                        </div>
                    </section>

                    {/* COOKIES */}
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <div className={styles.icon}>
                                <FiDatabase />
                            </div>
                            {t('cookiesTitle')}
                        </div>
                        <div className={styles.content}>
                            <p>{t('cookiesContent')}</p>
                        </div>
                    </section>

                    {/* CONTACTO */}
                    <div className={styles.contactInfo}>
                        <div className={styles.contactTitle}>
                            <FiMail style={{ display: 'inline', marginRight: '0.5rem' }} />
                            {t('contactTitle')}
                        </div>
                        <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                            {t('contactDescription')}
                        </p>
                        <a href="mailto:pitzbol2026@gmail.com" className={styles.email}>
                            {t('email')}
                        </a>
                    </div>

                    {/* FOOTER */}
                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            {t('footerText')}
                        </p>
                        <span className={styles.updateDate}>
                            {t('updateDate')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
