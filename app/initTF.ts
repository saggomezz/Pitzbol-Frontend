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
    const tf = await import('@tensorflow/tfjs');
    
    // Asignar a window para que face-api.js lo encuentre
    (window as any).tf = tf;
    
    // Intentar usar WebGL, pero fallback a CPU si no está disponible
    try {
      await tf.setBackend('webgl');
    } catch (e) {
      await tf.setBackend('cpu');
    }
    
    // Esperar a que esté listo
    await tf.ready();
    
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
    const faceapi = await import('@vladmandic/face-api');
    
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
