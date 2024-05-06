export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("http");
    await import("process");
    await import('./listener/send-email-reply')
  }
}