import { LoaderFunction, redirect } from "@remix-run/cloudflare";
import { github } from "auth"; // Adjust the path as needed
import { createCookie } from "@remix-run/cloudflare";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { initializeLucia } from "auth";
import { parseCookies } from "oslo/cookie";
import { Users } from "~/drizzle/schema.server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

interface GitHubUser {
	id: string;
	login: string;
}

// Define the githubOAuthStateCookie
const githubOAuthStateCookie = createCookie("github_oauth_state", {
  path: "/",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax"
});

export const loader: LoaderFunction = async ({ request, context }) => {
    console.log("Loader function triggered");
    console.log("Request method:", request.method);
    const lucia = initializeLucia(context.cloudflare.env.DB);
    const db = drizzle(context.cloudflare.env.DB);

    const url = new URL(request.url);
    console.log("Callback URL:", url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
  

    const cookieHeader = request.headers.get("Cookie");
    console.log("Cookie header:", cookieHeader);  // Log the raw cookie header

    // Manually parse the cookie header
    const cookies: any = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, ...rest] = cookie.split('=');
            const value = rest.join('=').trim();
            if (name && value) {
                cookies[name.trim()] = decodeURIComponent(value);
            }
        });
    }
    console.log("Parsed cookies:", cookies);  // Log the parsed cookies object

    let storedState = cookies["github_oauth_state"] ?? null;

    
    console.log("Stored State before decoding:", storedState);

    if (storedState) {
        storedState = decodeURIComponent(storedState);  // Decode the stored state
    }    console.log("This is the stored state:", storedState);

    console.log("Code:", code);
    console.log("State:", state);

    if (!code || !state || !storedState || state !== storedState) {
        console.error("Invalid code/state or state mismatch");
        return new Response(null, { status: 400 });
    }

    try {
        const tokens = await github.validateAuthorizationCode(!code ? "" : code);
        const githubUserResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`
            }
        });
        const githubUser: GitHubUser = await githubUserResponse.json();

        // Check if user already exists
        const [existingUser] = await db.select().from(Users).where(eq(Users.github_id, githubUser.id)).execute();

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            return redirect("/", {
                headers: {
                    "Set-Cookie": await sessionCookie.serialize()
                }
            });
        }

        const userId = generateIdFromEntropySize(10); // 16 characters long

        // Insert new user into the database
        await db.insert(Users).values({
            id: userId,
            github_id: githubUser.id,
            username: githubUser.login
        }).execute();

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        return redirect("/", {
            headers: {
                "Set-Cookie": await sessionCookie.serialize()
            }
        });
    } catch (e) {
        if (e instanceof OAuth2RequestError) {
            // invalid code
            console.error("OAuth2RequestError:", e);
            return new Response(null, { status: 400 });
        }
        console.error("Error:", e);
        return new Response(null, { status: 500 });
    }
};

export default function Callback() {
    console.log("Component rendered");
    return <div>Hello</div>;
}