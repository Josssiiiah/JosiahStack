import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/cloudflare";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { resources } from "app/drizzle/schema.server";
import { Navbar } from "./navbar";

import { doTheAuthThing } from "lib/authThing";

// This function fetches resources from D1 and images from R2
export async function loader({ request, context }: LoaderFunctionArgs) {
  // call this at the top of all your loaders that need auth and db
  const { user, session, db } = await doTheAuthThing({ request, context });
  // now you just have to condition all these queires on the user id
  if (user) {
    const userId = user.id;
    console.log("LOGGED IN!!");
    //      ^ type: string
  } else {
    console.log("NOT LOGGED IN!!");
    redirect("/login");
  }
  const resourceList = await db
    .select({
      id: resources.id,
      title: resources.title,
      href: resources.href,
    })
    .from(resources)
    .orderBy(resources.id);

  // console.log(await S3.send(new ListObjectsV2Command({ Bucket: "artworks" })));
  return json({
    resourceList,
    user, // return info about the user
  });
}

export default function Index() {
  const { resourceList, user } = useLoaderData<typeof loader>();
  const years = [
    { id: 1, name: "Frosh" },
    { id: 2, name: "Sophomore" },
    { id: 3, name: "Junior" },
    { id: 4, name: "Senior" },
  ];

  return (
    <div className="min-h-screen max-w-[1440px] px-4 mx-auto flex flex-col items-center">
      <Navbar user={user} />
      <Outlet />
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
