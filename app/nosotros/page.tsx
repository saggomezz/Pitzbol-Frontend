"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FiTarget, FiEye, FiHeart, FiUsers, FiGlobe, FiTrendingUp, FiAward, FiMapPin } from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi";
import styles from "./nosotros.module.css";

export default function Nosotros() {
    const t = useTranslations('aboutUs');
    const [placesCount, setPlacesCount] = useState<number | null>(null);
    const [verifiedCount, setVerifiedCount] = useState<number | null>(null);

    useEffect(() => {
        const getDynamicCounts = async () => {
            const [placesResult, guidesResult] = await Promise.allSettled([
                fetch("/api/lugares-proxy?includeApprovedBusinesses=true", { cache: "no-store" }),
                fetch("/api/guides/verified", { cache: "no-store" }),
            ]);

            if (placesResult.status === "fulfilled" && placesResult.value.ok) {
                const data = await placesResult.value.json();
                if (Array.isArray(data?.lugares)) {
                    setPlacesCount(data.lugares.length);
                }
            } else {
                console.error("No se pudieron cargar los lugares destacados.");
            }

            if (guidesResult.status === "fulfilled" && guidesResult.value.ok) {
                const data = await guidesResult.value.json();
                const count = data?.total ?? (Array.isArray(data?.guides) ? data.guides.length : null);
                const parsed = Number(count);
                if (Number.isFinite(parsed)) {
                    setVerifiedCount(parsed);
                }
            } else {
                console.error("No se pudieron cargar los guías verificados.");
            }
        };

        getDynamicCounts();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HERO SECTION */}
                <div className={styles.hero}>
                    <span className={styles.badge}>{t('badge')}</span>
                    <h1 className={styles.title}>
                        {t('heroTitle')} <span className={styles.titleAccent}>{t('heroAccent')}</span>
                    </h1>
                    <p className={styles.subtitle}>
                        {t('heroSubtitle')}
                    </p>
                </div>

                {/* MISSION & VISION */}
                <div className={styles.missionVision}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <div className={styles.icon}>
                                <FiTarget />
                            </div>
                            {t('missionTitle')}
                        </h2>
                        <div className={styles.cardContent}>
                            <p>{t.rich('missionContent', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}</p>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <div className={styles.icon}>
                                <FiEye />
                            </div>
                            {t('visionTitle')}
                        </h2>
                        <div className={styles.cardContent}>
                            <p>{t.rich('visionContent', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}</p>
                        </div>
                    </div>
                </div>

                {/* STORY SECTION */}
                <div className={styles.story}>
                    <h2 className={styles.storyTitle}>{t('storyTitle')}</h2>
                    <div className={styles.storyContent}>
                        <p>{t.rich('storyP1', {
                            strong: (chunks) => <strong>{chunks}</strong>,
                            em: (chunks) => <em>{chunks}</em>
                        })}</p>
                        
                        <div className={styles.highlight}>
                            {t('storyHighlight')}
                        </div>

                        <p>{t.rich('storyP2', {
                            strong: (chunks) => <strong>{chunks}</strong>,
                            em: (chunks) => <em>{chunks}</em>
                        })}</p>

                        <p>{t.rich('storyP3', {
                            strong: (chunks) => <strong>{chunks}</strong>,
                            em: (chunks) => <em>{chunks}</em>
                        })}</p>
                    </div>
                </div>

                {/* VALUES SECTION */}
                <div className={styles.values}>
                    <h2 className={styles.valuesTitle}>{t('valuesTitle')}</h2>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiHeart />
                            </div>
                            <h3 className={styles.valueTitle}>{t('valuePassion')}</h3>
                            <p className={styles.valueDescription}>
                                {t('valuePassionDesc')}
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiGlobe />
                            </div>
                            <h3 className={styles.valueTitle}>{t('valueInclusion')}</h3>
                            <p className={styles.valueDescription}>
                                {t('valueInclusionDesc')}
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiAward />
                            </div>
                            <h3 className={styles.valueTitle}>{t('valueExcellence')}</h3>
                            <p className={styles.valueDescription}>
                                {t('valueExcellenceDesc')}
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <GiSoccerBall />
                            </div>
                            <h3 className={styles.valueTitle}>{t('valueTradition')}</h3>
                            <p className={styles.valueDescription}>
                                {t('valueTraditionDesc')}
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiUsers />
                            </div>
                            <h3 className={styles.valueTitle}>{t('valueCommunity')}</h3>
                            <p className={styles.valueDescription}>
                                {t('valueCommunityDesc')}
                            </p>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <FiTrendingUp />
                            </div>
                            <h3 className={styles.valueTitle}>{t('valueInnovation')}</h3>
                            <p className={styles.valueDescription}>
                                {t('valueInnovationDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* TEAM & STATS SECTION */}
                <div className={styles.team}>
                    <h2 className={styles.teamTitle}>{t('teamTitle')}</h2>
                    <p className={styles.teamDescription}>
                        {t('teamDescription')}
                    </p>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <div className={styles.statNumber}>2026</div>
                            <div className={styles.statLabel}>{t('stat1Label')}</div>
                        </div>
                        <div className={styles.stat}>
                            <div className={styles.statNumber}>{
                                placesCount === null ? "—" : placesCount.toLocaleString()
                            }</div>
                            <div className={styles.statLabel}>{t('stat2Label')}</div>
                        </div>
                        <div className={styles.stat}>
                            <div className={styles.statNumber}>{
                                verifiedCount === null ? "—" : verifiedCount.toLocaleString()
                            }</div>
                            <div className={styles.statLabel}>{t('stat3Label')}</div>
                        </div>
                    </div>
                </div>

                {/* CTA SECTION */}
                <div className={styles.cta}>
                    <h2 className={styles.ctaTitle}>{t('ctaTitle')}</h2>
                    <p className={styles.ctaDescription}>
                        {t('ctaDescription')}
                    </p>
                    <Link href="/mapa" className={styles.ctaButton}>
                        <FiMapPin />
                        {t('ctaButton')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
