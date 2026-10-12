export type Theme = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Runs before paint (inlined in <head>) so the saved theme applies without a flash. */
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
