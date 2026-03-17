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

function numberValue(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === "") return 0;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Numeric fields must contain a valid non-negative number.");
  }

  return parsed;
}

function requiredId(value: FormDataEntryValue | null, fieldName: string) {
  const normalized = textValue(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

export async function createProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organization.id,
      name: requiredTextValue(formData.get("name"), "Project name"),
      address: textValue(formData.get("address")),
      status: requiredTextValue(formData.get("status"), "Project status"),
      start_date: textValue(formData.get("start_date")),
      target_completion_date: textValue(formData.get("target_completion_date")),
      planned_budget: numberValue(formData.get("planned_budget")),
      actual_spend: numberValue(formData.get("actual_spend")),
      notes: textValue(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (!error) {
      throw new Error("Project could not be created.");
    }

    throw error;
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${data.id}`);
  redirect(`/projects/${data.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: requiredTextValue(formData.get("name"), "Project name"),
      address: textValue(formData.get("address")),
      status: requiredTextValue(formData.get("status"), "Project status"),
      start_date: textValue(formData.get("start_date")),
      target_completion_date: textValue(formData.get("target_completion_date")),
      planned_budget: numberValue(formData.get("planned_budget")),
      actual_spend: numberValue(formData.get("actual_spend")),
      notes: textValue(formData.get("notes")),
    })
    .eq("organization_id", organization.id)
    .eq("id", projectId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Project not found or not accessible.");
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/edit`);
  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", projectId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Project not found or already removed.");
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function createTaskAction(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      organization_id: organization.id,
      project_id: projectId,
      assignee_id: textValue(formData.get("assignee_id")) || userId,
      title: requiredTextValue(formData.get("title"), "Task title"),
      description: textValue(formData.get("description")),
      due_date: textValue(formData.get("due_date")),
      priority: requiredTextValue(formData.get("priority"), "Task priority"),
      status: requiredTextValue(formData.get("status"), "Task status"),
    })
    .select("id, project_id")
    .single();

  if (error || !data?.id || !data?.project_id) {
    if (!error) {
      throw new Error("Task could not be created.");
    }

    throw error;
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${data.id}/edit`);
  revalidatePath(`/projects/${data.project_id}`);
  redirect("/tasks");
}

export async function updateTaskAction(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const taskId = requiredId(formData.get("task_id"), "Task");
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("tasks")
    .update({
      project_id: projectId,
      assignee_id: textValue(formData.get("assignee_id")) || userId,
      title: requiredTextValue(formData.get("title"), "Task title"),
      description: textValue(formData.get("description")),
      due_date: textValue(formData.get("due_date")),
      priority: requiredTextValue(formData.get("priority"), "Task priority"),
      status: requiredTextValue(formData.get("status"), "Task status"),
    })
    .eq("organization_id", organization.id)
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Task not found or not accessible.");
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  revalidatePath(`/projects/${projectId}`);
  redirect("/tasks");
}

export async function updateTaskStatusAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const taskId = requiredId(formData.get("task_id"), "Task");
  const projectId = textValue(formData.get("project_id"));
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: requiredTextValue(formData.get("status"), "Task status") })
    .eq("organization_id", organization.id)
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Task not found or not accessible.");
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const taskId = requiredId(formData.get("task_id"), "Task");
  const projectId = textValue(formData.get("project_id"));
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Task not found or already removed.");
  }

  revalidatePath("/tasks");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect("/tasks");
}

export async function createFieldUpdateAction(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { error } = await supabase.from("field_updates").insert({
    organization_id: organization.id,
    project_id: projectId,
    created_by: userId,
    title: requiredTextValue(formData.get("title"), "Update title"),
    description: textValue(formData.get("description")),
  });

  if (error) {
    throw error;
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFieldUpdateAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const updateId = requiredId(formData.get("update_id"), "Field update");
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("field_updates")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", updateId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Field update not found or already removed.");
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function createExpenseAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: organization.id,
      project_id: projectId,
      vendor_id: textValue(formData.get("vendor_id")),
      category: requiredTextValue(formData.get("category"), "Expense category"),
      amount: numberValue(formData.get("amount")),
      expense_date: requiredTextValue(formData.get("expense_date"), "Expense date"),
      notes: textValue(formData.get("notes")),
    })
    .select("id, project_id")
    .single();

  if (error || !data?.id || !data?.project_id) {
    if (!error) {
      throw new Error("Expense could not be created.");
    }

    throw error;
  }

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${data.id}/edit`);
  revalidatePath(`/projects/${data.project_id}`);
  redirect("/expenses");
}

export async function updateExpenseAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const expenseId = requiredId(formData.get("expense_id"), "Expense");
  const projectId = requiredId(formData.get("project_id"), "Project");
  const { data, error } = await supabase
    .from("expenses")
    .update({
      project_id: projectId,
      vendor_id: textValue(formData.get("vendor_id")),
      category: requiredTextValue(formData.get("category"), "Expense category"),
      amount: numberValue(formData.get("amount")),
      expense_date: requiredTextValue(formData.get("expense_date"), "Expense date"),
      notes: textValue(formData.get("notes")),
    })
    .eq("organization_id", organization.id)
    .eq("id", expenseId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Expense not found or not accessible.");
  }

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}/edit`);
  revalidatePath(`/projects/${projectId}`);
  redirect("/expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const expenseId = requiredId(formData.get("expense_id"), "Expense");
  const projectId = textValue(formData.get("project_id"));
  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", expenseId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Expense not found or already removed.");
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
      name: requiredTextValue(formData.get("name"), "Vendor name"),
      trade: textValue(formData.get("trade")),
      phone: textValue(formData.get("phone")),
      email: textValue(formData.get("email")),
      notes: textValue(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (!error) {
      throw new Error("Vendor could not be created.");
    }

    throw error;
  }

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${data.id}/edit`);
  redirect("/vendors");
}

export async function updateVendorAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const vendorId = requiredId(formData.get("vendor_id"), "Vendor");
  const { data, error } = await supabase
    .from("vendors")
    .update({
      name: requiredTextValue(formData.get("name"), "Vendor name"),
      trade: textValue(formData.get("trade")),
      phone: textValue(formData.get("phone")),
      email: textValue(formData.get("email")),
      notes: textValue(formData.get("notes")),
    })
    .eq("organization_id", organization.id)
    .eq("id", vendorId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Vendor not found or not accessible.");
  }

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${vendorId}/edit`);
  redirect("/vendors");
}

export async function deleteVendorAction(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  const vendorId = requiredId(formData.get("vendor_id"), "Vendor");
  const { data, error } = await supabase
    .from("vendors")
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", vendorId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Vendor not found or already removed.");
  }

  revalidatePath("/vendors");
  redirect("/vendors");
}
