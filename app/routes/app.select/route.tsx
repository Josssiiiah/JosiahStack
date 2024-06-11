import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/cloudflare";
import { Form, Link, useLoaderData, useNavigate } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { resources } from "app/drizzle/schema.server";

import { doTheAuthThing } from "lib/authThing";
import { Button } from "~/components/ui/button";
import { IoArrowBack } from "react-icons/io5";

// This function fetches resources from D1 and images from R2
export async function loader({ request, context }: LoaderFunctionArgs) {
  // call this at the top of all your loaders that need auth and db
  const { user, session, db } = await doTheAuthThing({ request, context });
  // now you just have to condition all these queires on the user id
  if (user) {
    console.log("LOGGED IN!!");
    //      ^ type: string
  } else {
    console.log("NOT LOGGED IN!!");
    return redirect("/login");
  }
  return null
}

export default function Select() {
  const years = [
    { id: 1, name: "Frosh" },
    { id: 2, name: "Sophomore" },
    { id: 3, name: "Junior" },
    { id: 4, name: "Senior" },
  ];
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/");
  };

  return (
    <div className="max-h-screen w-full  flex flex-col items-center">
      <div className="flex flex-row pt-16 sm:pt-24">
        <div className="flex flex-row items-center">
          <Button onClick={handleClick} className="mr-4 sm:mr-24 sm:py-6">
            <IoArrowBack className="text-xl" />
            <h2 className="hidden sm:flex text-xl">Back</h2>
          </Button>
        </div>
        <div className="flex text-center">
          <h1 className="text-4xl sm:text-6xl font-bold pr-[72px] sm:pr-[160px]">
            Select a Year
          </h1>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 pt-8 sm:pt-16">
        {years.map((year) => (
          <Link
            key={year.id}
            to={`/app/${year.name.toLowerCase()}`}
            className="bg-white p-12 sm:p-24 rounded shadow-md flex items-center justify-center"
          >
            <h2 className="text-xl font-semibold">{year.name}</h2>
          </Link>
        ))}
     </div>
    </div>
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const db = drizzle(context.cloudflare.env.DB);

  // Handle resource addition
  const title = formData.get("title");
  const href = formData.get("href");
  if (title && href) {
    await db
      .insert(resources)
      .values({ title: title as string, href: href as string })
      .execute();
    return json({ message: "Resource added" }, { status: 201 });
  }

  return json({ message: "No operation performed" }, { status: 400 });
}
