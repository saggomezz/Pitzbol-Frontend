// Singleton para inicializar TensorFlow.js y face-api.js una sola vez
let tfInitialized = false;
let tfInstance: any = null;
let faceapiInitialized = false;
let faceapiInstance: any = null;

export async function ensureTensorFlowReady() {
  if (tfInitialized && tfInstance) {
    return tfInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Suprimir warnings de TensorFlow durante inicialización
    const originalWarn = console.warn;
    console.warn = function(...args: any[]) {
      const message = args[0]?.toString?.() || '';
      // Ignorar warnings específicos de TensorFlow
      if (message.includes('already been set') || 
          message.includes('already registered') ||
          message.includes('backend') ||
          message.includes('kernel')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    // Importar TensorFlow.js y hacer que esté disponible globalmente
    const tfRaw = await import('@tensorflow/tfjs');
    const tf: any = (tfRaw as any).default ?? tfRaw;

    // Asignar a window para que face-api.js lo encuentre
    (window as any).tf = tf;

    // Intentar usar WebGL, pero fallback a CPU si no está disponible
    if (typeof tf.setBackend === 'function') {
      try {
        await tf.setBackend('webgl');
      } catch (e) {
        try { await tf.setBackend('cpu'); } catch {}
      }
    }

    // Esperar a que esté listo
    if (typeof tf.ready === 'function') await tf.ready();
    
    tfInstance = tf;
    tfInitialized = true;
    
    // Restaurar console.warn
    console.warn = originalWarn;
    
    return tf;
  } catch (error) {
    console.error("❌ Error inicializando TensorFlow.js:", error);
    throw error;
  }
}

export async function ensureFaceApiReady() {
  if (faceapiInitialized && faceapiInstance) {
    return faceapiInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Suprimir warnings durante inicialización
    const originalWarn = console.warn;
    console.warn = function(...args: any[]) {
      const message = args[0]?.toString?.() || '';
      if (message.includes('already been set') || 
          message.includes('already registered') ||
          message.includes('backend') ||
          message.includes('kernel')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    // Primero asegurar que TensorFlow.js esté completamente inicializado
    await ensureTensorFlowReady();

    // Importar @vladmandic/face-api que no tiene conflictos con TensorFlow
    const faceapiRaw = await import('@vladmandic/face-api');
    const faceapi: any = (faceapiRaw as any).default ?? faceapiRaw;

    faceapiInstance = faceapi;
    faceapiInitialized = true;
    
    // Restaurar console.warn
    console.warn = originalWarn;
    
    return faceapi;
  } catch (error) {
    console.error("❌ Error inicializando face-api.js:", error);
    throw error;
  }
}
