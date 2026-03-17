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

function requiredId(value: FormDataEntryValue | null, fieldName: string) {
  const normalized = textValue(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function numberValue(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === "") return 0;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Order must be a valid non-negative number.");
  }

  return parsed;
}

export async function createTemplateAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("task_templates")
    .insert({
      organization_id: organization.id,
      name: requiredTextValue(formData.get("name"), "Template name"),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (!error) {
      throw new Error("Template could not be created.");
    }

    throw error;
  }

  revalidatePath("/templates");
  redirect(`/templates/${data.id}`);
}

export async function updateTemplateAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const templateId = requiredId(formData.get("template_id"), "Template");
  const { data, error } = await supabase
    .from("task_templates")
    .update({
      name: requiredTextValue(formData.get("name"), "Template name"),
    })
    .eq("organization_id", organization.id)
    .eq("id", templateId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Template not found or not accessible.");
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
}

export async function addTemplateItemAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const templateId = requiredId(formData.get("template_id"), "Template");
  const { data, error } = await supabase
    .from("task_template_items")
    .insert({
      organization_id: organization.id,
      template_id: templateId,
      title: requiredTextValue(formData.get("title"), "Task title"),
      description: textValue(formData.get("description")),
      priority: requiredTextValue(formData.get("priority"), "Task priority"),
      sort_order: numberValue(formData.get("sort_order")),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (!error) {
      throw new Error("Template item could not be created.");
    }

    throw error;
  }

  revalidatePath(`/templates/${templateId}`);
}

export async function deleteTemplateItemAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const templateId = requiredId(formData.get("template_id"), "Template");
  const itemId = requiredId(formData.get("item_id"), "Template item");
  const { data, error } = await supabase
    .from("task_template_items")
    .delete()
    .eq("organization_id", organization.id)
    .eq("template_id", templateId)
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Template item not found or already removed.");
  }

  revalidatePath(`/templates/${templateId}`);
}

export async function applyTemplateToProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = requiredId(formData.get("project_id"), "Project");
  const templateId = requiredId(formData.get("template_id"), "Template");

  const [{ data: project, error: projectError }, { data: template, error: templateError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("task_templates")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("id", templateId)
        .maybeSingle(),
      supabase
        .from("task_template_items")
        .select("title, description, priority")
        .eq("organization_id", organization.id)
        .eq("template_id", templateId)
        .order("sort_order")
        .order("created_at"),
    ]);

  if (projectError) throw projectError;
  if (templateError) throw templateError;
  if (itemsError) throw itemsError;

  if (!project?.id) {
    throw new Error("Project not found or not accessible.");
  }

  if (!template?.id) {
    throw new Error("Template not found or not accessible.");
  }

  if (!items?.length) {
    throw new Error("Template has no task items to apply.");
  }

  const { error } = await supabase.from("tasks").insert(
    items.map((item) => ({
      organization_id: organization.id,
      project_id: projectId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: "not_started",
      assignee_id: null,
      due_date: null,
    })),
  );

  if (error) {
    throw error;
  }

  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
}
