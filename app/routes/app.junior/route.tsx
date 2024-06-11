import { Link, useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { IoArrowBack } from "react-icons/io5";

import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { resources } from "app/drizzle/schema.server";

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { doTheAuthThing } from "lib/authThing";

import { Document, Page } from "react-pdf";
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://bbe111b6726945b110b32ab037e4c232.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "e74dc595a3b18668b5e9f6795929cf3c",
    secretAccessKey:
      "b3c68d4ced82ad17a964d22648266c0a0b6fc55d0cf8b5f775e1183b4616b065",
  },
});

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
  }
  const resourceList = await db
    .select({
      id: resources.id,
      title: resources.title,
      href: resources.href,
    })
    .from(resources)
    .orderBy(resources.id);

  const { Contents } = await S3.send(
    new ListObjectsV2Command({ Bucket: "who-profile-pictures" })
  );

  const imageList = await Promise.all(
    Contents?.map(async (file) => {
      if (file.Key) {
        return getSignedUrl(
          S3,
          new GetObjectCommand({
            Bucket: "who-profile-pictures",
            Key: file.Key,
          }),
          { expiresIn: 3600 }
        ); // Expires in 1 hour
      }
      return null;
    }) || []
  );

  console.log(
    await S3.send(new ListObjectsV2Command({ Bucket: "who-profile-pictures" }))
  );
  return json({
    resourceList,
    imageList: imageList.filter((url) => url !== null), // Pass the list of signed image URLs to the frontend
  });
}

export default function Junior() {
  const { resourceList, imageList } = useLoaderData<typeof loader>();
  console.log("ImageList", imageList);

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/app/select");
  };

  return (
    <div className="max-h-screen flex flex-col items-center">
      <div className="flex flex-row w-full justify-between items pt-16 sm:pt-24">
        <Button onClick={handleClick}>
          <IoArrowBack className="text-xl" />
          <h2 className="hidden sm:flex">Back</h2>
        </Button>
        <h1 className="text-4xl font-bold absolute left-1/2 transform -translate-x-1/2">
          Junior
        </h1>
      </div>
      <div className="grid sm:grid-cols-2 gap-6 pt-8 sm:pt-16">
        {imageList.map((resume, index) => (
          <div key={index} style={{ width: "100%", height: "auto" }}>
            <iframe src={resume} width="100%" height="500px"></iframe>
          </div>
        ))}
      </div>
    </div>
  );
}
