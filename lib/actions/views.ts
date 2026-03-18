"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/lib/data";

function textValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function requiredTextValue(value: FormDataEntryValue | null, fieldName: string) {
  const normalized = textValue(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function queryStateFromForm(formData: FormData) {
  return {
    filter: textValue(formData.get("filter")) ?? undefined,
    sort: textValue(formData.get("sort")) ?? undefined,
    q: textValue(formData.get("q")) ?? undefined,
    projectId: textValue(formData.get("projectId")) ?? undefined,
    vendorId: textValue(formData.get("vendorId")) ?? undefined,
    category: textValue(formData.get("category")) ?? undefined,
  };
}

export async function saveViewAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const type = requiredTextValue(formData.get("type"), "View type");
  const viewName = requiredTextValue(formData.get("name"), "View name");
  const redirectTo = textValue(formData.get("redirect_to"));

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { error } = await supabase.from("saved_views").insert({
    organization_id: organization.id,
    name: viewName,
    type,
    query_state: queryStateFromForm(formData),
  });

  if (error) {
    throw error;
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(redirectTo || path);
}

export async function renameSavedViewAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const viewName = requiredTextValue(formData.get("name"), "View name");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { data, error } = await supabase
    .from("saved_views")
    .update({ name: viewName })
    .eq("organization_id", organization.id)
    .eq("id", viewId)
    .eq("type", type)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Saved view not found or not accessible.");
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(path);
}

export async function deleteSavedViewAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { data, error } = await supabase
    .from("saved_views")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", viewId)
    .eq("type", type)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Saved view not found or already removed.");
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(path);
}

export async function pinSavedViewAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_pinned: true })
    .eq("organization_id", organization.id)
    .eq("id", viewId)
    .eq("type", type)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Saved view not found or not accessible.");
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(path);
}

export async function unpinSavedViewAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_pinned: false })
    .eq("organization_id", organization.id)
    .eq("id", viewId)
    .eq("type", type)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Saved view not found or not accessible.");
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(path);
}

export async function setDefaultSavedViewAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { error: clearError } = await supabase
    .from("saved_views")
    .update({ is_default: false })
    .eq("organization_id", organization.id)
    .eq("type", type)
    .eq("is_default", true);

  if (clearError) {
    throw clearError;
  }

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_default: true })
    .eq("organization_id", organization.id)
    .eq("id", viewId)
    .eq("type", type)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Saved view not found or not accessible.");
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(path);
}
