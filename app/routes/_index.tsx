import { json, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { doTheAuthThing } from "lib/authThing";

// Let's also protect this route and conditionally render either signup or logout
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user, session } = await doTheAuthThing({ request, context });
  if (user) {
    const userId = user.id;
    console.log("LOGGED IN!!");
  } else {
    console.log("NOT LOGGED IN!!");
  }

  return json({
    user,
  });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen max-w-[1440px] mx-auto px-4 flex flex-col items-center text-gray-800">
      <div className="flex flex-row justify-between pt-8 w-full">
        <Link to="/">
          <h2 className="font-bold text-lg">Peer Profiles</h2>
        </Link>
        <div>
          {user ? (
            <Link
              to="/logout"
              className="px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600"
            >
              Logout
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded bg-black text-white font-medium hover:bg-blue-600"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
        <h1 className="text-5xl sm:text-7xl font-bold pt-32 sm:pt-48">
          Connect, Inspire, Succeed
        </h1>
        <p className="sm:w-3/4 sm:text-xl">
          Browse and share student resumes to unlock opportunities and be
          inspired by the journeys of your peers
        </p>
        <Link
          to="/app/select"
          className="px-4 w-1/2 sm:w-1/3 py-4 mt-6 rounded bg-black text-white font-medium hover:bg-gray-600"
        >
          Get Started
        </Link>
        {/* <Link
          to="/app/upload"
          className="px-4 w-1/2 sm:w-1/3 py-4 mt-6 rounded bg-black text-white font-medium hover:bg-gray-600"
        >
          Admin Upload
        </Link> */}
      </div>
    </div>
  );
}
