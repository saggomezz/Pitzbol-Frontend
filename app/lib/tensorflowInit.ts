// Inicialización global de TensorFlow.js
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';

let initialized = false;

export async function initTensorFlow() {
  if (initialized) return;
  
  try {
    console.log("🔄 Inicializando TensorFlow.js...");
    await tf.ready();
    await tf.setBackend('webgl');
    console.log("✅ TensorFlow.js inicializado correctamente:", tf.getBackend());
    initialized = true;
  } catch (error) {
    console.error("❌ Error inicializando TensorFlow.js:", error);
    // Intentar con CPU backend si WebGL falla
    try {
      await tf.setBackend('cpu');
      console.log("⚠️ Usando CPU backend como fallback");
      initialized = true;
    } catch (cpuError) {
      console.error("❌ Error inicializando CPU backend:", cpuError);
    }
  }
}
