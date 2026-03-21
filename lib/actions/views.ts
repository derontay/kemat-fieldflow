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
  const { supabase, organization, userId } = await getCurrentOrganization();
  const type = requiredTextValue(formData.get("type"), "View type");
  const viewName = requiredTextValue(formData.get("name"), "View name");
  const redirectTo = textValue(formData.get("redirect_to"));
  const scope = textValue(formData.get("scope")) ?? "personal";

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  if (scope !== "personal" && scope !== "team") {
    throw new Error("View scope must be personal or team.");
  }

  const { error } = await supabase.from("saved_views").insert({
    organization_id: organization.id,
    user_id: scope === "personal" ? userId : null,
    name: viewName,
    type,
    query_state: queryStateFromForm(formData),
  });

  if (error?.code === "42703") {
    const { error: fallbackError } = await supabase.from("saved_views").insert({
      organization_id: organization.id,
      name: viewName,
      type,
      query_state: queryStateFromForm(formData),
    });

    if (fallbackError) {
      throw fallbackError;
    }

    const path = type === "tasks" ? "/tasks" : "/expenses";
    revalidatePath(path);
    redirect(redirectTo || path);
  }

  if (error) {
    throw error;
  }

  const path = type === "tasks" ? "/tasks" : "/expenses";
  revalidatePath(path);
  redirect(redirectTo || path);
}

async function getScopedSavedView(
  viewId: string,
  type: string,
) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("saved_views")
    .select("id, type, user_id")
    .eq("organization_id", organization.id)
    .eq("id", viewId)
    .eq("type", type)
    .maybeSingle();

  if (error?.code === "42703") {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("saved_views")
      .select("id, type")
      .eq("organization_id", organization.id)
      .eq("id", viewId)
      .eq("type", type)
      .maybeSingle();

    if (fallbackError) {
      throw fallbackError;
    }

    if (!fallbackData?.id) {
      throw new Error("Saved view not found or not accessible.");
    }

    return {
      supabase,
      organizationId: organization.id,
      currentUserId: userId,
      supportsOwnershipFields: false,
      view: { ...(fallbackData as { id: string; type: "tasks" | "expenses" }), user_id: null },
    };
  }

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Saved view not found or not accessible.");
  }

  return {
    supabase,
    organizationId: organization.id,
    currentUserId: userId,
    supportsOwnershipFields: true,
    view: data as { id: string; type: "tasks" | "expenses"; user_id: string | null },
  };
}

export async function renameSavedViewAction(formData: FormData) {
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const viewName = requiredTextValue(formData.get("name"), "View name");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { supabase, organizationId, view } = await getScopedSavedView(viewId, type);

  const { data, error } = await supabase
    .from("saved_views")
    .update({ name: viewName })
    .eq("organization_id", organizationId)
    .eq("id", view.id)
    .eq("type", view.type)
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
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { supabase, organizationId, view } = await getScopedSavedView(viewId, type);

  const { data, error } = await supabase
    .from("saved_views")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", view.id)
    .eq("type", view.type)
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
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { supabase, organizationId, view } = await getScopedSavedView(viewId, type);

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_pinned: true })
    .eq("organization_id", organizationId)
    .eq("id", view.id)
    .eq("type", view.type)
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
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { supabase, organizationId, view } = await getScopedSavedView(viewId, type);

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_pinned: false })
    .eq("organization_id", organizationId)
    .eq("id", view.id)
    .eq("type", view.type)
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
  const viewId = requiredTextValue(formData.get("view_id"), "Saved view");
  const type = requiredTextValue(formData.get("type"), "View type");

  if (type !== "tasks" && type !== "expenses") {
    throw new Error("View type must be tasks or expenses.");
  }

  const { supabase, organizationId, currentUserId, supportsOwnershipFields, view } = await getScopedSavedView(
    viewId,
    type,
  );

  let clearQuery = supabase
    .from("saved_views")
    .update({ is_default: false })
    .eq("organization_id", organizationId)
    .eq("type", type)
    .eq("is_default", true);

  if (supportsOwnershipFields) {
    clearQuery =
      view.user_id === null
        ? clearQuery.is("user_id", null)
        : clearQuery.eq("user_id", currentUserId);
  }

  const { error: clearError } = await clearQuery;

  if (clearError) {
    throw clearError;
  }

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_default: true })
    .eq("organization_id", organizationId)
    .eq("id", view.id)
    .eq("type", view.type)
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
