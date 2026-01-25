"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import { FiSearch, FiFilter } from "react-icons/fi";
import GuideCard from "../components/GuideCard";
import styles from "./tours.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Guide {
  uid: string;
  nombre: string;
  fotoPerfil?: string;
  descripcion?: string;
  idiomas?: string[];
  especialidades?: string[];
  tarifa?: number;
  ubicacion?: string;
}

export default function ToursPage() {
  const t = useTranslations('tours');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  // Cargar guías desde el backend
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/guides/verified`);
        
        if (!response.ok) {
          console.warn(`Error al cargar guías: ${response.status} ${response.statusText}`);
          setGuides([]);
          return;
        }

        const data = await response.json();
        setGuides(data.guides || []);
      } catch (error) {
        console.error("Error fetching guides:", error);
        setGuides([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  // Extraer idiomas y especialidades únicos para los filtros
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    guides.forEach(guide => {
      guide.idiomas?.forEach(lang => languages.add(lang));
    });
    return Array.from(languages).sort();
  }, [guides]);

  const availableSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    guides.forEach(guide => {
      guide.especialidades?.forEach(spec => specialties.add(spec));
    });
    return Array.from(specialties).sort();
  }, [guides]);

  // Filtrar guías
  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      // Filtro de búsqueda
      const matchesSearch = searchTerm === "" || 
        guide.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.idiomas?.some(lang => lang.toLowerCase().includes(searchTerm.toLowerCase())) ||
        guide.especialidades?.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro de idioma
      const matchesLanguage = selectedLanguage === "all" || 
        guide.idiomas?.includes(selectedLanguage);

      // Filtro de especialidad
      const matchesSpecialty = selectedSpecialty === "all" || 
        guide.especialidades?.includes(selectedSpecialty);

      return matchesSearch && matchesLanguage && matchesSpecialty;
    });
  }, [guides, searchTerm, selectedLanguage, selectedSpecialty]);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.heroContent}
        >
          <h1 className={styles.title}>
            {t('title')}
          </h1>
          <p className={styles.subtitle}>
            {t('subtitle')}
          </p>
        </motion.div>
      </section>

      {/* Barra de búsqueda y filtros */}
      <section className={styles.searchSection}>
        <div className={styles.searchContainer}>
          {/* Buscador */}
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filtros */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <FiFilter className={styles.filterIcon} />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">{t('allLanguages')}</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <FiFilter className={styles.filterIcon} />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">{t('allSpecialties')}</option>
                {availableSpecialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <p className={styles.resultsCount}>
            {filteredGuides.length} {filteredGuides.length === 1 ? t('guideFound') : t('guidesFound')}
          </p>
        )}
      </section>

      {/* Grid de guías */}
      <section className={styles.guidesSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>{t('loading')}</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className={styles.emptyState}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={styles.emptyContent}
            >
              <h3 className={styles.emptyTitle}>{t('noGuides')}</h3>
              <p className={styles.emptyDescription}>{t('noGuidesDescription')}</p>
            </motion.div>
          </div>
        ) : (
          <div className={styles.guidesGrid}>
            {filteredGuides.map(guide => (
              <GuideCard key={guide.uid} guide={guide} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
