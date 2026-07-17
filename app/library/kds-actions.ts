"use server";



import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/session";

import { isPosOutlet } from "@/lib/pos-seed";

import {

  upsertStation,

  toggleStationActive,

  resetStationsFromSeed

} from "@/lib/station-service";

import {

  upsertNotesCategory,

  toggleNotesCategoryActive,

  resetNotesFromSeed

} from "@/lib/notes-category-service";



const LIBRARY_ROLES = ["leader", "admin", "owner"];



function requireLibraryRole() {

  const session = getSession();

  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  return session;

}



function kdsRedirect(params: Record<string, string>) {

  const q = new URLSearchParams(params).toString();

  redirect(`/library/kds${q ? `?${q}` : ""}`);

}



function revalidateKdsPaths() {

  revalidatePath("/library/kds");

  revalidatePath("/library/products");

  revalidatePath("/kds");

  revalidatePath("/pos");

}



const STATION_ERR: Record<string, string> = {

  duplicate: "duplicate",

  invalid: "invalid",

  "not-found": "not-found",

  "in-use": "in-use"

};



const NOTE_ERR: Record<string, string> = {

  duplicate: "duplicate",

  invalid: "invalid",

  "not-found": "not-found"

};



export async function saveStationAction(formData: FormData) {

  requireLibraryRole();

  const outletId = String(formData.get("outletId") ?? "");

  if (!isPosOutlet(outletId)) kdsRedirect({ error: "invalid-outlet" });



  const id = String(formData.get("id") ?? "") || undefined;

  const slug = String(formData.get("slug") ?? "") || undefined;

  const name = String(formData.get("name") ?? "");

  const sortOrder = Number(formData.get("sortOrder") ?? 1);



  const res = upsertStation({ id, slug, outletId, name, sortOrder });

  if (!res.ok) kdsRedirect({ outlet: outletId, error: STATION_ERR[res.error] ?? "save" });



  revalidateKdsPaths();

  kdsRedirect({ outlet: outletId, ok: "station-saved" });

}



export async function toggleStationAction(formData: FormData) {

  requireLibraryRole();

  const outletId = String(formData.get("outletId") ?? "");

  const id = String(formData.get("id") ?? "");

  const active = formData.get("active") === "1";



  const res = toggleStationActive(outletId, id, active);

  if (!res.ok) kdsRedirect({ outlet: outletId, error: "not-found" });



  revalidateKdsPaths();

  kdsRedirect({ outlet: outletId, ok: active ? "station-on" : "station-off" });

}



export async function bootstrapStationsAction(formData: FormData) {

  requireLibraryRole();

  const outletId = String(formData.get("outletId") ?? "");

  if (!isPosOutlet(outletId)) kdsRedirect({ error: "invalid-outlet" });



  resetStationsFromSeed(outletId);

  revalidateKdsPaths();

  kdsRedirect({ outlet: outletId, ok: "stations-bootstrapped" });

}



export async function saveNotesCategoryAction(formData: FormData) {

  requireLibraryRole();

  const outletId = String(formData.get("outletId") ?? "");

  if (!isPosOutlet(outletId)) kdsRedirect({ error: "invalid-outlet" });



  const id = String(formData.get("id") ?? "") || undefined;

  const name = String(formData.get("name") ?? "");

  const group = String(formData.get("group") ?? "") || undefined;

  const sortOrder = Number(formData.get("sortOrder") ?? 1);



  const res = upsertNotesCategory({ id, outletId, name, group, sortOrder });

  if (!res.ok) kdsRedirect({ outlet: outletId, error: NOTE_ERR[res.error] ?? "save" });



  revalidateKdsPaths();

  kdsRedirect({ outlet: outletId, ok: "note-saved" });

}



export async function toggleNotesCategoryAction(formData: FormData) {

  requireLibraryRole();

  const outletId = String(formData.get("outletId") ?? "");

  const id = String(formData.get("id") ?? "");

  const active = formData.get("active") === "1";



  const res = toggleNotesCategoryActive(id, active);

  if (!res.ok) kdsRedirect({ outlet: outletId, error: "not-found" });



  revalidateKdsPaths();

  kdsRedirect({ outlet: outletId, ok: active ? "note-on" : "note-off" });

}



export async function bootstrapNotesAction(formData: FormData) {

  requireLibraryRole();

  const outletId = String(formData.get("outletId") ?? "");

  if (!isPosOutlet(outletId)) kdsRedirect({ error: "invalid-outlet" });



  resetNotesFromSeed(outletId);

  revalidateKdsPaths();

  kdsRedirect({ outlet: outletId, ok: "notes-bootstrapped" });

}

