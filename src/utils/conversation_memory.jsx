// utils/conversationMemory.jsx

/**
 * Ritorna gli ultimi `maxMsgs` messaggi della conversazione (user + assistant)
 */
export function getFullHistory(userHistory, maxMsgs = 20) {
  return userHistory.slice(-maxMsgs);
}

/**
 * Aggiunge un messaggio dell'utente
 */
export function addUserMessage(userHistory, text) {
  userHistory.push({ role: "user", content: text });
}

/**
 * Aggiunge un messaggio dell'assistente
 */
export function addAssistantMessage(userHistory, text) {
  userHistory.push({ role: "assistant", content: text });
}
