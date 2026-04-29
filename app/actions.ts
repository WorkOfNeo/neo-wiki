"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEntry, updateEntry, deleteEntry } from "@/lib/wiki";

type Flavor = "NOTEBOOK" | "DISTILLED";

export async function createEntryAction(input: {
  title: string;
  content: string;
  tags: string[];
  flavor: Flavor;
}) {
  const entry = await createEntry(input);
  revalidatePath("/");
  redirect(`/entry/${entry.id}`);
}

export async function updateEntryAction(input: {
  id: string;
  title: string;
  content: string;
  tags: string[];
  flavor: Flavor;
}) {
  await updateEntry(input);
  revalidatePath("/");
  revalidatePath(`/entry/${input.id}`);
}

export async function deleteEntryAction(id: string) {
  await deleteEntry(id);
  revalidatePath("/");
  redirect("/");
}
