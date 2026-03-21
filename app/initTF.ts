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

  const originalWarn = console.warn;
  try {
    // Suprimir warnings de TensorFlow durante inicialización
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

    // Importar TensorFlow.js y normalizar acceso ESM/CJS
    const tfModule = await import('@tensorflow/tfjs');
    const tf = (tfModule as any).default ?? tfModule;

    if (typeof tf?.setBackend !== 'function' || typeof tf?.ready !== 'function') {
      throw new Error('TensorFlow module inválido: faltan setBackend/ready');
    }

    // Asignar a window para que face-api.js lo encuentre
    (window as any).tf = tf;

    try {
      await tf.setBackend('webgl');
    } catch {
      await tf.setBackend('cpu');
    }

    // Esperar a que TensorFlow esté listo
    await tf.ready();

    tfInstance = tf;
    tfInitialized = true;

    return tf;
  } catch (error) {
    console.error("❌ Error inicializando TensorFlow.js:", error);
    throw error;
  } finally {
    console.warn = originalWarn;
  }
}

export async function ensureFaceApiReady() {
  if (faceapiInitialized && faceapiInstance) {
    return faceapiInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const originalWarn = console.warn;
  try {
    // Suprimir warnings durante inicialización
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

    // Importar @vladmandic/face-api y normalizar acceso ESM/CJS
    const faceapiModule = await import('@vladmandic/face-api');
    const faceapi = (faceapiModule as any).default ?? faceapiModule;

    faceapiInstance = faceapi;
    faceapiInitialized = true;

    return faceapi;
  } catch (error) {
    console.error("❌ Error inicializando face-api.js:", error);
    throw error;
  } finally {
    console.warn = originalWarn;
  }
}
