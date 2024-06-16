import { Lucia } from "lucia";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";


// Sets up Lucia auth system with my SQLite database
export function initializeLucia(D1: D1Database) {
	const adapter = new D1Adapter(D1, {
		user: "Users",
		session: "session"
	});
	return new Lucia(adapter);
}

declare module "lucia" {
	interface Register {
		Auth: ReturnType<typeof initializeLucia>;
	}
}



