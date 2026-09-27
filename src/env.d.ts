declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts on every guarded admin route. */
    adminSession?: import('./lib/server/auth').AdminSession;
  }
}
