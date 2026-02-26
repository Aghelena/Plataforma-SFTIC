const KEY = "player";

export function getPlayer() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setPlayer(player) {
  localStorage.setItem(KEY, JSON.stringify(player));
}

export function clearPlayer() {
  localStorage.removeItem(KEY);
}