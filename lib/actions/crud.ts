"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/lib/data";

function numberValue(value: FormDataEntryValue | null) {
  return value ? Number(value) : 0;
}

export async function createProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organization.id,
      name: formData.get("name"),
      address: formData.get("address"),
      status: formData.get("status"),
      start_date: formData.get("start_date") || null,
      target_completion_date: formData.get("target_completion_date") || null,
      planned_budget: numberValue(formData.get("planned_budget")),
      actual_spend: numberValue(formData.get("actual_spend")),
      notes: formData.get("notes"),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${data.id}`);
  redirect(`/projects/${data.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("projects")
    .update({
      name: formData.get("name"),
      address: formData.get("address"),
      status: formData.get("status"),
      start_date: formData.get("start_date") || null,
      target_completion_date: formData.get("target_completion_date") || null,
      planned_budget: numberValue(formData.get("planned_budget")),
      actual_spend: numberValue(formData.get("actual_spend")),
      notes: formData.get("notes"),
    })
    .eq("organization_id", organization.id)
    .eq("id", projectId);

  if (error) {
    throw error;
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/edit`);
  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase.from("projects").delete().eq("organization_id", organization.id).eq("id", projectId);

  if (error) {
    throw error;
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function createTaskAction(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const projectId = String(formData.get("project_id"));
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      organization_id: organization.id,
      project_id: projectId,
      assignee_id: formData.get("assignee_id") || userId,
      title: formData.get("title"),
      description: formData.get("description"),
      due_date: formData.get("due_date") || null,
      priority: formData.get("priority"),
      status: formData.get("status"),
    })
    .select("id, project_id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${data.id}/edit`);
  revalidatePath(`/projects/${data.project_id}`);
  redirect("/tasks");
}

export async function updateTaskAction(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const taskId = String(formData.get("task_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("tasks")
    .update({
      project_id: projectId,
      assignee_id: formData.get("assignee_id") || userId,
      title: formData.get("title"),
      description: formData.get("description"),
      due_date: formData.get("due_date") || null,
      priority: formData.get("priority"),
      status: formData.get("status"),
    })
    .eq("organization_id", organization.id)
    .eq("id", taskId);

  if (error) {
    throw error;
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  revalidatePath(`/projects/${projectId}`);
  redirect("/tasks");
}

export async function updateTaskStatusAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const taskId = String(formData.get("task_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("tasks")
    .update({ status: formData.get("status") })
    .eq("organization_id", organization.id)
    .eq("id", taskId);

  if (error) {
    throw error;
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const taskId = String(formData.get("task_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase.from("tasks").delete().eq("organization_id", organization.id).eq("id", taskId);

  if (error) {
    throw error;
  }

  revalidatePath("/tasks");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect("/tasks");
}

export async function createFieldUpdateAction(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase.from("field_updates").insert({
    organization_id: organization.id,
    project_id: projectId,
    created_by: userId,
    title: formData.get("title"),
    description: formData.get("description") || null,
  });

  if (error) {
    throw error;
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFieldUpdateAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const updateId = String(formData.get("update_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("field_updates")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", updateId);

  if (error) {
    throw error;
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function createExpenseAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = String(formData.get("project_id"));
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: organization.id,
      project_id: projectId,
      vendor_id: formData.get("vendor_id") || null,
      category: formData.get("category"),
      amount: numberValue(formData.get("amount")),
      expense_date: formData.get("expense_date"),
      notes: formData.get("notes"),
    })
    .select("id, project_id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${data.id}/edit`);
  revalidatePath(`/projects/${data.project_id}`);
  redirect("/expenses");
}

export async function updateExpenseAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const expenseId = String(formData.get("expense_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("expenses")
    .update({
      project_id: projectId,
      vendor_id: formData.get("vendor_id") || null,
      category: formData.get("category"),
      amount: numberValue(formData.get("amount")),
      expense_date: formData.get("expense_date"),
      notes: formData.get("notes"),
    })
    .eq("organization_id", organization.id)
    .eq("id", expenseId);

  if (error) {
    throw error;
  }

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}/edit`);
  revalidatePath(`/projects/${projectId}`);
  redirect("/expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const expenseId = String(formData.get("expense_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase.from("expenses").delete().eq("organization_id", organization.id).eq("id", expenseId);

  if (error) {
    throw error;
  }

  revalidatePath("/expenses");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect("/expenses");
}

export async function createVendorAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      organization_id: organization.id,
      name: formData.get("name"),
      trade: formData.get("trade"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      notes: formData.get("notes"),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${data.id}/edit`);
  redirect("/vendors");
}

export async function updateVendorAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const vendorId = String(formData.get("vendor_id"));
  const { error } = await supabase
    .from("vendors")
    .update({
      name: formData.get("name"),
      trade: formData.get("trade"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      notes: formData.get("notes"),
    })
    .eq("organization_id", organization.id)
    .eq("id", vendorId);

  if (error) {
    throw error;
  }

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${vendorId}/edit`);
  redirect("/vendors");
}

export async function deleteVendorAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const vendorId = String(formData.get("vendor_id"));
  const { error } = await supabase.from("vendors").delete().eq("organization_id", organization.id).eq("id", vendorId);

  if (error) {
    throw error;
  }

  revalidatePath("/vendors");
  redirect("/vendors");
}
