"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Carga Stripe con fallback de variables de entorno
const STRIPE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "";
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// ===============================
// Checkout Form
// ===============================
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    try {
      // 1️⃣ Crear PaymentIntent en el backend (ruta simple sin reserva)
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/payments/create-simple-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: 5000, // $50.00 MXN (centavos)
            currency: "mxn",
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const { clientSecret } = await res.json();

      // 2️⃣ Confirmar pago con Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setMessage("❌ " + result.error.message);
      } else if (result.paymentIntent?.status === "succeeded") {
        setMessage("✅ Pago realizado con éxito");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error al procesar el pago");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💳 Pago seguro</h1>

      <p style={styles.amount}>
        Monto: <strong>$50 MXN</strong>
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.cardBox}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#ffffff",
                  "::placeholder": { color: "#bfbfbf" },
                },
              },
            }}
          />
        </div>

        <button style={styles.button} disabled={!stripe || loading}>
          {loading ? "Procesando..." : "Pagar ahora"}
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </form>
    </div>
  );
}

// ===============================
// Page Wrapper
// ===============================
export default function PagoPage() {
  if (!stripePromise) {
    return (
      <div style={{ maxWidth: "560px", margin: "60px auto", padding: "20px", color: "#8B0000" }}>
        No se pudo inicializar Stripe: falta la variable de entorno
        NEXT_PUBLIC_STRIPE_PUBLIC_KEY o NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

// ===============================
// Estilos simples (inline)
// ===============================
const styles = {
  container: {
    maxWidth: "420px",
    margin: "60px auto",
    padding: "24px",
    background: "#1a1a1a",
    borderRadius: "12px",
    color: "#ffffff",
  },
  title: {
    textAlign: "center" as const,
    marginBottom: "12px",
  },
  amount: {
    textAlign: "center" as const,
    marginBottom: "24px",
    fontSize: "18px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  cardBox: {
    padding: "14px",
    border: "1px solid #333",
    borderRadius: "8px",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#635bff",
    color: "#fff",
  },
  message: {
    textAlign: "center" as const,
    marginTop: "12px",
  },
};
