// Singleton para inicializar TensorFlow.js y face-api.js una sola vez
let tfInitialized = false;
let tfInstance: any = null;
let faceapiInitialized = false;
let faceapiInstance: any = null;

export async function ensureTensorFlowReady() {
  if (tfInitialized && tfInstance) {
    console.log("✅ TensorFlow.js ya está inicializado");
    return tfInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    console.log("🔄 Inicializando TensorFlow.js globalmente...");
    
    // Importar TensorFlow.js y hacer que esté disponible globalmente
    const tf = await import('@tensorflow/tfjs');
    
    // Asignar a window para que face-api.js lo encuentre
    (window as any).tf = tf;
    
    // Registrar el backend WebGL explícitamente
    await tf.setBackend('webgl');
    
    // Esperar a que esté listo
    await tf.ready();
    
    tfInstance = tf;
    tfInitialized = true;
    
    console.log("✅ TensorFlow.js inicializado globalmente, backend:", tf.getBackend());
    
    return tf;
  } catch (error) {
    console.error("❌ Error inicializando TensorFlow.js:", error);
    throw error;
  }
}

export async function ensureFaceApiReady() {
  if (faceapiInitialized && faceapiInstance) {
    console.log("✅ face-api.js ya está inicializado");
    return faceapiInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    console.log("🔄 Cargando @vladmandic/face-api...");
    
    // Importar @vladmandic/face-api que no tiene conflictos con TensorFlow
    const faceapi = await import('@vladmandic/face-api');
    
    faceapiInstance = faceapi;
    faceapiInitialized = true;
    
    console.log("✅ face-api.js inicializado correctamente");
    
    return faceapi;
  } catch (error) {
    console.error("❌ Error inicializando face-api.js:", error);
    throw error;
  }
}
