import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/data";
import { DatasetValidationError, parseRixzaData } from "@/lib/data/validate";
import { deriveDataset } from "@/lib/finance/derive";
import { buildSnapshot } from "@/lib/finance/snapshot";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditFinancials } from "@/lib/auth/config";

// proxy.ts enforces authentication (401 for anonymous /api requests).
// Write access is further restricted to OWNER / ADMIN / FINANCE here.

async function isEditor() {
  const user = await getCurrentUser();
  return canEditFinancials(user?.role);
}

export async function GET() {
  const store = getStore();
  const [data, dataset] = await Promise.all([store.getData(), store.getDataset()]);
  return NextResponse.json({ data, dataset });
}

export async function PUT(request: Request) {
  if (!(await isEditor())) {
    return NextResponse.json(
      { error: "Votre rôle ne permet pas de modifier les données financières." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { data?: unknown } | unknown;
    const raw = body && typeof body === "object" && "data" in body ? body.data : body;
    const data = parseRixzaData(raw);
    // Fails fast if the records can't produce a valid snapshot.
    buildSnapshot(deriveDataset(data));

    await getStore().setData(data);
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message =
      err instanceof DatasetValidationError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Données invalides.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function DELETE() {
  if (!(await isEditor())) {
    return NextResponse.json(
      { error: "Votre rôle ne permet pas de modifier les données financières." },
      { status: 403 },
    );
  }
  await getStore().resetData();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
