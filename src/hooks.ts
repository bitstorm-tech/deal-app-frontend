import { extractJwt } from "$lib/jwt.service";
import type { RequestEvent } from "@sveltejs/kit/types/private";
import type { JWTPayload } from "jose";

export async function handle({ event, resolve }): Promise<Response> {
  event.locals.jwt = await extractJwt(event.request);

  return await resolve(event);
}

export async function getSession(event: RequestEvent) {
  const jwt = event.locals.jwt as JWTPayload;

  return {
    isAuthenticated: !!jwt,
    isDealer: jwt?.isDealer,
    id: jwt?.sub
  };
}
