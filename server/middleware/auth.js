// server/middleware/auth.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Inicializa o Firebase Admin uma única vez, lendo a service account
// de uma variável de ambiente (nunca de um arquivo versionado no repositório).
if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT_KEY não definida — rotas de admin vão falhar até configurar."
    );
  } else {
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
  }
}

const db = getFirestore();

/**
 * Verifica o ID Token do Firebase enviado no header Authorization: Bearer <token>.
 * Se válido, anexa os dados decodificados do usuário em req.user (uid, email, etc.).
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  try {
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch (err) {
    console.error("Falha ao verificar token:", err.message);
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

/**
 * Exige que o usuário autenticado tenha role "admin" no Firestore
 * (mesmo campo já usado pelo AdminRoute no front-end).
 * Deve ser usado sempre depois de verifyToken.
 */
export async function requireAdmin(req, res, next) {
  try {
    const snap = await db.collection("users").doc(req.user.uid).get();
    const role = snap.exists ? snap.data().role : null;

    if (role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito a administradores." });
    }

    next();
  } catch (err) {
    console.error("Falha ao verificar permissão de admin:", err.message);
    return res.status(500).json({ error: "Erro ao verificar permissões." });
  }
}