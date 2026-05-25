#!/usr/bin/env node

/**
 * Script de verificación de i18n
 * Verifica que todos los archivos de traducción estén correctos
 */

const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const locales = ['es', 'en'];

console.log('🔍 Verificando archivos de traducción...\n');

let hasErrors = false;

// Verificar que existan los archivos
locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: No existe el archivo ${locale}.json`);
    hasErrors = true;
    return;
  }
  
  console.log(`Archivo ${locale}.json encontrado`);
  
  // Verificar que sea JSON válido
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    console.log(`✅ ${locale}.json es un JSON válido`);
    
    // Mostrar secciones disponibles
    const sections = Object.keys(json);
    console.log(`   Secciones: ${sections.join(', ')}\n`);
  } catch (error) {
    console.error(`❌ ERROR: ${locale}.json no es un JSON válido`);
    console.error(`   ${error.message}\n`);
    hasErrors = true;
  }
});

// Verificar que las claves coincidan entre idiomas
if (!hasErrors) {
  console.log('🔍 Verificando consistencia entre idiomas...\n');
  
  const esContent = JSON.parse(fs.readFileSync(path.join(messagesDir, 'es.json'), 'utf-8'));
  const enContent = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf-8'));
  
  const esSections = Object.keys(esContent);
  const enSections = Object.keys(enContent);
  
  // Secciones faltantes
  const missingSectionsInEn = esSections.filter(s => !enSections.includes(s));
  const missingSectionsInEs = enSections.filter(s => !esSections.includes(s));
  
  if (missingSectionsInEn.length > 0) {
    console.error(`❌ Secciones en ES pero no en EN: ${missingSectionsInEn.join(', ')}`);
    hasErrors = true;
  }
  
  if (missingSectionsInEs.length > 0) {
    console.error(`❌ Secciones en EN pero no en ES: ${missingSectionsInEs.join(', ')}`);
    hasErrors = true;
  }
  
  if (!hasErrors) {
    console.log('✅ Todas las secciones están presentes en ambos idiomas\n');
  }
  
  // Verificar claves dentro de cada sección
  esSections.forEach(section => {
    if (enSections.includes(section)) {
      const esKeys = Object.keys(esContent[section]);
      const enKeys = Object.keys(enContent[section]);
      
      const missingInEn = esKeys.filter(k => !enKeys.includes(k));
      const missingInEs = enKeys.filter(k => !esKeys.includes(k));
      
      if (missingInEn.length > 0) {
        console.error(`❌ [${section}] Claves en ES pero no en EN: ${missingInEn.join(', ')}`);
        hasErrors = true;
      }
      
      if (missingInEs.length > 0) {
        console.error(`❌ [${section}] Claves en EN pero no en ES: ${missingInEs.join(', ')}`);
        hasErrors = true;
      }
    }
  });
  
  if (!hasErrors) {
    console.log('✅ Todas las claves están presentes en ambos idiomas\n');
  }
}

// Resultado final
if (hasErrors) {
  console.log('\n❌ Se encontraron errores. Por favor, corrígelos antes de continuar.\n');
  process.exit(1);
} else {
  console.log('\n✅ ¡Todo está correcto! El sistema de i18n está listo para usar.\n');
  console.log('💡 Para probarlo:');
  console.log('   1. npm run dev');
  console.log('   2. Abre http://localhost:3000');
  console.log('   3. Busca el ícono 🌐 en el navbar\n');
  process.exit(0);
}
