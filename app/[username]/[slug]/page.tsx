import Link from "next/link";
import db from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import NavbarWithBack from "@/components/server/navbarWithBack";
import Footer from "@/components/server/footer";
import CommentForm from "../../../components/client/forms/commentForm";
import Button from "@/components/client/button";
import { Metadata } from "next";

type params = {
  author: string;
  slug: string;
};

type Props = {
  params: params;
};

type MetaDataProps = {
  params: params;
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: MetaDataProps): Promise<Metadata> {
  const post = await db.post.findFirst({
    where: {
      author: params.author,
      slug: params.slug,
    },
  });

  return {
    title: `${post?.title} by ${post?.author}`,
    description: post?.content,
  };
}

export default async function Blog({ params }: Props) {
  const session = auth();

  const post = await db.post.findFirst({
    where: {
      author: params.author,
      slug: params.slug,
    },
  });

  const split = post?.created_at.toDateString().split(" ");

  let date = "";

  if (split) {
    date = `${split[0]} ${split[1]} ${split[2]}, ${split[3]}`;
  }

  const paragraphs = post?.content.split(/\r?\n/).filter((p) => p != "");

  const comments = await db.comment.findMany({
    where: {
      post_id: post?.id,
    },
    orderBy: [
      {
        created_at: "desc",
      },
      { id: "desc" },
    ],
    take: 20,
  });

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <NavbarWithBack />
      <div className="flex flex-grow flex-col text-center">
        <p className="mb-6 text-3xl font-bold md:mb-12 md:text-5xl">{post?.title}</p>

        <div className="text-md mb-6 md:text-2xl">
          <Link href={`/${post?.author}`}>
            <p className="font-bold">
              Author: <span className="inline font-normal text-blue-500">{post?.author}</span>
            </p>
          </Link>
        </div>

        <div className="text-md mb-6 md:text-2xl">
          <span className="font-bold">Date:</span> {date}
        </div>

        {paragraphs?.map((paragraph, index) => (
          <p
            key={index}
            className="mx-10 mb-8 text-start text-lg break-words md:mx-44 md:indent-32 md:text-2xl"
          >
            {paragraph}
          </p>
        ))}

        <div className="mb-8 w-full border-t-4 border-black"></div>

        <div className="mb-12 flex flex-grow flex-col items-center">
          <p className="mb-3 text-4xl font-bold">Comments</p>
          {session.userId && post?.id ? (
            <CommentForm post_id={post.id} />
          ) : (
            <div className="my-6">
              <p>You need to be logged to comment!</p>

              <Link href="/register">
                <Button text="Signup" />
              </Link>
              <Link href="/login">
                <Button text="Login" />
              </Link>
            </div>
          )}
          <div className="my-2 w-10/12 flex flex-col justify-center items-center md:w-6/12">
            {comments?.map((comment, index) => {
              const split = comment?.created_at.toDateString().split(" ");

              let date = "";

              if (split) {
                date = `${split[0]} ${split[1]} ${split[2]}, ${split[3]}`;
              }

              return (
                <div
                  key={index}
                  className="w-full flex flex-col break-words"
                >
                  <div className="flex justify-end">
                    <p className="rounded-2xl rounded-r-none max-w-full break-words text-start bg-slate-100 mt-8 px-5 py-3">
                      {comment.text}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <p className="p-1.5 w-max">{date}</p>
                    <p className="p-1.5 w-max">
                      Author:{" "}
                      <Link href={`/${comment?.author}`}>
                        <span className="text-blue-500">{comment.author}</span>
                      </Link>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
